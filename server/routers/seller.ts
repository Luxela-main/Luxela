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
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { checkRateLimit, getCached, deleteCache, CacheKeys } from "../lib/redis";
import { getSeller } from "./utils";
import { verifyIdWithDojah, getCountryCode } from "../lib/dojah";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
}

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
          // Profile already exists, just return success
          return { success: true, message: "Seller profile already exists" };
        }

        await db.insert(sellers).values({
          id: uuidv4(),
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
    .input(z.void())
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
        countryCode: z.string().optional(),
        socialMediaPlatform: z.string().optional(),
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
            .set({ ...(input as any), updatedAt: new Date() })
            .where(eq(sellerBusiness.sellerId, seller.id));
        } else {
          // Create new
          await db.insert(sellerBusiness).values({
            ...input,
            id: uuidv4(),
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
        summary: "Verify seller ID with retry logic and multi-country support",
        description: "Verify the seller's ID number using Dojah API with automatic retry, country detection, and comprehensive response validation",
      },
    })
    .input(
      z.object({
        idType: z.enum(["passport", "drivers_license", "voters_card", "national_id"]),
        idNumber: z.string().min(1, "ID number is required"),
        country: z.string().optional().default("NG"), // Default to Nigeria
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
        personalInfo: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          dateOfBirth: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
        }).optional(),
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

      try {
        const seller = await getSeller(userId);

        // Check if API keys are set
        if (!process.env.DOJAH_SECRET_KEY || !process.env.DOJAH_APP_ID) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "ID verification service is not configured",
          });
        }

        // Use enhanced Dojah verification with retry logic and validation
        const result = await verifyIdWithDojah(input.idType, input.idNumber, input.country);

        if (result.success && result.personalInfo) {
          // Extract personal info from verified data
          const verifiedPersonalInfo = result.personalInfo;

          // Update seller with verification data
          await db
            .update(sellerBusiness)
            .set({
              idVerified: true,
              idNumber: input.idNumber,
              idType: input.idType,
              firstName: verifiedPersonalInfo.firstName,
              lastName: verifiedPersonalInfo.lastName,
              dateOfBirth: verifiedPersonalInfo.dateOfBirth || null,
              verificationCountry: input.country,
              verificationDate: new Date(),
              dojahResponse: result.data || null,
              updatedAt: new Date(),
            })
            .where(eq(sellerBusiness.sellerId, seller.id));

          // Invalidate cache
          await deleteCache(CacheKeys.sellerProfile(userId));

          return {
            success: true,
            message: "ID verified successfully with personal information captured",
            personalInfo: verifiedPersonalInfo,
          };
        } else {
          return {
            success: false,
            message: result.message || "ID verification failed. Please check your details and try again.",
          };
        }
      } catch (err: any) {
        console.error("Error verifying ID:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to verify ID. Please try again later.",
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
          "same_day",
          "next_day",
          "48hrs",
          "72hrs",
          "5_working_days",
          "1_2_weeks",
          "2_3_weeks",
          "1week",
          "custom",
        ]),
        refundPolicy: z.enum(["no_refunds", "48hrs", "72hrs", "5_working_days", "1week", "14days", "30days", "60days", "store_credit"]),
        refundPeriod: z.enum(["same_day", "next_day", "48hrs", "72hrs", "5_working_days", "1_2_weeks", "2_3_weeks", "1week", "14days", "30days", "60days", "store_credit", "custom"]),
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
            .set({ ...(input as any), updatedAt: new Date() })
            .where(eq(sellerShipping.sellerId, seller.id));
        } else {
          await db.insert(sellerShipping).values({
            ...input,
            id: uuidv4(),
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
            .set({ ...(input as any), updatedAt: new Date() })
            .where(eq(sellerPayment.sellerId, seller.id));
        } else {
          await db.insert(sellerPayment).values({
            ...input,
            id: uuidv4(),
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
            .set({ ...(input as any), updatedAt: new Date() })
            .where(eq(sellerAdditional.sellerId, seller.id));
        } else {
          await db.insert(sellerAdditional).values({
            ...input,
            id: uuidv4(),
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

  updatePassword: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/seller/password",
        tags: ["Seller"],
        summary: "Update seller password",
        description: "Change seller account password",
      },
    })
    .input(
      z.object({
        currentPassword: z.string().min(8),
        newPassword: z.string().min(8),
      })
    )
    .output(z.object({ success: z.boolean(), message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const sb = getSupabase();
        if (!sb) {
          throw new Error("Supabase is not configured on the server");
        }

        // Update password through Supabase
        const { error } = await sb.auth.admin.updateUserById(userId, {
          password: input.newPassword,
        });

        if (error) {
          throw new Error(`Password update failed: ${error.message}`);
        }

        return {
          success: true,
          message: "Password updated successfully",
        };
      } catch (err: any) {
        console.error("Error updating password:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to update password",
        });
      }
    }),

  deleteAccount: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/seller/account",
        tags: ["Seller"],
        summary: "Delete seller account",
        description: "Permanently delete seller account and associated data",
      },
    })
    .input(z.object({ password: z.string().min(8) }))
    .output(z.object({ success: z.boolean(), message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const sb = getSupabase();
        if (!sb) {
          throw new Error("Supabase is not configured on the server");
        }

        // Get seller record
        const seller = await getSeller(userId);

        // Delete all seller-related data
        await db
          .delete(sellerBusiness)
          .where(eq(sellerBusiness.sellerId, seller.id));

        await db
          .delete(sellerShipping)
          .where(eq(sellerShipping.sellerId, seller.id));

        await db
          .delete(sellerPayment)
          .where(eq(sellerPayment.sellerId, seller.id));

        await db
          .delete(sellerAdditional)
          .where(eq(sellerAdditional.sellerId, seller.id));

        // Delete seller profile
        await db.delete(sellers).where(eq(sellers.id, seller.id));

        // Delete Supabase auth user
        const { error } = await sb.auth.admin.deleteUser(userId);

        if (error) {
          throw new Error(`Account deletion failed: ${error.message}`);
        }

        // Invalidate cache
        await deleteCache(CacheKeys.sellerProfile(userId));

        return {
          success: true,
          message: "Account deleted successfully",
        };
      } catch (err: any) {
        console.error("Error deleting account:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to delete account",
        });
      }
    }),
});