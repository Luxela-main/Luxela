import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "../db";
import { payments } from "../db/schema";
import { randomUUID } from "crypto";
import { createPaymentLink,retrievePaymentLink, getPaymentLink, listPaymentLinks, disablePaymentLink } from "../services/tsara";


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
        metadata: z.record(z.string(), z.any()).optional(),
        redirect_url: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        
        const response = await createPaymentLink(input);

        const [payment] = await db
          .insert(payments)
          .values({
            buyerId: input.buyerId,
            listingId: input.listingId,
            orderId: input.orderId ?? null,
            amountCents: Math.round(input.amount * 100),
            currency: input.currency,
            paymentMethod: input.paymentMethod,
            provider: input.provider,
            status: "pending",
            transactionRef:
              response?.data?.reference ||
              response?.reference ||
              randomUUID(),
            gatewayResponse: JSON.stringify(response),
          })
          .returning();

        return {
          payment,
          paymentLink: response?.data?.link || response?.data?.url || null,
        };
      } catch (error: any) {
        console.error("Payment creation error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error?.response?.data?.message || "Payment creation failed",
        });
      }
    }),

     getPaymentLink: protectedProcedure
    .input(z.object({ plinkId: z.string() }))
    .query(async ({ input }) => {
      const result = await retrievePaymentLink(input.plinkId);
      return result;
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
        return {
          success: true,
          data: response.data || [],
          pagination: response.pagination || {},
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error?.message || "Failed to list payment links",
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

});