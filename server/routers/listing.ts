import { createTRPCRouter, protectedProcedure } from "../trpc/trpc";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { listings, sellers, brands, collections, products, productImages } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "../trpc/context";

type ReleaseDurationType = "24hrs" | "48hrs" | "72hrs" | "1week" | "2weeks" | "1month";

// ---------- ENUMS ----------
const SizesEnum = z.enum(["S", "M", "L", "XL", "XXL", "XXXL"]);
const SupplyCapacityEnum = z.enum(["no_max", "limited"]);
const LimitedBadgeEnum = z.enum(["show_badge", "do_not_show"]);
const ListingStatusEnum = z.enum(["pending", "approved", "rejected", "revision_requested"]);
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
const ShippingEtaEnum = z.enum(["same_day", "next_day", "48hrs", "72hrs", "5_working_days", "1_2_weeks", "2_3_weeks", "custom"]);
const TargetAudienceEnum = z.enum(["male", "female", "unisex"]);
const ReleaseDurationEnum = z.enum([
  "24hrs",
  "48hrs",
  "72hrs",
  "1week",
  "2weeks",
  "1month",
]);

// Helper to convert extended enum values to db values
const mapShippingEta = (value: string): "same_day" | "next_day" | "48hrs" | "72hrs" | "5_working_days" | "1_2_weeks" | "2_3_weeks" | "custom" => {
  return value as "same_day" | "next_day" | "48hrs" | "72hrs" | "5_working_days" | "1_2_weeks" | "2_3_weeks" | "custom";
};

// ---------- OUTPUT SCHEMAS ----------
const ListingOutput = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  type: z.enum(["single", "collection"]),
  title: z.string(),
  description: z.string().nullable(),
  category: CategoryEnum.nullable(),
  image: z.string().nullable(),
  imagesJson: z.string().nullable(),
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
  etaDomestic: ShippingEtaEnum.nullable(),
  etaInternational: ShippingEtaEnum.nullable(),
  refundPolicy: z.enum(['no_refunds', '48hrs', '72hrs', '5_working_days', '1week', '14days', '30days', '60days', 'store_credit']).nullable(),
  localPricing: z.enum(['fiat', 'cryptocurrency', 'both']).nullable(),
  itemsJson: z.array(z.any()).nullable(),
  status: ListingStatusEnum.default('pending'),
  productId: z.string().uuid().nullable().optional(),
  sku: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  careInstructions: z.string().nullable().optional(),
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
const SingleListingInput = z.object({
  sellerId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category: CategoryEnum.nullable().optional(),
  image: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
  imagesJson: z.string().nullable().optional(),
  priceCents: z.number().int().nullable().optional(),
  currency: z.string().nullable().optional(),
  sizes: z.array(z.string()).optional(),
  supplyCapacity: SupplyCapacityEnum.nullable().optional(),
  quantityAvailable: z.number().int().nullable().optional(),
  limitedEditionBadge: LimitedBadgeEnum.nullable().optional(),
  releaseDuration: ReleaseDurationEnum.nullable().optional(),
  materialComposition: z.string().nullable().optional(),
  colorsAvailable: z
    .array(
      z.object({
        colorName: z.string(),
        colorHex: z.string(),
      })
    )
    .nullable()
    .optional(),
  additionalTargetAudience: TargetAudienceEnum.nullable().optional(),
  shippingOption: ShippingOptionEnum.nullable().optional(),
  etaDomestic: ShippingEtaEnum.nullable().optional(),
  etaInternational: ShippingEtaEnum.nullable().optional(),
  refundPolicy: z.enum(['no_refunds', '48hrs', '72hrs', '5_working_days', '1week', '14days', '30days', '60days', 'store_credit']).nullable().optional(),
  localPricing: z.enum(['fiat', 'cryptocurrency', 'both']).nullable().optional(),
  itemsJson: z.array(z.any()).nullable().optional(),
  productId: z.string().uuid().nullable().optional(),
  sku: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  careInstructions: z.string().nullable().optional(),
  collectionId: z.any().optional(),
}).transform((data) => {
  const { collectionId, ...rest } = data;
  return rest;
});

