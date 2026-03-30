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

      // Define paymentData variable in outer scope so it's available in catch block
        let paymentData: any;
        
        try {
        // Validate input data first
        if (!input.buyerId || input.buyerId.trim() === '') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Buyer ID is required",
          });
        }

        if (!input.listingId || input.listingId.trim() === '') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Listing ID is required for payment",
          });
        }

        if (!input.amount || input.amount <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment amount must be a positive number",
          });
        }

        // Validate environment configuration
        const TSARA_SECRET_KEY = env.TSARA_SECRET_KEY || process.env.TSARA_SECRET_KEY;
        console.log('[Payment] Environment check:', {
          envHasKey: !!env.TSARA_SECRET_KEY,
          processEnvHasKey: !!process.env.TSARA_SECRET_KEY,
          keyLength: TSARA_SECRET_KEY?.length,
          nodeEnv: process.env.NODE_ENV,
        });
        if (!TSARA_SECRET_KEY || TSARA_SECRET_KEY.trim() === '') {
          console.error('[Payment] TSARA_SECRET_KEY is not configured');
          console.error('[Payment] Available TSARA env vars:', Object.keys(process.env).filter(k => k.includes('TSARA')));
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment service is not properly configured. Please contact support.",
          });
        }
        // Note: TSARA_WEBHOOK_SECRET is only required for webhook verification, not payment creation
        // It will be validated when receiving webhooks at /api/webhooks/tsara

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

        // Note: Tsara automatically creates customers, so we don't need to manage customer IDs
        // Customer creation removed - customer info is passed via payment link metadata

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
        
        // Sanitize metadata - ensure all values are strings for Tsara API
        const sanitizedMetadata: Record<string, string> = {};
        if (input.metadata) {
          Object.entries(input.metadata).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              sanitizedMetadata[key] = typeof value === 'string' ? value : JSON.stringify(value);
            }
          });
        }

        // Add buyer and listing info to metadata for tracking
        sanitizedMetadata.buyerId = input.buyerId;
        sanitizedMetadata.listingId = input.listingId;
        if (input.orderId) sanitizedMetadata.orderId = input.orderId;
        
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
            metadata: sanitizedMetadata,
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
            metadata: sanitizedMetadata,
          });
        } else {
          // Fiat payment (card or bank transfer)
          // Convert amount to cents for Tsara API
          const amountInCents = Math.round(input.amount * AMOUNT_MULTIPLIER);

          // Sanitize metadata - ensure all values are strings for Tsara API
          if (input.success_url && input.cancel_url) {
            // Use checkout session for better UX
            response = await createCheckoutSession({
              amount: amountInCents,
              currency: input.currency,
              reference: `order_${input.orderId || uuidv4()}`,
              success_url: input.success_url,
              cancel_url: input.cancel_url,
              metadata: sanitizedMetadata,
            });
          } else {
            // Use payment link
            response = await createFiatPaymentLink({
              amount: amountInCents,
              currency: input.currency,
              description: input.description,
              metadata: sanitizedMetadata,
              redirect_url: input.redirect_url,
            });
          }
        }

        // Validate response structure
        if (!response || !response.data) {
          console.error('[Payment] Invalid Tsara response:', {
            hasResponse: !!response,
            hasData: !!response?.data,
            response: response,
          });
          
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid response from payment provider",
          });
        }

        // Tsara returns a consistent wrapper: { success, data, request_id, error? }
        // The response variable is already the TsaraResponse<T> from the service functions
        if (response.success === false) {
          const errorMessage =
            response.error?.message || "Payment provider returned an error";

          console.error("Tsara API error:", response.error);

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: errorMessage,
          });
        }

        // Validate we have a payment ID for the transaction reference
        const tsaraPaymentId = response.data?.id;
        console.log('[Payment] Extracted Tsara payment ID:', { tsaraPaymentId, type: typeof tsaraPaymentId });
        
        if (!tsaraPaymentId || tsaraPaymentId.trim?.() === '') {
          console.error('[Payment] No payment ID from Tsara:', {
            responseData: response.data,
            responseDataKeys: response.data ? Object.keys(response.data) : null,
          });
          
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment provider did not return a payment ID",
          });
        }

        console.log('[Payment] Tsara link created successfully:', {
          paymentId: tsaraPaymentId,
          amount: input.amount,
          currency: input.currency,
          paymentMethod: input.paymentMethod,
        });

        // Calculate amount in cents for database storage
        let amountCents: number;
        if (input.paymentType === "stablecoin" || (input.paymentMethod === "crypto" && input.currency === "USDC")) {
          // For stablecoin, store the NGN equivalent in cents
          amountCents = Math.round(input.amount * AMOUNT_MULTIPLIER);
        } else {
          // For fiat, amount is already in currency units, convert to cents
          amountCents = Math.round(input.amount * AMOUNT_MULTIPLIER);
        }

        // Safely stringify gateway response to handle circular references
        let gatewayResponseStr: string;
        try {
          gatewayResponseStr = JSON.stringify(response);
        } catch (jsonError) {
          console.error('[Payment] Failed to stringify gateway response:', jsonError);
          gatewayResponseStr = JSON.stringify({ 
            error: 'Failed to stringify response',
            data: response?.data ? { id: response.data.id, status: response.data.status } : null
          });
        }
        
        console.log('[Payment] About to create payment data object...');
        
        // Store payment in database with transaction
        paymentData = {
          buyerId: input.buyerId,
          listingId: input.listingId,
          orderId: input.orderId ?? null,
          amountCents,
          currency: input.paymentType === "stablecoin" ? "USDC" : input.currency,
          paymentMethod: input.paymentMethod,
          provider: input.provider,
          status: "pending" as const,
          transactionRef: tsaraPaymentId,
          gatewayResponse: gatewayResponseStr,
        };

        console.log('[Payment] Inserting payment into database:', {
          buyerId: paymentData.buyerId,
          listingId: paymentData.listingId,
          amountCents: paymentData.amountCents,
          currency: paymentData.currency,
          transactionRef: paymentData.transactionRef,
          gatewayResponseLength: paymentData.gatewayResponse?.length,
        });

        let payment;
        try {
          const result = await db
            .insert(payments)
            .values(paymentData)
            .returning();
          console.log('[Payment] Database insert result:', { 
            resultLength: result?.length,
            resultType: typeof result,
            isArray: Array.isArray(result)
          });
          payment = result[0];
        } catch (dbError: any) {
          console.error('[Payment] DATABASE INSERT ERROR:', {
            message: dbError?.message,
            code: dbError?.code,
            detail: dbError?.detail,
            constraint: dbError?.constraint,
            stack: dbError?.stack,
          });
          throw dbError;
        }

        if (!payment) {
          console.error('[Payment] Database insertion returned no record:', { paymentData });
          
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save payment record",
          });
        }

        console.log('[Payment] Payment saved successfully:', { 
          paymentId: payment.id,
          transactionRef: payment.transactionRef,
        });

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
          errorType: error?.constructor?.name,
          dbCode: error?.code, // PostgreSQL error code
          digest: (error as any)?.digest, // Prisma/Drizzle digest
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

        // Handle TRPC errors first - pass them through as-is
        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle Axios/HTTP response errors
        if (error?.response?.status) {
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

        // Handle database/Drizzle ORM errors
        // PostgreSQL constraint violations (unique, foreign key, not null, etc.)
        // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
        const pgErrorCode = error?.code?.toString?.() || '';
        const dbErrorMessage = error?.message?.toString?.() || '';
        const dbErrorName = error?.name?.toString?.() || '';
        
        // 23505 = unique_violation, 23503 = foreign_key_violation, 23502 = not_null_violation
        // 23514 = check_violation, 23P01 = exclusion_violation
        const isConstraintViolation = pgErrorCode.startsWith('23') || 
                                      dbErrorMessage.includes('unique') || 
                                      dbErrorMessage.includes('constraint') ||
                                      dbErrorMessage.includes('duplicate');
        
        if (isConstraintViolation) {
          console.error('[Payment] Database constraint violation:', {
            message: dbErrorMessage,
            code: pgErrorCode,
            transactionRef: paymentData?.transactionRef,
          });
          
          // Provide more specific error messages based on the constraint type
          let userMessage = "Payment record conflicts with existing data.";
          if (dbErrorMessage.includes('transaction_ref') || dbErrorMessage.includes('transactionRef')) {
            userMessage = "A payment with this transaction reference already exists. Please try again.";
          } else if (dbErrorMessage.includes('buyer_id') || dbErrorMessage.includes('buyerId')) {
            userMessage = "Invalid buyer account. Please log in again.";
          } else if (dbErrorMessage.includes('listing_id') || dbErrorMessage.includes('listingId')) {
            userMessage = "The item you're trying to purchase is no longer available.";
          } else if (dbErrorMessage.includes('order_id') || dbErrorMessage.includes('orderId')) {
            userMessage = "Invalid order reference. Please start the checkout process again.";
          }
          
          throw new TRPCError({
            code: "CONFLICT",
            message: `${userMessage} Please contact support if the problem persists.`,
          });
        }

        // Handle other database errors - include actual error details for debugging
        // Only treat as database error if it looks like one (has PostgreSQL error code or Drizzle-specific properties)
        const isDbError = pgErrorCode && /^[0-9A-Z]{5}$/.test(pgErrorCode); // PostgreSQL error codes are 5 chars
        const isDrizzleError = dbErrorName.includes('Drizzle') || dbErrorName.includes('Postgres');
        
        if (isDbError || isDrizzleError) {
          console.error('[Payment] Database operation failed:', {
            message: dbErrorMessage,
            code: pgErrorCode,
            name: dbErrorName,
            stack: error?.stack,
          });
          
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Database error: ${dbErrorMessage || 'Unknown database error'}. Please try again or contact support.`,
          });
        }

        // Generic fallback for any other errors
        const errorMessage = error?.message || "Payment creation failed due to an unexpected error";
        console.error('[Payment] Unhandled error:', errorMessage);
        
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