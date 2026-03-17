import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "../db";
import { payments, orders, listings, sellers, carts, cartItems, buyerAccountDetails, buyerBillingAddress } from "../db/schema";
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
  type PaymentLink
} from "../services/tsara";
import { getOrCreateTsaraCustomer } from "../services/paymentCustomerHelper";
import { runTsaraDiagnostics, isTsaraConfigured } from "../services/tsaraDiagnostic";
import { env } from "@/env";


export const paymentRouter = createTRPCRouter({
  createPayment: protectedProcedure
    .input(
      z.object({
        buyerId: z.string(),
        listingId: z.string(),
        orderId: z.string().optional(),
        amount: z.number(),
        currency: z.string().default("NGN"),
        description: z.string(),
        customer_id: z.string().optional(),
        paymentMethod: z.enum(["card", "bank_transfer", "crypto"]),
        provider: z.enum(["tsara"]).default("tsara"),
        paymentType: z.enum(["fiat", "stablecoin"]).default("fiat"),
        wallet_id: z.string().optional(), // Required for stablecoin payments
        metadata: z.record(z.string(), z.any()).optional(),
        redirect_url: z.string().url().optional(),
        success_url: z.string().url().optional(),
        cancel_url: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Log incoming request for debugging
      console.log('[Payment] Creating payment with input:', {
        buyerId: input.buyerId,
        orderId: input.orderId,
        amount: input.amount,
        currency: input.currency,
        paymentMethod: input.paymentMethod,
        paymentType: input.paymentType,
      });

      try {
        // Check if Tsara is properly configured
        const { TSARA_SECRET_KEY, NEXT_PUBLIC_TSARA_PUBLIC_KEY } = env;
        if (!TSARA_SECRET_KEY || TSARA_SECRET_KEY.trim() === '') {
          console.error('[Payment] TSARA_SECRET_KEY is not configured');
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment service is not properly configured. Please contact support.",
          });
        }

        // Get or create Tsara customer ID from the database
        // This ensures we always have a valid customer_id before making payment requests
        let customerId: string;
        
        try {
          console.log('[Payment] Getting or creating Tsara customer for buyer:', input.buyerId);
          customerId = await getOrCreateTsaraCustomer(input.buyerId);
          console.log('[Payment] Successfully got Tsara customer ID:', customerId);
        } catch (error: any) {
          console.error('[Payment] Failed to get/create Tsara customer:', {
            buyerId: input.buyerId,
            error: error.message,
            stack: error.stack,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to initialize customer: ${error.message}`,
            cause: error,
          });
        }
        
        if (!customerId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Customer ID is required for payment processing",
          });
        }

        let response;

        console.log('[Payment] Creating payment link with customer ID:', customerId);

        // Create appropriate payment link based on type
        if (input.paymentType === "stablecoin") {
          if (!input.wallet_id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "wallet_id is required for stablecoin payments",
            });
          }

          response = await createStablecoinPaymentLink({
            amount: input.amount.toString(),
            asset: "USDC",
            network: "solana",
            wallet_id: input.wallet_id,
            description: input.description,
            metadata: input.metadata,
          });
        } else if (input.paymentMethod === "crypto" && input.currency === "USDC") {
          // Handle USDC payments via stablecoin link
          if (!input.wallet_id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "wallet_id is required for USDC payments",
            });
          }

          response = await createStablecoinPaymentLink({
            amount: input.amount.toString(),
            asset: "USDC",
            network: "solana",
            wallet_id: input.wallet_id,
            description: input.description,
            metadata: input.metadata,
          });
        } else {
          // Create fiat payment link or checkout session
          if (input.success_url && input.cancel_url) {
            // Use checkout session for better UX
            response = await createCheckoutSession({
              amount: Math.round(input.amount * 100), 
              currency: input.currency,
              reference: `order_${input.orderId || uuidv4()}`,
              customer_id: customerId,
              success_url: input.success_url,
              cancel_url: input.cancel_url,
              metadata: input.metadata,
            });
          } else {
            // Use payment link
            response = await createFiatPaymentLink({
              amount: Math.round(input.amount * 100), // Convert to cents for fiat
              currency: input.currency,
              description: input.description,
              customer_id: customerId,
              metadata: input.metadata,
              redirect_url: input.redirect_url,
            });
          }
        }

        const [payment] = await db
          .insert(payments)
          .values({
            buyerId: input.buyerId,
            listingId: input.listingId,
            orderId: input.orderId ?? null,
            amountCents: input.paymentType === "stablecoin" ? Math.round(input.amount * 1000000) : Math.round(input.amount * 100), // USDC has 6 decimals
            currency: input.currency,
            paymentMethod: input.paymentMethod,
            provider: input.provider,
            status: "pending",
            transactionRef: response.data.id,
            gatewayResponse: JSON.stringify(response),
          })
          .returning();

        return {
          payment,
          paymentUrl: (response.data as any).url || (response.data as any).checkout_url,
          paymentId: response.data.id,
        };
      } catch (error: any) {
        // Already a TRPCError - rethrow it
        if (error.code && error.message) {
          throw error;
        }

        console.error("[Payment] Payment creation error:", {
          message: error?.message,
          code: error?.code,
          responseStatus: error?.response?.status,
          responseData: error?.response?.data,
          stack: error?.stack,
        });
        
        const errorMessage = 
          error?.response?.data?.error?.message || 
          error?.response?.data?.message || 
          error?.message || 
          "Payment creation failed";
        
        throw new TRPCError({
          code: error?.response?.status === 401 ? "UNAUTHORIZED" : "BAD_REQUEST",
          message: errorMessage,
          cause: error,
        });
      }
    }),

     getPaymentLink: protectedProcedure
    .input(z.object({ plinkId: z.string() }))
    .query(async ({ input }) => {
      try {
        const response = await retrievePaymentLink(input.plinkId);
        return {
          success: true,
          data: response.data,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error?.message || "Failed to retrieve payment link",
        });
      }
    }),
    
    listPaymentLinks: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ input }) => {
      const { page = 1, limit = 20 } = input || {};
      try {
        const response = await listPaymentLinks(page, limit);
        const paymentData = response.data as PaymentLink[] & { pagination: any };
        return {
          success: true,
          data: paymentData,
          pagination: paymentData.pagination || {},
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error?.message || "Failed to list payment links",
        });
      }
    }),

  verifyPayment: publicProcedure
    .input(
      z.object({
        reference: z.string().min(1, "Payment reference is required"),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await verifyTsaraPayment(input.reference);

        // Update local payment status if verification successful
        if (response.success && response.data) {
          // Map Tsara status to our database status
          const statusMap: Record<string, "pending" | "processing" | "completed" | "failed" | "refunded"> = {
            "pending": "pending",
            "processing": "processing",
            "success": "completed",
            "failed": "failed",
            "refunded": "refunded"
          };

          await db
            .update(payments)
            .set({
              status: statusMap[response.data.status] || "pending",
              updatedAt: new Date(),
              gatewayResponse: JSON.stringify(response),
            })
            .where(eq(payments.transactionRef, input.reference));
        }

        return {
          success: true,
          data: response.data,
        };
      } catch (error: any) {
        console.error("Payment verification error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error?.message || "Payment verification failed",
        });
      }
    }),

  disablePaymentLink: protectedProcedure
    .input(
      z.object({
        plinkId: z.string().min(1, "Payment link ID is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await disablePaymentLink(input.plinkId);
        return {
          success: true,
          data: response.data,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error?.message || "Failed to disable payment link",
        });
      }
    }),

  // Diagnostic endpoint for checking Tsara configuration
  diagnose: publicProcedure
    .query(async () => {
      try {
        const diagnostics = await runTsaraDiagnostics();
        return {
          success: true,
          data: diagnostics,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || "Failed to run diagnostics",
        });
      }
    }),

  // Quick configuration check
  isConfigured: publicProcedure
    .query(() => {
      return {
        success: true,
        isConfigured: isTsaraConfigured(),
      };
    }),

});