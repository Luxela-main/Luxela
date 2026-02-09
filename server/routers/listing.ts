import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc/trpc";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { listings, sellers, brands, collections, products, productImages, collectionItems, listingReviews } from "../db/schema";
import { and, eq, sql, inArray, asc } from "drizzle-orm";
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
  collectionId: z.string().uuid().nullable().optional(),
});

const CollectionItemInput = z.object({
  title: z.string(),
  priceCents: z.number().int().nonnegative().default(0),
  currency: z.string(),
  description: z.string().optional(),
  category: CategoryEnum.optional(),
  images: z.array(z.string()).optional(),
});

// ---------- HELPERS ----------
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
  
  let seller = getCachedSeller(userId);
  if (!seller) {
    const sellerRows = await db.select().from(sellers).where(eq(sellers.userId, userId));
    if (!sellerRows?.length) throw new TRPCError({ code: "FORBIDDEN", message: "Seller not found" });
    seller = sellerRows[0];
    setCachedSeller(userId, seller);
  }
  return seller;
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
      
      // Set default quantity to 1000 if not limited and not provided
      const quantity = input.quantityAvailable ?? (input.supplyCapacity === "limited" ? 0 : 1000);

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

      // Get or create default collection for brand
      let collectionId = input.collectionId;
      if (!collectionId) {
        try {
          const existingCollections = await db.select().from(collections).where(eq(collections.brandId, brandId)).limit(1);
          if (existingCollections.length > 0) {
            collectionId = existingCollections[0].id;
          } else {
            const defaultCollection = await db.insert(collections).values({
              brandId: brandId,
              name: "All Products",
              slug: "all-products",
            }).returning({ id: collections.id });
            collectionId = defaultCollection[0].id;
          }
        } catch (error) {
          console.warn('Failed to create default collection, continuing without one:', error);
          collectionId = null;
        }
      }

      const productId = input.productId ?? uuidv4();
      
      // Generate base slug from title
      let baseSlug = input.title.toLowerCase().replace(/\s+/g, "-").substring(0, 50);
      
      // Check if slug already exists for this brand and make it unique if needed
      let slug = baseSlug;
      let slugExists: any[] = [];
      try {
        slugExists = await db.select().from(products).where(
          and(eq(products.brandId, brandId), eq(products.slug, slug))
        );
      } catch (error) {
        console.warn('Slug check failed, proceeding with base slug:', error);
      }
      
      let counter = 1;
      while (slugExists && slugExists.length > 0) {
        slug = `${baseSlug}-${counter}`;
        try {
          slugExists = await db.select().from(products).where(
            and(eq(products.brandId, brandId), eq(products.slug, slug))
          );
        } catch (error) {
          console.warn(`Slug check failed for ${slug}, trying next counter:`, error);
          counter++;
          continue;
        }
        counter++;
      }
      
      // Build product values object with only fields that have values
      const productValues: any = {
        brandId: brandId,
        collectionId: collectionId,
        name: input.title,
        slug: slug,
        priceCents: input.priceCents ?? 0,
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
      
      let productInserted;
      try {
        productInserted = await db.insert(products).values(productValues).returning({ id: products.id });
      } catch (error: any) {
        console.error('Product insert error:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: `Database error: ${error.message}`,
          cause: error
        });
      }

      const listingValues = {
        sellerId: seller.id,
        productId: productInserted[0].id,
        collectionId: input.collectionId ?? null,
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
        quantityAvailable: quantity,
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

      // Create a corresponding listing review entry for admin review dashboard
      await db.insert(listingReviews).values({
        listingId: listingInserted[0].id,
        sellerId: seller.id,
        status: 'pending',
      });

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
      // Shipping and supply fields
      supplyCapacity: SupplyCapacityEnum.optional(),
      shippingOption: ShippingOptionEnum.optional(),
      etaDomestic: ShippingEtaEnum.optional(),
      etaInternational: ShippingEtaEnum.optional(),
      refundPolicy: z.enum(['no_refunds', '48hrs', '72hrs', '5_working_days', '1week', '14days', '30days', '60days', 'store_credit']).optional(),
      // Enterprise fields
      sku: z.string().optional().transform(val => val === '' ? undefined : val),
      slug: z.string().optional(),
      metaDescription: z.string().optional().transform(val => val === '' ? undefined : val),
      barcode: z.string().optional().transform(val => val === '' ? undefined : val),
      videoUrl: z.string().optional().transform(val => val === '' ? undefined : val),
      careInstructions: z.string().optional().transform(val => val === '' ? undefined : val),
    })
  )
  .output(ListingOutput)
  .mutation(async ({ ctx, input }) => {
    try {
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
        slug: 'default-store', // Will be updated to include ID after insert
      }).returning({ id: brands.id });
      brandId = newBrand[0].id;
      
      // Update slug to include brand ID for uniqueness
      const uniqueSlug = `default-store-${brandId.substring(0, 8)}`;
      await db.update(brands).set({ slug: uniqueSlug }).where(eq(brands.id, brandId));
    }

    // --- Create the collection ---
    const collectionId = uuidv4();
    const now = new Date();
    
    // Generate slug: use input slug if provided and non-empty, otherwise generate from title
    let collectionSlug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    // If slug is still empty after generation, use timestamp fallback
    if (!collectionSlug || collectionSlug.trim() === "") {
      collectionSlug = `collection-${Date.now()}`;
    }
    
    // Check for slug uniqueness within the brand and append numeric suffix if needed
    let uniqueSlug = collectionSlug;
    let slugCounter = 1;
    let slugExists = true;
    const maxAttempts = 100;
    let attempts = 0;
    
    while (slugExists && attempts < maxAttempts) {
      try {
        const existingCollection = await db
          .select({ id: collections.id })
          .from(collections)
          .where(
            and(
              eq(collections.brandId, brandId),
              eq(collections.slug, uniqueSlug)
            )
          )
          .limit(1);
        
        if (existingCollection.length === 0) {
          slugExists = false;
        } else {
          uniqueSlug = `${collectionSlug}-${slugCounter}`;
          slugCounter++;
        }
      } catch (error) {
        console.error('Error checking slug uniqueness:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check collection slug uniqueness'
        });
      }
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not generate unique collection slug'
      });
    }
    
    // Sanitize slug to ensure it's safe for database
    if (!uniqueSlug || typeof uniqueSlug !== 'string' || uniqueSlug.length === 0) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Invalid collection slug generated'
      });
    }
    
    let result: any;
    try {
      await db.insert(collections).values({
        id: collectionId,
        brandId: brandId,
        name: input.title,
        slug: uniqueSlug,
        description: input.description,
        createdAt: now,
        updatedAt: now,
      });

    // --- Create all products for this collection ---
    const productIds: string[] = [];
    const collectionItemsToInsert: any[] = [];
    
    for (const [index, item] of input.items.entries()) {
      const productId = uuidv4();
      productIds.push(productId);

      // Generate slug with proper special character handling
      const productSlug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Generate unique SKU using UUID
      const uniqueSku = `SKU-${uuidv4().slice(0, 8).toUpperCase()}`;

      // Insert product into database - DO NOT set type to 'collection'
      const productInserted = await db.insert(products).values({
        id: productId,
        brandId: brandId,
        collectionId: collectionId,
        name: item.title,
        slug: productSlug,
        description: item.description ?? null,
        category: item.category ?? null,
        priceCents: item.priceCents,
        currency: item.currency ?? "SOL",
        sku: uniqueSku,
        inStock: true,
      }).returning({ id: products.id });
      
      if (!productInserted[0]?.id) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create product for collection item: ${item.title}`
        });
      }

      // Add to collection items to be inserted later
      collectionItemsToInsert.push({
        id: uuidv4(),
        collectionId: collectionId,
        productId: productId,
        position: index,
      });

      // Insert product images if provided
      if (item.images && item.images.length > 0) {
        const imageValues = item.images.map((imageUrl, imgIndex) => ({
          id: uuidv4(),
          productId: productId,
          imageUrl,
          position: imgIndex,
        }));
        await db.insert(productImages).values(imageValues);
      }
    }

    // Insert collection items into junction table for proper relational structure
    if (collectionItemsToInsert.length > 0) {
      await db.insert(collectionItems).values(collectionItemsToInsert);
    }

    // Create individual listings for each product so they're cartable
    const listingsToInsert: any[] = [];
    for (const [index, item] of input.items.entries()) {
      const productId = productIds[index];
      
      // Generate listing slug
      const listingSlug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      listingsToInsert.push({
        id: uuidv4(),
        productId: productId,
        collectionId: collectionId,
        sellerId: seller.id,
        type: "single",
        title: item.title,
        description: item.description ?? null,
        category: item.category ?? null,
        priceCents: item.priceCents,
        currency: item.currency ?? "SOL",
        supplyCapacity: input.supplyCapacity ?? "no_max",
        quantityAvailable: 1,
        shippingOption: input.shippingOption ?? "both",
        etaDomestic: input.etaDomestic ?? null,
        etaInternational: input.etaInternational ?? null,
        refundPolicy: input.refundPolicy ?? null,
        slug: listingSlug,
        status: "pending_review",
      });
    }

    if (listingsToInsert.length > 0) {
      await db.insert(listings).values(listingsToInsert);
    }

    // Get the first product's image for the collection thumbnail
    let collectionMainImage: string | null = null;
    if (productIds.length > 0) {
      try {
        const firstProductImages = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, productIds[0]))
          .orderBy(productImages.position)
          .limit(1);
        
        if (firstProductImages.length > 0) {
          collectionMainImage = firstProductImages[0].imageUrl;
        }
      } catch (imageError) {
        console.warn('Error fetching first product image for collection:', imageError);
      }
    }

    // Create the collection overview listing
    result = await db.insert(listings).values({
      collectionId: collectionId,
      sellerId: seller.id,
      type: "collection",
      title: input.title,
      description: input.description ?? null,
      image: collectionMainImage,
      itemsJson: null,
      productId: null,
      quantityAvailable: input.items.length,
      status: "pending_review",
      }).returning();
    
    // Create a corresponding listing review entry for admin review dashboard
    if (result[0]) {
      await db.insert(listingReviews).values({
        listingId: result[0].id,
        sellerId: seller.id,
        status: 'pending',
      });
    }
    } catch (dbError) {
      console.error('Database error inserting collection:', dbError);
      if (dbError instanceof Error) {
        console.error('Error details:', dbError.message);
        console.error('Stack:', dbError.stack);
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to create collection: ${dbError instanceof Error ? dbError.message : String(dbError)}`
      });
    }

    const createdListing = result[0];
    if (!createdListing) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create listing' });

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
      sku: createdListing.sku || undefined,
      slug: createdListing.slug || undefined,
      metaDescription: createdListing.metaDescription || undefined,
      barcode: createdListing.barcode || undefined,
      videoUrl: createdListing.videoUrl || undefined,
      careInstructions: createdListing.careInstructions || undefined,
      createdAt: new Date(createdListing.createdAt),
      updatedAt: new Date(createdListing.updatedAt),
    };
  } catch (error) {
    console.error('Error in createCollection mutation:', error);
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to create collection'
    });
  }
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

      // Batch fetch all product images and collection data upfront to avoid N+1 queries
      const singleListingProductIds = myListings
        .filter(l => l.type === 'single' && l.productId)
        .map(l => l.productId);
      
      const collectionListingIds = myListings
        .filter(l => l.type === 'collection' && l.collectionId)
        .map(l => l.collectionId);
      
      const productImagesByProductId: Record<string, typeof productImages.$inferSelect[]> = {};
      const collectionItemsByCollectionId: Record<string, typeof collectionItems.$inferSelect[]> = {};
      const productsById: Record<string, typeof products.$inferSelect> = {};
      
      // Fetch all product images for single listings in one query
      if (singleListingProductIds.length > 0) {
        const allProductImages = await db
          .select()
          .from(productImages)
          .where(inArray(productImages.productId, singleListingProductIds as string[]));
        
        allProductImages.forEach(img => {
          if (!productImagesByProductId[img.productId]) {
            productImagesByProductId[img.productId] = [];
          }
          productImagesByProductId[img.productId].push(img);
        });
      }
      
      // Fetch all collection items in one query
      if (collectionListingIds.length > 0) {
        const allCollectionItems = await db
          .select()
          .from(collectionItems)
          .where(inArray(collectionItems.collectionId, collectionListingIds as string[]));
        
        allCollectionItems.forEach(item => {
          if (!collectionItemsByCollectionId[item.collectionId]) {
            collectionItemsByCollectionId[item.collectionId] = [];
          }
          collectionItemsByCollectionId[item.collectionId].push(item);
        });
        
        // Fetch all unique product IDs from collection items
        const collectionProductIds = [...new Set(allCollectionItems.map(item => item.productId))];
        if (collectionProductIds.length > 0) {
          const collectionProducts = await db
            .select()
            .from(products)
            .where(inArray(products.id, collectionProductIds as string[]));
          
          collectionProducts.forEach(p => {
            productsById[p.id] = p;
          });
          
          // Fetch all product images for collection products in one query
          const collectionProductImages = await db
            .select()
            .from(productImages)
            .where(inArray(productImages.productId, collectionProductIds as string[]));
          
          collectionProductImages.forEach(img => {
            if (!productImagesByProductId[img.productId]) {
              productImagesByProductId[img.productId] = [];
            }
            productImagesByProductId[img.productId].push(img);
          });
        }
      }
      
      return Promise.all(myListings.map(async (l) => {
        try {
          const result: any = {
            id: l.id,
            sellerId: l.sellerId,
            type: l.type as "single" | "collection",
            title: l.title,
            description: l.description,
            category: l.category,
            image: l.image,
            imagesJson: l.imagesJson || null,
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
            itemsJson: null,
            productId: l.productId ?? undefined,
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          };
          
          // Only include optional enterprise fields if they exist
          if (l.sku) result.sku = l.sku;
          if (l.slug) result.slug = l.slug;
          if (l.metaDescription) result.metaDescription = l.metaDescription;
          if (l.barcode) result.barcode = l.barcode;
          if (l.videoUrl) result.videoUrl = l.videoUrl;
          if (l.careInstructions) result.careInstructions = l.careInstructions;
          
          // For single listings, fetch product images from database
          if (l.type === 'single' && l.productId) {
            try {
              const productImagesList = await db
                .select()
                .from(productImages)
                .where(eq(productImages.productId, l.productId))
                .orderBy(productImages.position);
              
              if (productImagesList.length > 0) {
                // Build imagesJson array from product images
                result.imagesJson = JSON.stringify(productImagesList.map((img) => ({
                  url: img.imageUrl,
                })));
                
                // If no main image, use the first product image
                if (!result.image) {
                  result.image = productImagesList[0].imageUrl;
                }
              }
            } catch (singleError) {
              console.error('Error fetching images for single listing:', l.id, singleError);
            }
          }
          // For collection listings, fetch real product data from database with images
          else if (l.type === 'collection' && l.collectionId) {
            try {
              const items = await db
                .select()
                .from(collectionItems)
                .where(eq(collectionItems.collectionId, l.collectionId))
                .orderBy(collectionItems.position);
              
              if (items.length > 0) {
                const productIds = items.map((item) => item.productId);
                const productsData = await db
                  .select()
                  .from(products)
                  .where(inArray(products.id, productIds));
                
                // Fetch images for all products
                const allImages = await db
                  .select()
                  .from(productImages)
                  .where(inArray(productImages.productId, productIds));
                
                // Build collection items with real data including all images and extended metadata
                result.itemsJson = items.map((item) => {
                  const product = productsData.find((p) => p.id === item.productId);
                  const productImageList = allImages.filter((img) => img.productId === item.productId);
                  
                  return {
                    id: item.productId,
                    title: product?.name || '',
                    priceCents: product?.priceCents || 0,
                    currency: product?.currency || l.currency || 'NGN',
                    image: productImageList[0]?.imageUrl || null,
                    images: productImageList.map((img) => img.imageUrl),
                    imagesJson: productImageList.length > 0 ? JSON.stringify(productImageList.map((img) => ({ url: img.imageUrl }))) : null,
                    quantityAvailable: product?.inStock ? 1 : 0,
                    sku: product?.sku || null,
                    description: product?.description || null,
                    category: product?.category || null,
                  };
                });
                
                // If collection listing doesn't have a main image, set it from the first product
                if (!result.image && result.itemsJson.length > 0) {
                  result.image = result.itemsJson[0].image;
                }
              }
            } catch (collectionError) {
              console.error('Error fetching collection items for listing:', l.id, collectionError);
              result.itemsJson = [];
            }
          } else if (l.itemsJson) {
            result.itemsJson = typeof l.itemsJson === 'string' ? JSON.parse(l.itemsJson) : l.itemsJson;
          }
          
          return result;
        } catch (parseError) {
          console.error('Error parsing listing:', l.id, parseError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to parse listing data for ${l.id}`,
            cause: parseError
          });
        }
      }));
    }),

  // ---- GET MY COLLECTIONS ----
  getMyCollections: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/listing/my-collections",
        tags: ["Listing"],
        summary: "Fetch all collections belonging to the current seller",
      },
    })
    .output(z.array(ListingOutput))
    .query(async ({ ctx }) => {
      const seller = await fetchSeller(ctx);
      
      // Get all collection type listings for this seller
      const collectionListings = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.sellerId, seller.id),
            eq(listings.type, 'collection')
          )
        );

      return await Promise.all(collectionListings.map(async (l) => {
        try {
          const result: any = {
            id: l.id,
            sellerId: l.sellerId,
            type: l.type as "single" | "collection",
            title: l.title,
            description: l.description,
            category: l.category,
            image: l.image,
            imagesJson: l.imagesJson || null,
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
            itemsJson: null,
            productId: l.productId ?? undefined,
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          };
          
          // Only include optional enterprise fields if they exist
          if (l.sku) result.sku = l.sku;
          if (l.slug) result.slug = l.slug;
          if (l.metaDescription) result.metaDescription = l.metaDescription;
          if (l.barcode) result.barcode = l.barcode;
          if (l.videoUrl) result.videoUrl = l.videoUrl;
          if (l.careInstructions) result.careInstructions = l.careInstructions;
          
          // Fetch collection items with real product data
          if (l.collectionId) {
            try {
              const items = await db
                .select()
                .from(collectionItems)
                .where(eq(collectionItems.collectionId, l.collectionId))
                .orderBy(collectionItems.position);
              
              if (items.length > 0) {
                const productIds = items.map((item) => item.productId);
                const productsData = await db
                  .select()
                  .from(products)
                  .where(inArray(products.id, productIds));
                
                // Fetch images for all products
                const allImages = await db
                  .select()
                  .from(productImages)
                  .where(inArray(productImages.productId, productIds));
                
                // Build collection items with real data including all images and extended metadata
                result.itemsJson = items.map((item) => {
                  const product = productsData.find((p) => p.id === item.productId);
                  const productImageList = allImages.filter((img) => img.productId === item.productId);
                  
                  return {
                    id: item.productId,
                    title: product?.name || '',
                    priceCents: product?.priceCents || 0,
                    currency: product?.currency || l.currency || 'NGN',
                    image: productImageList[0]?.imageUrl || null,
                    images: productImageList.map((img) => img.imageUrl),
                    imagesJson: productImageList.length > 0 ? JSON.stringify(productImageList.map((img) => ({ url: img.imageUrl }))) : null,
                    quantityAvailable: product?.inStock ? 1 : 0,
                    sku: product?.sku || null,
                    description: product?.description || null,
                    category: product?.category || null,
                  };
                });
                
                // If collection listing doesn't have a main image, set it from the first product
                if (!result.image && result.itemsJson.length > 0) {
                  result.image = result.itemsJson[0].image;
                }
              } else {
                result.itemsJson = [];
              }
            } catch (collectionError) {
              console.error('Error fetching collection items for listing:', l.id, collectionError);
              result.itemsJson = [];
            }
          } else if (l.itemsJson) {
            result.itemsJson = typeof l.itemsJson === 'string' ? JSON.parse(l.itemsJson) : l.itemsJson;
          }
          
          return result;
        } catch (parseError) {
          console.error('Error parsing collection listing:', l.id, parseError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to parse collection listing data for ${l.id}`,
            cause: parseError
          });
        }
      }));
    }),

  // ---- GET ALL COLLECTIONS (Public) ----
  getAllCollections: publicProcedure
    .output(z.array(ListingOutput))
    .query(async () => {
      try {
        const collectionListings = await db
          .select()
          .from(listings)
          .where(
            and(
              eq(listings.type, 'collection'),
              eq(listings.status, 'approved')
            )
          );

        return await Promise.all(collectionListings.map(async (l) => {
          try {
            const result: any = {
              id: l.id,
              sellerId: l.sellerId,
              type: l.type as "single" | "collection",
              title: l.title,
              description: l.description,
              category: l.category,
              image: l.image,
              imagesJson: l.imagesJson || null,
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
              videoUrl: l.videoUrl,
              careInstructions: l.careInstructions,
              sku: l.sku,
              slug: l.slug,
              metaDescription: l.metaDescription,
              barcode: l.barcode,
              localPricing: l.localPricing,
              itemsJson: null,
              productId: l.productId ?? undefined,
              createdAt: new Date(l.createdAt),
              updatedAt: new Date(l.updatedAt),
            };
            
            if (l.collectionId) {
              try {
                const items = await db
                  .select()
                  .from(collectionItems)
                  .where(eq(collectionItems.collectionId, l.collectionId))
                  .orderBy(collectionItems.position);
                
                if (items.length > 0) {
                  const productIds = items.map((item) => item.productId);
                  const productsData = await db
                    .select()
                    .from(products)
                    .where(sql`${products.id} = ANY(ARRAY[${sql.join(productIds, sql`,`)}]::uuid[])`);
                  
                  const allImages = await db
                    .select()
                    .from(productImages)
                    .where(sql`${productImages.productId} = ANY(ARRAY[${sql.join(productIds, sql`,`)}]::uuid[])`);
                  
                  result.itemsJson = items.map((item) => {
                    const product = productsData.find((p) => p.id === item.productId);
                    const productImageList = allImages.filter((img) => img.productId === item.productId);
                    return {
                      id: item.productId,
                      title: product?.name || '',
                      priceCents: product?.priceCents || 0,
                      currency: product?.currency || l.currency || 'NGN',
                      image: productImageList[0]?.imageUrl || null,
                      images: productImageList.map((img) => img.imageUrl),
                      imagesJson: productImageList.length > 0 ? JSON.stringify(productImageList.map((img) => ({ url: img.imageUrl }))) : null,
                      quantityAvailable: product?.inStock ? 1 : 0,
                      sku: product?.sku || null,
                      description: product?.description || null,
                      category: product?.category || null,
                    };
                  });
                } else {
                  result.itemsJson = [];
                }
              } catch (collectionError) {
                console.error('Error fetching collection items:', l.id, collectionError);
                result.itemsJson = [];
              }
            } else if (l.itemsJson) {
              result.itemsJson = typeof l.itemsJson === 'string' ? JSON.parse(l.itemsJson) : l.itemsJson;
            }
            
            return result;
          } catch (parseError) {
            console.error('Error parsing collection:', l.id, parseError);
            return {
              id: l.id,
              sellerId: l.sellerId,
              type: l.type as "single" | "collection",
              title: l.title,
              description: l.description,
              category: l.category,
              image: l.image,
              imagesJson: null,
              priceCents: l.priceCents,
              currency: l.currency,
              sizesJson: null,
              supplyCapacity: l.supplyCapacity,
              quantityAvailable: l.quantityAvailable,
              limitedEditionBadge: l.limitedEditionBadge,
              releaseDuration: l.releaseDuration as any,
              materialComposition: l.materialComposition,
              colorsAvailable: null,
              additionalTargetAudience: l.additionalTargetAudience,
              shippingOption: l.shippingOption,
              etaDomestic: l.etaDomestic as any,
              etaInternational: l.etaInternational as any,
              refundPolicy: l.refundPolicy,
              localPricing: l.localPricing,
              itemsJson: [],
              productId: l.productId ?? undefined,
              createdAt: new Date(l.createdAt),
              updatedAt: new Date(l.updatedAt),
            };
          }
        }));
      } catch (error) {
        console.error('Error fetching collections:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch collections',
          cause: error
        });
      }
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

      // Get all product IDs for bulk image fetching
      const productIds = approvedListings
        .filter(l => l.productId)
        .map(l => l.productId) as string[];
      
      // Fetch all images for all products in one query
      let allProductImages: any[] = [];
      if (productIds.length > 0) {
        allProductImages = await db
          .select()
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
          .orderBy(productImages.position);
      }
      
      // Build map of images by product ID
      const imagesByProductId: Record<string, string[]> = {};
      allProductImages.forEach(img => {
        if (!imagesByProductId[img.productId]) {
          imagesByProductId[img.productId] = [];
        }
        imagesByProductId[img.productId].push(img.imageUrl);
      });

      // For collection listings, fetch all collection items and their images
      const collectionListingIds = approvedListings.filter(l => l.type === 'collection').map(l => l.id);
      let collectionItemsData: any[] = [];
      let collectionProductImages: any[] = [];
      
      if (collectionListingIds.length > 0) {
        collectionItemsData = await db
          .select()
          .from(collectionItems)
          .where(inArray(collectionItems.collectionId, 
            approvedListings
              .filter(l => l.type === 'collection' && l.collectionId)
              .map(l => l.collectionId) as string[]
          ));
        
        const collectionProductIds = collectionItemsData.map(ci => ci.productId);
        if (collectionProductIds.length > 0) {
          collectionProductImages = await db
            .select()
            .from(productImages)
            .where(inArray(productImages.productId, collectionProductIds))
            .orderBy(productImages.position);
          
          collectionProductImages.forEach(img => {
            if (!imagesByProductId[img.productId]) {
              imagesByProductId[img.productId] = [];
            }
            imagesByProductId[img.productId].push(img.imageUrl);
          });
        }
      }

      return approvedListings.map((l) => {
        try {
          // Fetch images for this listing
          let imagesJson = l.imagesJson || null;
          if (l.productId && imagesByProductId[l.productId]) {
            imagesJson = JSON.stringify(imagesByProductId[l.productId]);
          } else if (l.productId && !imagesByProductId[l.productId] && l.imagesJson) {
            // Fallback to parsing imagesJson if no product images
            try {
              const parsed = JSON.parse(l.imagesJson);
              imagesJson = JSON.stringify(parsed);
            } catch (e) {
              imagesJson = null;
            }
          }
          
          const result: any = {
            id: l.id,
            sellerId: l.sellerId,
            type: l.type as "single" | "collection",
            title: l.title,
            description: l.description,
            category: l.category,
            image: l.image,
            imagesJson,
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
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          };
          
          // Only include optional enterprise fields if they exist
          if (l.sku) result.sku = l.sku;
          if (l.slug) result.slug = l.slug;
          if (l.metaDescription) result.metaDescription = l.metaDescription;
          if (l.barcode) result.barcode = l.barcode;
          if (l.videoUrl) result.videoUrl = l.videoUrl;
          if (l.careInstructions) result.careInstructions = l.careInstructions;
          
          return result;
        } catch (parseError) {
          console.error('Error parsing approved listing:', l.id, parseError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to parse listing data for ${l.id}`,
            cause: parseError
          });
        }
      });
    }),
});