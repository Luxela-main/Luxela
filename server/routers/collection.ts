import { createTRPCRouter, protectedProcedure } from "../trpc/trpc";
import { db } from "../db";
import { collections, collectionItems, products, productImages } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const collectionRouter = createTRPCRouter({
  // Get collection with all products and their images
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

        // Get collection items
        const items = await db
          .select()
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, input.collectionId));

        // Get products for items
        const productIds = items.map((item) => item.productId);
        const productsData =
          productIds.length > 0
            ? await db
                .select()
                .from(products)
                .where(
                  productIds.length === 1
                    ? eq(products.id, productIds[0])
                    : undefined
                )
            : [];

        // Get images for products
        const images =
          productIds.length > 0
            ? await db
                .select()
                .from(productImages)
                .where(
                  productIds.length === 1
                    ? eq(productImages.productId, productIds[0])
                    : undefined
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

  // Add product to collection
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
        // Verify collection exists
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

        // Verify product exists
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

        // Check if product already in collection
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

  // Remove product from collection
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

  // Reorder products in collection
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

  // Get collection items with product details and images
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
                    : undefined
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
                    : undefined
                )
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

  // Get product details with images for collection
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
          .where(eq(productImages.productId, input.productId));

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
});