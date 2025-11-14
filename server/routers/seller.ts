import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { db } from "../db";
import {
  sellers,
  sellerBusiness,
  sellerShipping,
  sellerPayment,
  sellerAdditional,
} from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  checkRateLimit,
  getCached,
  deleteCache,
  // invalidateCache,
  CacheKeys,
  // RateLimits,
} from "../lib/redis";

async function getOrCreateSeller(userId: string) {
  try {
    // Check if seller exists
    const existingSeller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, userId));

    if (existingSeller.length > 0) {
      return existingSeller[0];
    }

    // Create new seller
    const sellerId = randomUUID();
    await db.insert(sellers).values({
      id: sellerId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Fetch newly created seller
    const newSeller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.id, sellerId));

    if (!newSeller[0]) {
      throw new Error("Failed to create seller record");
    }

    return newSeller[0];
  } catch (err: any) {
    console.error("Error in getOrCreateSeller:", err);
    throw new Error(`getOrCreateSeller failed: ${err?.message || err}`);
  }
}

export const sellerRouter = createTRPCRouter({
  getProfile: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/seller/profile",
        summary: "Get seller profile details",
        description:
          "Fetch seller, shipping, payment, and additional profile information for the authenticated user.",
        tags: ["Seller"],
      },
    })
    .output(
      z.object({
        seller: z.object({
          id: z.string(),
          userId: z.string(),
          status: z.string().nullable().optional(),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
        business: z.any().nullable(),
        shipping: z.any().nullable(),
        payment: z.any().nullable(),
        additional: z.any().nullable(),
      })
    )
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        // Use cache with 5 minute TTL
        return await getCached(
          CacheKeys.sellerProfile(userId),
          async () => {
            // Get or create seller automatically
            const seller = await getOrCreateSeller(userId);

            const [business, shipping, payment, additional] = await Promise.all([
              db
                .select()
                .from(sellerBusiness)
                .where(eq(sellerBusiness.sellerId, seller.id))
                .then((r) => r[0] || null),
              db
                .select()
                .from(sellerShipping)
                .where(eq(sellerShipping.sellerId, seller.id))
                .then((r) => r[0] || null),
              db
                .select()
                .from(sellerPayment)
                .where(eq(sellerPayment.sellerId, seller.id))
                .then((r) => r[0] || null),
              db
                .select()
                .from(sellerAdditional)
                .where(eq(sellerAdditional.sellerId, seller.id))
                .then((r) => r[0] || null),
            ]);

            return {
              seller: {
                id: seller.id,
                userId: seller.userId,
                status: (seller as any).status ?? null,
                createdAt: seller.createdAt,
                updatedAt: seller.updatedAt,
              },
              business,
              shipping,
              payment,
              additional,
            };
          },
          { ttl: 300 } // 5 minutes
        );
      } catch (err: any) {
        console.error("Error fetching seller profile:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to load seller profile",
        });
      }
    }),

  updateSellerBusiness: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/seller/business",
        tags: ["Seller"],
        summary: "Update seller business information",
        description:
          "Create or update a seller's business details such as name, description, and contact info.",
      },
    })
    .input(
      z.object({
        brandName: z.string().min(1, "Brand name is required"),
        businessType: z.enum(["individual", "business"]),
        businessAddress: z.string().min(1, "Business address is required"),
        officialEmail: z.string().email("Invalid email format"),
        phoneNumber: z.string().min(3, "Phone number is required"),
        country: z.string().min(2, "Country is required"),
        socialMedia: z.string().optional(),
        fullName: z.string().min(1, "Full name is required"),
        idType: z.enum([
          "passport",
          "drivers_license",
          "voters_card",
          "national_id",
        ]),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      // Rate limiting
      const rateLimitKey = `seller_update:${userId}`;
      const rateLimit = await checkRateLimit(rateLimitKey, {
        limit: 20,
        windowMs: 3600000, // 20 updates per hour
      });

      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many updates. Please try again later.",
        });
      }

      try {
        const seller = await getOrCreateSeller(userId);

        const existing = await db
          .select()
          .from(sellerBusiness)
          .where(eq(sellerBusiness.sellerId, seller.id));

        if (existing.length > 0) {
          // Update existing
          await db
            .update(sellerBusiness)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(sellerBusiness.sellerId, seller.id));
        } else {
          // Create new
          await db.insert(sellerBusiness).values({
            id: randomUUID(),
            sellerId: seller.id,
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Invalidate cache
        await deleteCache(CacheKeys.sellerProfile(userId));

        return {
          success: true,
          message: "Business information updated successfully",
        };
      } catch (err: any) {
        console.error("Error updating business info:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to update business information",
        });
      }
    }),

  updateSellerShipping: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/seller/shipping",
        tags: ["Seller"],
        summary: "Update seller shipping information",
        description:
          "Create or update seller's shipping zone, address, refund policy, etc.",
      },
    })
    .input(
      z.object({
        shippingZone: z.string().min(1, "Shipping zone is required"),
        city: z.string().min(1, "City is required"),
        shippingAddress: z.string().min(1, "Shipping address is required"),
        returnAddress: z.string().min(1, "Return address is required"),
        shippingType: z.enum(["domestic"]),
        estimatedShippingTime: z.enum([
          "48hrs",
          "72hrs",
          "5_working_days",
          "1week",
        ]),
        refundPolicy: z.enum(["no_refunds", "accept_refunds"]),
        refundPeriod: z.enum(["48hrs", "72hrs", "5_working_days", "1week"]),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      // Rate limiting
      const rateLimitKey = `seller_update:${userId}`;
      const rateLimit = await checkRateLimit(rateLimitKey, {
        limit: 20,
        windowMs: 3600000,
      });

      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many updates. Please try again later.",
        });
      }

      try {
        const seller = await getOrCreateSeller(userId);

        const existing = await db
          .select()
          .from(sellerShipping)
          .where(eq(sellerShipping.sellerId, seller.id));

        if (existing.length > 0) {
          await db
            .update(sellerShipping)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(sellerShipping.sellerId, seller.id));
        } else {
          await db.insert(sellerShipping).values({
            id: randomUUID(),
            sellerId: seller.id,
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Invalidate cache
        await deleteCache(CacheKeys.sellerProfile(userId));

        return {
          success: true,
          message: "Shipping information updated successfully",
        };
      } catch (err: any) {
        console.error("Error updating shipping info:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to update shipping information",
        });
      }
    }),

  updateSellerPayment: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/seller/payment",
        tags: ["Seller"],
        summary: "Update seller payment details",
        description:
          "Set or modify preferred payout method, bank, and crypto wallet information.",
      },
    })
    .input(
      z.object({
        preferredPayoutMethod: z.enum([
          "fiat_currency",
          "cryptocurrency",
          "both",
        ]),
        fiatPayoutMethod: z
          .enum(["bank", "paypal", "stripe", "flutterwave"])
          .optional(),
        bankCountry: z.string().optional(),
        accountHolderName: z.string().optional(),
        accountNumber: z.string().optional(),
        walletType: z
          .enum(["phantom", "solflare", "backpack", "wallet_connect"])
          .optional(),
        walletAddress: z.string().optional(),
        preferredPayoutToken: z.enum(["USDT", "USDC", "solana"]).optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      // Rate limiting
      const rateLimitKey = `seller_update:${userId}`;
      const rateLimit = await checkRateLimit(rateLimitKey, {
        limit: 20,
        windowMs: 3600000,
      });

      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many updates. Please try again later.",
        });
      }

      try {
        const seller = await getOrCreateSeller(userId);

        const existing = await db
          .select()
          .from(sellerPayment)
          .where(eq(sellerPayment.sellerId, seller.id));

        if (existing.length > 0) {
          await db
            .update(sellerPayment)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(sellerPayment.sellerId, seller.id));
        } else {
          await db.insert(sellerPayment).values({
            id: randomUUID(),
            sellerId: seller.id,
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Invalidate cache
        await deleteCache(CacheKeys.sellerProfile(userId));

        return {
          success: true,
          message: "Payment information updated successfully",
        };
      } catch (err: any) {
        console.error("Error updating payment info:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to update payment information",
        });
      }
    }),

  updateSellerAdditional: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/seller/additional",
        tags: ["Seller"],
        summary: "Update seller additional details",
        description:
          "Set or modify product category, target audience, and local pricing type.",
      },
    })
    .input(
      z.object({
        productCategory: z.enum([
          "men_clothing",
          "women_clothing",
          "men_shoes",
          "women_shoes",
          "accessories",
          "merch",
          "others",
        ]),
        targetAudience: z.enum(["male", "female", "unisex"]),
        localPricing: z.enum(["fiat", "cryptocurrency"]),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      // Rate limiting
      const rateLimitKey = `seller_update:${userId}`;
      const rateLimit = await checkRateLimit(rateLimitKey, {
        limit: 20,
        windowMs: 3600000,
      });

      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many updates. Please try again later.",
        });
      }

      try {
        const seller = await getOrCreateSeller(userId);

        const existing = await db
          .select()
          .from(sellerAdditional)
          .where(eq(sellerAdditional.sellerId, seller.id));

        if (existing.length > 0) {
          await db
            .update(sellerAdditional)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(sellerAdditional.sellerId, seller.id));
        } else {
          await db.insert(sellerAdditional).values({
            id: randomUUID(),
            sellerId: seller.id,
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Invalidate cache
        await deleteCache(CacheKeys.sellerProfile(userId));

        return {
          success: true,
          message: "Additional information updated successfully",
        };
      } catch (err: any) {
        console.error("Error updating additional info:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to update additional information",
        });
      }
    }),
});