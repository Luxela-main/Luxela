import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc/trpc";
import { db } from "../db";
import { collections, collectionItems, products, productImages, listings, sellers } from "../db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Helper function to calculate total collection price from items
const calculateCollectionTotalPrice = async (collectionId: string): Promise<{ totalPrice: number; avgPrice: number }> => {
  try {
    const itemsWithListings = await db
      .select({
        priceCents: listings.priceCents,
      })
      .from(collectionItems)
      .innerJoin(products, eq(collectionItems.productId, products.id))
      .leftJoin(listings, eq(products.id, listings.productId))
      .where(eq(collectionItems.collectionId, collectionId));

    const totalPrice = itemsWithListings.reduce((sum, item) => sum + (item.priceCents || 0), 0);
    const avgPrice = itemsWithListings.length > 0 ? totalPrice / itemsWithListings.length : 0;
    
    return { totalPrice, avgPrice };
  } catch (error) {
    console.warn(`[calculateCollectionTotalPrice] Error calculating price for collection ${collectionId}:`, error);
    return { totalPrice: 0, avgPrice: 0 };
  }
};

export const collectionRouter = createTRPCRouter({
  getCollectionWithProducts: protectedProcedure
    .input(z.object({ collectionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const collection = await db
          .select()
          .from(collections)
          .where(eq(collections.id, input.collectionId))
          .limit(1);

        if (collection.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Collection not found",
          });
        }

        const items = await db
          .select()
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, input.collectionId));

        const productIds = items.map((item) => item.productId);
        const productsData =
          productIds.length > 0
            ? await db
                .select()
                .from(products)
                .where(
                  productIds.length === 1
                    ? eq(products.id, productIds[0])
                    : inArray(products.id, productIds)
                )
            : [];

        const images =
          productIds.length > 0
            ? await db
                .select()
                .from(productImages)
                .where(
                  productIds.length === 1
                    ? eq(productImages.productId, productIds[0])
                    : inArray(productImages.productId, productIds)
                )
            : [];

        const itemsWithProducts = items.map((item) => ({
          ...item,
          product: productsData.find((p) => p.id === item.productId),
          images: images.filter((img) => img.productId === item.productId),
        }));

        return {
          ...collection[0],
          items: itemsWithProducts,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch collection",
        });
      }
    }),

  addProductToCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().uuid(),
        productId: z.string().uuid(),
        position: z.number().int().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const collection = await db
          .select()
          .from(collections)
          .where(eq(collections.id, input.collectionId))
          .limit(1);

        if (collection.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Collection not found",
          });
        }

        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, input.productId))
          .limit(1);

        if (product.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        const existing = await db
          .select()
          .from(collectionItems)
          .where(
            and(
              eq(collectionItems.collectionId, input.collectionId),
              eq(collectionItems.productId, input.productId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Product already in collection",
          });
        }

        const newItem = await db
          .insert(collectionItems)
          .values({
            collectionId: input.collectionId,
            productId: input.productId,
            position: input.position,
          })
          .returning();

        return newItem[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add product to collection",
        });
      }
    }),

  removeProductFromCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().uuid(),
        productId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await db
          .delete(collectionItems)
          .where(
            and(
              eq(collectionItems.collectionId, input.collectionId),
              eq(collectionItems.productId, input.productId)
            )
          )
          .returning();

        if (result.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Collection item not found",
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove product from collection",
        });
      }
    }),

  reorderCollectionItems: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().uuid(),
        items: z.array(
          z.object({
            productId: z.string().uuid(),
            position: z.number().int(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        for (const item of input.items) {
          await db
            .update(collectionItems)
            .set({ position: item.position })
            .where(
              and(
                eq(collectionItems.collectionId, input.collectionId),
                eq(collectionItems.productId, item.productId)
              )
            );
        }

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reorder collection items",
        });
      }
    }),

  getCollectionItems: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().uuid(),
        limit: z.number().int().default(10),
        offset: z.number().int().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const items = await db
          .select()
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, input.collectionId))
          .limit(input.limit)
          .offset(input.offset);

        const productIds = items.map((item) => item.productId);
        const productsData =
          productIds.length > 0
            ? await db
                .select()
                .from(products)
                .where(
                  productIds.length === 1
                    ? eq(products.id, productIds[0])
                    : inArray(products.id, productIds)
                )
            : [];

        const images =
          productIds.length > 0
            ? await db
                .select()
                .from(productImages)
                .where(
                  productIds.length === 1
                    ? eq(productImages.productId, productIds[0])
                    : inArray(productImages.productId, productIds)
                )
                .orderBy(productImages.position)
            : [];

        return {
          items: items.map((item) => ({
            ...item,
            product: productsData.find((p) => p.id === item.productId),
            images: images.filter((img) => img.productId === item.productId),
          })),
          count: items.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch collection items",
        });
      }
    }),

  getProductWithImages: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, input.productId))
          .limit(1);

        if (product.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        const images = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, input.productId))
          .orderBy(productImages.position);

        return {
          ...product[0],
          images: images,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch product details",
        });
      }
    }),

  getBuyerCollectionWithProducts: publicProcedure
    .input(z.object({ collectionId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const collection = await db
          .select()
          .from(collections)
          .where(eq(collections.id, input.collectionId))
          .limit(1);

        if (collection.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Collection not found",
          });
        }

        const listing = await db
          .select()
          .from(listings)
          .where(and(
            eq(listings.collectionId, input.collectionId),
            inArray(listings.status, ["approved", "pending_review"])
          ))
          .limit(1);

        if (listing.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Collection listing not found",
          });
        }

        const items = await db
          .select()
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, input.collectionId));

        const productIds = items.map((item) => item.productId);
        const productsData =
          productIds.length > 0
            ? await db
                .select()
                .from(products)
                .where(
                  productIds.length === 1
                    ? eq(products.id, productIds[0])
                    : inArray(products.id, productIds)
                )
            : [];

        // Fetch listings for all products in the collection to get individual prices
        const productListings =
          productIds.length > 0
            ? await db
                .select()
                .from(listings)
                .where(
                  productIds.length === 1
                    ? and(
                        eq(listings.productId, productIds[0]),
                        inArray(listings.status, ["approved", "pending_review"])
                      )
                    : and(
                        inArray(listings.productId, productIds),
                        inArray(listings.status, ["approved", "pending_review"])
                      )
                )
            : [];

        const images =
          productIds.length > 0
            ? await db
                .select()
                .from(productImages)
                .where(
                  productIds.length === 1
                    ? eq(productImages.productId, productIds[0])
                    : inArray(productImages.productId, productIds)
                )
                .orderBy(productImages.position)
            : [];

        const itemsWithProducts = items.map((item) => {
          // Find the listing for this specific product
          const productListing = productListings.find(
            (l) => l.productId === item.productId
          );
          
          return {
            ...item,
            product: productsData.find((p) => p.id === item.productId),
            images: images.filter((img) => img.productId === item.productId),
            listing: productListing || listing[0], // Use product's own listing, fallback to collection listing
          };
        })

        return {
          ...collection[0],
          items: itemsWithProducts,
          listing: listing[0], // Include listing data with pricing and inventory
          isApproved: true,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch collection",
        });
      }
    }),

  getApprovedCollections: publicProcedure
    .input(
      z.object({
        limit: z.number().int().default(20),
        offset: z.number().int().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log('[getApprovedCollections] Starting query with input:', input);
        
        // Fetch approved collection listings with pagination
        const approvedListings = await db
          .select({
            id: listings.id,
            collectionId: listings.collectionId,
            title: listings.title,
            description: listings.description,
            image: listings.image,
            imagesJson: listings.imagesJson,
            priceCents: listings.priceCents,
            category: listings.category,
            sellerId: listings.sellerId,
            slug: listings.slug,
            createdAt: listings.createdAt,
            updatedAt: listings.updatedAt,
            shippingOption: listings.shippingOption,
            refundPolicy: listings.refundPolicy,
            quantityAvailable: listings.quantityAvailable,
          })
          .from(listings)
          .where(and(
            eq(listings.type, "collection"),
            eq(listings.status, "approved")
          ))
          .orderBy(listings.createdAt)
          .limit(input.limit)
          .offset(input.offset);
        
        console.log('[getApprovedCollections] Found approved collection listings:', approvedListings.length);

        if (approvedListings.length === 0) {
          console.log('[getApprovedCollections] No approved collection listings found, returning empty array');
          return {
            collections: [],
            total: 0,
          };
        }

        // Get total count for pagination
        const totalCount = await db
          .select()
          .from(listings)
          .where(and(
            eq(listings.type, "collection"),
            eq(listings.status, "approved")
          ));
        console.log('[getApprovedCollections] Total visible collections (approved):', totalCount.length);

        const enrichedCollections = await Promise.all(
          approvedListings.map(async (listing) => {
            try {
              console.log(`[getApprovedCollections] Processing listing: ${listing.id}, collectionId: ${listing.collectionId}`);
              
              if (!listing.collectionId) {
                console.warn(`[getApprovedCollections] WARNING: Listing ${listing.id} has NO collectionId! This collection will be empty.`);
              }
              
              // Get the actual collection details from collections table
              const collectionDetails = await db
                .select()
                .from(collections)
                .where(eq(collections.id, listing.collectionId!))
                .limit(1);
              
              console.log(`[getApprovedCollections] Collection details found:`, collectionDetails.length > 0);

              // Fetch ALL collection items with products, images, and listings (no limit)
              const collectionItemsWithProducts = await db
                .select({
                  itemId: collectionItems.id,
                  position: collectionItems.position,
                  productId: collectionItems.productId,
                  productName: products.name,
                  productSlug: products.slug,
                  productDescription: products.description,
                  productImage: productImages.imageUrl,
                  productImagePosition: productImages.position,
                  // Include full listing details for each item
                  listingId: listings.id,
                  listingTitle: listings.title,
                  listingDescription: listings.description,
                  listingPriceCents: listings.priceCents,
                  listingCurrency: listings.currency,
                  listingColorsAvailable: listings.colorsAvailable,
                  listingSizesJson: listings.sizesJson,
                  listingMaterialComposition: listings.materialComposition,
                  listingCategory: listings.category,
                  listingQuantityAvailable: listings.quantityAvailable,
                  listingCareInstructions: listings.careInstructions,
                  listingRefundPolicy: listings.refundPolicy,
                  listingVideoUrl: listings.videoUrl,
                  listingShippingOption: listings.shippingOption,
                  listingEtaDomestic: listings.etaDomestic,
                  listingEtaInternational: listings.etaInternational,
                  listingSku: listings.sku,
                  listingBarcode: listings.barcode,
                  listingMetaDescription: listings.metaDescription,
                  listingImage: listings.image,
                  listingImagesJson: listings.imagesJson,
                  listingStatus: listings.status,
                })
                .from(collectionItems)
                .innerJoin(products, eq(collectionItems.productId, products.id))
                .leftJoin(productImages, eq(products.id, productImages.productId))
                .leftJoin(listings, and(
                  eq(listings.productId, collectionItems.productId),
                  inArray(listings.status, ['approved', 'pending_review'])
                ))
                .where(eq(collectionItems.collectionId, listing.collectionId!))
                .orderBy(collectionItems.position);
              
              // Count unique products in collection
              const uniqueProductIds = new Set(collectionItemsWithProducts.map(item => item.productId));
              const itemCount = uniqueProductIds.size || collectionItemsWithProducts.length;
              console.log(`[getApprovedCollections] Collection ${listing.collectionId} has ${itemCount} unique items`);

              // Group items by product to organize images and include listing details
              const itemsMap = new Map();
              collectionItemsWithProducts.forEach((row) => {
                const key = row.productId;
                if (!itemsMap.has(key)) {
                  itemsMap.set(key, {
                    itemId: row.itemId,
                    position: row.position,
                    productId: row.productId,
                    productName: row.productName,
                    productSlug: row.productSlug,
                    productDescription: row.productDescription,
                    images: [],
                    // Include listing details for complete item information
                    title: row.listingTitle || row.productName,
                    description: row.listingDescription || row.productDescription,
                    priceCents: row.listingPriceCents,
                    currency: row.listingCurrency,
                    colorsAvailable: row.listingColorsAvailable,
                    sizesJson: row.listingSizesJson,
                    material: row.listingMaterialComposition,
                    category: row.listingCategory,
                    quantityAvailable: row.listingQuantityAvailable,
                    careInstructions: row.listingCareInstructions,
                    refundPolicy: row.listingRefundPolicy,
                    videoUrl: row.listingVideoUrl,
                    shippingOption: row.listingShippingOption,
                    etaDomestic: row.listingEtaDomestic,
                    etaInternational: row.listingEtaInternational,
                    sku: row.listingSku,
                    barcode: row.listingBarcode,
                    metaDescription: row.listingMetaDescription,
                    listingImage: row.listingImage,
                    listingImagesJson: row.listingImagesJson,
                    listingStatus: row.listingStatus,
                  });
                }
                if (row.productImage) {
                  itemsMap.get(key).images.push({
                    image: row.productImage,
                    position: row.productImagePosition,
                  });
                }
              });

              const items = Array.from(itemsMap.values());
              console.log(`[getApprovedCollections] Grouped into ${items.length} unique products with full listing details`);

              // Fetch seller info
              const seller = await db
                .select()
                .from(sellers)
                .where(eq(sellers.id, listing.sellerId))
                .limit(1);

              // Calculate total price for collection
              const collectionId = listing.collectionId || '';
              const { totalPrice, avgPrice } = await calculateCollectionTotalPrice(collectionId);

              const enriched = {
                id: listing.id,
                collectionId: listing.collectionId,
                title: listing.title,
                description: listing.description,
                image: listing.image,
                imagesJson: listing.imagesJson,
                slug: listing.slug,
                collectionName: collectionDetails[0]?.name || listing.title,
                collectionDescription: collectionDetails[0]?.description || listing.description,
                itemCount: itemCount,
                items: items,  // Each item now includes full listing details (colors, sizes, pricing, shipping, refund info)
                sellerId: listing.sellerId,
                sellerName: seller[0]?.id ? "Seller" : "Unknown Seller",
                shippingOption: listing.shippingOption,
                refundPolicy: listing.refundPolicy,
                createdAt: listing.createdAt,
                updatedAt: listing.updatedAt,
                totalPriceCents: totalPrice,  // totalPrice from calculateCollectionTotalPrice is already in cents
                avgPrice: avgPrice / 100,  // avgPrice is in cents, convert to decimal
              };
              
              console.log(`[getApprovedCollections] Enriched collection with ${items.length} items`);
              return enriched;
            } catch (itemError) {
              console.error(`[getApprovedCollections] Error processing listing ${listing.id}:`, itemError);
              // Return empty collection on error
              return {
                id: listing.id,
                collectionId: listing.collectionId,
                title: listing.title,
                description: listing.description,
                image: listing.image,
                imagesJson: listing.imagesJson,
                slug: listing.slug,
                collectionName: listing.title,
                collectionDescription: listing.description,
                itemCount: 0,
                items: [],
                sellerId: listing.sellerId,
                sellerName: "Unknown Seller",
                shippingOption: listing.shippingOption,
                refundPolicy: listing.refundPolicy,
                createdAt: listing.createdAt,
                updatedAt: listing.updatedAt,
              };
            }
          })
        );

        console.log('[getApprovedCollections] ✓ Successfully returning', enrichedCollections.length, 'collections (total in db:', totalCount.length, ')');
        return {
          collections: enrichedCollections,
          total: totalCount.length,
        };
      } catch (error) {
        console.error("[getApprovedCollections] Failed to fetch approved collections:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch approved collections: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),
});