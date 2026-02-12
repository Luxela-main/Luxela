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

    const totalPrice = itemsWithListings.reduce((sum: any, item: any) => sum + (item.priceCents || 0), 0);
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

        const productIds = items.map((item: any) => item.productId);
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

        const itemsWithProducts = items.map((item: any) => ({
          ...item,
          product: productsData.find((p: any) => p.id === item.productId),
          images: images.filter((img: any) => img.productId === item.productId),
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

        const productIds = items.map((item: any) => item.productId);
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
          items: items.map((item: any) => ({
            ...item,
            product: productsData.find((p: any) => p.id === item.productId),
            images: images.filter((img: any) => img.productId === item.productId),
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

        const productIds = items.map((item: any) => item.productId);
        console.log('[getBuyerCollectionWithProducts] Product IDs:', productIds);
        
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
        
        console.log('[getBuyerCollectionWithProducts] Found products:', productsData.length);

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
                        eq(listings.type, "single"),
                        inArray(listings.status, ["approved", "pending_review"])
                      )
                    : and(
                        inArray(listings.productId, productIds),
                        eq(listings.type, "single"),
                        inArray(listings.status, ["approved", "pending_review"])
                      )
                )
            : [];
        
        console.log('[getBuyerCollectionWithProducts] Product listings found:', productListings.length, 'for', productIds.length, 'products');
        productListings.forEach((l: any) => {
          console.log(`  Listing: id=${l.id}, productId=${l.productId}, status=${l.status}, priceCents=${l.priceCents}`);
        });

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

        const itemsWithProducts = items.map((item: any) => {
          // Find the listing for this specific product
          const productListing = productListings.find(
            (l: any) => l.productId === item.productId
          );
          
          const selectedListing = productListing || listing[0];
          
          // Extract colors and sizes from the listing
          let colors: any[] = [];
          let sizes: any[] = [];
          
          if (selectedListing) {
            // Try to parse colors
            const colorSource = selectedListing.colorsAvailable || selectedListing.colors_available || selectedListing.colors;
            if (colorSource) {
              try {
                colors = typeof colorSource === 'string' ? JSON.parse(colorSource) : Array.isArray(colorSource) ? colorSource : [];
              } catch (e) {
                colors = [];
              }
            }
            
            // Try to parse sizes
            const sizeSource = selectedListing.sizesJson || selectedListing.sizes;
            if (sizeSource) {
              try {
                sizes = typeof sizeSource === 'string' ? JSON.parse(sizeSource) : Array.isArray(sizeSource) ? sizeSource : [];
              } catch (e) {
                sizes = [];
              }
            }
          }
          
          if (productListing) {
            console.log(`[getBuyerCollectionWithProducts] Item productId=${item.productId}, using product listing id=${productListing.id}, priceCents=${productListing.priceCents}`);
          } else {
            console.log(`[getBuyerCollectionWithProducts] Item productId=${item.productId}, falling back to collection listing, priceCents=${listing[0].priceCents}`);
          }
          
          return {
            ...item,
            product: productsData.find((p: any) => p.id === item.productId),
            images: images.filter((img: any) => img.productId === item.productId),
            listing: selectedListing,
            colors: colors,
            sizes: sizes,
            colorsAvailable: colors,
            sizesJson: sizes
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
        
        // OPTIMIZATION: Fetch only basic listing info first (minimal fields, fast query)
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
        
        console.log('[getApprovedCollections] Found', approvedListings.length, 'approved collection listings');

        if (approvedListings.length === 0) {
          return { collections: [], total: 0 };
        }

        // Get total count - optimized separate query
        const countResult = await db
          .select({ count: listings.id })
          .from(listings)
          .where(and(
            eq(listings.type, "collection"),
            eq(listings.status, "approved")
          ));
        const totalCount = countResult.length;

        const collectionIds = approvedListings
          .filter((l: typeof approvedListings[number]) => l.collectionId)
          .map((l: typeof approvedListings[number]) => l.collectionId as string);
        const sellerIds = approvedListings
          .filter((l: typeof approvedListings[number]) => l.sellerId)
          .map((l: typeof approvedListings[number]) => l.sellerId as string);
        
        console.log(`[getApprovedCollections] Fetching data for ${collectionIds.length} collections...`);

        // OPTIMIZATION: Batch fetch with minimal fields and item limit
        const [allCollectionDetails, allSellers, allCollectionItemsWithProducts] = await Promise.all([
          collectionIds.length > 0
            ? db.select().from(collections).where(inArray(collections.id, collectionIds))
            : Promise.resolve([]),
          sellerIds.length > 0
            ? db.select({ id: sellers.id }).from(sellers).where(inArray(sellers.id, sellerIds))
            : Promise.resolve([]),
          collectionIds.length > 0
            ? db.select({
                collectionId: collectionItems.collectionId,
                itemId: collectionItems.id,
                position: collectionItems.position,
                productId: collectionItems.productId,
                productName: products.name,
                productSlug: products.slug,
                productDescription: products.description,
                productImage: productImages.imageUrl,
                productImagePosition: productImages.position,
                listingId: listings.id,
                listingTitle: listings.title,
                listingDescription: listings.description,
                listingPriceCents: listings.priceCents,
                listingCurrency: listings.currency,
                listingCategory: listings.category,
                listingQuantityAvailable: listings.quantityAvailable,
                listingImage: listings.image,
                listingImagesJson: listings.imagesJson,
              })
              .from(collectionItems)
              .innerJoin(products, eq(collectionItems.productId, products.id))
              .leftJoin(productImages, eq(products.id, productImages.productId))
              .leftJoin(listings, and(
                eq(listings.productId, collectionItems.productId),
                inArray(listings.status, ['approved', 'pending_review'])
              ))
              .where(inArray(collectionItems.collectionId, collectionIds))
              .orderBy(collectionItems.position)
            : Promise.resolve([]),
        ]);
        
        console.log('[getApprovedCollections] Batch fetch complete. Processing...');
        
        // Create maps for O(1) lookup
        const collectionDetailsMap = new Map<string, typeof allCollectionDetails[number]>(allCollectionDetails.map((c: typeof allCollectionDetails[number]) => [c.id, c]));
        const sellersMap = new Map(allSellers.map((s: typeof allSellers[number]) => [s.id, s]));
        
        // Group items by collection with limit per collection
        const itemsByCollection = new Map<string, any[]>();
        const itemCountByCollection = new Map<string, number>();
        const MAX_ITEMS_PER_COLLECTION = 5; // Limit items for faster response
        
        allCollectionItemsWithProducts.forEach((item: typeof allCollectionItemsWithProducts[number]) => {
          const collId = item.collectionId;
          if (!itemsByCollection.has(collId)) {
            itemsByCollection.set(collId, []);
            itemCountByCollection.set(collId, 0);
          }
          
          // Count all items
          itemCountByCollection.set(collId, (itemCountByCollection.get(collId) || 0) + 1);
          
          // Only keep first MAX_ITEMS_PER_COLLECTION items in response
          if ((itemsByCollection.get(collId) || []).length < MAX_ITEMS_PER_COLLECTION) {
            itemsByCollection.get(collId)!.push(item);
          }
        });

        // Process each listing with pre-fetched data (no more async calls per listing!)
        const enrichedCollections = approvedListings.map((listing: any) => {
          console.log('[getApprovedCollections] Processing collection listing:', { listingId: listing.id, collectionId: listing.collectionId });
          const collectionItemsWithProducts = itemsByCollection.get(listing.collectionId!) || [];
          const totalItemsInCollection = itemCountByCollection.get(listing.collectionId!) || collectionItemsWithProducts.length;
          
          // Group items by product
          const itemsMap = new Map();
          collectionItemsWithProducts.forEach((row: any) => {
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
                title: row.listingTitle || row.productName,
                description: row.listingDescription || row.productDescription,
                priceCents: row.listingPriceCents,
                currency: row.listingCurrency,
                category: row.listingCategory,
                quantityAvailable: row.listingQuantityAvailable,
                listingImage: row.listingImage,
                listingImagesJson: row.listingImagesJson,
                listingId: row.listingId,
              });
            }
            if (row.productImage) {
              const images = itemsMap.get(key).images;
              if (!images.find((img: any) => img.image === row.productImage)) {
                images.push({
                  image: row.productImage,
                  position: row.productImagePosition,
                });
              }
            }
          });

          const items = Array.from(itemsMap.values());
          const collectionDetails = collectionDetailsMap.get(listing.collectionId!);

          return {
            id: listing.id,
            collectionId: listing.collectionId,
            title: listing.title,
            description: listing.description,
            image: listing.image,
            imagesJson: listing.imagesJson,
            slug: listing.slug,
            collectionName: collectionDetails?.name || listing.title,
            collectionDescription: collectionDetails?.description || listing.description,
            itemCount: totalItemsInCollection,
            items: items,
            sellerId: listing.sellerId,
            sellerName: sellersMap.has(listing.sellerId) ? "Seller" : "Unknown Seller",
            shippingOption: listing.shippingOption,
            refundPolicy: listing.refundPolicy,
            createdAt: listing.createdAt,
            updatedAt: listing.updatedAt,
          };
        });

        console.log('[getApprovedCollections] ✓ Returning', enrichedCollections.length, 'collections');
        return {
          collections: enrichedCollections,
          total: totalCount,
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