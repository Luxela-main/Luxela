import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc/trpc";
import { db } from "../db";
import { collections, collectionItems, products, productImages, listings, sellers, reviews, buyers, users } from "../db/schema";
import { and, eq, inArray, desc, sql } from "drizzle-orm";
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

        // Rebuild itemsJson in the listing after adding item
        try {
          const collectionItemsData = await db
            .select({
              id: collectionItems.productId,
              productId: collectionItems.productId,
              position: collectionItems.position,
            })
            .from(collectionItems)
            .where(eq(collectionItems.collectionId, input.collectionId))
            .orderBy(collectionItems.position);

          const itemsWithDetails = await Promise.all(
            collectionItemsData.map(async (item: { id: string; productId: string; position: number }) => {
              const product = await db
                .select()
                .from(products)
                .where(eq(products.id, item.id))
                .limit(1);

              if (product.length === 0) return null;

              const p = product[0];
              const images = await db
                .select({ imageUrl: productImages.imageUrl })
                .from(productImages)
                .where(eq(productImages.productId, p.id))
                .orderBy(productImages.position);

              return {
                id: p.id,
                productId: p.id,
                title: p.name,
                description: p.description,
                category: p.category,
                priceCents: p.priceCents,
                currency: p.currency,
                sizes: p.sizes ? JSON.parse(p.sizes) : [],
                colors: p.colors ? JSON.parse(p.colors) : [],
                images: images.map((img: { imageUrl: string }) => img.imageUrl),
                sku: p.sku,
              };
            })
          );

          const itemsJson = JSON.stringify(itemsWithDetails.filter((item) => item !== null));

          // Find the listing for this collection and update itemsJson
          const listing = await db
            .select()
            .from(listings)
            .where(eq(listings.collectionId, input.collectionId))
            .limit(1);

          if (listing.length > 0) {
            await db.update(listings).set({ itemsJson }).where(eq(listings.id, listing[0].id));
          }
        } catch (err) {
          console.error('Error rebuilding itemsJson after adding product to collection:', err);
          // Don't throw - the item was added successfully even if itemsJson rebuild fails
        }

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

        // Rebuild itemsJson in the listing after removing item
        try {
          const collectionItemsData = await db
            .select({
              id: collectionItems.productId,
              productId: collectionItems.productId,
              position: collectionItems.position,
            })
            .from(collectionItems)
            .where(eq(collectionItems.collectionId, input.collectionId))
            .orderBy(collectionItems.position);

          const itemsWithDetails = await Promise.all(
            collectionItemsData.map(async (item: { id: string; productId: string; position: number }) => {
              const product = await db
                .select()
                .from(products)
                .where(eq(products.id, item.id))
                .limit(1);

              if (product.length === 0) return null;

              const p = product[0];
              const images = await db
                .select({ imageUrl: productImages.imageUrl })
                .from(productImages)
                .where(eq(productImages.productId, p.id))
                .orderBy(productImages.position);

              return {
                id: p.id,
                productId: p.id,
                title: p.name,
                description: p.description,
                category: p.category,
                priceCents: p.priceCents,
                currency: p.currency,
                sizes: p.sizes ? JSON.parse(p.sizes) : [],
                colors: p.colors ? JSON.parse(p.colors) : [],
                images: images.map((img: { imageUrl: string }) => img.imageUrl),
                sku: p.sku,
              };
            })
          );

          const itemsJson = JSON.stringify(itemsWithDetails.filter((item) => item !== null));

          // Find the listing for this collection and update itemsJson
          const listing = await db
            .select()
            .from(listings)
            .where(eq(listings.collectionId, input.collectionId))
            .limit(1);

          if (listing.length > 0) {
            await db.update(listings).set({ itemsJson }).where(eq(listings.id, listing[0].id));
          }
        } catch (err) {
          console.error('Error rebuilding itemsJson after removing product from collection:', err);
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

        // Rebuild itemsJson in the listing after reordering items
        try {
          const collectionItemsData = await db
            .select({
              id: collectionItems.productId,
              productId: collectionItems.productId,
              position: collectionItems.position,
            })
            .from(collectionItems)
            .where(eq(collectionItems.collectionId, input.collectionId))
            .orderBy(collectionItems.position);

          const itemsWithDetails = await Promise.all(
            collectionItemsData.map(async (item: { id: string; productId: string; position: number }) => {
              const product = await db
                .select()
                .from(products)
                .where(eq(products.id, item.id))
                .limit(1);

              if (product.length === 0) return null;

              const p = product[0];
              const images = await db
                .select({ imageUrl: productImages.imageUrl })
                .from(productImages)
                .where(eq(productImages.productId, p.id))
                .orderBy(productImages.position);

              return {
                id: p.id,
                productId: p.id,
                title: p.name,
                description: p.description,
                category: p.category,
                priceCents: p.priceCents,
                currency: p.currency,
                sizes: p.sizes ? JSON.parse(p.sizes) : [],
                colors: p.colors ? JSON.parse(p.colors) : [],
                images: images.map((img: { imageUrl: string }) => img.imageUrl),
                sku: p.sku,
              };
            })
          );

          const itemsJson = JSON.stringify(itemsWithDetails.filter((item) => item !== null));

          const listing = await db
            .select()
            .from(listings)
            .where(eq(listings.collectionId, input.collectionId))
            .limit(1);

          if (listing.length > 0) {
            await db.update(listings).set({ itemsJson }).where(eq(listings.id, listing[0].id));
          }
        } catch (err) {
          console.error('Error rebuilding itemsJson after reordering collection items:', err);
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

  // NEW: Get complete collection details with full product information and real reviews
  getBuyerCollectionDetailsComplete: publicProcedure
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

        // Get the collection listing for pricing info
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

        // Fetch collection items
        const items = await db
          .select()
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, input.collectionId))
          .orderBy(collectionItems.position);

        if (items.length === 0) {
          return {
            ...collection[0],
            listing: listing[0],
            items: [],
            collectionTotalPrice: 0,
            isApproved: true,
          };
        }

        const productIds = items.map((item: any) => item.productId);

        // Fetch all products
        const productsData = await db
          .select()
          .from(products)
          .where(
            productIds.length === 1
              ? eq(products.id, productIds[0])
              : inArray(products.id, productIds)
          );

        // Fetch all product listings for specs (colors, sizes, care instructions)
        const productListings = await db
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
          );

        // Fetch all images for all products
        const allImages = await db
          .select()
          .from(productImages)
          .where(
            productIds.length === 1
              ? eq(productImages.productId, productIds[0])
              : inArray(productImages.productId, productIds)
          )
          .orderBy(productImages.position);

        // Fetch all reviews with buyer details for all products
        const allProductListingIds = productListings.map((pl: any) => pl.id);
        const allReviews =
          allProductListingIds.length > 0
            ? await db
                .select({
                  id: reviews.id,
                  listingId: reviews.listingId,
                  buyerId: reviews.buyerId,
                  rating: reviews.rating,
                  comment: reviews.comment,
                  createdAt: reviews.createdAt,
                  buyerName: users.name,
                  buyerEmail: users.email,
                })
                .from(reviews)
                .innerJoin(buyers, eq(reviews.buyerId, buyers.id))
                .innerJoin(users, eq(buyers.userId, users.id))
                .where(
                  allProductListingIds.length === 1
                    ? eq(reviews.listingId, allProductListingIds[0])
                    : inArray(reviews.listingId, allProductListingIds)
                )
            : [];

        // Build maps for efficient lookup
        const imagesByProductId: Record<string, string[]> = {};
        const specsByProductId: Record<string, any> = {};
        const reviewsByListingId: Record<string, any[]> = {};

        allImages.forEach((img: any) => {
          if (!imagesByProductId[img.productId]) {
            imagesByProductId[img.productId] = [];
          }
          imagesByProductId[img.productId].push(img.imageUrl);
        });

        // Extract specs from product listings
        productListings.forEach((pl: any) => {
          if (pl.productId) {
            let colors = null;
            let sizes = null;

            if (pl.colorsAvailable) {
              try {
                colors = JSON.parse(pl.colorsAvailable);
              } catch (e) {
                colors = null;
              }
            }

            if (pl.sizesJson) {
              try {
                sizes = JSON.parse(pl.sizesJson);
              } catch (e) {
                sizes = null;
              }
            }

            specsByProductId[pl.productId] = {
              careInstructions: pl.careInstructions || null,
              materialComposition: pl.materialComposition || null,
              colors,
              sizes,
              shippingOption: pl.shippingOption,
              etaDomestic: pl.etaDomestic,
              etaInternational: pl.etaInternational,
              refundPolicy: pl.refundPolicy,
            };
          }
        });

        // Group reviews by listing ID
        allReviews.forEach((review: any) => {
          if (!reviewsByListingId[review.listingId]) {
            reviewsByListingId[review.listingId] = [];
          }
          reviewsByListingId[review.listingId].push({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            reviewerName: review.buyerName || "Anonymous Buyer",
            reviewerEmail: review.buyerEmail,
          });
        });

        let collectionTotalPrice = 0;

        // Build items with complete details
        const itemsWithCompleteDetails = items
          .map((item: any) => {
            const product = productsData.find((p: any) => p.id === item.productId);
            if (!product) return null;

            const productImages = imagesByProductId[product.id] || [];
            const specs = specsByProductId[product.id] || {};
            
            // Find the listing for this product to get its reviews
            const productListing = productListings.find((pl: any) => pl.productId === product.id);
            const productReviews = productListing ? reviewsByListingId[productListing.id] || [] : [];

            // Fallback to product primary image if no images found
            const finalImages = productImages.length > 0
              ? productImages
              : product.image
              ? [product.image]
              : [];

            const imagesJson = finalImages.length > 0
              ? JSON.stringify(finalImages.map((url: string) => ({ url })))
              : null;

            collectionTotalPrice += (product.priceCents || 0) / 100;

            // Determine stock status
            const qty = product.quantityAvailable || 0;
            let status: "in_stock" | "low_stock" | "sold_out" = "in_stock";
            if (qty === 0) {
              status = "sold_out";
            } else if (qty <= 5) {
              status = "low_stock";
            }

            return {
              id: item.id,
              itemId: item.id,
              productId: product.id,
              position: item.position,
              title: product.name,
              description: product.description,
              priceCents: product.priceCents,
              price: product.priceCents ? product.priceCents / 100 : 0,
              currency: product.currency || "NGN",
              category: product.category,
              sku: product.sku,
              images: finalImages,
              imagesJson: imagesJson,
              careInstructions: specs.careInstructions,
              materialComposition: specs.materialComposition,
              colors: specs.colors,
              sizes: specs.sizes,
              shippingOption: specs.shippingOption,
              etaDomestic: specs.etaDomestic,
              etaInternational: specs.etaInternational,
              refundPolicy: specs.refundPolicy,
              quantityAvailable: qty,
              status: status,
              reviews: productReviews,
            };
          })
          .filter((item: any) => item !== null);

        return {
          id: collection[0].id,
          name: collection[0].name,
          description: collection[0].description,
          items: itemsWithCompleteDetails,
          listing: listing[0],
          collectionTotalPrice: collectionTotalPrice,
          itemCount: itemsWithCompleteDetails.length,
          isApproved: true,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch collection details",
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

        // Fetch reviews with buyer details for all product listings
        const allListingIds = productListings.map((pl: any) => pl.id).filter(Boolean);
        const allReviews =
          allListingIds.length > 0
            ? await db
                .select({
                  id: reviews.id,
                  listingId: reviews.listingId,
                  buyerId: reviews.buyerId,
                  rating: reviews.rating,
                  comment: reviews.comment,
                  createdAt: reviews.createdAt,
                  buyerName: users.name,
                  buyerEmail: users.email,
                })
                .from(reviews)
                .innerJoin(buyers, eq(reviews.buyerId, buyers.id))
                .innerJoin(users, eq(buyers.userId, users.id))
                .where(
                  allListingIds.length === 1
                    ? eq(reviews.listingId, allListingIds[0])
                    : inArray(reviews.listingId, allListingIds)
                )
            : [];

        // Group reviews by listing ID
        const reviewsByListingId: Record<string, any[]> = {};
        allReviews.forEach((review: any) => {
          if (!reviewsByListingId[review.listingId]) {
            reviewsByListingId[review.listingId] = [];
          }
          reviewsByListingId[review.listingId].push({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            reviewerName: review.buyerName || "Anonymous Buyer",
            reviewerEmail: review.buyerEmail,
          });
        });

        const itemsWithProducts = items.map((item: any) => {
          // Find the listing for this specific product
          const productListing = productListings.find(
            (l: any) => l.productId === item.productId
          );
          
          const selectedListing = productListing || listing[0];
          const productReviews = productListing ? reviewsByListingId[productListing.id] || [] : [];
          
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
            sizesJson: sizes,
            reviews: productReviews,
          };
        });

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
          .orderBy(desc(listings.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        if (approvedListings.length === 0) {
          return { collections: [], total: 0 };
        }

        let totalCount = 0;
        try {
          const countResult = await Promise.race([
            db.execute(
              sql`SELECT COUNT(*) as count FROM listings WHERE type = 'collection' AND status = 'approved'`
            ),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Count timeout')), 5000))
          ]) as any;
          totalCount = Number(countResult.rows[0]?.count || 0);
        } catch (countErr) {
          totalCount = input.offset + approvedListings.length + (approvedListings.length === input.limit ? 100 : 0);
        }

        const collectionIds: string[] = approvedListings
          .filter((l: any) => l.collectionId)
          .map((l: any) => l.collectionId as string);
        const sellerIds: string[] = Array.from(
          new Set(
            approvedListings
              .filter((l: any) => l.sellerId)
              .map((l: any) => l.sellerId as string)
          )
        );

        if (collectionIds.length === 0) {
          return { collections: [], total: 0 };
        }

        const allCollectionItems = await db.select({
          collectionId: collectionItems.collectionId,
          itemId: collectionItems.id,
          position: collectionItems.position,
          productId: collectionItems.productId,
        })
        .from(collectionItems)
        .where(inArray(collectionItems.collectionId, collectionIds))
        .orderBy(collectionItems.position);

        const itemsByCollectionId = new Map<string, any[]>();
        const MAX_PREVIEW_ITEMS = 3;
        const allProductIdsSet = new Set<string>();
        
        allCollectionItems.forEach((item: any) => {
          const collId = item.collectionId;
          if (!itemsByCollectionId.has(collId)) {
            itemsByCollectionId.set(collId, []);
          }
          if (itemsByCollectionId.get(collId)!.length < MAX_PREVIEW_ITEMS) {
            itemsByCollectionId.get(collId)!.push(item);
            allProductIdsSet.add(item.productId);
          }
        });
        
        const productIds: string[] = Array.from(allProductIdsSet);
        
        console.log(`[getApprovedCollections] Found ${allCollectionItems.length} items, fetching ${productIds.length} products for ${collectionIds.length} collections`);

        const [allCollectionDetails, allSellers, allProducts, allProductImages, allListings] = await Promise.all([
          collectionIds.length > 0 ? db.select().from(collections).where(inArray(collections.id, collectionIds)) : Promise.resolve([]),
          sellerIds.length > 0 ? db.select({ id: sellers.id }).from(sellers).where(inArray(sellers.id, sellerIds as string[])) : Promise.resolve([]),
          productIds.length > 0 ? db.select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            description: products.description,
          })
          .from(products)
          .where(inArray(products.id, productIds as string[])) : Promise.resolve([]),
          productIds.length > 0 ? db.select({
            productId: productImages.productId,
            imageUrl: productImages.imageUrl,
            position: productImages.position,
          })
          .from(productImages)
          .where(inArray(productImages.productId, productIds as string[])) : Promise.resolve([]),
          productIds.length > 0 ? db.select({
            id: listings.id,
            productId: listings.productId,
            title: listings.title,
            description: listings.description,
            priceCents: listings.priceCents,
            currency: listings.currency,
            category: listings.category,
            quantityAvailable: listings.quantityAvailable,
            image: listings.image,
            imagesJson: listings.imagesJson,
            colorsAvailable: listings.colorsAvailable,
            sizesJson: listings.sizesJson,
            materialComposition: listings.materialComposition,
            careInstructions: listings.careInstructions,
            videoUrl: listings.videoUrl,
            etaDomestic: listings.etaDomestic,
            etaInternational: listings.etaInternational,
            shippingOption: listings.shippingOption,
            sku: listings.sku,
            barcode: listings.barcode,
            metaDescription: listings.metaDescription,
            refundPolicy: listings.refundPolicy,
          })
          .from(listings)
          .where(and(inArray(listings.productId, productIds as string[]), inArray(listings.status, ['approved', 'pending_review']))) : Promise.resolve([]),
        ]);
        
        console.log('[getApprovedCollections] Batch fetch complete. Processing...');
        
        // Create maps for O(1) lookup
        const collectionDetailsMap = new Map<string, typeof allCollectionDetails[number]>(allCollectionDetails.map((c: typeof allCollectionDetails[number]) => [c.id, c]));
        const sellersMap = new Map(allSellers.map((s: typeof allSellers[number]) => [s.id, s]));
        const productsMap = new Map<string, typeof allProducts[number]>(allProducts.map((p: typeof allProducts[number]) => [p.id, p]));
        const listingsMap = new Map<string, typeof allListings[number]>(allListings.map((l: typeof allListings[number]) => [l.productId, l]));
        
        // Group product images by product ID
        const imagesByProductId = new Map<string, Array<typeof allProductImages[number]>>();
        allProductImages.forEach((img: typeof allProductImages[number]) => {
          if (!imagesByProductId.has(img.productId)) {
            imagesByProductId.set(img.productId, []);
          }
          imagesByProductId.get(img.productId)!.push(img);
        });
        
        // Build items by collection from preview-only items (already limited above)
        const itemsByCollection = new Map<string, any[]>();
        const itemCountByCollection = new Map<string, number>();
        
        // Set item counts from original allCollectionItems and use pre-filtered items
        itemsByCollectionId.forEach((items: any[], collId: string) => {
          // Count original items for display
          const originalCount = allCollectionItems.filter((i: any) => i.collectionId === collId).length;
          itemCountByCollection.set(collId, originalCount);
          
          // Add preview items to map
          itemsByCollection.set(collId, []);
          items.forEach((item: any) => {
            const product = productsMap.get(item.productId) as typeof allProducts[number] | undefined;
            const listing = listingsMap.get(item.productId) as typeof allListings[number] | undefined;
            const images = (imagesByProductId.get(item.productId) || []) as Array<typeof allProductImages[number]>;
            
            itemsByCollection.get(collId)!.push({
              itemId: item.itemId,
              position: item.position,
              productId: item.productId,
              productName: product?.name,
              productSlug: product?.slug,
              productDescription: product?.description,
              listingId: listing?.id,
              listingTitle: listing?.title,
              listingDescription: listing?.description,
              listingPriceCents: listing?.priceCents,
              listingCurrency: listing?.currency,
              listingCategory: listing?.category,
              listingQuantityAvailable: listing?.quantityAvailable,
              listingImage: listing?.image,
              listingImagesJson: listing?.imagesJson,
              listingColorsAvailable: listing?.colorsAvailable,
              listingSizesJson: listing?.sizesJson,
              listingMaterial: listing?.materialComposition,
              listingCareInstructions: listing?.careInstructions,
              listingVideoUrl: listing?.videoUrl,
              listingEtaDomestic: listing?.etaDomestic,
              listingEtaInternational: listing?.etaInternational,
              listingShippingOption: listing?.shippingOption,
              listingSku: listing?.sku,
              listingBarcode: listing?.barcode,
              listingMetaDescription: listing?.metaDescription,
              listingRefundPolicy: listing?.refundPolicy,
              images: images.map((img: typeof allProductImages[number]) => ({
                image: img.imageUrl,
                position: img.position,
              })),
            });
          });
        });

        // Process each listing with pre-fetched data (no more async calls per listing!)
        const enrichedCollections = approvedListings.map((listing: any) => {
          console.log('[getApprovedCollections] Processing collection listing:', { listingId: listing.id, collectionId: listing.collectionId });
          const collectionItemsWithProducts = itemsByCollection.get(listing.collectionId!) || [];
          const totalItemsInCollection = itemCountByCollection.get(listing.collectionId!) || collectionItemsWithProducts.length;
          
          // Group items by product (items already merged in previous loop)
          const collectionItemsData = (itemsByCollection.get(listing.collectionId!) || []).map((item: any) => ({
            itemId: item.itemId,
            position: item.position,
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            productDescription: item.productDescription,
            images: item.images,
            title: item.listingTitle || item.productName,
            description: item.listingDescription || item.productDescription,
            priceCents: item.listingPriceCents,
            currency: item.listingCurrency,
            category: item.listingCategory,
            quantityAvailable: item.listingQuantityAvailable,
            listingImage: item.listingImage,
            listingImagesJson: item.listingImagesJson,
            listingId: item.listingId,
            colorsAvailable: item.listingColorsAvailable,
            sizesJson: item.listingSizesJson,
            material: item.listingMaterial,
            careInstructions: item.listingCareInstructions,
            videoUrl: item.listingVideoUrl,
            etaDomestic: item.listingEtaDomestic,
            etaInternational: item.listingEtaInternational,
            shippingOption: item.listingShippingOption,
            sku: item.listingSku,
            barcode: item.listingBarcode,
            metaDescription: item.listingMetaDescription,
            refundPolicy: item.listingRefundPolicy,
          }));

          const items = collectionItemsData;
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