import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { db } from "../db";
import {
  sellers,
  sellerBusiness,
  sellerShipping,
  sellerPaymentConfig,
  sellerPayoutMethods,
  sellerCryptoPayoutMethods,
  sellerAdditional,
  notifications,
  conversations,
  messages,
  brands,
  listings,
  supportTickets,
  supportTicketReplies,
  profiles,
  shippingRates,
} from "../db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { checkRateLimit, getCached, deleteCache, CacheKeys } from "../lib/redis";
import { getSeller } from "./utils";
import { verifyIdWithDojah, getCountryCode } from "../lib/dojah";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FILE_CONSTRAINTS = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
};

function validateFile(
  base64Data: string,
  fileType: string
): { valid: boolean; error?: string } {
  if (!FILE_CONSTRAINTS.allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: ${
        FILE_CONSTRAINTS.allowedTypes.join(", ")
      }`,
    };
  }

  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  if (sizeInBytes > FILE_CONSTRAINTS.maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${
        FILE_CONSTRAINTS.maxSize / 1024 / 1024
      }MB limit`,
    };
  }

  return { valid: true };
}

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
          profilePhoto: z.string().nullable(),
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

            const [business, shipping, paymentConfig, payoutMethods, cryptoMethods, additional] = await Promise.all([
              db
                .select()
                .from(sellerBusiness)
                .where(eq(sellerBusiness.sellerId, seller.id))
                .then((r: any[]) => r[0] || null),
              db
                .select()
                .from(sellerShipping)
                .where(eq(sellerShipping.sellerId, seller.id))
                .then((r: any[]) => r[0] || null),
              db
                .select()
                .from(sellerPaymentConfig)
                .where(eq(sellerPaymentConfig.sellerId, seller.id))
                .then((r: any[]) => r[0] || null),
              db
                .select()
                .from(sellerPayoutMethods)
                .where(eq(sellerPayoutMethods.sellerId, seller.id)),
              db
                .select()
                .from(sellerCryptoPayoutMethods)
                .where(eq(sellerCryptoPayoutMethods.sellerId, seller.id)),
              db
                .select()
                .from(sellerAdditional)
                .where(eq(sellerAdditional.sellerId, seller.id))
                .then((r: any[]) => r[0] || null),
            ]);

            return {
              seller: {
                id: seller.id,
                userId: seller.userId,
                profilePhoto: seller.profilePhoto || null,
                createdAt: seller.createdAt,
                updatedAt: seller.updatedAt,
              },
              business,
              shipping,
              payment: {
                config: paymentConfig,
                payoutMethods,
                cryptoMethods,
              },
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
        businessType: z.enum(["individual", "sole_proprietorship", "llc", "corporation", "partnership", "cooperative", "non_profit", "trust", "joint_venture"]),
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
          "business_license",
          "tax_id",
          "business_registration",
        ]),
        idNumber: z.string().optional(),
        idVerified: z.boolean().optional(),
        bio: z.string().optional(),
        storeDescription: z.string().optional(),
        storeLogo: z.string().optional(),
        storeBanner: z.string().optional(),
        profilePhoto: z.string().optional(),
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
        // Ensure seller record exists
        let seller = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));

        if (!seller[0]) {
          // Auto-create seller record if missing
          const newSellerId = uuidv4();
          await db.insert(sellers).values({
            id: newSellerId,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          seller = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, userId));
        }

        const sellerRecord = seller[0];
        let { storeLogo, profilePhoto, ...businessData } = input;

        const existing = await db
          .select()
          .from(sellerBusiness)
          .where(eq(sellerBusiness.sellerId, sellerRecord.id));

        if (existing.length > 0) {
          // Update existing
          await db
            .update(sellerBusiness)
            .set({ ...(businessData as any), storeLogo: storeLogo || existing[0].storeLogo, updatedAt: new Date() })
            .where(eq(sellerBusiness.sellerId, sellerRecord.id));
        } else {
          // Create new
          await db.insert(sellerBusiness).values({
            ...businessData,
            storeLogo,
            id: uuidv4(),
            sellerId: sellerRecord.id,
          } as any);
        }

        // Handle profile picture upload to Supabase and update user metadata
        let avatarUrl = profilePhoto || storeLogo;
        if (storeLogo && storeLogo.startsWith('data:')) {
          // Upload base64 image to Supabase storage
          const supabaseClient = getSupabase();
          if (supabaseClient) {
            try {
              // Convert base64 to buffer
              const base64Data = storeLogo.replace(/^data:image\/\w+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              
              // Determine file type from base64 header
              let mimeType = 'image/jpeg';
              if (storeLogo.includes('image/png')) mimeType = 'image/png';
              else if (storeLogo.includes('image/webp')) mimeType = 'image/webp';
              
              // Generate unique filename
              const timestamp = Date.now();
              const filename = `seller-avatars/${userId}/${timestamp}-profile.${mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'}`;
              
              // Upload to Supabase storage
              const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('profile-pictures')
                .upload(filename, buffer, {
                  contentType: mimeType,
                  upsert: true,
                });
              
              if (!uploadError && uploadData) {
                // Get public URL
                const { data: publicUrlData } = supabaseClient
                  .storage
                  .from('profile-pictures')
                  .getPublicUrl(filename);
                
                avatarUrl = publicUrlData.publicUrl;
                
                // Update Supabase auth user metadata with avatar URL
                const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
                  userId,
                  {
                    user_metadata: {
                      avatar_url: avatarUrl,
                      full_name: input.fullName,
                      role: 'seller',
                    },
                  }
                );
                
                if (updateError) {
                  console.error('Error updating user metadata:', updateError);
                } else {
                  console.log('User metadata updated with avatar URL');
                }
              } else {
                console.error('Error uploading to storage:', uploadError);
              }
            } catch (uploadErr) {
              console.error('Error handling image upload:', uploadErr);
              // Continue with base64 as fallback
              avatarUrl = storeLogo;
            }
          }
        } else if (avatarUrl) {
          // If it's already a URL, update user metadata
          const supabaseClient = getSupabase();
          if (supabaseClient) {
            try {
              await supabaseClient.auth.admin.updateUserById(
                userId,
                {
                  user_metadata: {
                    avatar_url: avatarUrl,
                    full_name: input.fullName,
                    role: 'seller',
                  },
                }
              );
            } catch (err) {
              console.error('Error updating user metadata:', err);
            }
          }
        }

        // Update sellers table with the avatar URL
        if (avatarUrl) {
          await db
            .update(sellers)
            .set({ profilePhoto: avatarUrl, updatedAt: new Date() })
            .where(eq(sellers.id, sellerRecord.id));
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
        shippingType: z.enum(["domestic", "international", "both"]),
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
        // Ensure seller record exists
        let seller = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));

        if (!seller[0]) {
          // Auto-create seller record if missing
          const newSellerId = uuidv4();
          await db.insert(sellers).values({
            id: newSellerId,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          seller = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, userId));
        }

        const sellerRecord = seller[0];

        const existing = await db
          .select()
          .from(sellerShipping)
          .where(eq(sellerShipping.sellerId, sellerRecord.id));

        if (existing.length > 0) {
          await db
            .update(sellerShipping)
            .set({ ...(input as any), updatedAt: new Date() })
            .where(eq(sellerShipping.sellerId, sellerRecord.id));
        } else {
          await db.insert(sellerShipping).values({
            ...input,
            id: uuidv4(),
            sellerId: sellerRecord.id,
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

  // NOTE: Payment methods are now handled via separate tables:
  // - sellerPaymentConfig (payout preferences and schedule)
  // - sellerPayoutMethods (fiat payment methods)
  // - sellerCryptoPayoutMethods (crypto wallets)
  // Create dedicated payment router (payments.ts) to handle these
  /*
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
        // Ensure seller record exists
        let seller = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));

        if (!seller[0]) {
          // Auto-create seller record if missing
          const newSellerId = uuidv4();
          await db.insert(sellers).values({
            id: newSellerId,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          seller = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, userId));
        }

        const sellerRecord = seller[0];

        const existing = await db
          .select()
          .from(sellerPayment)
          .where(eq(sellerPayment.sellerId, sellerRecord.id));

        if (existing.length > 0) {
          await db
            .update(sellerPayment)
            .set({ ...(input as any), updatedAt: new Date() })
            .where(eq(sellerPayment.sellerId, sellerRecord.id));
        } else {
          await db.insert(sellerPayment).values({
            ...input,
            id: uuidv4(),
            sellerId: sellerRecord.id,
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
  */

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
        // Ensure seller record exists
        let seller = await db
          .select()
          .from(sellers)
          .where(eq(sellers.userId, userId));

        if (!seller[0]) {
          // Auto-create seller record if missing
          const newSellerId = uuidv4();
          await db.insert(sellers).values({
            id: newSellerId,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          seller = await db
            .select()
            .from(sellers)
            .where(eq(sellers.userId, userId));
        }

        const sellerRecord = seller[0];

        const existing = await db
          .select()
          .from(sellerAdditional)
          .where(eq(sellerAdditional.sellerId, sellerRecord.id));

        if (existing.length > 0) {
          await db
            .update(sellerAdditional)
            .set({ ...(input as any), updatedAt: new Date() })
            .where(eq(sellerAdditional.sellerId, sellerRecord.id));
        } else {
          await db.insert(sellerAdditional).values({
            ...input,
            id: uuidv4(),
            sellerId: sellerRecord.id,
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
        description: "Permanently delete seller account and all associated data (GDPR compliant)",
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

        // Delete all seller-related data in transaction
        await db.transaction(async (tx: any) => {
          // Delete messaging & communications
          const sellerConversations = await tx
            .select()
            .from(conversations)
            .where(eq(conversations.sellerId, seller.id));

          for (const conv of sellerConversations) {
            await tx
              .delete(messages)
              .where(eq(messages.conversationId, conv.id));
          }

          await tx
            .delete(conversations)
            .where(eq(conversations.sellerId, seller.id));

          // Delete support tickets & replies
          const sellerTickets = await tx
            .select()
            .from(supportTickets)
            .where(eq(supportTickets.sellerId, seller.id));

          for (const ticket of sellerTickets) {
            await tx
              .delete(supportTicketReplies)
              .where(eq(supportTicketReplies.ticketId, ticket.id));
          }

          await tx
            .delete(supportTickets)
            .where(eq(supportTickets.sellerId, seller.id));

          // Delete assigned support tickets
          await tx
            .delete(supportTickets)
            .where(eq(supportTickets.assignedTo, seller.id));

          // Delete all seller notifications
          await tx
            .delete(notifications)
            .where(eq(notifications.sellerId, seller.id));

          // Delete seller business details
          await tx
            .delete(sellerBusiness)
            .where(eq(sellerBusiness.sellerId, seller.id));

          // Delete seller shipping
          await tx
            .delete(sellerShipping)
            .where(eq(sellerShipping.sellerId, seller.id));



          // Delete seller additional details
          await tx
            .delete(sellerAdditional)
            .where(eq(sellerAdditional.sellerId, seller.id));

          // Delete brands and all related cascading data
          // (cascading delete will handle listings, orders, payments, etc.)
          await tx
            .delete(brands)
            .where(eq(brands.sellerId, seller.id));

          // Delete seller record (cascading delete for other relations)
          await tx.delete(sellers).where(eq(sellers.id, seller.id));
        });

        // Delete profile if exists
        const existingProfile = await db
          .select()
          .from(profiles)
          .where(eq(profiles.userId, userId))
          .limit(1);

        if (existingProfile.length > 0) {
          await db.delete(profiles).where(eq(profiles.userId, userId));
        }

        // Delete Supabase auth user
        const { error } = await sb.auth.admin.deleteUser(userId);

        if (error) {
          throw new Error(`Account deletion failed: ${error.message}`);
        }

        // Invalidate cache
        await deleteCache(CacheKeys.sellerProfile(userId));

        return {
          success: true,
          message: "Account deleted successfully. All personal and business data has been removed.",
        };
      } catch (err: any) {
        console.error("Error deleting account:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to delete account",
        });
      }
    }),

  // ============ PROFILE PICTURE ============

  uploadProfilePicture: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/seller/profile-picture",
        tags: ["Seller"],
        summary: "Upload profile picture",
        description: "Upload a new seller profile picture (max 5MB, JPEG/PNG/WebP)",
      },
    })
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        base64Data: z.string(),
      })
    )
    .output(z.object({ url: z.string(), success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const validation = validateFile(input.base64Data, input.fileType);
      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error,
        });
      }

      try {
        const seller = await getSeller(userId);

        const buffer = Buffer.from(input.base64Data, "base64");
        const timestamp = Date.now();
        const uniqueFileName = `${userId}/pfp/${timestamp}_${input.fileName}`;

        const sb = getSupabase();
        if (!sb) {
          throw new Error("Supabase storage is not configured on the server");
        }

        const { data, error } = await sb.storage
          .from("profile-pictures")
          .upload(uniqueFileName, buffer, {
            contentType: input.fileType,
            upsert: false,
          });

        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }

        const {
          data: { publicUrl },
        } = sb.storage.from("profile-pictures").getPublicUrl(data.path);

        await db
          .update(sellers)
          .set({ profilePhoto: publicUrl, updatedAt: new Date() })
          .where(eq(sellers.id, seller.id));

        // Invalidate cache
        await deleteCache(CacheKeys.sellerProfile(userId));

        return { url: publicUrl, success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to upload profile picture",
        });
      }
    }),

  getShippingRates: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const seller = await getSeller(userId);
        const rates = await db
          .select()
          .from(shippingRates)
          .where(eq(shippingRates.sellerId, seller.id))
          .orderBy(desc(shippingRates.createdAt));

        return rates;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch shipping rates",
        });
      }
    }),

  createShippingRate: protectedProcedure
    .input(
      z.object({
        shippingZone: z.string().min(1, "Zone is required"),
        minWeight: z.number().positive(),
        maxWeight: z.number().positive(),
        rateCents: z.number().nonnegative(),
        currency: z.string().default("USD"),
        estimatedDays: z.number().int().positive(),
        shippingType: z.enum(["same_day", "next_day", "express", "standard", "domestic", "international", "both"]),
        active: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const seller = await getSeller(userId);
        const rate = await db
          .insert(shippingRates)
          .values({
            sellerId: seller.id,
            shippingZone: input.shippingZone,
            minWeight: input.minWeight.toString(),
            maxWeight: input.maxWeight.toString(),
            rateCents: input.rateCents,
            currency: input.currency,
            estimatedDays: input.estimatedDays,
            shippingType: input.shippingType,
            active: input.active,
          })
          .returning();

        return rate[0];
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to create shipping rate",
        });
      }
    }),

  updateShippingRate: protectedProcedure
    .input(
      z.object({
        rateId: z.string().uuid(),
        shippingZone: z.string().optional(),
        minWeight: z.number().positive().optional(),
        maxWeight: z.number().positive().optional(),
        rateCents: z.number().nonnegative().optional(),
        estimatedDays: z.number().int().positive().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const seller = await getSeller(userId);
        const existingRate = await db
          .select()
          .from(shippingRates)
          .where(
            and(
              eq(shippingRates.id, input.rateId),
              eq(shippingRates.sellerId, seller.id)
            )
          );

        if (!existingRate.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Shipping rate not found",
          });
        }

        const updateData: any = {};
        if (input.shippingZone) updateData.shippingZone = input.shippingZone;
        if (input.minWeight) updateData.minWeight = input.minWeight.toString();
        if (input.maxWeight) updateData.maxWeight = input.maxWeight.toString();
        if (input.rateCents !== undefined) updateData.rateCents = input.rateCents;
        if (input.estimatedDays) updateData.estimatedDays = input.estimatedDays;
        if (input.active !== undefined) updateData.active = input.active;
        updateData.updatedAt = new Date();

        const rate = await db
          .update(shippingRates)
          .set(updateData)
          .where(eq(shippingRates.id, input.rateId))
          .returning();

        return rate[0];
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to update shipping rate",
        });
      }
    }),

  deleteShippingRate: protectedProcedure
    .input(z.object({ rateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const seller = await getSeller(userId);
        const existingRate = await db
          .select()
          .from(shippingRates)
          .where(
            and(
              eq(shippingRates.id, input.rateId),
              eq(shippingRates.sellerId, seller.id)
            )
          );

        if (!existingRate.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Shipping rate not found",
          });
        }

        await db
          .delete(shippingRates)
          .where(eq(shippingRates.id, input.rateId));

        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to delete shipping rate",
        });
      }
    }),
});