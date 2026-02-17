import { createTRPCRouter, protectedProcedure } from "../trpc/trpc";
import { db } from "../db";
import { orders, sellers, sellerPayoutMethods } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { notifyOrderConfirmed } from "../services/notificationService";

import { sellerConfirmOrder, sellerConfirmDelivery } from "../services/orderConfirmationService";

const OrderFilterEnum = z.enum([
  "all",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "returned",
]);

const sellerCache = new Map<string, { id: string; data: any; timestamp: number }>();
const CACHE_DURATION = 30000;

function getCachedSeller(userId: string) {
  const cached = sellerCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedSeller(userId: string, data: any) {
  sellerCache.set(userId, { id: userId, data, timestamp: Date.now() });
}

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
          orderDate: z.string().datetime(),
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
        let seller = getCachedSeller(userId);
        if (!seller) {
          const sellerRow = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, userId));
          seller = sellerRow[0];
          if (!seller)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Seller not found",
            });
          setCachedSeller(userId, seller);
        }

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

        return rows.map((o: any) => {
          // Convert orderDate to ISO string for Zod validation
          const orderDateStr = o.orderDate instanceof Date 
            ? o.orderDate.toISOString()
            : typeof o.orderDate === 'string'
              ? o.orderDate
              : new Date(o.orderDate).toISOString();
          
          return {
            id: o.id,
            orderId: o.id,
            product: o.productTitle || '',
            customer: o.customerName || '',
            customerEmail: o.customerEmail || undefined,
            orderDate: orderDateStr,
            paymentMethod: String(o.paymentMethod || ''),
            amountCents: o.amountCents || 0,
            currency: o.currency || '',
            payoutStatus: String(o.payoutStatus || ''),
            deliveryStatus: String(o.deliveryStatus || ''),
            orderStatus: String(o.orderStatus || ''),
          };
        });
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
    .output(
      z.object({
        id: z.string(),
        orderId: z.string(),
        product: z.string(),
        customer: z.string(),
        customerEmail: z.string().optional(),
        orderDate: z.string().datetime(),
        paymentMethod: z.string(),
        amountCents: z.number(),
        currency: z.string(),
        quantity: z.number().optional(),
        shippingAddress: z.string().optional(),
        payoutStatus: z.string(),
        deliveryStatus: z.string(),
        orderStatus: z.string(),
        selectedSize: z.string().optional(),
        selectedColor: z.string().optional(),
        selectedColorHex: z.string().optional(),
        productImage: z.string().optional(),
        productCategory: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        let seller = getCachedSeller(userId);
        if (!seller) {
          const sellerRow = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, userId));
          seller = sellerRow[0];
          if (!seller)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Seller not found",
            });
          setCachedSeller(userId, seller);
        }

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
        // Safely format orderDate - handle both Date objects and strings
        const orderDateStr = order.orderDate instanceof Date 
          ? order.orderDate.toISOString()
          : typeof order.orderDate === 'string'
            ? order.orderDate
            : new Date(order.orderDate).toISOString();
        
        return {
          id: order.id,
          orderId: order.id,
          product: order.productTitle || '',
          customer: order.customerName || '',
          customerEmail: order.customerEmail || undefined,
          orderDate: orderDateStr,
          paymentMethod: String(order.paymentMethod || ''),
          amountCents: order.amountCents || 0,
          currency: order.currency || '',
          quantity: order.quantity || 1,
          shippingAddress: order.shippingAddress || undefined,
          payoutStatus: String(order.payoutStatus || ''),
          deliveryStatus: String(order.deliveryStatus || ''),
          orderStatus: String(order.orderStatus || ''),
          selectedSize: order.selectedSize || undefined,
          selectedColor: order.selectedColor || undefined,
          selectedColorHex: order.selectedColorHex || undefined,
          productImage: order.productImage || undefined,
          productCategory: String(order.productCategory || ''),
        };
      } catch (err: any) {
        console.error("[getSaleById] Error:", err?.message);
        console.error("[getSaleById] Full error object:", err);
        console.error("[getSaleById] Stack trace:", err?.stack);
        
        if (err instanceof TRPCError) {
          throw err;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch order: " + (err?.message || "Unknown error"),
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
        let seller = getCachedSeller(userId);
        if (!seller) {
          const sellerRow = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, userId));
          seller = sellerRow[0];
          if (!seller)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Seller not found",
            });
          setCachedSeller(userId, seller);
        }

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
        let seller = getCachedSeller(userId);
        if (!seller) {
          const sellerRow = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, userId));
          seller = sellerRow[0];
          if (!seller)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Seller not found",
            });
          setCachedSeller(userId, seller);
        }

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
        let seller = getCachedSeller(ctx.user.id);
        if (!seller) {
          const sellerRow = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, ctx.user.id));
          seller = sellerRow[0];
          if (!seller)
            throw new TRPCError({ code: "BAD_REQUEST", message: "Seller not found" });
          setCachedSeller(ctx.user.id, seller);
        }

        // Fetch from the actual database table with error handling
        let methods: any[] = [];
        try {
          methods = await db
            .select()
            .from(sellerPayoutMethods)
            .where(eq(sellerPayoutMethods.sellerId, seller.id));
        } catch (dbError: any) {
          console.warn("[PAYOUT_METHODS] Query failed:", dbError?.message);
          // Return empty array if query fails - table might not be migrated yet
          methods = [];
        }
        
        return methods.map((m) => ({
          id: m.id,
          type: m.methodType,
          is_default: m.isDefault,
          is_verified: m.isVerified,
          accountName: m.accountHolderName || m.email || m.phoneNumber || 'Unnamed Account',
          bankName: m.bankName,
          accountNumber: m.accountNumber,
          bankCountry: m.bankCountry,
          swiftCode: m.swiftCode,
          iban: m.iban,
          email: m.email,
          accountId: m.accountId,
          phoneNumber: m.phoneNumber,
          mobileMoneyProvider: m.mobileMoneyProvider,
          sellerId: seller.id,
          created_at: m.createdAt,
          updated_at: m.updatedAt,
        }));
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
        type: z.enum(["bank", "paypal", "stripe", "flutterwave", "tsara", "mobile_money", "wise", "other"]),
        accountDetails: z.record(z.string(), z.any()),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        let seller = getCachedSeller(ctx.user.id);
        if (!seller) {
          const sellerRow = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, ctx.user.id));
          seller = sellerRow[0];
          if (!seller)
            throw new TRPCError({ code: "BAD_REQUEST", message: "Seller not found" });
          setCachedSeller(ctx.user.id, seller);
        }

        // Check if this will be the default method with error handling
        let existingMethods: any[] = [];
        try {
          existingMethods = await db
            .select()
            .from(sellerPayoutMethods)
            .where(eq(sellerPayoutMethods.sellerId, seller.id));
        } catch (dbError: any) {
          console.warn("[PAYOUT_METHODS] Failed to check existing methods:", dbError?.message);
          existingMethods = [];
        }
        
        const isDefault = input.isDefault || existingMethods.length === 0;

        // If this method should be default, unset others
        if (isDefault && existingMethods.length > 0) {
          try {
            await db
              .update(sellerPayoutMethods)
              .set({ isDefault: false })
              .where(eq(sellerPayoutMethods.sellerId, seller.id));
          } catch (dbError: any) {
            console.warn("[PAYOUT_METHODS] Failed to update default status:", dbError?.message);
          }
        }

        // Helper function to sanitize string inputs
        const sanitizeInput = (value: any): string | null => {
          if (!value || typeof value !== 'string') return null;
          // Trim whitespace and remove leading special characters that indicate corrupted data
          const cleaned = value.trim();
          if (cleaned === '' || cleaned === '&') return null;
          // Remove leading ampersand if present (URL encoding artifact)
          return cleaned.startsWith('&') ? cleaned.substring(1) : cleaned;
        };

        // Create new method in database with error handling
        let newMethod: any[] = [];
        try {
          const insertData: any = {
            sellerId: seller.id,
            methodType: input.type as any,
            isDefault,
            isVerified: false,
            // Explicitly set default/nullable fields to null to avoid Drizzle "default" keyword issues
            verificationToken: null,
            bankCountry: null,
            bankName: null,
            bankCode: null,
            accountHolderName: null,
            accountNumber: null,
            accountType: null,
            swiftCode: null,
            iban: null,
            email: null,
            accountId: null,
            phoneNumber: null,
            mobileMoneyProvider: null,
            metadata: null,
            lastUsedAt: null,
          };

          // Add optional fields only if they are defined and not null
          const optionalFields = [
            'bankCountry', 'bankName', 'bankCode', 'accountHolderName',
            'accountNumber', 'accountType', 'swiftCode', 'iban',
            'email', 'accountId', 'phoneNumber', 'mobileMoneyProvider'
          ];
          
          for (const field of optionalFields) {
            const value = input.accountDetails[field];
            const sanitized = sanitizeInput(value);
            if (sanitized !== null && sanitized !== '') {
              insertData[field] = sanitized;
            }
          }

          newMethod = await db
            .insert(sellerPayoutMethods)
            .values(insertData)
            .returning();
        } catch (dbError: any) {
          console.error("[PAYOUT_METHODS] Insert failed:", dbError?.message);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: dbError?.message || "Failed to add payout method",
          });
        }

        return {
          id: newMethod[0].id,
          type: newMethod[0].methodType,
          is_default: newMethod[0].isDefault,
          is_verified: newMethod[0].isVerified,
          accountName: newMethod[0].accountHolderName || newMethod[0].email || newMethod[0].phoneNumber || 'Unnamed Account',
          created_at: newMethod[0].createdAt,
        };
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
        let seller = getCachedSeller(ctx.user.id);
        if (!seller) {
          const sellerRow = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, ctx.user.id));
          seller = sellerRow[0];
          if (!seller)
            throw new TRPCError({ code: "BAD_REQUEST", message: "Seller not found" });
          setCachedSeller(ctx.user.id, seller);
        }

        // Verify the method belongs to this seller
        let method: any[] = [];
        try {
          method = await db
            .select()
            .from(sellerPayoutMethods)
            .where(
              and(
                eq(sellerPayoutMethods.id, input.methodId),
                eq(sellerPayoutMethods.sellerId, seller.id)
              )
            );
        } catch (dbError: any) {
          console.warn("[PAYOUT_METHODS] Failed to fetch method:", dbError?.message);
          throw new TRPCError({ code: "NOT_FOUND", message: "Method not found" });
        }
        
        if (method.length === 0)
          throw new TRPCError({ code: "NOT_FOUND", message: "Method not found" });

        const sanitizeInput = (value: any): string | null => {
          if (!value || typeof value !== 'string') return null;
          const cleaned = value.trim();
          if (cleaned === '' || cleaned === '&') return null;
          return cleaned.startsWith('&') ? cleaned.substring(1) : cleaned;
        };

        const updateData: any = {};
        
        if (input.accountDetails) {
          const fields = [
            'bankCountry', 'bankName', 'bankCode', 'accountHolderName',
            'accountNumber', 'accountType', 'swiftCode', 'iban',
            'email', 'accountId', 'phoneNumber', 'mobileMoneyProvider'
          ];
          
          for (const field of fields) {
            const value = (input.accountDetails as any)[field];
            const sanitized = sanitizeInput(value);
            if (sanitized !== null && sanitized !== '') {
              (updateData as any)[field] = sanitized;
            }
          }
        }

        if (input.isDefault !== undefined && input.isDefault) {
          // Unset other default methods
          try {
            await db
              .update(sellerPayoutMethods)
              .set({ isDefault: false })
              .where(eq(sellerPayoutMethods.sellerId, seller.id));
          } catch (dbError: any) {
            console.warn("[PAYOUT_METHODS] Failed to update other methods:", dbError?.message);
          }
          updateData.isDefault = true;
        }

        let updatedMethod: any[] = [];
        try {
          updatedMethod = await db
            .update(sellerPayoutMethods)
            .set(updateData)
            .where(eq(sellerPayoutMethods.id, input.methodId))
            .returning();
        } catch (dbError: any) {
          console.error("[PAYOUT_METHODS] Update failed:", dbError?.message);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: dbError?.message || "Failed to update payout method",
          });
        }

        const updated = updatedMethod[0];
        return {
          id: updated.id,
          type: updated.methodType,
          is_default: updated.isDefault,
          is_verified: updated.isVerified,
          accountName: updated.accountHolderName || updated.email || updated.phoneNumber || 'Unnamed Account',
        };
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
        let seller = getCachedSeller(ctx.user.id);
        if (!seller) {
          const sellerRow = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, ctx.user.id));
          seller = sellerRow[0];
          if (!seller)
            throw new TRPCError({ code: "BAD_REQUEST", message: "Seller not found" });
          setCachedSeller(ctx.user.id, seller);
        }

        // Verify the method belongs to this seller
        let method: any[] = [];
        try {
          method = await db
            .select()
            .from(sellerPayoutMethods)
            .where(
              and(
                eq(sellerPayoutMethods.id, input.methodId),
                eq(sellerPayoutMethods.sellerId, seller.id)
              )
            );
        } catch (dbError: any) {
          console.warn("[PAYOUT_METHODS] Failed to fetch method for deletion:", dbError?.message);
          throw new TRPCError({ code: "NOT_FOUND", message: "Method not found" });
        }
        
        if (method.length === 0)
          throw new TRPCError({ code: "NOT_FOUND", message: "Method not found" });

        // Check if this is the default method
        const isDefault = method[0].isDefault;

        // Delete the method
        try {
          await db
            .delete(sellerPayoutMethods)
            .where(eq(sellerPayoutMethods.id, input.methodId));
        } catch (dbError: any) {
          console.error("[PAYOUT_METHODS] Delete failed:", dbError?.message);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: dbError?.message || "Failed to delete payout method",
          });
        }

        // If we deleted the default method, set a new one as default
        if (isDefault) {
          try {
            const remainingMethods = await db
              .select()
              .from(sellerPayoutMethods)
              .where(eq(sellerPayoutMethods.sellerId, seller.id));
            
            if (remainingMethods.length > 0) {
              await db
                .update(sellerPayoutMethods)
                .set({ isDefault: true })
                .where(eq(sellerPayoutMethods.id, remainingMethods[0].id));
            }
          } catch (dbError: any) {
            console.warn("[PAYOUT_METHODS] Failed to set new default method:", dbError?.message);
          }
        }

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
        // Use orderConfirmationService which handles payment hold verification
        const updated = await sellerConfirmOrder(userId, input.orderId);

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
        let seller = getCachedSeller(userId);
        if (!seller) {
          const sellerRow = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, userId));
          seller = sellerRow[0];
          if (!seller)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Seller not found",
            });
          setCachedSeller(userId, seller);
        }

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