const CollectionItemInput = z.object({
  title: z.string(),
  priceCents: z.number().int().positive(),
  currency: z.string(),
  description: z.string().optional(),
  category: CategoryEnum.optional(),
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

async function fetchSeller(ctx: TRPCContext) {
  const userId = ctx.user?.id;
  if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  const sellerRows = await db.select().from(sellers).where(eq(sellers.userId, userId));
  if (!sellerRows?.length) throw new TRPCError({ code: "FORBIDDEN", message: "Seller not found" });
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

      if (input.supplyCapacity === "limited" && (!input.quantityAvailable || input.quantityAvailable <= 0))
        throw new TRPCError({ code: "BAD_REQUEST", message: "quantityAvailable is required for limited supply" });

      // Get or create brand for seller
      const existingBrands = await db.select().from(brands).where(eq(brands.sellerId, seller.id));
      let brandId: string;
      if (existingBrands.length > 0) {
        brandId = existingBrands[0].id;
      } else {
        const defaultBrandName = "Default Store";
        const newBrand = await db.insert(brands).values({
          sellerId: seller.id,
          name: defaultBrandName,
          slug: defaultBrandName.toLowerCase().replace(/\s+/g, "-"),
        }).returning({ id: brands.id });
        brandId = newBrand[0].id;
      }

      const productId = input.productId ?? uuidv4();

      const convertedPrice = input.priceCents ? (input.priceCents / 100).toFixed(2) : "0.00";
      
      // Build product values object with only fields that have values
      const productValues: any = {
        brandId: brandId,
        collectionId: null,  // Explicitly set to null for single products
        name: input.title,
        slug: input.title.toLowerCase().replace(/\s+/g, "-"),
        price: convertedPrice,
        currency: input.currency ?? "SOL",
        type: "single",
        sku: input.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        inStock: true,
      };

      // Only add optional fields if they have values
      if (input.description) {
        productValues.description = input.description;
      }
      if (input.category) {
        productValues.category = input.category;
      }
      if (input.etaDomestic) {
        productValues.shipsIn = input.etaDomestic;
      }
      
      const productInserted = await db.insert(products).values(productValues).returning({ id: products.id });

      const listingValues = {
        sellerId: seller.id,
        productId: productInserted[0].id,
        type: "single" as const,
        title: input.title,
        description: input.description ?? null,
        category: input.category ?? null,
        image: input.image ?? null,
        imagesJson: input.imagesJson ?? null,
        priceCents: input.priceCents ?? null,
        currency: input.currency ?? null,
        sizesJson: input.sizes ? JSON.stringify(input.sizes) : null,
        supplyCapacity: input.supplyCapacity ?? null,
        quantityAvailable: input.quantityAvailable ?? null,
        limitedEditionBadge: input.limitedEditionBadge ?? null,
        releaseDuration: input.releaseDuration ?? null,
        materialComposition: input.materialComposition ?? null,
        colorsAvailable: input.colorsAvailable ? JSON.stringify(input.colorsAvailable) : null,
        additionalTargetAudience: input.additionalTargetAudience ?? null,
        shippingOption: input.shippingOption ?? null,
        etaDomestic: input.etaDomestic ? mapShippingEta(input.etaDomestic) : null,
        etaInternational: input.etaInternational ? mapShippingEta(input.etaInternational) : null,
        refundPolicy: input.refundPolicy ?? null,
        localPricing: input.localPricing ?? null,
        itemsJson: input.itemsJson ? JSON.stringify(input.itemsJson) : null,
        sku: input.sku ?? null,
        slug: input.slug ?? null,
        metaDescription: input.metaDescription ?? null,
        barcode: input.barcode ?? null,
        videoUrl: input.videoUrl ?? null,
        careInstructions: input.careInstructions ?? null,
      };

      const listingInserted = await db.insert(listings).values(listingValues).returning();

      // Insert additional product images if provided
      if (input.images && input.images.length > 0) {
        const imageValues = input.images.map((imageUrl, index) => ({
          productId: productInserted[0].id,
          imageUrl,
          position: index,
        }));
        await db.insert(productImages).values(imageValues);
      }

      const created = listingInserted[0];

      return {
        id: created.id,
        sellerId: created.sellerId,
        type: created.type as "single" | "collection",
        title: created.title,
        description: created.description,
        category: created.category,
        image: created.image,
        imagesJson: created.imagesJson,
        priceCents: created.priceCents,
        currency: created.currency,
        sizesJson: created.sizesJson ? JSON.parse(created.sizesJson) : null,
        supplyCapacity: created.supplyCapacity,
        quantityAvailable: created.quantityAvailable,
        limitedEditionBadge: created.limitedEditionBadge,
        releaseDuration: created.releaseDuration as any,
        materialComposition: created.materialComposition,
        colorsAvailable: created.colorsAvailable ? JSON.parse(created.colorsAvailable) : null,
        additionalTargetAudience: created.additionalTargetAudience,
        shippingOption: created.shippingOption,
        etaDomestic: created.etaDomestic as any,
        etaInternational: created.etaInternational as any,
        refundPolicy: created.refundPolicy ?? null,
        localPricing: created.localPricing ?? null,
        itemsJson: created.itemsJson ? JSON.parse(created.itemsJson) : null,
        productId: created.productId,
        sku: created.sku || undefined,
        slug: created.slug || undefined,
        metaDescription: created.metaDescription || undefined,
        barcode: created.barcode || undefined,
        videoUrl: created.videoUrl || undefined,
        careInstructions: created.careInstructions || undefined,
        createdAt: created.createdAt instanceof Date ? created.createdAt : new Date(created.createdAt),
        updatedAt: created.updatedAt instanceof Date ? created.updatedAt : new Date(created.updatedAt),
      };
    }),

  // ---- CREATE COLLECTION ----
  createCollection: protectedProcedure
  .meta({
    openapi: {
      method: "POST",
      path: "/listing/create-collection",
      tags: ["Listing"],
      summary: "Create a collection with multiple products",
    },
  })
  .input(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      items: z.array(CollectionItemInput).nonempty(),
    })
  )
  .output(ListingOutput)
  .mutation(async ({ ctx, input }) => {
    // --- Fetch seller and brand ---
    const seller = await fetchSeller(ctx);

    // Get or create brand for seller
    const existingBrands = await db.select().from(brands).where(eq(brands.sellerId, seller.id));
    let brandId: string;
    if (existingBrands.length > 0) {
      brandId = existingBrands[0].id;
    } else {
      const defaultBrandName = "Default Store";
      const newBrand = await db.insert(brands).values({
        sellerId: seller.id,
        name: defaultBrandName,
        slug: defaultBrandName.toLowerCase().replace(/\s+/g, "-"),
      }).returning({ id: brands.id });
      brandId = newBrand[0].id;
    }

    // --- Create the collection ---
    const collectionId = uuidv4();
    const now = new Date();
    await db.insert(collections).values({
      id: collectionId,
      brandId: brandId,
      name: input.title,
      slug: input.title.toLowerCase().replace(/\s+/g, "-"),
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // --- Create all products for this collection ---
    const productIds: string[] = [];
    for (const [index, item] of input.items.entries()) {
      const productId = uuidv4();
      productIds.push(productId);

      await db.insert(products).values({
        brandId: brandId,
        collectionId: collectionId,
        name: item.title,
        slug: item.title.toLowerCase().replace(/\s+/g, "-"),
        ...(item.description && { description: item.description }),
        ...(item.category && { category: item.category }),
        price: ((item.priceCents ?? 0) / 100).toFixed(2),
        currency: item.currency ?? "SOL",
        type: "collection",
        sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        inStock: true,
      });
    }

    const result = await db.insert(listings).values({
      sellerId: seller.id,
      type: "collection",
      title: input.title,
      description: input.description ?? null,
      itemsJson: JSON.stringify(productIds),
      productId: null,
    }).returning();

    const createdListing = result[0];
    if (!createdListing) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create listing' });
    const listingId = createdListing.id;

    // Helper to reverse-map shipping eta from DB values to full enum
    const unmapShippingEta = (value: string | null): string | null => {
      if (!value) return null;
      const map: { [key: string]: string } = {
        "48hrs": "48hrs",
        "72hrs": "72hrs",
        "5_working_days": "5_working_days",
        "1week": "1_2_weeks",
      };
      return map[value] || "custom";
    };

    return {
      id: createdListing.id,
      sellerId: createdListing.sellerId,
      type: createdListing.type,
      title: createdListing.title,
      description: createdListing.description,
      category: createdListing.category,
      image: createdListing.image,
      imagesJson: createdListing.imagesJson,
      priceCents: createdListing.priceCents,
      currency: createdListing.currency,
      sizesJson: createdListing.sizesJson ? JSON.parse(createdListing.sizesJson) : null,
      supplyCapacity: createdListing.supplyCapacity,
      quantityAvailable: createdListing.quantityAvailable,
      limitedEditionBadge: createdListing.limitedEditionBadge,
      releaseDuration: createdListing.releaseDuration as ReleaseDurationType | null,
      materialComposition: createdListing.materialComposition,
      colorsAvailable: createdListing.colorsAvailable ? JSON.parse(createdListing.colorsAvailable) : null,
      additionalTargetAudience: createdListing.additionalTargetAudience,
      shippingOption: createdListing.shippingOption,
      etaDomestic: unmapShippingEta(createdListing.etaDomestic) as any,
      etaInternational: unmapShippingEta(createdListing.etaInternational) as any,
      refundPolicy: createdListing.refundPolicy,
      localPricing: createdListing.localPricing,
      itemsJson: createdListing.itemsJson ? JSON.parse(createdListing.itemsJson) : null,
      productId: createdListing.productId ?? undefined,
      createdAt: new Date(createdListing.createdAt),
      updatedAt: new Date(createdListing.updatedAt),
    };
  }),

  // ---- GET MY LISTINGS ----
  getMyListings: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/listing/my-listings",
        tags: ["Listing"],
        summary: "Fetch all listings belonging to the current seller",
      },
    })
    .output(z.array(ListingOutput))
    .query(async ({ ctx }) => {
      const seller = await fetchSeller(ctx);
      const myListings = await db.select().from(listings).where(eq(listings.sellerId, seller.id));

      return myListings.map((l) => ({
        id: l.id,
        sellerId: l.sellerId,
        type: l.type as "single" | "collection",
        title: l.title,
        description: l.description,
        category: l.category,
        image: l.image,
        imagesJson: l.imagesJson,
        priceCents: l.priceCents,
        currency: l.currency,
        sizesJson: l.sizesJson ? JSON.parse(l.sizesJson) : null,
        supplyCapacity: l.supplyCapacity,
        quantityAvailable: l.quantityAvailable,
        limitedEditionBadge: l.limitedEditionBadge,
        releaseDuration: l.releaseDuration as any,
        materialComposition: l.materialComposition,
        colorsAvailable: l.colorsAvailable ? JSON.parse(l.colorsAvailable) : null,
        additionalTargetAudience: l.additionalTargetAudience,
        shippingOption: l.shippingOption,
        etaDomestic: l.etaDomestic as any,
        etaInternational: l.etaInternational as any,
        refundPolicy: l.refundPolicy,
        localPricing: l.localPricing,
        itemsJson: l.itemsJson ? JSON.parse(l.itemsJson) : null,
        productId: l.productId ?? undefined,
        sku: l.sku || undefined,
        slug: l.slug || undefined,
        metaDescription: l.metaDescription || undefined,
        barcode: l.barcode || undefined,
        videoUrl: l.videoUrl || undefined,
        careInstructions: l.careInstructions || undefined,
        createdAt: new Date(l.createdAt),
        updatedAt: new Date(l.updatedAt),
      }));
    }),

  // ---- RESTOCK ----
  restockListing: protectedProcedure
    .input(z.object({ id: z.string().uuid(), quantityAvailable: z.number().int().nonnegative() }))
    .output(RestockOutput)
    .mutation(async ({ ctx, input }) => {
      const seller = await fetchSeller(ctx);
      await db.update(listings).set({ quantityAvailable: input.quantityAvailable }).where(
        and(eq(listings.id, input.id), eq(listings.sellerId, seller.id))
      );
      const updated = (await db.select().from(listings).where(eq(listings.id, input.id)))[0];
      return {
        id: updated.id,
        quantityAvailable: updated.quantityAvailable,
        status: computeStockStatus(updated.supplyCapacity as any, updated.quantityAvailable ?? null),
      };
    }),

  // ---- ADD IMAGE TO PRODUCT ----
  addImage: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/product/add-image",
        tags: ["Product"],
        summary: "Add an image to an existing product",
      },
    })
    .input(z.object({
      productId: z.string().uuid(),
      imageUrl: z.string(),
      position: z.number().int().nonnegative(),
    }))
    .output(z.object({
      success: z.boolean(),
      imageId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const seller = await fetchSeller(ctx);
      
      // Verify seller owns the product
      const productListings = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.productId, input.productId),
            eq(listings.sellerId, seller.id)
          )
        );
      
      if (!productListings.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to add images to this product",
        });
      }
      
      const result = await db
        .insert(productImages)
        .values({
          productId: input.productId,
          imageUrl: input.imageUrl,
          position: input.position,
        })
        .returning({ id: productImages.id });
      
      return {
        success: true,
        imageId: result[0].id,
      };
    }),

  // ---- UPDATE LISTING ----
  updateListing: protectedProcedure
    .meta({
      openapi: {
        method: "PUT",
        path: "/listing/update",
        tags: ["Listing"],
        summary: "Update an existing listing",
      },
    })
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).optional(),
      description: z.string().nullable().optional(),
      category: CategoryEnum.nullable().optional(),
      image: z.string().nullable().optional(),
      images: z.array(z.string()).optional(),
      imagesJson: z.string().nullable().optional(),
      priceCents: z.number().int().nullable().optional(),
      currency: z.string().nullable().optional(),
      sizes: z.array(z.string()).optional(),
      supplyCapacity: SupplyCapacityEnum.nullable().optional(),
      quantityAvailable: z.number().int().nullable().optional(),
      limitedEditionBadge: LimitedBadgeEnum.nullable().optional(),
      releaseDuration: ReleaseDurationEnum.nullable().optional(),
      materialComposition: z.string().nullable().optional(),
      colorsAvailable: z.array(z.string()).nullable().optional(),
      additionalTargetAudience: TargetAudienceEnum.nullable().optional(),
      shippingOption: ShippingOptionEnum.nullable().optional(),
      etaDomestic: ShippingEtaEnum.nullable().optional(),
      etaInternational: ShippingEtaEnum.nullable().optional(),
    }))
    .output(ListingOutput)
    .mutation(async ({ ctx, input }) => {
      const seller = await fetchSeller(ctx);
      
      // Verify seller owns the listing
      const existingListing = await db
        .select()
        .from(listings)
        .where(and(eq(listings.id, input.id), eq(listings.sellerId, seller.id)));
      
      if (!existingListing.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this listing",
        });
      }
      
      const listing = existingListing[0];
      
      // Update listing
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.image !== undefined) updateData.image = input.image;
      if (input.imagesJson !== undefined) updateData.imagesJson = input.imagesJson;
      if (input.priceCents !== undefined) updateData.priceCents = input.priceCents;
      if (input.currency !== undefined) updateData.currency = input.currency;
      if (input.sizes !== undefined) updateData.sizesJson = input.sizes ? JSON.stringify(input.sizes) : null;
      if (input.supplyCapacity !== undefined) updateData.supplyCapacity = input.supplyCapacity;
      if (input.quantityAvailable !== undefined) updateData.quantityAvailable = input.quantityAvailable;
      if (input.limitedEditionBadge !== undefined) updateData.limitedEditionBadge = input.limitedEditionBadge;
      if (input.releaseDuration !== undefined) updateData.releaseDuration = input.releaseDuration;
      if (input.materialComposition !== undefined) updateData.materialComposition = input.materialComposition;
      if (input.colorsAvailable !== undefined) updateData.colorsAvailable = input.colorsAvailable ? JSON.stringify(input.colorsAvailable) : null;
      if (input.additionalTargetAudience !== undefined) updateData.additionalTargetAudience = input.additionalTargetAudience;
      if (input.shippingOption !== undefined) updateData.shippingOption = input.shippingOption;
      if (input.etaDomestic !== undefined) updateData.etaDomestic = input.etaDomestic ? mapShippingEta(input.etaDomestic) : null;
      if (input.etaInternational !== undefined) updateData.etaInternational = input.etaInternational ? mapShippingEta(input.etaInternational) : null;
      
      await db.update(listings).set(updateData).where(eq(listings.id, input.id));
      
      // Handle new images if provided
      if (input.images && input.images.length > 0 && listing.productId) {
        const imageValues = input.images.map((imageUrl, index) => ({
          productId: listing.productId!,
          imageUrl,
          position: index,
        }));
        await db.insert(productImages).values(imageValues);
      }
      
      // Fetch updated listing
      const updated = (await db.select().from(listings).where(eq(listings.id, input.id)))[0];
      
      return {
        id: updated.id,
        sellerId: updated.sellerId,
        type: updated.type,
        title: updated.title,
        description: updated.description,
        category: updated.category,
        image: updated.image,
        imagesJson: updated.imagesJson,
        priceCents: updated.priceCents,
        currency: updated.currency,
        sizesJson: updated.sizesJson ? JSON.parse(updated.sizesJson) : null,
        supplyCapacity: updated.supplyCapacity,
        quantityAvailable: updated.quantityAvailable,
        limitedEditionBadge: updated.limitedEditionBadge,
        releaseDuration: updated.releaseDuration as ReleaseDurationType | null,
        materialComposition: updated.materialComposition,
        colorsAvailable: updated.colorsAvailable ? JSON.parse(updated.colorsAvailable) : null,
        additionalTargetAudience: updated.additionalTargetAudience,
        shippingOption: updated.shippingOption,
        etaDomestic: updated.etaDomestic as any,
        etaInternational: updated.etaInternational as any,
        refundPolicy: updated.refundPolicy ?? null,
        localPricing: updated.localPricing ?? null,
        itemsJson: updated.itemsJson ? JSON.parse(updated.itemsJson) : null,
        productId: updated.productId ?? undefined,
        sku: updated.sku || undefined,
        slug: updated.slug || undefined,
        metaDescription: updated.metaDescription || undefined,
        barcode: updated.barcode || undefined,
        videoUrl: updated.videoUrl || undefined,
        careInstructions: updated.careInstructions || undefined,
        createdAt: new Date(updated.createdAt),
        updatedAt: new Date(updated.updatedAt),
      };
    }),

  // ---- DELETE ----
  deleteListing: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(DeleteOutput)
    .mutation(async ({ ctx, input }) => {
      const seller = await fetchSeller(ctx);
      await db.delete(listings).where(and(eq(listings.id, input.id), eq(listings.sellerId, seller.id)));
      return { success: true };
    }),

  getApprovedListings: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/listing/approved",
        tags: ["Listing"],
        summary: "Fetch all approved listings visible to buyers",
      },
    })
    .input(z.object({
      type: z.enum(["single", "collection"]).optional(),
      category: CategoryEnum.optional(),
    }).optional())
    .output(z.array(ListingOutput))
    .query(async ({ input }) => {
      const conditions = [eq(listings.status, "approved")];
      
      if (input?.type) {
        conditions.push(eq(listings.type, input.type));
      }
      
      if (input?.category) {
        conditions.push(eq(listings.category, input.category));
      }
      
      const approvedListings = await db
        .select()
        .from(listings)
        .where(and(...conditions));

      return approvedListings.map((l) => ({
        id: l.id,
        sellerId: l.sellerId,
        type: l.type as "single" | "collection",
        title: l.title,
        description: l.description,
        category: l.category,
        image: l.image,
        imagesJson: l.imagesJson,
        priceCents: l.priceCents,
        currency: l.currency,
        sizesJson: l.sizesJson ? JSON.parse(l.sizesJson) : null,
        supplyCapacity: l.supplyCapacity,
        quantityAvailable: l.quantityAvailable,
        limitedEditionBadge: l.limitedEditionBadge,
        releaseDuration: l.releaseDuration as any,
        materialComposition: l.materialComposition,
        colorsAvailable: l.colorsAvailable ? JSON.parse(l.colorsAvailable) : null,
        additionalTargetAudience: l.additionalTargetAudience,
        shippingOption: l.shippingOption,
        etaDomestic: l.etaDomestic as any,
        etaInternational: l.etaInternational as any,
        refundPolicy: l.refundPolicy,
        localPricing: l.localPricing,
        itemsJson: l.itemsJson ? JSON.parse(l.itemsJson) : null,
        productId: l.productId ?? undefined,
        sku: l.sku || undefined,
        slug: l.slug || undefined,
        metaDescription: l.metaDescription || undefined,
        barcode: l.barcode || undefined,
        videoUrl: l.videoUrl || undefined,
        careInstructions: l.careInstructions || undefined,
        createdAt: new Date(l.createdAt),
        updatedAt: new Date(l.updatedAt),
      }));
    }),
});