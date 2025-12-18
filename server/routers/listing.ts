import { createTRPCRouter, protectedProcedure } from "../trpc/trpc";
import { db } from "../db";
import { listings, sellers } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { getSeller } from "./utils";


const SizesEnum = z.enum(["S", "M", "L", "XL", "XXL", "XXXL"]);
const SupplyCapacityEnum = z.enum(["no_max", "limited"]);
const LimitedBadgeEnum = z.enum(["show_badge", "do_not_show"]);
const CategoryEnum = z.enum([
  "men_clothing",
  "women_clothing",
  "men_shoes",
  "women_shoes",
  "accessories",
  "merch",
  "others",
]);
const ShippingOptionEnum = z.enum(["local", "international", "both"]);
const ShippingEtaEnum = z.enum(["48hrs", "72hrs", "5_working_days", "1week"]);
const TargetAudienceEnum = z.enum(["male", "female", "unisex"]);

const ListingOutput = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  type: z.enum(["single", "collection"]),
  title: z.string(),
  description: z.string().nullable(),
  category: CategoryEnum.nullable(),
  image: z.string().nullable(),
  priceCents: z.number().int().nullable(),
  currency: z.string().nullable(),
  sizesJson: z.string().nullable(),
  supplyCapacity: SupplyCapacityEnum.nullable(),
  quantityAvailable: z.number().int().nullable(),
  limitedEditionBadge: LimitedBadgeEnum.nullable(),
  releaseDuration: z.string().nullable(),
  materialComposition: z.string().nullable(),
  colorsAvailable: z.string().nullable(),
  additionalTargetAudience: TargetAudienceEnum.nullable(),
  shippingOption: ShippingOptionEnum.nullable(),
  etaDomestic: ShippingEtaEnum.nullable(),
  etaInternational: ShippingEtaEnum.nullable(),
  itemsJson: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const RestockOutput = z.object({
  id: z.string().uuid(),
  quantityAvailable: z.number().int().nullable(),
  status: z.enum(["in_stock", "low_stock", "sold_out"]),
});

const DeleteOutput = z.object({
  success: z.boolean(),
});

const SingleListingInput = z.object({
  // Personal information (required)
  title: z.string().min(1),
  category: CategoryEnum,
  priceCents: z.number().int().positive(),
  currency: z.string().min(1).max(16),
  description: z.string().min(1),
  image: z.string().url().min(1),
  sizes: z.array(SizesEnum).nonempty(),
  supplyCapacity: SupplyCapacityEnum,
  quantityAvailable: z.number().int().nonnegative().optional(),
  limitedEditionBadge: LimitedBadgeEnum,
  releaseDuration: z.string().min(1),
  // Additional information (optional)
  materialComposition: z.string().optional(),
  colorsAvailable: z.array(z.string().min(1)).optional(),
  additionalTargetAudience: TargetAudienceEnum.optional(),
  shippingOption: ShippingOptionEnum.optional(),
  etaDomestic: ShippingEtaEnum.optional(),
  etaInternational: ShippingEtaEnum.optional(),
});

function computeStockStatus(
  supplyCapacity: "no_max" | "limited" | null,
  quantity: number | null
): "in_stock" | "low_stock" | "sold_out" {
  if (supplyCapacity === "no_max") return "in_stock";
  const qty = quantity ?? 0;
  if (qty <= 0) return "sold_out";
  if (qty <= 5) return "low_stock";
  return "in_stock";
}

