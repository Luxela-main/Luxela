import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc/trpc";
import { db } from "../db";
import {
  buyers,
  buyerAccountDetails,
  buyerBillingAddress,
  buyerFavorites,
  loyaltyNFTs,
  orders,
  listings,
  notifications,
  conversations,
  messages,
  supportTickets,
  supportTicketReplies,
  reviews,
  sales,
  buyerShipping,
  carts,
  cartItems,
  profiles,
} from "../db/schema";
import { and, eq, desc, sql, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
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

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMITS = {
  profileUpload: { limit: 5, windowMs: 3600000 }, // 5 uploads per hour
  addressCreate: { limit: 10, windowMs: 3600000 }, // 10 addresses per hour
  favorite: { limit: 50, windowMs: 3600000 }, // 50 favorites per hour
};

const FILE_CONSTRAINTS = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
};

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

function validateFile(
  base64Data: string,
  fileType: string
): { valid: boolean; error?: string } {
  if (!FILE_CONSTRAINTS.allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: ${FILE_CONSTRAINTS.allowedTypes.join(
        ", "
      )}`,
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

async function getBuyer(userId: string) {
  try {
    const existingBuyer = await db
      .select()
      .from(buyers)
      .where(eq(buyers.userId, userId));

    if (existingBuyer.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Buyer profile not found. Please create a profile first.",
      });
    }

    return existingBuyer[0];
  } catch (err: any) {
    console.error("Error in getBuyer:", err);
    if (err instanceof TRPCError) {
      throw err;
    }
    throw new Error(`getBuyer failed: ${err?.message || err}`);
  }
}

export const buyerRouter = createTRPCRouter({
  createBuyerProfile: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/buyer/profile",
        tags: ["Buyer - Account"],
        summary: "Create buyer profile",
        description: "Create a new buyer profile and account details",
      },
    })
    .input(
      z.object({
        username: z.string().min(3).max(100),
        fullName: z.string().min(1),
        dateOfBirth: z.coerce.date().optional(),
        phoneNumber: z.string().optional(),
        country: z.string(),
        state: z.string(),
        profilePicture: z.string().optional(),
      })
    )
    .output(z.object({ 
      success: z.boolean(), 
      message: z.string().optional(),
      profile: z.object({
        id: z.string(),
        username: z.string(),
        fullName: z.string(),
        email: z.string(),
        profilePicture: z.string().nullable(),
        dateOfBirth: z.string().nullable().optional(),
        phoneNumber: z.string().nullable().optional(),
        country: z.string(),
        state: z.string(),
      }).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const userEmail = ctx.user?.email;
      if (!userEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "Authenticated user email is missing. Cannot create profile.",
        });
      }
      try {
        // First, check if buyer profile (account details) already exists for this user
        const existingAccountDetails = await db
          .select()
          .from(buyerAccountDetails)
          .innerJoin(buyers, eq(buyers.id, buyerAccountDetails.buyerId))
          .where(eq(buyers.userId, userId))
          .limit(1);

        console.log(`[DEBUG] Existing account details check result:`, existingAccountDetails.length);

        if (existingAccountDetails.length > 0) {
          console.log(`[ERROR] Account details already exist for user ${userId}`);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Buyer profile already exists",
          });
        }

        // Check if username is already taken
        const existingUsername = await db
          .select()
          .from(buyerAccountDetails)
          .where(eq(buyerAccountDetails.username, input.username))
          .limit(1);

        if (existingUsername.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Username is already taken",
          });
        }

        // Get or create buyer record
        const existingBuyer = await db
          .select()
          .from(buyers)
          .where(eq(buyers.userId, userId))
          .limit(1);

        let buyerId: string;

        if (existingBuyer.length === 0) {
          buyerId = uuidv4();
          console.log(`[INFO] Creating new buyer record with ID: ${buyerId}`);
          await db.insert(buyers).values({
            id: buyerId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          buyerId = existingBuyer[0].id;
          console.log(`[INFO] Using existing buyer record with ID: ${buyerId}`);
        }

        // Get profile picture: use input if provided (uploaded during creation), otherwise fallback to OAuth
        const profilePictureUrl = input.profilePicture || ctx.user?.avatar_url || null;
        console.log(`[DEBUG] Using profile picture:`, profilePictureUrl ? 'from input/oauth' : 'none');
        console.log(`[INFO] Inserting account details for buyerId: ${buyerId} with username: ${input.username}`);

        const insertData = {
          id: uuidv4(),
          buyerId: buyerId,
          username: input.username,
          fullName: input.fullName,
          email: ctx.user?.email || userEmail,
          country: input.country,
          state: input.state,
          profilePicture: profilePictureUrl,
          dateOfBirth: input.dateOfBirth || null,
          phoneNumber: input.phoneNumber || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        console.log(`[DEBUG] Attempting to insert account details with data:`, insertData);

        const insertResult = await db.insert(buyerAccountDetails).values(insertData);
        
        console.log(`[DEBUG] Insert result:`, insertResult);
        console.log("[SUCCESS] Buyer profile created for buyerId: " + buyerId);
        
        // Return the created profile data immediately
        const createdAccountDetails = await db
          .select()
          .from(buyerAccountDetails)
          .where(eq(buyerAccountDetails.buyerId, buyerId))
          .limit(1);
        
        if (createdAccountDetails.length === 0) {
          return { success: true, message: "Buyer profile created successfully" };
        }
        
        const profile = createdAccountDetails[0];
        return { 
          success: true, 
          message: "Buyer profile created successfully",
          profile: {
            id: profile.id,
            username: profile.username,
            fullName: profile.fullName,
            email: profile.email,
            profilePicture: profile.profilePicture,
            dateOfBirth: profile.dateOfBirth?.toISOString() || null,
            phoneNumber: profile.phoneNumber,
            country: profile.country,
            state: profile.state,
          }
        };
      } catch (err: any) {
        console.error("[ERROR] Error creating buyer profile:", err);
        console.error("[ERROR] Full error object:", JSON.stringify(err, null, 2));
        console.error("[ERROR] Error code:", err?.code);
        console.error("[ERROR] Error detail:", err?.detail);
        console.error("[ERROR] Error stack:", err?.stack);
        
        // Don't wrap TRPCErrors again
        if (err instanceof TRPCError) {
          throw err;
        }
        // Handle database constraint errors
        if (err?.code === "23505") {
          // Unique constraint violation
          console.error("[ERROR] Unique constraint violation detected");
          if (err?.detail?.includes("username")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Username is already taken",
            });
          }
          if (err?.detail?.includes("email")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "An account with this email already exists",
            });
          }
          if (err?.detail?.includes("buyer_id")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Buyer profile already exists",
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to create buyer profile",
        });
      }
    }),

  // ============ ACCOUNT DETAILS ============

  getAccountDetails: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/account",
        tags: ["Buyer - Account"],
        summary: "Get buyer account details",
        description:
          "Retrieve complete account information including profile and default billing address",
      },
    })
    .input(z.void())
    .output(
      z.object({
        id: z.string(),
        username: z.string(),
        fullName: z.string(),
        dateOfBirth: z.date().nullable(),
        phoneNumber: z.string().nullable(),
        email: z.string(),
        country: z.string(),
        state: z.string(),
        profilePicture: z.string().nullable(),
        billingAddress: z
          .object({
            id: z.string(),
            houseAddress: z.string(),
            city: z.string(),
            postalCode: z.string(),
            isDefault: z.boolean(),
          })
          .nullable(),
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
        const buyer = await getBuyer(userId);

        const [accountDetails, billingAddress] = await Promise.all([
          db
            .select()
            .from(buyerAccountDetails)
            .where(eq(buyerAccountDetails.buyerId, buyer.id))
            .then((r) => r[0] || null),
          db
            .select()
            .from(buyerBillingAddress)
            .where(
              and(
                eq(buyerBillingAddress.buyerId, buyer.id),
                eq(buyerBillingAddress.isDefault, true)
              )
            )
            .then((r) => r[0] || null),
        ]);

        if (!accountDetails) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account details not found",
          });
        }

        return {
          id: accountDetails.id,
          username: accountDetails.username,
          fullName: accountDetails.fullName,
          dateOfBirth: accountDetails.dateOfBirth,
          phoneNumber: accountDetails.phoneNumber,
          email: accountDetails.email,
          country: accountDetails.country,
          state: accountDetails.state,
          profilePicture: accountDetails.profilePicture,
          billingAddress: billingAddress
            ? {
                id: billingAddress.id,
                houseAddress: billingAddress.houseAddress,
                city: billingAddress.city,
                postalCode: billingAddress.postalCode,
                isDefault: billingAddress.isDefault,
              }
            : null,
        };
      } catch (err: any) {
        console.error("Error fetching account details:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch account details",
        });
      }
    }),

  updateAccountDetails: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/buyer/account",
        tags: ["Buyer - Account"],
        summary: "Update buyer account details",
        description: "Update buyer profile information",
      },
    })
    .input(
      z.object({
        username: z.string().min(3).max(100).optional(),
        fullName: z.string().min(1).optional(),
        dateOfBirth: z.date().optional(),
        phoneNumber: z.string().optional(),
        country: z.string().optional(),
        state: z.string().optional(),
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
        const buyer = await getBuyer(userId);

        const existing = await db
          .select()
          .from(buyerAccountDetails)
          .where(eq(buyerAccountDetails.buyerId, buyer.id));

        if (existing.length > 0) {
          await db
            .update(buyerAccountDetails)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(buyerAccountDetails.buyerId, buyer.id));
        } else {
          if (!input.username || !input.fullName) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Username and fullName are required for initial creation",
            });
          }

          await db.insert(buyerAccountDetails).values({
            id: uuidv4(),
            buyerId: buyer.id,
            username: input.username,
            fullName: input.fullName,
            email: ctx.user?.email || "",
            country: input.country || "",
            state: input.state || "",
            dateOfBirth: input.dateOfBirth || null,
            phoneNumber: input.phoneNumber || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        return {
          success: true,
          message: "Account details updated successfully",
        };
      } catch (err: any) {
        console.error("Error updating account details:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to update account details",
        });
      }
    }),

  uploadProfilePicture: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/buyer/account/profile-picture",
        tags: ["Buyer - Account"],
        summary: "Upload profile picture",
        description: "Upload a new profile picture (max 5MB, JPEG/PNG/WebP)",
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

      const rateLimitKey = `profile_upload_${userId}`;
      if (
        !checkRateLimit(
          rateLimitKey,
          RATE_LIMITS.profileUpload.limit,
          RATE_LIMITS.profileUpload.windowMs
        )
      ) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Profile picture upload limit exceeded. Try again later.",
        });
      }

      const validation = validateFile(input.base64Data, input.fileType);
      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error,
        });
      }

      try {
        const buyer = await getBuyer(userId);

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
          .update(buyerAccountDetails)
          .set({ profilePicture: publicUrl, updatedAt: new Date() })
          .where(eq(buyerAccountDetails.buyerId, buyer.id));

        return { url: publicUrl, success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to upload profile picture",
        });
      }
    }),

  // ============ BILLING ADDRESSES ============

  getBillingAddresses: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/billing-addresses",
        tags: ["Buyer - Billing"],
        summary: "Get all billing addresses",
        description: "Retrieve paginated list of billing addresses",
      },
    })
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(5).max(50).default(10),
      })
    )
    .output(
      z.object({
        data: z.array(
          z.object({
            id: z.string(),
            houseAddress: z.string(),
            city: z.string(),
            postalCode: z.string(),
            isDefault: z.boolean(),
          })
        ),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);
        const offset = (input.page - 1) * input.limit;

        // const [addresses, totalResult] = await Promise.all([
        //   db
        //     .select()
        //     .from(buyerBillingAddress)
        //     .where(eq(buyerBillingAddress.buyerId, buyer.id))
        //     .limit(input.limit)
        //     .offset(offset),
        //   db
        //     .select({ count: (db as any).fn.count().as("count") })
        //     .from(buyerBillingAddress)
        //     .where(eq(buyerBillingAddress.buyerId, buyer.id)),
        // ]);

// HI, THIS IS TOLU, THIS WORKED SO I AM LEAVING IT AS IS NOW, YOU CAN CHECK AND CLEAN UP LATER IF NEEDED
// Inside getBillingAddresses query
const [addresses, totalResult] = await Promise.all([
  db
    .select()
    .from(buyerBillingAddress)
    .where(eq(buyerBillingAddress.buyerId, buyer.id))
    .limit(input.limit)
    .offset(offset),
  // Changed this line to use a more direct SQL count approach
  db.execute(sql`SELECT count(*) as count FROM ${buyerBillingAddress} WHERE buyer_id = ${buyer.id}`)
]);

// Most reliable way to extract count across different SQL drivers:
const rawCount = totalResult?.[0]?.count ?? (totalResult as any)?.rows?.[0]?.count ?? 0;
const total = Number(rawCount);

return {
  data: (addresses || []).map((a) => ({
    id: a.id,
    houseAddress: a.houseAddress,
    city: a.city,
    postalCode: a.postalCode,
    isDefault: a.isDefault,
  })),
  total,
  page: input.page,
  limit: input.limit,
  totalPages: Math.ceil(total / input.limit) || 1,
};





        // const total = totalResult[0]?.count || 0;

        // return {
        //   data: addresses.map((a) => ({
        //     id: a.id,
        //     houseAddress: a.houseAddress,
        //     city: a.city,
        //     postalCode: a.postalCode,
        //     isDefault: a.isDefault,
        //   })),
        //   total,
        //   page: input.page,
        //   limit: input.limit,
        //   totalPages: Math.ceil(total / input.limit),
        // };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch billing addresses",
        });
      }
    }),

  createBillingAddress: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/buyer/billing-addresses",
        tags: ["Buyer - Billing"],
        summary: "Create a new billing address",
        description: "Add a new billing address for the buyer",
      },
    })
    .input(
      z.object({
        houseAddress: z.string().min(1),
        city: z.string().min(1),
        postalCode: z.string().min(1),
        isDefault: z.boolean().default(false),
      })
    )
    .output(z.object({ success: z.boolean(), id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const rateLimitKey = `address_create_${userId}`;
      if (
        !checkRateLimit(
          rateLimitKey,
          RATE_LIMITS.addressCreate.limit,
          RATE_LIMITS.addressCreate.windowMs
        )
      ) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Address creation limit exceeded. Try again later.",
        });
      }

      try {
        const buyer = await getBuyer(userId);
        const addressId = uuidv4();

        await db.transaction(async (tx) => {
          if (input.isDefault) {
            await tx
              .update(buyerBillingAddress)
              .set({ isDefault: false })
              .where(eq(buyerBillingAddress.buyerId, buyer.id));
          }

          await tx.insert(buyerBillingAddress).values({
            id: addressId,
            buyerId: buyer.id,
            houseAddress: input.houseAddress,
            city: input.city,
            postalCode: input.postalCode,
            isDefault: input.isDefault,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });

        return { success: true, id: addressId };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to create billing address",
        });
      }
    }),

  updateBillingAddress: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/buyer/billing-addresses/{addressId}",
        tags: ["Buyer - Billing"],
        summary: "Update a billing address",
        description: "Modify an existing billing address",
      },
    })
    .input(
      z.object({
        addressId: z.string().uuid(),
        houseAddress: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);

        const address = await db
          .select()
          .from(buyerBillingAddress)
          .where(
            and(
              eq(buyerBillingAddress.id, input.addressId),
              eq(buyerBillingAddress.buyerId, buyer.id)
            )
          );

        if (!address[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Billing address not found",
          });
        }

        await db.transaction(async (tx) => {
          if (input.isDefault) {
            await tx
              .update(buyerBillingAddress)
              .set({ isDefault: false })
              .where(eq(buyerBillingAddress.buyerId, buyer.id));
          }

          await tx
            .update(buyerBillingAddress)
            .set({
              houseAddress: input.houseAddress,
              city: input.city,
              postalCode: input.postalCode,
              isDefault: input.isDefault,
              updatedAt: new Date(),
            })
            .where(eq(buyerBillingAddress.id, input.addressId));
        });

        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to update billing address",
        });
      }
    }),

  deleteBillingAddress: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/buyer/billing-addresses/{addressId}",
        tags: ["Buyer - Billing"],
        summary: "Delete a billing address",
        description: "Remove a billing address from the buyer's account",
      },
    })
    .input(z.object({ addressId: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);

        const address = await db
          .select()
          .from(buyerBillingAddress)
          .where(
            and(
              eq(buyerBillingAddress.id, input.addressId),
              eq(buyerBillingAddress.buyerId, buyer.id)
            )
          );

        if (!address[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Billing address not found",
          });
        }

        await db
          .delete(buyerBillingAddress)
          .where(eq(buyerBillingAddress.id, input.addressId));

        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to delete billing address",
        });
      }
    }),

  // ============ FAVORITES ============

  getFavorites: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/favorites",
        tags: ["Buyer - Favorites"],
        summary: "Get all favorite listings",
        description: "Retrieve paginated list of favorited listings",
      },
    })
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(5).max(50).default(10),
      })
    )
    .output(
      z.object({
        data: z.array(
          z.object({
            favoriteId: z.string(),
            listingId: z.string(),
            title: z.string(),
            image: z.string().nullable(),
            priceCents: z.number().nullable(),
            currency: z.string().nullable(),
            category: z.string().nullable(),
          })
        ),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);
        const offset = (input.page - 1) * input.limit;

        const [favorites, totalResult] = await Promise.all([
          db
            .select({
              favoriteId: buyerFavorites.id,
              listingId: listings.id,
              title: listings.title,
              image: listings.image || undefined,
              priceCents: listings.priceCents,
              currency: listings.currency,
              category: listings.category,
            })
            .from(buyerFavorites)
            .innerJoin(listings, eq(buyerFavorites.listingId, listings.id))
            .where(eq(buyerFavorites.buyerId, buyer.id))
            .orderBy(desc(buyerFavorites.createdAt))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ count: (db as any).fn.count().as("count") })
            .from(buyerFavorites)
            .where(eq(buyerFavorites.buyerId, buyer.id)),
        ]);

        const total = totalResult[0]?.count || 0;

        return {
          data: favorites,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch favorites",
        });
      }
    }),

  addFavorite: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/buyer/favorites",
        tags: ["Buyer - Favorites"],
        summary: "Add a listing to favorites",
        description: "Add a listing to the buyer's favorites collection",
      },
    })
    .input(z.object({ listingId: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), favoriteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const rateLimitKey = `favorite_${userId}`;
      if (
        !checkRateLimit(
          rateLimitKey,
          RATE_LIMITS.favorite.limit,
          RATE_LIMITS.favorite.windowMs
        )
      ) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Favorite action limit exceeded. Try again later.",
        });
      }

      try {
        const buyer = await getBuyer(userId);

        const existing = await db
          .select()
          .from(buyerFavorites)
          .where(
            and(
              eq(buyerFavorites.buyerId, buyer.id),
              eq(buyerFavorites.listingId, input.listingId)
            )
          );

        if (existing.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Listing already favorited",
          });
        }

        const favoriteId = uuidv4();
        await db.insert(buyerFavorites).values({
          id: favoriteId,
          buyerId: buyer.id,
          listingId: input.listingId,
          createdAt: new Date(),
        });

        return { success: true, favoriteId };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to add favorite",
        });
      }
    }),

  removeFavorite: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/buyer/favorites/{favoriteId}",
        tags: ["Buyer - Favorites"],
        summary: "Remove a listing from favorites",
        description: "Remove a listing from the buyer's favorites collection",
      },
    })
    .input(z.object({ favoriteId: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);

        const favorite = await db
          .select()
          .from(buyerFavorites)
          .where(
            and(
              eq(buyerFavorites.id, input.favoriteId),
              eq(buyerFavorites.buyerId, buyer.id)
            )
          );

        if (!favorite[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Favorite not found",
          });
        }

        await db
          .delete(buyerFavorites)
          .where(eq(buyerFavorites.id, input.favoriteId));

        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to remove favorite",
        });
      }
    }),

  isFavorited: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/favorites/check/{listingId}",
        tags: ["Buyer - Favorites"],
        summary: "Check if a listing is favorited",
        description:
          "Check whether a specific listing is in the buyer's favorites",
      },
    })
    .input(z.object({ listingId: z.string().uuid() }))
    .output(
      z.object({ isFavorited: z.boolean(), favoriteId: z.string().nullable() })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);

        const favorite = await db
          .select()
          .from(buyerFavorites)
          .where(
            and(
              eq(buyerFavorites.buyerId, buyer.id),
              eq(buyerFavorites.listingId, input.listingId)
            )
          )
          .then((r) => r[0] || null);

        return {
          isFavorited: !!favorite,
          favoriteId: favorite?.id || null,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to check favorite status",
        });
      }
    }),

  // ============ PURCHASE HISTORY ============

  getPurchaseHistory: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/orders",
        tags: ["Buyer - Orders"],
        summary: "Get purchase history",
        description:
          "Retrieve paginated order history with optional status filtering",
      },
    })
    .input(
      z.object({
        status: z.enum(["all", "ongoing", "delivered", "canceled"]).optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(5).max(50).default(10),
      })
    )
    .output(
      z.object({
        data: z.array(
          z.object({
            orderId: z.string(),
            productTitle: z.string(),
            productImage: z.string().optional(),
            productCategory: z.string(),
            priceCents: z.number(),
            currency: z.string(),
            orderDate: z.date(),
            orderStatus: z.string(),
            deliveryStatus: z.string(),
          })
        ),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);
        const offset = (input.page - 1) * input.limit;

        const status = input?.status ?? "all";

        let whereCondition: any = eq(orders.buyerId, buyer.id);

        if (status === "ongoing") {
          whereCondition = and(
            whereCondition,
            eq(orders.deliveryStatus, "in_transit")
          );
        } else if (status === "delivered") {
          whereCondition = and(
            whereCondition,
            eq(orders.deliveryStatus, "delivered")
          );
        } else if (status === "canceled") {
          whereCondition = and(
            whereCondition,
            eq(orders.orderStatus, "canceled")
          );
        }

        const [results, totalResult] = await Promise.all([
          db
            .select({
              id: orders.id,
              productTitle: orders.productTitle,
              productImage: orders.productImage || undefined,
              productCategory: orders.productCategory,
              amountCents: orders.amountCents,
              currency: orders.currency,
              orderDate: orders.orderDate,
              orderStatus: orders.orderStatus,
              deliveryStatus: orders.deliveryStatus,
            })
            .from(orders)
            .where(whereCondition)
            .orderBy(desc(orders.orderDate))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ count: (db as any).fn.count().as("count") })
            .from(orders)
            .where(whereCondition),
        ]);

        const total = totalResult[0]?.count || 0;

        return {
          data: results.map((o) => ({
            orderId: o.id,
            productTitle: o.productTitle,
            productImage: o.productImage || undefined,
            productCategory: o.productCategory,
            priceCents: o.amountCents,
            currency: o.currency,
            orderDate: o.orderDate,
            orderStatus: o.orderStatus,
            deliveryStatus: o.deliveryStatus,
          })),
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch purchase history",
        });
      }
    }),

  getOrderDetails: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/orders/{orderId}",
        tags: ["Buyer - Orders"],
        summary: "Get detailed order information",
        description:
          "Fetch complete order details including shipping, tracking, and delivery info",
      },
    })
    .input(z.object({ orderId: z.string().uuid() }))
    .output(
      z.object({
        orderId: z.string(),
        productTitle: z.string(),
        productImage: z.string().optional(),
        productCategory: z.string(),
        amountCents: z.number(),
        currency: z.string(),
        orderDate: z.date(),
        orderStatus: z.string(),
        deliveryStatus: z.string(),
        deliveredDate: z.date().nullable(),
        shippingAddress: z.string().nullable(),
        trackingNumber: z.string().nullable(),
        estimatedArrival: z.date().nullable(),
        recipientEmail: z.string().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);

        const order = await db
          .select()
          .from(orders)
          .where(
            and(eq(orders.id, input.orderId), eq(orders.buyerId, buyer.id))
          );

        if (!order[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        const o = order[0];
        return {
          orderId: o.id,
          productTitle: o.productTitle,
          productImage: o.productImage || undefined,
          productCategory: o.productCategory,
          amountCents: o.amountCents,
          currency: o.currency,
          orderDate: o.orderDate,
          orderStatus: o.orderStatus,
          deliveryStatus: o.deliveryStatus,
          deliveredDate: o.deliveredDate,
          shippingAddress: o.shippingAddress,
          trackingNumber: o.trackingNumber,
          estimatedArrival: o.estimatedArrival,
          recipientEmail: o.recipientEmail,
        };
      } catch (err: any) {
        console.error("Error fetching order details:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch order details",
        });
      }
    }),

  getOrdersByStatus: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/orders/by-status",
        tags: ["Buyer - Orders"],
        summary: "Get orders filtered by status",
        description:
          "Retrieve orders filtered by specific order status with pagination support",
      },
    })
    .input(
      z.object({
        status: z.enum([
          "processing",
          "shipped",
          "delivered",
          "canceled",
          "returned",
        ]),
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(5).max(50).default(10),
      })
    )
    .output(
      z.object({
        data: z.array(
          z.object({
            orderId: z.string(),
            productTitle: z.string(),
            productImage: z.string().optional(),
            priceCents: z.number(),
            currency: z.string(),
            orderDate: z.date(),
            orderStatus: z.string(),
          })
        ),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);
        const offset = (input.page - 1) * input.limit;

        const [results, totalResult] = await Promise.all([
          db
            .select({
              id: orders.id,
              productTitle: orders.productTitle,
              productImage: orders.productImage,
              amountCents: orders.amountCents,
              currency: orders.currency,
              orderDate: orders.orderDate,
              orderStatus: orders.orderStatus,
            })
            .from(orders)
            .where(
              and(
                eq(orders.buyerId, buyer.id),
                eq(orders.orderStatus, input.status)
              )
            )
            .orderBy(desc(orders.orderDate))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ count: (db as any).fn.count().as("count") })
            .from(orders)
            .where(
              and(
                eq(orders.buyerId, buyer.id),
                eq(orders.orderStatus, input.status)
              )
            ),
        ]);

        const total = totalResult[0]?.count || 0;

        return {
          data: results.map((o) => ({
            orderId: o.id,
            productTitle: o.productTitle,
            productImage: o.productImage || undefined,
            priceCents: o.amountCents,
            currency: o.currency,
            orderDate: o.orderDate,
            orderStatus: o.orderStatus,
          })),
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch orders by status",
        });
      }
    }),

  getNotifications: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/notifications",
        tags: ["Buyer - Notifications"],
        summary: "Get buyer notifications",
        description: "Retrieve paginated list of buyer notifications",
      },
    })
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(5).max(50).default(10),
      })
    )
    .output(
      z.object({
        data: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            message: z.string(),
            type: z.enum([
              "purchase",
              "review",
              "comment",
              "reminder",
              "order_confirmed",
              "payment_failed",
              "refund_issued",
              "delivery_confirmed",
            ]),
            timestamp: z.string(),
            isRead: z.boolean(),
            isFavorited: z.boolean(),
          })
        ),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);
        const offset = (input.page - 1) * input.limit;

        const [notifs, totalResult] = await Promise.all([
          db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.buyerId, buyer.id),
                isNull(notifications.sellerId)
              )
            )
            .orderBy(desc(notifications.createdAt))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ count: (db as any).fn.count().as("count") })
            .from(notifications)
            .where(
              and(
                eq(notifications.buyerId, buyer.id),
                isNull(notifications.sellerId)
              )
            ),
        ]);

        const total = totalResult[0]?.count || 0;

        return {
          data: notifs.map((n) => ({
            id: n.id,
            title: n.message.split("|")[0] || "Notification",
            message: n.message,
            type: n.type,
            timestamp: n.createdAt.toISOString(),
            isRead: n.isRead,
            isFavorited: n.isStarred,
          })),
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch notifications",
        });
      }
    }),

  // ============ LOYALTY NFTs ============

  getLoyaltyNFTs: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/loyalty-nfts",
        tags: ["Buyer - Loyalty"],
        summary: "Get buyer loyalty NFTs",
        description: "Retrieve loyalty NFT rewards and points",
      },
    })
    .input(z.void())
    .output(
      z.object({
        nfts: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            image: z.string(),
            loyaltyPoints: z.number(),
            earnedDate: z.date(),
            rarity: z.string(),
            property: z.string(),
          })
        ),
        totalPoints: z.number(),
      })
    )
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);
        
        // Fetch real NFTs from database
        const nfts = await db
          .select({
            id: loyaltyNFTs.id,
            title: loyaltyNFTs.title,
            image: loyaltyNFTs.image,
            loyaltyPoints: loyaltyNFTs.loyaltyPoints,
            earnedDate: loyaltyNFTs.earnedDate,
            rarity: loyaltyNFTs.rarity,
            property: loyaltyNFTs.property,
          })
          .from(loyaltyNFTs)
          .where(eq(loyaltyNFTs.buyerId, buyer.id));
        
        // Calculate total loyalty points from purchase history
        const purchaseStats = await db
          .select({
            totalSpent: sql`COALESCE(SUM(${orders.amountCents}), 0)`,
          })
          .from(orders)
          .where(eq(orders.buyerId, buyer.id));

        const stats = purchaseStats[0] as any;
        const totalPoints = Math.floor((Number(stats?.totalSpent) || 0) / 100);
        
        return {
          nfts: nfts || [],
          totalPoints,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch loyalty NFTs",
        });
      }
    }),

  // ============ AUTHENTICATION ============

  updatePassword: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/buyer/password",
        tags: ["Buyer - Account"],
        summary: "Update buyer password",
        description: "Change buyer account password",
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
        path: "/buyer/account",
        tags: ["Buyer - Account"],
        summary: "Delete buyer account",
        description: "Permanently delete buyer account and all associated data (GDPR compliant)",
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

        // Get buyer record
        const buyer = await getBuyer(userId);

        // Delete all buyer-related data in transaction
        // Note: Cascading deletes will handle orders, payments, refunds, etc.
        await db.transaction(async (tx) => {
          // Delete messaging & communications
          // First delete messages, then conversations
          const buyerConversations = await tx
            .select()
            .from(conversations)
            .where(eq(conversations.buyerId, buyer.id));

          for (const conv of buyerConversations) {
            await tx
              .delete(messages)
              .where(eq(messages.conversationId, conv.id));
          }

          await tx
            .delete(conversations)
            .where(eq(conversations.buyerId, buyer.id));

          // Delete support tickets & replies
          const buyerTickets = await tx
            .select()
            .from(supportTickets)
            .where(eq(supportTickets.buyerId, buyer.id));

          for (const ticket of buyerTickets) {
            await tx
              .delete(supportTicketReplies)
              .where(eq(supportTicketReplies.ticketId, ticket.id));
          }

          await tx
            .delete(supportTickets)
            .where(eq(supportTickets.buyerId, buyer.id));

          // Delete reviews
          await tx
            .delete(reviews)
            .where(eq(reviews.buyerId, buyer.id));

          // Delete sales records (financial history)
          await tx
            .delete(sales)
            .where(eq(sales.buyerId, buyer.id));

          // Delete shipping addresses
          await tx
            .delete(buyerShipping)
            .where(eq(buyerShipping.buyerId, buyer.id));

          // Delete billing addresses
          await tx
            .delete(buyerBillingAddress)
            .where(eq(buyerBillingAddress.buyerId, buyer.id));

          // Delete cart items first (FK constraint)
          const buyerCarts = await tx
            .select()
            .from(carts)
            .where(eq(carts.buyerId, buyer.id));

          for (const cart of buyerCarts) {
            await tx
              .delete(cartItems)
              .where(eq(cartItems.cartId, cart.id));
          }

          // Delete carts
          await tx
            .delete(carts)
            .where(eq(carts.buyerId, buyer.id));

          // Delete favorites
          await tx
            .delete(buyerFavorites)
            .where(eq(buyerFavorites.buyerId, buyer.id));

          // Delete notifications
          await tx
            .delete(notifications)
            .where(
              and(
                eq(notifications.buyerId, buyer.id),
                isNull(notifications.sellerId)
              )
            );

          // Delete loyalty NFTs
          await tx
            .delete(loyaltyNFTs)
            .where(eq(loyaltyNFTs.buyerId, buyer.id));

          // Delete account details
          await tx
            .delete(buyerAccountDetails)
            .where(eq(buyerAccountDetails.buyerId, buyer.id));

          // Delete buyer record (cascading deletes orders, payments, refunds)
          await tx.delete(buyers).where(eq(buyers.id, buyer.id));
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

        // Delete Supabase user (handles auth)
        const { error } = await sb.auth.admin.deleteUser(userId);
        if (error) {
          throw new Error(`User deletion failed: ${error.message}`);
        }

        return {
          success: true,
          message: "Account deleted successfully. All personal data has been removed.",
        };
      } catch (err: any) {
        console.error("Error deleting account:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to delete account",
        });
      }
    }),

  // ============ ORDER STATISTICS ============

  getOrderStats: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/orders/stats",
        tags: ["Buyer - Orders"],
        summary: "Get buyer order statistics",
        description:
          "Fetch summary statistics for buyer orders (total orders, total spent, status breakdown) with optional date range filtering",
      },
    })
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .output(
      z.object({
        totalOrders: z.number(),
        totalSpentCents: z.number(),
        pendingOrders: z.number(),
        deliveredOrders: z.number(),
        canceledOrders: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const buyer = await getBuyer(userId);

        // Build where condition with optional date filtering
        let whereCondition: any = eq(orders.buyerId, buyer.id);
        
        if (input.startDate && input.endDate) {
          whereCondition = and(
            whereCondition,
            sql`${orders.orderDate} >= ${input.startDate} AND ${orders.orderDate} <= ${input.endDate}`
          );
        } else if (input.startDate) {
          whereCondition = and(
            whereCondition,
            sql`${orders.orderDate} >= ${input.startDate}`
          );
        } else if (input.endDate) {
          whereCondition = and(
            whereCondition,
            sql`${orders.orderDate} <= ${input.endDate}`
          );
        }

        // Fetch all orders for the buyer (with optional date filter)
        const allOrders = await db
          .select()
          .from(orders)
          .where(whereCondition);

        // Calculate stats in application
        const totalOrders = allOrders.length;
        const totalSpentCents = allOrders.reduce(
          (sum, o) => sum + (o.amountCents || 0),
          0
        );
        const pendingOrders = allOrders.filter(
          (o) => o.deliveryStatus === "in_transit"
        ).length;
        const deliveredOrders = allOrders.filter(
          (o) => o.deliveryStatus === "delivered"
        ).length;
        const canceledOrders = allOrders.filter(
          (o) => o.orderStatus === "canceled"
        ).length;

        return {
          totalOrders,
          totalSpentCents,
          pendingOrders,
          deliveredOrders,
          canceledOrders,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch order statistics",
        });
      }
    }),

  updateNotificationPreferences: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/buyer/notification-preferences",
        tags: ["Buyer - Preferences"],
        summary: "Update notification preferences",
        description: "Update buyer notification preferences for emails and alerts",
      },
    })
    .input(
      z.object({
        orderUpdates: z.boolean().optional(),
        promotionalEmails: z.boolean().optional(),
        securityAlerts: z.boolean().optional(),
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
        const buyer = await getBuyer(userId);

        const existing = await db
          .select()
          .from(buyerAccountDetails)
          .where(eq(buyerAccountDetails.buyerId, buyer.id));

        if (existing.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Buyer account details not found",
          });
        }

        await db
          .update(buyerAccountDetails)
          .set({
            orderUpdates:
              input.orderUpdates !== undefined ? input.orderUpdates : existing[0].orderUpdates,
            promotionalEmails:
              input.promotionalEmails !== undefined ? input.promotionalEmails : existing[0].promotionalEmails,
            securityAlerts:
              input.securityAlerts !== undefined ? input.securityAlerts : existing[0].securityAlerts,
            updatedAt: new Date(),
          })
          .where(eq(buyerAccountDetails.buyerId, buyer.id));

        return {
          success: true,
          message: "Notification preferences updated successfully",
        };
      } catch (err: any) {
        console.error("Error updating notification preferences:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to update notification preferences",
        });
      }
    }),

  getNotificationPreferences: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/notification-preferences",
        tags: ["Buyer - Preferences"],
        summary: "Get notification preferences",
        description: "Retrieve buyer notification preferences",
      },
    })
    .output(
      z.object({
        orderUpdates: z.boolean(),
        promotionalEmails: z.boolean(),
        securityAlerts: z.boolean(),
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
        const buyer = await getBuyer(userId);

        const result = await db
          .select()
          .from(buyerAccountDetails)
          .where(eq(buyerAccountDetails.buyerId, buyer.id));

        if (result.length === 0) {
          return {
            orderUpdates: true,
            promotionalEmails: true,
            securityAlerts: true,
          };
        }

        return {
          orderUpdates: result[0].orderUpdates,
          promotionalEmails: result[0].promotionalEmails,
          securityAlerts: result[0].securityAlerts,
        };
      } catch (err: any) {
        console.error("Error fetching notification preferences:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to fetch notification preferences",
        });
      }
    }),
});