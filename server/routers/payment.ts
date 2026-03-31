import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "../db";
import { payments, orders, listings, sellers, carts, cartItems, buyerAccountDetails, buyerBillingAddress, buyers } from "../db/schema";
import { eq, and } from "drizzle-orm";
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
  CheckoutSession,
  StablecoinPaymentLink,
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
        customer_id: z.string().optional(),
        paymentMethod: z.enum(["card", "bank_transfer", "crypto"]),
        provider: z.enum(["tsara"]).default("tsara"),
        paymentType: z.enum(["fiat", "stablecoin"]).default("fiat"),
        wallet_id: z.string().optional(),
        metadata: z.record(z.string(), z.any()as z.ZodTypeAny).optional(),
        redirect_url: z.string().url().optional(),
        success_url: z.string().url().optional(),
        cancel_url: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let paymentData: any;

      try {
        // --- Validate buyer and listing ---
        const [buyer] = await db.select().from(buyers).where(eq(buyers.id, input.buyerId)).limit(1);
        if (!buyer) throw new TRPCError({ code: "NOT_FOUND", message: "Buyer not found" });

        const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
        if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
        if (listing.status !== "approved") throw new TRPCError({ code: "BAD_REQUEST", message: "Listing not available" });

        // --- Validate Tsara API key ---
        const TSARA_SECRET_KEY = env.TSARA_SECRET_KEY || process.env.TSARA_SECRET_KEY;
        if (!TSARA_SECRET_KEY) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment service is not configured. Contact support.",
          });
        }

        // --- Sanitize metadata ---
        const sanitizedMetadata: Record<string, string> = {};
        if (input.metadata) {
          Object.entries(input.metadata).forEach(([key, value]) => {
            sanitizedMetadata[key] = typeof value === "string" ? value : JSON.stringify(value);
          });
        }
        sanitizedMetadata.buyerId = input.buyerId;
        sanitizedMetadata.listingId = input.listingId;
        if (input.orderId) sanitizedMetadata.orderId = input.orderId;

        // --- Handle stablecoin payments ---
        let response: any;
        const USDC_TO_NGN_RATE = 1000; // 1 USDC = 1000 NGN
        const AMOUNT_MULTIPLIER = 100; // convert to kobo/cents

        if (input.paymentType === "stablecoin" || (input.paymentMethod === "crypto" && input.currency === "USDC")) {
          if (!input.wallet_id) throw new TRPCError({ code: "BAD_REQUEST", message: "wallet_id required for stablecoin" });

          const usdcAmount = input.amount / USDC_TO_NGN_RATE;
          if (usdcAmount < 0.01) throw new TRPCError({ code: "BAD_REQUEST", message: "Amount too small for USDC" });

          response = await createStablecoinPaymentLink({
            amount: usdcAmount.toFixed(6),
            asset: "USDC",
            network: "solana",
            wallet_id: input.wallet_id,
            description: input.description,
            metadata: sanitizedMetadata,
          });
        } else {
          // --- Fiat payment (card/bank transfer) ---
          const amountInCents = Math.round(input.amount * AMOUNT_MULTIPLIER);

          if (input.success_url && input.cancel_url) {
            response = await createCheckoutSession({
              amount: amountInCents,
              currency: input.currency,
              reference: `order_${input.orderId || uuidv4()}`,
              success_url: input.success_url,
              cancel_url: input.cancel_url,
              metadata: sanitizedMetadata,
            });
          } else {
            response = await createFiatPaymentLink({
              amount: amountInCents,
              currency: input.currency,
              description: input.description,
              metadata: sanitizedMetadata,
              redirect_url: input.redirect_url,
            });
          }
        }

        // --- Validate Tsara response ---
        if (!response?.data || !response.data.id) {
          console.error("[Payment] Invalid response from Tsara:", response);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment provider returned invalid data" });
        }

        const tsaraPaymentId = response.data.id;
        const amountCents = Math.round(input.amount * AMOUNT_MULTIPLIER);
        paymentData = {
          buyerId: input.buyerId,
          listingId: input.listingId,
          orderId: input.orderId || null,
          amountCents,
          currency: input.paymentType === "stablecoin" ? "USDC" : input.currency,
          paymentMethod: input.paymentMethod,
          provider: input.provider,
          status: "pending" as const,
          transactionRef: tsaraPaymentId,
          gatewayResponse: JSON.stringify(response),
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

  verifyPayment: publicProcedure
    .input(z.object({ reference: z.string().min(1, "Payment reference is required") }))
    .query(async ({ input }) => {
      try {
        const response = await verifyTsaraPayment(input.reference);
        if (response.success && response.data) {
          const statusMap: Record<string, "pending" | "processing" | "completed" | "failed" | "refunded"> = {
            "pending": "pending",
            "processing": "processing",
            "success": "completed",
            "failed": "failed",
            "refunded": "refunded"
          };
          await db.update(payments).set({
            status: statusMap[response.data.status] || "pending",
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

  validateApiKey: publicProcedure
    .query(() => {
      const validation = validateApiKey(process.env.TSARA_SECRET_KEY || env.TSARA_SECRET_KEY);
      const status = getApiKeyStatus();
      return {
        success: validation.valid,
        valid: validation.valid,
        message: validation.valid ? validation.details : validation.error,
        details: validation.details,
        keyLength: (process.env.TSARA_SECRET_KEY || env.TSARA_SECRET_KEY)?.length || 0,
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
});