export const listingRouter = createTRPCRouter({
  createSingle: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/listing/create-single",
        tags: ["Listing"],
        summary: "Create a single product listing",
      },
    })
    .input(SingleListingInput)
    .output(ListingOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const seller = await getSeller(userId);

        // if limited supply, quantity must be provided and > 0
        if (
          input.supplyCapacity === "limited" &&
          (!input.quantityAvailable || input.quantityAvailable <= 0)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "quantityAvailable is required for limited supply",
          });
        }

        const [created] = await db
          .insert(listings)
          .values({
            productId: randomUUID(),
            sellerId: seller.id,
            type: "single",
            title: input.title,
            description: input.description,
            category: input.category,
            image: input.image,
            priceCents: input.priceCents,
            currency: input.currency,
            sizesJson: JSON.stringify(input.sizes),
            supplyCapacity: input.supplyCapacity,
            quantityAvailable: input.quantityAvailable,
            limitedEditionBadge: input.limitedEditionBadge,
            releaseDuration: input.releaseDuration,
            materialComposition: input.materialComposition,
            colorsAvailable: input.colorsAvailable
              ? JSON.stringify(input.colorsAvailable)
              : null,
            additionalTargetAudience: input.additionalTargetAudience,
            shippingOption: input.shippingOption,
            etaDomestic: input.etaDomestic,
            etaInternational: input.etaInternational,
          })
          .returning();

        return created;
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to create listing",
        });
      }
    }),

  createCollection: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/listing/createCollection",
        tags: ["Listing"],
        summary: "Create a new product collection",
        description:
          "Creates a new collection listing for the authenticated seller with the provided title, description, and item details.",
      },
    })
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        items: z
          .array(
            z.object({
              title: z.string().min(1),
              priceCents: z.number().int().positive(),
              currency: z.string().min(1).max(16),
            })
          )
          .min(1),
      })
    )
    .output(ListingOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const seller = await getSeller(userId);

        const [created] = await db
          .insert(listings)
          .values({
            productId: randomUUID(),
            sellerId: seller.id,
            type: "collection",
            title: input.title,
            description: input.description,
            itemsJson: JSON.stringify(input.items),
          })
          .returning();
        return created;
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to create listing",
        });
      }
    }),

  getMyListings: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/listings/me",
        tags: ["Listings"],
        summary: "Get all listings belonging to the authenticated seller",
        description:
          "Fetches all listings created by the currently authenticated seller, including both product and collection listings.",
      },
    })
    .output(z.array(ListingOutput))
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const seller = await getSeller(userId);

        const rows = await db
          .select()
          .from(listings)
          .where(eq(listings.sellerId, seller.id));
        return rows;
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to fetch listings",
        });
      }
    }),

  getMyListingsByCategory: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/listings/me/category",
        tags: ["Listings"],
        summary: "Get all listings by category for the authenticated seller",
        description:
          "Retrieves all single-type listings belonging to the authenticated seller filtered by the specified product category.",
      },
    })
    .input(z.object({ category: CategoryEnum }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          category: CategoryEnum.nullable(),
          priceCents: z.number().nullable(),
          currency: z.string().nullable(),
          stock: z.number().nullable(),
          status: z.enum(["in_stock", "low_stock", "sold_out"]),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const seller = await getSeller(userId);

        const rows = await db
          .select({
            id: listings.id,
            title: listings.title,
            category: listings.category,
            priceCents: listings.priceCents,
            currency: listings.currency,
            quantityAvailable: listings.quantityAvailable,
            supplyCapacity: listings.supplyCapacity,
            type: listings.type,
          })
          .from(listings)
          .where(
            and(
              eq(listings.sellerId, seller.id),
              eq(listings.category, input.category)
            )
          );

        return rows
          .filter((r) => r.type === "single")
          .map((r) => ({
            id: r.id,
            title: r.title,
            category: r.category,
            priceCents: r.priceCents,
            currency: r.currency,
            stock:
              r.supplyCapacity === "no_max" ? null : r.quantityAvailable ?? 0,
            status: computeStockStatus(
              r.supplyCapacity as any,
              r.quantityAvailable ?? null
            ),
          }));
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to fetch listings by category",
        });
      }
    }),

  // deleteListing = delete product, restockListing = restock product quantity for single listings
  deleteListing: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/listings/{id}",
        tags: ["Listings"],
        summary: "Delete a listing",
        description:
          "Deletes a specific listing owned by the authenticated seller. The listing ID must belong to the seller; otherwise, an error is returned.",
      },
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(DeleteOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const seller = await getSeller(userId);

        const owned = await db
          .select()
          .from(listings)
          .where(
            and(eq(listings.id, input.id), eq(listings.sellerId, seller.id))
          );
        if (!owned[0])
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Listing not found",
          });

        await db.delete(listings).where(eq(listings.id, input.id));
        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to delete listing",
        });
      }
    }),

  restockListing: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/listings/{id}/restock",
        tags: ["Listings"],
        summary: "Restock a listing",
        description:
          "Updates the available quantity for a specific single-type listing owned by the authenticated seller. Cannot restock listings with unlimited supply or non-single types.",
      },
    })
    .input(
      z.object({
        id: z.string().uuid(),
        quantityAvailable: z.number().int().nonnegative(),
      })
    )
    .output(RestockOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const seller = await getSeller(userId);

        const owned = await db
          .select()
          .from(listings)
          .where(
            and(eq(listings.id, input.id), eq(listings.sellerId, seller.id))
          );
        const listing = owned[0];
        if (!listing)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Listing not found",
          });
        if (listing.type !== "single")
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only single listings can be restocked",
          });
        if (listing.supplyCapacity === "no_max")
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unlimited supply listing does not require restock",
          });

        const [updated] = await db
          .update(listings)
          .set({ quantityAvailable: input.quantityAvailable })
          .where(eq(listings.id, input.id))
          .returning({
            id: listings.id,
            quantityAvailable: listings.quantityAvailable,
            supplyCapacity: listings.supplyCapacity,
          });

        return {
          id: updated.id,
          quantityAvailable: updated.quantityAvailable,
          status: computeStockStatus(
            updated.supplyCapacity as any,
            updated.quantityAvailable ?? null
          ),
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to restock listing",
        });
      }
    }),
});
