import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "../db";
import { payments, listings, buyers, carts, cartItems } from "../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  createFiatPaymentLink,
  createStablecoinPaymentLink,
  createCheckoutSession,
  retrievePaymentLink,
  verifyPayment as verifyTsaraPayment,
  listPaymentLinks,
  disablePaymentLink,
  type PaymentLink,
  validateApiKey,
  getApiKeyStatus,
  diagnoseTsaraConnection,
} from "../services/tsara";
import { runTsaraDiagnostics, isTsaraConfigured } from "../services/tsaraDiagnostic";
import { env } from "@/env";


export const paymentRouter = createTRPCRouter({

  // =======================
  // CREATE PAYMENT
  // =======================
  createPayment: protectedProcedure
    .input(
      z.object({
        buyerId: z.string().uuid(),
        listingId: z.string().uuid(),
        orderId: z.string().uuid().optional(),
        amount: z.number().positive(),
        currency: z.string().min(3).max(3).default("NGN"),
        description: z.string().min(1).max(500),
        paymentMethod: z.enum(["card", "bank_transfer", "crypto"]),
        provider: z.enum(["tsara"]).default("tsara"),
        paymentType: z.enum(["fiat", "stablecoin"]).default("fiat"),
        wallet_id: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
        redirect_url: z.string().url().optional(),
        success_url: z.string().url().optional(),
        cancel_url: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let paymentData: any;

      try {
        // --- FIRST: Validate Tsara API key is configured ---
        const TSARA_SECRET_KEY =
          env.TSARA_SECRET_KEY ||
          process.env.TSARA_SECRET_KEY ||
          process.env.TSARA_KEY ||
          process.env.TSARA_API_KEY ||
          process.env.TSARA_SECRET;
        if (!TSARA_SECRET_KEY || TSARA_SECRET_KEY.trim() === '') {
          console.error('[Payment] CRITICAL: TSARA_SECRET_KEY is not configured');
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment service is not properly configured. Please contact support.",
          });
        }

        // --- Validate buyer and listing ---
        const buyerExists = await db.select({ id: buyers.id }).from(buyers).where(eq(buyers.id, input.buyerId)).limit(1);
        if (!buyerExists.length) throw new TRPCError({ code: "NOT_FOUND", message: "Buyer not found" });

        const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
        if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
        if (listing.status !== "approved") throw new TRPCError({ code: "BAD_REQUEST", message: "Listing not available" });

        // --- Validate amount ranges ---
        if (input.amount <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment amount must be greater than zero" });
        }

        if (input.amount > 10000000) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment amount exceeds maximum allowed limit" });
        }

        // --- Build safe metadata ---
        const sanitizedMetadata: Record<string, string> = {};
        if (input.metadata) {
          Object.entries(input.metadata).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              sanitizedMetadata[key] = typeof value === "string" ? value : JSON.stringify(value);
            }
          });
        }
        sanitizedMetadata.buyerId = input.buyerId;
        sanitizedMetadata.listingId = input.listingId;
        if (input.orderId) sanitizedMetadata.orderId = input.orderId;

        // --- Handle stablecoin payments ---
        let response: any;
        const USDC_TO_NGN_RATE = 1000; // 1 USDC = 1000 NGN
        const AMOUNT_MULTIPLIER = 100; // convert to kobo/cents
        const currencyCode = input.currency.toUpperCase();
        const isStablecoinPayment = input.paymentType === "stablecoin" || (input.paymentMethod === "crypto" && currencyCode === "USDC");
        const paymentCurrency = isStablecoinPayment ? "USDC" : currencyCode;

        if (isStablecoinPayment) {
          if (currencyCode !== "USDC") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Stablecoin payments must use USDC currency." });
          }
          if (!input.wallet_id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "wallet_id is required for stablecoin payments" });
          }

          const usdcAmount = input.amount / USDC_TO_NGN_RATE;
          if (usdcAmount < 0.01) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Amount too small for USDC" });
          }

          response = await createStablecoinPaymentLink({
            amount: usdcAmount.toFixed(6),
            asset: "USDC",
            network: "solana",
            wallet_id: input.wallet_id,
            description: input.description,
            metadata: sanitizedMetadata,
          });
        } else {
          const amountInCents = Math.round(input.amount * AMOUNT_MULTIPLIER);

          if (input.success_url && input.cancel_url) {
            response = await createCheckoutSession({
              amount: amountInCents,
              currency: currencyCode,
              reference: `order_${input.orderId || uuidv4()}`,
              success_url: input.success_url,
              cancel_url: input.cancel_url,
              metadata: sanitizedMetadata,
            });
          } else {
            response = await createFiatPaymentLink({
              amount: amountInCents,
              currency: currencyCode,
              description: input.description,
              metadata: sanitizedMetadata,
              redirect_url: input.redirect_url,
            });
          }
        }

        // --- Validate Tsara response ---
        if (!response || response.success === false || !response.data || !response.data.id) {
          console.error("[Payment] Invalid response from Tsara:", response);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment provider returned invalid data" });
        }

        const tsaraPaymentId = response.data.id;
        const amountCents = isStablecoinPayment
          ? Math.round((input.amount / USDC_TO_NGN_RATE) * 1000000)
          : Math.round(input.amount * AMOUNT_MULTIPLIER);

        const paymentData = {
          buyerId: input.buyerId,
          listingId: input.listingId,
          orderId: input.orderId || null,
          amountCents,
          currency: paymentCurrency,
          paymentMethod: input.paymentMethod,
          provider: input.provider,
          status: "pending" as const,
          transactionRef: tsaraPaymentId,
          gatewayResponse: (() => {
            try {
              return JSON.stringify(response);
            } catch (jsonError) {
              console.error('[Payment] Failed to stringify provider response:', jsonError);
              return JSON.stringify({
                error: 'Failed to stringify response',
                data: response?.data ? { id: response.data.id, status: response.data.status } : null,
              });
            }
          })(),
        };

        const [payment] = await db.insert(payments).values(paymentData).returning();

        return {
          payment,
          paymentUrl: response.data.url || response.data.checkout_url,
          paymentId: tsaraPaymentId,
        };

      } catch (error: any) {
        console.error("[Payment] createPayment error:", error, { input });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message || "Payment creation failed" });
      }
    }),


  // =======================
  // OTHER PROCEDURES
  // =======================
  getPaymentLink: protectedProcedure
    .input(z.object({ plinkId: z.string() }))
    .query(async ({ input }) => {
      try {
        const response = await retrievePaymentLink(input.plinkId);
        return { success: true, data: response.data };
      } catch (error: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error?.message || "Failed to retrieve payment link" });
      }
    }),

  listPaymentLinks: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      const { page = 1, limit = 20 } = input || {};
      try {
        const response = await listPaymentLinks(page, limit);
        const paymentData = response.data as PaymentLink[] & { pagination: any };
        return { success: true, data: paymentData, pagination: paymentData.pagination || {} };
      } catch (error: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error?.message || "Failed to list payment links" });
      }
    }),

  verifyPayment: protectedProcedure
    .input(z.object({ reference: z.string().min(1, "Payment reference is required") }))
    .mutation(async ({ input }) => {
      try {
        const response = await verifyTsaraPayment(input.reference);
        if (response.success && response.data && response.data.status) {
          const statusMap: Record<string, "pending" | "processing" | "completed" | "failed" | "refunded"> = {
            "pending": "pending",
            "processing": "processing",
            "success": "completed",
            "failed": "failed",
            "refunded": "refunded"
          };
          const mappedStatus = statusMap[response.data.status] || "pending";
          await db.update(payments).set({
            status: mappedStatus,
            updatedAt: new Date(),
            gatewayResponse: JSON.stringify(response),
          }).where(eq(payments.transactionRef, input.reference));
        }
        return { success: true, data: response.data };
      } catch (error: any) {
        console.error("Payment verification error:", error);
        throw new TRPCError({ code: "BAD_REQUEST", message: error?.message || "Payment verification failed" });
      }
    }),

  disablePaymentLink: protectedProcedure
    .input(z.object({ plinkId: z.string().min(1, "Payment link ID is required") }))
    .mutation(async ({ input }) => {
      try {
        const response = await disablePaymentLink(input.plinkId);
        return { success: true, data: response.data };
      } catch (error: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error?.message || "Failed to disable payment link" });
      }
    }),

  diagnose: publicProcedure
    .query(async () => {
      try {
        const diagnostics = await runTsaraDiagnostics();
        return { success: true, data: diagnostics };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message || "Failed to run diagnostics" });
      }
    }),

  isConfigured: publicProcedure
    .query(() => ({ success: true, isConfigured: isTsaraConfigured() })),

  getUserPayments: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      status: z.enum(["pending", "processing", "completed", "failed", "refunded"]).optional(),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get buyer
      const [buyer] = await db.select().from(buyers).where(eq(buyers.userId, userId)).limit(1);
      if (!buyer) throw new TRPCError({ code: "NOT_FOUND", message: "Buyer profile not found" });

      const query = db.select().from(payments).where(eq(payments.buyerId, buyer.id));

      if (input.status) {
        query.where(eq(payments.status, input.status));
      }

      const userPayments = await query
        .orderBy(payments.createdAt)
        .limit(input.limit)
        .offset(input.offset);

      return {
        success: true,
        data: userPayments,
        count: userPayments.length,
      };
    }),

  validateApiKey: publicProcedure
    .query(() => {
      const key =
        process.env.TSARA_SECRET_KEY ||
        env.TSARA_SECRET_KEY ||
        process.env.TSARA_KEY ||
        process.env.TSARA_API_KEY ||
        process.env.TSARA_SECRET ||
        '';
      const validation = validateApiKey(key);
      const status = getApiKeyStatus();
      return {
        success: validation.valid,
        valid: validation.valid,
        message: validation.valid ? validation.details : validation.error,
        details: validation.details,
        keyLength: key.length || 0,
        environment: process.env.NODE_ENV,
      };
    }),

  testConnection: publicProcedure
    .query(async () => {
      try {
        const connection = await diagnoseTsaraConnection();
        return {
          success: connection.isConfigured && connection.canReachApi,
          configured: connection.isConfigured,
          canReachApi: connection.canReachApi,
          apiTestStatus: connection.apiTestStatus,
          baseUrl: connection.baseUrl,
          errorDetails: connection.errorDetails,
          keyValidation: connection.keyValidation,
          timestamp: connection.timestamp,
        };
      } catch (error: any) {
        return {
          success: false,
          configured: false,
          canReachApi: false,
          errorDetails: error?.message || 'Unknown error during connection test',
        };
      }
    }),

  // =======================
  // CREATE CART PAYMENT
  // =======================
  createCartPayment: protectedProcedure
    .input(
      z.object({
        cartId: z.string().uuid(),
        amount: z.number().positive(),
        currency: z.string().min(3).max(3).default("NGN"),
        description: z.string().min(1).max(500),
        paymentMethod: z.enum(["card", "bank_transfer", "crypto"]),
        provider: z.enum(["tsara"]).default("tsara"),
        paymentType: z.enum(["fiat", "stablecoin"]).default("fiat"),
        wallet_id: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
        redirect_url: z.string().url().optional(),
        success_url: z.string().url().optional(),
        cancel_url: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      let paymentData: any;

      try {
        // --- FIRST: Validate Tsara API key is configured ---
        const TSARA_SECRET_KEY =
          env.TSARA_SECRET_KEY ||
          process.env.TSARA_SECRET_KEY ||
          process.env.TSARA_KEY ||
          process.env.TSARA_API_KEY ||
          process.env.TSARA_SECRET;
        console.log('[Cart Payment] TSARA_SECRET_KEY check: configured=', !!TSARA_SECRET_KEY, 'length=', TSARA_SECRET_KEY?.length || 0);
        if (!TSARA_SECRET_KEY || TSARA_SECRET_KEY.trim() === '') {
          console.error('[Cart Payment] CRITICAL: TSARA_SECRET_KEY is not configured');
          console.error('[Cart Payment] Available env keys with TSARA/SECRET:', Object.keys(process.env).filter(k => /TSARA|SECRET/i.test(k)));
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment service is not properly configured. Please contact support.",
          });
        }

        console.log('[Cart Payment] Starting createCartPayment for user:', userId, 'cart:', input.cartId);

        // --- Validate buyer ---
        const buyer = await db.select().from(buyers).where(eq(buyers.userId, userId)).limit(1);
        console.log('[Cart Payment] Buyer query result:', buyer.length, 'records');
        if (!buyer.length) throw new TRPCError({ code: "NOT_FOUND", message: "Buyer not found" });
        const buyerId = buyer[0].id;
        console.log('[Cart Payment] Found buyer:', buyerId);

        // --- Validate cart exists and belongs to buyer ---
        const cart = await db.select().from(carts).where(eq(carts.id, input.cartId)).limit(1);
        console.log('[Cart Payment] Cart query result:', cart.length, 'records');
        if (!cart.length) throw new TRPCError({ code: "NOT_FOUND", message: "Cart not found" });

        console.log('[Cart Payment] Cart buyerId:', cart[0].buyerId, 'expected buyerId:', buyerId);
        if (!cart[0].buyerId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cart has no associated buyer" });
        }
        if (cart[0].buyerId !== buyerId) throw new TRPCError({ code: "FORBIDDEN", message: "Cart does not belong to you" });

        // --- Validate cart has items ---
        const items = await db.select().from(cartItems).where(eq(cartItems.cartId, input.cartId));
        console.log('[Cart Payment] Cart items query result:', items.length, 'items');
        if (items.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });

        // Note: TSARA_SECRET_KEY already validated above

        // --- Validate amount ranges ---
        if (input.amount <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment amount must be greater than zero" });
        }

        if (input.amount > 10000000) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment amount exceeds maximum allowed limit" });
        }

        // --- Build safe metadata ---
        const sanitizedMetadata: Record<string, string> = {};
        if (input.metadata) {
          Object.entries(input.metadata).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              sanitizedMetadata[key] = typeof value === "string" ? value : JSON.stringify(value);
            }
          });
        }
        sanitizedMetadata.buyerId = userId;
        sanitizedMetadata.cartId = input.cartId;
        sanitizedMetadata.itemCount = items.length.toString();

        // --- Handle stablecoin payments ---
        let response: any;
        const USDC_TO_NGN_RATE = 1000; // 1 USDC = 1000 NGN
        const AMOUNT_MULTIPLIER = 100; // convert to kobo/cents
        const currencyCode = input.currency.toUpperCase();
        const isStablecoinPayment = input.paymentType === "stablecoin" || (input.paymentMethod === "crypto" && currencyCode === "USDC");
        const paymentCurrency = isStablecoinPayment ? "USDC" : currencyCode;

        console.log('[Cart Payment] Payment type:', { isStablecoinPayment, currencyCode, paymentCurrency, amount: input.amount });

        if (isStablecoinPayment) {
          if (currencyCode !== "USDC") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Stablecoin payments must use USDC currency." });
          }
          if (!input.wallet_id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "wallet_id is required for stablecoin payments" });
          }

          const usdcAmount = input.amount / USDC_TO_NGN_RATE;
          if (usdcAmount < 0.01) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Amount too small for USDC" });
          }

          console.log('[Cart Payment] Creating stablecoin payment link for amount:', usdcAmount);
          response = await createStablecoinPaymentLink({
            amount: usdcAmount.toFixed(6),
            asset: "USDC",
            network: "solana",
            wallet_id: input.wallet_id,
            description: input.description,
            metadata: sanitizedMetadata,
          });
        } else {
          const amountInCents = Math.round(input.amount * AMOUNT_MULTIPLIER);

          if (input.success_url && input.cancel_url) {
            console.log('[Cart Payment] Creating checkout session for amount:', amountInCents, currencyCode);
            response = await createCheckoutSession({
              amount: amountInCents,
              currency: currencyCode,
              reference: `cart_${input.cartId}`,
              success_url: input.success_url,
              cancel_url: input.cancel_url,
              metadata: sanitizedMetadata,
            });
          } else {
            console.log('[Cart Payment] Creating fiat payment link for amount:', amountInCents, currencyCode);
            response = await createFiatPaymentLink({
              amount: amountInCents,
              currency: currencyCode,
              description: input.description,
              metadata: sanitizedMetadata,
              redirect_url: input.redirect_url,
            });
          }
        }

        // --- Validate Tsara response ---
        console.log('[Cart Payment] Tsara API response:', response ? 'received' : 'null', response?.success, response?.data?.id);
        if (!response || response.success === false || !response.data || !response.data.id) {
          console.error("[Cart Payment] Invalid response from Tsara:", response);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment provider returned invalid data" });
        }

        const tsaraPaymentId = response.data.id;
        const amountCents = isStablecoinPayment
          ? Math.round((input.amount / USDC_TO_NGN_RATE) * 1000000)
          : Math.round(input.amount * AMOUNT_MULTIPLIER);

        console.log('[Cart Payment] Creating payment record:', { buyerId, amountCents, currency: paymentCurrency, tsaraPaymentId });
        const paymentData = {
          buyerId: buyerId,
          listingId: null, // Cart payment, not tied to single listing
          orderId: input.cartId, // Use cart ID as reference
          amountCents,
          currency: paymentCurrency,
          paymentMethod: input.paymentMethod,
          provider: input.provider,
          status: "pending" as const,
          transactionRef: tsaraPaymentId,
          gatewayResponse: (() => {
            try {
              return JSON.stringify(response);
            } catch (jsonError) {
              console.error('[Cart Payment] Failed to stringify provider response:', jsonError);
              return JSON.stringify({
                error: 'Failed to stringify response',
                data: response?.data ? { id: response.data.id, status: response.data.status } : null,
              });
            }
          })(),
        };

        const [payment] = await db.insert(payments).values(paymentData).returning();
        console.log('[Cart Payment] Payment record created:', payment.id);

        return {
          payment,
          paymentUrl: response.data.url || response.data.checkout_url,
          paymentId: tsaraPaymentId,
        };

      } catch (error: any) {
        console.error("[Cart Payment] createCartPayment error:", error, { input });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message || "Cart payment creation failed" });
      }
    }),
});