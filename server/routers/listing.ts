type ReleaseDurationType = "24hrs" | "48hrs" | "72hrs" | "1week" | "2weeks" | "1month";
import { createTRPCRouter, protectedProcedure } from "../trpc/trpc";
import { db } from "../db";
import { listings, sellers } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { listingsSchema } from "../db/zodSchemas";
import { TRPCError } from "@trpc/server";

// ---------- ENUMS ----------
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
const ShippingEtaInternationalEnum = z.enum(["custom", "days_7_to_14", "days_14_to_30"]);
const TargetAudienceEnum = z.enum(["male", "female", "unisex"]);
const ReleaseDurationEnum = z.enum([
  "24hrs",
  "48hrs",
  "72hrs",
  "1week",
  "2weeks",
  "1month",
]);

const EtaDomesticEnum = ShippingEtaEnum;
const EtaInternationalEnum = ShippingEtaInternationalEnum;

// ---------- OUTPUT SCHEMAS ----------
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
  sizesJson: z.array(z.string()).nullable(),
  supplyCapacity: SupplyCapacityEnum.nullable(),
  quantityAvailable: z.number().int().nullable(),
  limitedEditionBadge: LimitedBadgeEnum.nullable(),
  releaseDuration: ReleaseDurationEnum.nullable(),
  materialComposition: z.string().nullable(),
  colorsAvailable: z
    .array(
      z.object({
        colorName: z.string(),
        colorHex: z.string(),
      })
    )
    .nullable(),
  additionalTargetAudience: TargetAudienceEnum.nullable(),
  shippingOption: ShippingOptionEnum.nullable(),
  etaDomestic: EtaDomesticEnum.nullable(),
  etaInternational: EtaInternationalEnum.nullable(),
  itemsJson: z.array(z.any()).nullable(),
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

// ---------- INPUT SCHEMAS ----------
// Use listingsSchema for input, picking only the fields needed for creation
// Omit productId for creation, allow sizes as array for API input
const SingleListingInput = listingsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sizesJson: true,
  sellerId: true,
  type: true,
}).extend({
  productId: z.string().uuid().optional(),
  sizes: z.array(z.string()).nonempty().optional(),
});

// ---------- HELPERS ----------
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

import type { TRPCContext } from "../trpc/context";
// Middleware to fetch seller
async function fetchSeller(ctx: TRPCContext) {
  const userId = ctx.user?.id;
  if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  const sellerRows = await db
    .select()
    .from(sellers)
    .where(eq(sellers.userId, userId));
  if (!sellerRows || sellerRows.length === 0) throw new TRPCError({ code: "FORBIDDEN", message: "Seller not found" });
  return sellerRows[0];
}

