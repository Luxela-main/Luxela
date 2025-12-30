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
import { checkRateLimit, getCached, deleteCache, CacheKeys } from "../lib/redis";
import { getSeller } from "./utils";


export const sellerRouter = createTRPCRouter({
  createSellerProfile: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/seller/profile/create",
        tags: ["Seller"],
        summary: "Create seller profile",
        description: "Create a new seller profile for the authenticated user.",
      },
    })
    .input(z.void())
    .output(z.object({ success: z.boolean(), message: z.string().optional() }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const existingSeller = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));

        if (existingSeller.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seller profile already exists",
          });
        }

        await db.insert(sellers).values({
          id: randomUUID(),
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return { success: true, message: "Seller profile created successfully" };
      } catch (err: any) {
        console.error("Error creating seller profile:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to create seller profile",
        });
      }
    }),

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
            const seller = await getSeller(userId);

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
        idNumber: z.string().optional(),
        idVerified: z.boolean().optional(),
        bio: z.string().optional(),
        storeDescription: z.string().optional(),
        storeLogo: z.string().optional(),
        storeBanner: z.string().optional(),
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
        const seller = await getSeller(userId);

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
            ...input,
            id: randomUUID(),
            sellerId: seller.id,
          } as any);
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

  verifyId: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/seller/verify-id",
        tags: ["Seller"],
        summary: "Verify seller ID",
        description: "Verify the seller's ID number using external API",
      },
    })
    .input(
      z.object({
        idType: z.enum(["passport", "drivers_license", "voters_card", "national_id"]),
        idNumber: z.string().min(1, "ID number is required"),
      })
    )
  //   .output(
  //     z.object({
  //       success: z.boolean(),
  //       message: z.string(),
  //     })
  //   )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      try {
        const seller = await getSeller(userId);

        // Check if API keys are set
        if (!process.env.DOJAH_SECRET_KEY || !process.env.DOJAH_APP_ID) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "ID verification service is not configured",
          });
        }

        // Call Dojah API for verification
        const response = await fetch('https://api.dojah.io/api/v1/kyc/nigeria/identity', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.DOJAH_SECRET_KEY}`,
            'AppId': process.env.DOJAH_APP_ID,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_type: input.idType === 'national_id' ? 'nin' : input.idType === 'drivers_license' ? 'dl' : input.idType === 'voters_card' ? 'pvc' : 'passport',
            id_number: input.idNumber,
          }),
        });

        const data = await response.json() as any;

        if (data.status && data.data) {
          // Update idVerified to true
          await db
            .update(sellerBusiness)
            .set({ idVerified: true, idNumber: input.idNumber, updatedAt: new Date() })
            .where(eq(sellerBusiness.sellerId, seller.id));

          // Invalidate cache
          await deleteCache(CacheKeys.sellerProfile(userId));

          return {
            success: true,
            message: "ID verified successfully",
          };
        } else {
          return {
            success: false,
            message: "ID verification failed. Please check your details.",
          };
        }
      } catch (err: any) {
        console.error("Error verifying ID:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify ID",
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
        const seller = await getSeller(userId);

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
            ...input,
            id: randomUUID(),
            sellerId: seller.id,
          } as any);
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

      // Validate required fields based on preferred payout method
      if (input.preferredPayoutMethod === "fiat_currency" || input.preferredPayoutMethod === "both") {
        if (!input.fiatPayoutMethod) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Fiat payout method is required when selecting fiat currency",
          });
        }
        if (input.fiatPayoutMethod === "bank") {
          if (!input.bankCountry || !input.accountHolderName || !input.accountNumber) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Bank details (country, account holder name, account number) are required for bank transfers",
            });
          }
        }
      }

      if (input.preferredPayoutMethod === "cryptocurrency" || input.preferredPayoutMethod === "both") {
        if (!input.walletType || !input.walletAddress || !input.preferredPayoutToken) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Wallet type, wallet address, and preferred payout token are required when selecting cryptocurrency",
          });
        }
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
        const seller = await getSeller(userId);

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
            ...input,
            id: randomUUID(),
            sellerId: seller.id,
          } as any);
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
        const seller = await getSeller(userId);

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
            ...input,
            id: randomUUID(),
            sellerId: seller.id,
          } as any);
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