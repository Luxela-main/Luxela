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
  StablecoinPaymentLink
} from "../services/tsara";
import { getOrCreateTsaraCustomer } from "../services/paymentCustomerHelper";
import { runTsaraDiagnostics, isTsaraConfigured } from "../services/tsaraDiagnostic";
import { env } from "@/env";


export const paymentRouter = createTRPCRouter({
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
        // Validate environment configuration
        const { TSARA_SECRET_KEY, TSARA_WEBHOOK_SECRET } = env;
        if (!TSARA_SECRET_KEY || TSARA_SECRET_KEY.trim() === '') {
          console.error('[Payment] TSARA_SECRET_KEY is not configured');
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment service is not properly configured. Please contact support.",
          });
        }
        if (!TSARA_WEBHOOK_SECRET || TSARA_WEBHOOK_SECRET.trim() === '') {
          console.error('[Payment] TSARA_WEBHOOK_SECRET is not configured');
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment webhook is not properly configured. Please contact support.",
          });
        }

        // Validate buyer exists
        const [buyer] = await db
          .select()
          .from(buyers)
          .where(eq(buyers.id, input.buyerId))
          .limit(1);

        if (!buyer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Buyer not found",
          });
        }

        // Validate listing exists and is available
        const [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, input.listingId))
          .limit(1);

        if (!listing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Listing not found",
          });
        }

        if (listing.status !== 'approved') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Listing is not available for purchase",
          });
        }

        // Get or create Tsara customer ID with improved error handling
        let customerId: string | undefined;
        
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
          
          // For fiat payments, we can continue without a customer ID
          // The payment link API might handle customer creation automatically
          if (input.paymentType === 'fiat') {
            console.log('[Payment] Continuing without customer ID for fiat payment');
            customerId = undefined;
          } else {
            // For crypto payments, customer ID might be required
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to initialize customer: ${error.message}`,
              cause: error,
            });
          }
        }

        console.log('[Payment] Creating payment link with customer ID:', customerId);

        // Define consistent conversion rates
        const USDC_TO_NGN_RATE = 1000; // 1 USDC = 1000 NGN
        const AMOUNT_MULTIPLIER = 100; // Convert to cents for fiat

        // Validate amount ranges
        if (input.amount <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment amount must be greater than zero",
          });
        }

        if (input.amount > 10000000) { // 100 million NGN limit
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment amount exceeds maximum allowed limit",
          });
        }

        // Create appropriate payment link based on type
        let response: any;
        
        if (input.paymentType === "stablecoin") {
          if (!input.wallet_id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "wallet_id is required for stablecoin payments",
            });
          }

          // Convert NGN amount to USDC with proper decimal handling
          const usdcAmount = input.amount / USDC_TO_NGN_RATE;

          // Validate USDC amount is reasonable
          if (usdcAmount < 0.01) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Payment amount too small for stablecoin transaction",
            });
          }

          response = await createStablecoinPaymentLink({
            amount: usdcAmount.toFixed(6), // Send as decimal string with 6 decimals
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

          // Convert NGN amount to USDC
          const usdcAmount = input.amount / USDC_TO_NGN_RATE;

          if (usdcAmount < 0.01) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Payment amount too small for USDC transaction",
            });
          }

          response = await createStablecoinPaymentLink({
            amount: usdcAmount.toFixed(6),
            asset: "USDC",
            network: "solana",
            wallet_id: input.wallet_id,
            description: input.description,
            metadata: input.metadata,
          });
        } else {
          // Fiat payment (card or bank transfer)
          // Convert amount to cents for Tsara API
          const amountInCents = Math.round(input.amount * AMOUNT_MULTIPLIER);

          if (input.success_url && input.cancel_url) {
            // Use checkout session for better UX
            response = await createCheckoutSession({
              amount: amountInCents,
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
              amount: amountInCents,
              currency: input.currency,
              description: input.description,
              customer_id: customerId,
              metadata: input.metadata,
              redirect_url: input.redirect_url,
            });
          }
        }

        // Validate response structure
        if (!response || !response.data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid response from payment provider",
          });
        }

        // Tsara sometimes returns only a raw entity (PaymentLink, CheckoutSession, etc)
        // not a wrapper with { success, error }. We normalize it here.
        type TsaraWrapper<T> = {
        success?: boolean;
        error?: { message?: string };
        data?: T;
      };

        // Normalize into predictable shape
        const result = response.data as TsaraWrapper<
        PaymentLink | StablecoinPaymentLink | CheckoutSession
      >;

        if (result.success === false) {
        const errorMessage =
        result.error?.message || "Payment provider returned an error";

        console.error("Tsara API error:", result.error);

        throw new TRPCError({
        code: "BAD_REQUEST",
        message: errorMessage,
      });
    }

        // Calculate amount in cents for database storage
        let amountCents: number;
        if (input.paymentType === "stablecoin" || (input.paymentMethod === "crypto" && input.currency === "USDC")) {
          // For stablecoin, store the NGN equivalent in cents
          amountCents = Math.round(input.amount * AMOUNT_MULTIPLIER);
        } else {
          // For fiat, amount is already in currency units, convert to cents
          amountCents = Math.round(input.amount * AMOUNT_MULTIPLIER);
        }

        // Store payment in database with transaction
        const paymentData = {
          buyerId: input.buyerId,
          listingId: input.listingId,
          orderId: input.orderId ?? null,
          amountCents,
          currency: input.paymentType === "stablecoin" ? "USDC" : input.currency,
          paymentMethod: input.paymentMethod,
          provider: input.provider,
          status: "pending" as const,
          transactionRef: response.data.id,
          gatewayResponse: JSON.stringify(response),
        };

        const [payment] = await db
          .insert(payments)
          .values(paymentData)
          .returning();

        if (!payment) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save payment record",
          });
        }

        return {
          payment,
          paymentUrl: (response.data as any).url || (response.data as any).checkout_url,
          paymentId: response.data.id,
        };
      // TEMPORARILY COMMENTED OUT CATCH BLOCK
      } catch (error: any) {
        // Enhanced error logging and handling
        console.error("[Payment] Payment creation error:", {
          message: error?.message,
          code: error?.code,
          name: error?.name,
          stack: error?.stack,
          responseStatus: error?.response?.status,
          responseData: error?.response?.data,
          input: {
            buyerId: input.buyerId,
            listingId: input.listingId,
            orderId: input.orderId,
            amount: input.amount,
            currency: input.currency,
            paymentMethod: input.paymentMethod,
            paymentType: input.paymentType,
          },
          timestamp: new Date().toISOString(),
        });

        // Handle different types of errors appropriately
        if (error instanceof TRPCError) {
          throw error; // Re-throw TRPC errors as-is
        }

        // Handle Axios/network errors
        if (error?.response) {
          const status = error.response.status;
          const errorData = error.response.data;

          if (status === 401) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Payment service authentication failed. Please contact support.",
            });
          } else if (status === 403) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Payment service access denied. Please contact support.",
            });
          } else if (status === 429) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Too many payment requests. Please wait and try again.",
            });
          } else if (status >= 500) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Payment service is temporarily unavailable. Please try again later.",
            });
          } else {
            // Handle specific API error codes
            const errorMessage = errorData?.error?.message ||
                               errorData?.message ||
                               error?.message ||
                               "Payment creation failed";

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: errorMessage,
            });
          }
        }

        // Handle Tsara API errors that have error codes attached (from tsara.ts service functions)
        // These errors have properties like 'code', 'status', 'tsaraError' attached to them
        if (error?.code && error?.tsaraError) {
          const errorCode = error.code as string;
          const errorStatus = error.status as number;
          
          // Extract the detailed error message from tsaraError first, then fall back to error.message
          // error.message is generic ("Payment provider returned an error"), 
          // while error.tsaraError.message contains the actual API error details
          const errorDetails = error.tsaraError as { message?: string; code?: string; requestId?: string } | undefined;
          let errorMessage: string;
          
          if (errorDetails?.message) {
            errorMessage = errorDetails.message;
          } else if (error?.message) {
            errorMessage = error.message;
          } else {
            errorMessage = "Payment processing failed";
          }
          
          // If this is an internal server error from Tsara without a specific message, add context
          if (errorCode === "INTERNAL_SERVER_ERROR" && errorMessage === "Payment processing failed") {
            errorMessage = "Payment provider returned an error. Please try again later.";
          }

          // Map specific Tsara error codes to appropriate TRPC error codes
          if (errorCode === "AUTHENTICATION_FAILED" || errorCode === "AUTH_ERROR" || errorCode === "UNAUTHORIZED") {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Payment service authentication failed. The API credentials may be invalid or missing. Please check your TSARA_SECRET_KEY configuration or contact support.",
            });
          } else if (errorCode === "RATE_LIMIT_EXCEEDED") {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Too many payment attempts. Please wait a moment and try again.",
            });
          } else if (errorCode === "SERVICE_UNAVAILABLE" || errorStatus >= 500) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Payment service is temporarily unavailable. Please try again later.",
            });
          } else {
            // For all other Tsara errors (INVALID_AMOUNT, INVALID_CURRENCY, CUSTOMER_NOT_FOUND, etc.)
            // Use BAD_REQUEST with the user-friendly message already constructed by tsara.ts
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: errorMessage,
            });
          }
        }

        // Handle validation errors
        if (error?.name === 'ValidationError' || error?.name === 'ZodError') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid payment data provided",
          });
        }

        // Handle database errors
        if (error?.code?.startsWith('23')) { // PostgreSQL constraint violations
          throw new TRPCError({
            code: "CONFLICT",
            message: "Payment data conflicts with existing records",
          });
        }

        // Generic fallback
        const errorMessage = error?.message || "Payment creation failed due to an unexpected error";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errorMessage,
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