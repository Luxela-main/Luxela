import { z } from "zod";
import { protectedProcedure, publicProcedure, createTRPCRouter } from "../trpc/trpc";
const router = createTRPCRouter;
import { TRPCError } from "@trpc/server";

export const paymentConfirmationRouter = router({
  // Create payment confirmation intent
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        amount: z.number().positive(),
        currency: z.string().default("USD"),
        paymentMethod: z.enum([
          "card",
          "bank_transfer",
          "wallet",
          "crypto",
        ]),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create payment intent in payment provider (Stripe, etc)
      const { data: intent, error } = await ctx.supabase
        .from("payment_intents")
        .insert({
          order_id: input.orderId,
          buyer_id: ctx.user!.id,
          amount: input.amount,
          currency: input.currency,
          payment_method: input.paymentMethod,
          status: "pending",
          metadata: input.metadata,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment intent",
        });
      }

      // Generate client secret for payment
      const clientSecret = `pi_${intent.id}_${Math.random().toString(36).substr(2, 32)}`;

      return {
        intentId: intent.id,
        clientSecret,
        amount: input.amount,
        currency: input.currency,
      };
    }),

  // Confirm payment (called by payment provider after successful payment)
  confirmPayment: protectedProcedure
    .input(
      z.object({
        intentId: z.string(),
        transactionId: z.string(),
        verificationCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get payment intent
      const { data: intent, error: fetchError } = await ctx.supabase
        .from("payment_intents")
        .select("*")
        .eq("id", input.intentId)
        .single();

      if (fetchError || !intent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment intent not found",
        });
      }

      // Check if expired
      if (new Date(intent.expires_at) < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment intent has expired",
        });
      }

      // Verify with payment provider
      const verified = await verifyPaymentWithProvider(
        input.transactionId,
        intent.amount,
        input.verificationCode
      );

      if (!verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment verification failed",
        });
      }

      // Update payment intent status
      const { error: updateError } = await ctx.supabase
        .from("payment_intents")
        .update({
          status: "confirmed",
          transaction_id: input.transactionId,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", input.intentId);

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to confirm payment",
        });
      }

      // Create payment record
      const { data: payment, error: paymentError } = await ctx.supabase
        .from("payments")
        .insert({
          order_id: intent.order_id,
          buyer_id: ctx.user!.id,
          amount: intent.amount,
          currency: intent.currency,
          payment_method: intent.payment_method,
          transaction_id: input.transactionId,
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (paymentError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record payment",
        });
      }

      return {
        success: true,
        paymentId: payment.id,
        status: "confirmed",
        message: "Payment confirmed successfully",
      };
    }),

  // Check payment status
  getPaymentStatus: protectedProcedure
    .input(z.object({ intentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data: intent, error } = await ctx.supabase
        .from("payment_intents")
        .select("*")
        .eq("id", input.intentId)
        .single();

      if (error || !intent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment intent not found",
        });
      }

      return {
        intentId: intent.id,
        status: intent.status,
        amount: intent.amount,
        currency: intent.currency,
        expiresAt: intent.expires_at,
        isExpired: new Date(intent.expires_at) < new Date(),
      };
    }),

  // Refund confirmed payment
  refundPayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        reason: z.string(),
        amount: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get payment
      const { data: payment, error: fetchError } = await ctx.supabase
        .from("payments")
        .select("*")
        .eq("id", input.paymentId)
        .single();

      if (fetchError || !payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      // Verify ownership
      if (payment.buyer_id !== ctx.user!.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot refund this payment",
        });
      }

      const refundAmount = input.amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Refund amount cannot exceed payment amount",
        });
      }

      // Create refund with payment provider
      const { data: refund, error: refundError } = await ctx.supabase
        .from("refunds")
        .insert({
          payment_id: input.paymentId,
          order_id: payment.order_id,
          buyer_id: ctx.user!.id,
          amount: refundAmount,
          currency: payment.currency,
          reason: input.reason,
          status: "processing",
          requested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (refundError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create refund",
        });
      }

      // Update payment status
      await ctx.supabase
        .from("payments")
        .update({
          status: "refunded",
          refund_initiated_at: new Date().toISOString(),
        })
        .eq("id", input.paymentId);

      return {
        success: true,
        refundId: refund.id,
        status: "processing",
        message: "Refund has been initiated",
      };
    }),

  // Get all confirmed payments for buyer
  getMyPayments: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: payments, count, error } = await ctx.supabase
        .from("payments")
        .select("*", { count: "exact" })
        .eq("buyer_id", ctx.user!.id)
        .eq("status", "confirmed")
        .order("confirmed_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch payments",
        });
      }

      return {
        payments: payments || [],
        total: count || 0,
      };
    }),

  // Webhook for payment provider
  handlePaymentWebhook: publicProcedure
    .input(
      z.object({
        event: z.string(),
        data: z.record(z.string(), z.any()),
        signature: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify webhook signature
      const valid = verifyWebhookSignature(input.signature, input.data);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid webhook signature",
        });
      }

      // Handle different webhook events
      if (input.event === "payment.succeeded") {
        // Update payment intent
        await ctx.supabase
          .from("payment_intents")
          .update({ status: "confirmed" })
          .eq("transaction_id", input.data.transactionId);
      } else if (input.event === "payment.failed") {
        await ctx.supabase
          .from("payment_intents")
          .update({ status: "failed" })
          .eq("transaction_id", input.data.transactionId);
      } else if (input.event === "refund.completed") {
        await ctx.supabase
          .from("refunds")
          .update({ status: "completed" })
          .eq("id", input.data.refundId);
      }

      return { received: true };
    }),
});

// Helper to verify payment with payment provider
async function verifyPaymentWithProvider(
  transactionId: string,
  amount: number,
  verificationCode?: string
): Promise<boolean> {
  try {
    // This would call your payment provider's API (Stripe, PayPal, etc)
    // For now, we'll simulate verification
    return true;
  } catch {
    return false;
  }
}

// Helper to verify webhook signature
function verifyWebhookSignature(
  signature: string,
  data: Record<string, any>
): boolean {
  try {
    // Verify signature from payment provider
    // This depends on your payment provider's implementation
    return true;
  } catch {
    return false;
  }
}