import { createTRPCRouter, protectedProcedure } from "../trpc/trpc";
import { db } from "../db";
import { orders, sellers } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const OrderFilterEnum = z.enum([
  "all",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "returned",
]);

export const salesRouter = createTRPCRouter({
  getAllSales: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/sales" } })
    .input(z.object({ status: OrderFilterEnum.optional(), limit: z.number().optional(), offset: z.number().optional() }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          orderId: z.string(),
          product: z.string(),
          customer: z.string(),
          customerEmail: z.string().optional(),
          orderDate: z.date(),
          paymentMethod: z.string(),
          amountCents: z.number(),
          currency: z.string(),
          payoutStatus: z.string(),
          deliveryStatus: z.string(),
          orderStatus: z.string(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seller not found",
          });

        const status = input?.status ?? "all";
        const limit = input?.limit ?? 50;
        const offset = input?.offset ?? 0;
        const rows =
          status === "all"
            ? await db
                .select()
                .from(orders)
                .where(eq(orders.sellerId, seller.id))
                .limit(limit)
                .offset(offset)
            : await db
                .select()
                .from(orders)
                .where(
                  and(
                    eq(orders.sellerId, seller.id),
                    eq(orders.orderStatus, status as any)
                  )
                )
                .limit(limit)
                .offset(offset);

        return rows.map((o) => ({
          id: o.id,
          orderId: o.id,
          product: o.productTitle,
          customer: o.customerName,
          customerEmail: o.customerEmail,
          orderDate: o.orderDate,
          paymentMethod: o.paymentMethod,
          amountCents: o.amountCents,
          currency: o.currency,
          payoutStatus: o.payoutStatus,
          deliveryStatus: o.deliveryStatus,
          orderStatus: o.orderStatus,
        }))
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to fetch sales",
        });
      }
    }),

  getSaleById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/sales/{orderId}" } })
    .input(z.object({ orderId: z.string().uuid() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seller not found",
          });

        const rows = await db
          .select()
          .from(orders)
          .where(
            and(eq(orders.id, input.orderId), eq(orders.sellerId, seller.id))
          );
        const order = rows[0];
        if (!order)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        return order;
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to fetch order",
        });
      }
    }),

  updateSale: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/sales/update" } })
    .input(
      z.object({
        orderId: z.string().uuid(),
        payoutStatus: z.enum(["in_escrow", "processing", "paid"]).optional(),
        deliveryStatus: z
          .enum(["not_shipped", "in_transit", "delivered"])
          .optional(),
        orderStatus: z
          .enum(["processing", "shipped", "delivered", "canceled", "returned"])
          .optional(),
      })
    )

    .output(
      z.object({
        orderId: z.string(),
        product: z.string(),
        customer: z.string(),
        orderDate: z.date(),
        paymentMethod: z.string(),
        amountCents: z.number(),
        currency: z.string(),
        payoutStatus: z.string(),
        deliveryStatus: z.string(),
        orderStatus: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seller not found",
          });

        const rows = await db
          .select()
          .from(orders)
          .where(
            and(eq(orders.id, input.orderId), eq(orders.sellerId, seller.id))
          );
        if (!rows[0])
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });

        const [updated] = await db
          .update(orders)
          .set({
            payoutStatus: input.payoutStatus,
            deliveryStatus: input.deliveryStatus,
            orderStatus: input.orderStatus,
          })
          .where(eq(orders.id, input.orderId))
          .returning();

        return {
          orderId: updated.id,
          product: updated.productTitle,
          customer: updated.customerName,
          orderDate: updated.orderDate,
          paymentMethod: updated.paymentMethod,
          amountCents: updated.amountCents,
          currency: updated.currency,
          payoutStatus: updated.payoutStatus,
          deliveryStatus: updated.deliveryStatus,
          orderStatus: updated.orderStatus,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to update order",
        });
      }
    }),

  deleteSale: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/sales/{orderId}" } })
    .input(z.object({ orderId: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seller not found",
          });

        const rows = await db
          .select()
          .from(orders)
          .where(
            and(eq(orders.id, input.orderId), eq(orders.sellerId, seller.id))
          );
        if (!rows[0])
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });

        await db.delete(orders).where(eq(orders.id, input.orderId));
        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to delete order",
        });
      }
    }),

  getPayoutMethod: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, ctx.user.id));
        const seller = sellerRow[0];
        if (!seller)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Seller not found" });

        const methods = seller.payoutMethods ? JSON.parse(seller.payoutMethods) : [];
        return methods;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch payout methods",
        });
      }
    }),

  addPayoutMethod: protectedProcedure
    .input(
      z.object({
        type: z.enum(["bank_transfer", "paypal", "stripe", "crypto", "wise"]),
        accountDetails: z.record(z.string(), z.any()),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, ctx.user.id));
        const seller = sellerRow[0];
        if (!seller)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Seller not found" });

        const methods = seller.payoutMethods ? JSON.parse(seller.payoutMethods) : [];
        const newMethod = {
          id: Date.now().toString(),
          type: input.type,
          accountDetails: input.accountDetails,
          is_default: input.isDefault || methods.length === 0,
          is_verified: false,
          created_at: new Date().toISOString(),
        };

        if (newMethod.is_default) {
          methods.forEach((m: any) => (m.is_default = false));
        }

        methods.push(newMethod);

        await db
          .update(sellers)
          .set({ payoutMethods: JSON.stringify(methods) })
          .where(eq(sellers.id, seller.id));

        return newMethod;
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to add payout method",
        });
      }
    }),

  updatePayoutMethod: protectedProcedure
    .input(
      z.object({
        methodId: z.string(),
        accountDetails: z.record(z.string(), z.any()).optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, ctx.user.id));
        const seller = sellerRow[0];
        if (!seller)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Seller not found" });

        const methods = seller.payoutMethods ? JSON.parse(seller.payoutMethods) : [];
        const methodIndex = methods.findIndex((m: any) => m.id === input.methodId);
        if (methodIndex === -1)
          throw new TRPCError({ code: "NOT_FOUND", message: "Method not found" });

        if (input.accountDetails) {
          methods[methodIndex].accountDetails = input.accountDetails;
        }

        if (input.isDefault !== undefined && input.isDefault) {
          methods.forEach((m: any) => (m.is_default = false));
          methods[methodIndex].is_default = true;
        }

        await db
          .update(sellers)
          .set({ payoutMethods: JSON.stringify(methods) })
          .where(eq(sellers.id, seller.id));

        return methods[methodIndex];
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to update payout method",
        });
      }
    }),

  deletePayoutMethod: protectedProcedure
    .input(z.object({ methodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, ctx.user.id));
        const seller = sellerRow[0];
        if (!seller)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Seller not found" });

        const methods = seller.payoutMethods ? JSON.parse(seller.payoutMethods) : [];
        const updatedMethods = methods.filter((m: any) => m.id !== input.methodId);

        if (updatedMethods.length === methods.length)
          throw new TRPCError({ code: "NOT_FOUND", message: "Method not found" });

        if (updatedMethods.length > 0 && !updatedMethods.some((m: any) => m.is_default)) {
          updatedMethods[0].is_default = true;
        }

        await db
          .update(sellers)
          .set({ payoutMethods: JSON.stringify(updatedMethods) })
          .where(eq(sellers.id, seller.id));

        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to delete payout method",
        });
      }
    }),

  confirmOrder: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/sales/confirm" } })
    .input(z.object({ orderId: z.string().uuid() }))
    .output(
      z.object({
        orderId: z.string(),
        product: z.string(),
        customer: z.string(),
        orderDate: z.date(),
        paymentMethod: z.string(),
        amountCents: z.number(),
        currency: z.string(),
        payoutStatus: z.string(),
        deliveryStatus: z.string(),
        orderStatus: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seller not found",
          });

        const rows = await db
          .select()
          .from(orders)
          .where(
            and(eq(orders.id, input.orderId), eq(orders.sellerId, seller.id))
          );
        if (!rows[0])
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });

        const [updated] = await db
          .update(orders)
          .set({
            orderStatus: "confirmed",
            deliveryStatus: "not_shipped",
          })
          .where(eq(orders.id, input.orderId))
          .returning();

        return {
          orderId: updated.id,
          product: updated.productTitle,
          customer: updated.customerName,
          orderDate: updated.orderDate,
          paymentMethod: updated.paymentMethod,
          amountCents: updated.amountCents,
          currency: updated.currency,
          payoutStatus: updated.payoutStatus,
          deliveryStatus: updated.deliveryStatus,
          orderStatus: updated.orderStatus,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to confirm order",
        });
      }
    }),

  cancelOrder: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/sales/cancel" } })
    .input(
      z.object({
        orderId: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .output(
      z.object({
        orderId: z.string(),
        product: z.string(),
        customer: z.string(),
        orderDate: z.date(),
        paymentMethod: z.string(),
        amountCents: z.number(),
        currency: z.string(),
        payoutStatus: z.string(),
        deliveryStatus: z.string(),
        orderStatus: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const sellerRow = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seller not found",
          });

        const rows = await db
          .select()
          .from(orders)
          .where(
            and(eq(orders.id, input.orderId), eq(orders.sellerId, seller.id))
          );
        if (!rows[0])
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });

        const [updated] = await db
          .update(orders)
          .set({
            orderStatus: "canceled",
            deliveryStatus: "not_shipped",
          })
          .where(eq(orders.id, input.orderId))
          .returning();

        return {
          orderId: updated.id,
          product: updated.productTitle,
          customer: updated.customerName,
          orderDate: updated.orderDate,
          paymentMethod: updated.paymentMethod,
          amountCents: updated.amountCents,
          currency: updated.currency,
          payoutStatus: updated.payoutStatus,
          deliveryStatus: updated.deliveryStatus,
          orderStatus: updated.orderStatus,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to cancel order",
        });
      }
    }),
});