// ---------- ROUTER ----------
export const listingRouter = createTRPCRouter({
  // ---- CREATE SINGLE LISTING ----
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
      const seller = await fetchSeller(ctx);
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
        await db
          .insert(listings)
          .values({
            sellerId: seller.id,
            type: "single",
            title: input.title,
            description: input.description,
            category: input.category as any,
            image: input.image,
            priceCents: input.priceCents,
            currency: input.currency,
            sizesJson: input.sizes ? JSON.stringify(input.sizes) : null,
            supplyCapacity: input.supplyCapacity as any,
            quantityAvailable: input.quantityAvailable,
            limitedEditionBadge: input.limitedEditionBadge as any,
            releaseDuration: input.releaseDuration,
            materialComposition: input.materialComposition,
            colorsAvailable: input.colorsAvailable ? JSON.stringify(input.colorsAvailable) : null,
            additionalTargetAudience: input.additionalTargetAudience as any,
            shippingOption: input.shippingOption as any,
            etaDomestic: input.etaDomestic as any,
            etaInternational: input.etaInternational as any,
            itemsJson: input.itemsJson ? JSON.stringify(input.itemsJson) : null,
            productId: input.productId,
          });
        const createdRows = await db
          .select()
          .from(listings)
          .where(and(
            eq(listings.sellerId, seller.id),
            eq(listings.title, input.title),
            eq(listings.type, "single")
          ));
        if (!createdRows || createdRows.length === 0 || !createdRows[0]?.id) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch created listing." });
        }
        const created = createdRows[0];

      return {
        id: created.id,
        sellerId: created.sellerId,
        type: created.type,
        title: created.title,
        description: created.description,
        category: created.category,
        image: created.image,
        priceCents: created.priceCents,
        currency: created.currency,
        sizesJson: created.sizesJson ? JSON.parse(created.sizesJson) : [],
        supplyCapacity: created.supplyCapacity,
        quantityAvailable: created.quantityAvailable,
        limitedEditionBadge: created.limitedEditionBadge,
        releaseDuration: created.releaseDuration as ReleaseDurationType,
        materialComposition: created.materialComposition,
        colorsAvailable: created.colorsAvailable ? JSON.parse(created.colorsAvailable) : null,
        additionalTargetAudience: created.additionalTargetAudience,
        shippingOption: created.shippingOption,
        etaDomestic: created.etaDomestic,
        etaInternational: created.etaInternational,
        itemsJson: created.itemsJson ? JSON.parse(created.itemsJson) : [],
        productId: created.productId,
        createdAt: new Date(created.createdAt),
        updatedAt: new Date(created.updatedAt),
      };
    }),

  // ---- CREATE COLLECTION ----
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
          .optional(),
      })
    )
    .output(ListingOutput)
    .mutation(async ({ ctx, input }) => {
      const seller = await fetchSeller(ctx);

      await db
        .insert(listings)
        .values({
          sellerId: seller.id,
          type: "collection",
          title: input.title,
          description: input.description,
          itemsJson: input.items && input.items.length > 0 ? JSON.stringify(input.items) : null,
        });
      const createdRows = await db
        .select()
        .from(listings)
        .where(and(
          eq(listings.sellerId, seller.id),
          eq(listings.title, input.title),
          eq(listings.type, "collection")
        ));
      if (!createdRows || createdRows.length === 0 || !createdRows[0]?.id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch created collection." });
      }
      const created = createdRows[0];

      return {
        id: created.id,
        sellerId: created.sellerId,
        type: created.type,
        title: created.title,
        description: created.description,
        category: created.category,
        image: created.image,
        priceCents: created.priceCents,
        currency: created.currency,
        sizesJson: created.sizesJson ? JSON.parse(created.sizesJson) : [],
        supplyCapacity: created.supplyCapacity,
        quantityAvailable: created.quantityAvailable,
        limitedEditionBadge: created.limitedEditionBadge,
        releaseDuration: created.releaseDuration as ReleaseDurationType,
        materialComposition: created.materialComposition,
        colorsAvailable: created.colorsAvailable ? JSON.parse(created.colorsAvailable) : null,
        additionalTargetAudience: created.additionalTargetAudience,
        shippingOption: created.shippingOption,
        etaDomestic: created.etaDomestic,
        etaInternational: created.etaInternational,
        itemsJson: created.itemsJson ? JSON.parse(created.itemsJson) : [],
        createdAt: new Date(created.createdAt),
        updatedAt: new Date(created.updatedAt),
      };
    }),

  // ---- GET MY LISTINGS ----
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
      const seller = await fetchSeller(ctx);
      const rows = await db
        .select()
        .from(listings)
        .where(eq(listings.sellerId, seller.id));
      return rows.filter(r => r?.id).map((r) => ({
        id: r.id,
        sellerId: r.sellerId,
        type: r.type,
        title: r.title,
        description: r.description,
        category: r.category,
        image: r.image,
        priceCents: r.priceCents,
        currency: r.currency,
        sizesJson: r.sizesJson ? JSON.parse(r.sizesJson) : [],
        supplyCapacity: r.supplyCapacity,
        quantityAvailable: r.quantityAvailable,
        limitedEditionBadge: r.limitedEditionBadge,
        releaseDuration: r.releaseDuration as ReleaseDurationType,
        materialComposition: r.materialComposition,
        colorsAvailable: r.colorsAvailable ? JSON.parse(r.colorsAvailable) : null,
        additionalTargetAudience: r.additionalTargetAudience,
        shippingOption: r.shippingOption,
        etaDomestic: r.etaDomestic,
        etaInternational: r.etaInternational,
        itemsJson: r.itemsJson ? JSON.parse(r.itemsJson) : [],
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));
    }),

  // ---- GET MY LISTINGS BY CATEGORY ----
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
      const seller = await fetchSeller(ctx);

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
          stock: r.supplyCapacity === "no_max" ? null : r.quantityAvailable ?? 0,
          status: computeStockStatus(r.supplyCapacity, r.quantityAvailable ?? null),
        }));
    }),

  // ---- RESTOCK LISTING ----
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
      const seller = await fetchSeller(ctx);

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

      await db
        .update(listings)
        .set({ quantityAvailable: input.quantityAvailable })
        .where(eq(listings.id, input.id));
      const updatedRows = await db
        .select({
          id: listings.id,
          quantityAvailable: listings.quantityAvailable,
          supplyCapacity: listings.supplyCapacity,
        })
        .from(listings)
        .where(eq(listings.id, input.id));
      if (!updatedRows || updatedRows.length === 0) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch updated listing." });
      }
      const updated = updatedRows[0];
      return {
        id: updated.id,
        quantityAvailable: updated.quantityAvailable,
        status: computeStockStatus(
          updated.supplyCapacity as any,
          updated.quantityAvailable ?? null
        ),
      };

    }),

  // ---- DELETE LISTING ----
  deleteListing: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/listing/{id}",
        tags: ["Listing"],
        summary: "Delete a listing by id",
        description: "Deletes a listing owned by the authenticated seller.",
      },
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(DeleteOutput)
    .mutation(async ({ ctx, input }) => {
      const seller = await fetchSeller(ctx);
      const result = await db
        .delete(listings)
        .where(and(eq(listings.id, input.id), eq(listings.sellerId, seller.id)));
      return { success: true };
    })
});
