import { createTRPCRouter, protectedProcedure } from "../trpc/trpc";
import { db } from "../db";
import { productImages, products } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";

export const productRouter = createTRPCRouter({
  /**
   * Add a product image and link it to a product
   */
  addImage: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/product/add-image",
        tags: ["Product"],
        summary: "Add an image to a product",
        description:
          "Adds a signed image URL to a product. Typically called after uploading an image to Supabase storage.",
      },
    })
    .input(
      z.object({
        productId: z.string().uuid().describe("The product ID"),
        imageUrl: z.string().url().describe("Signed image URL from Supabase"),
        position: z.number().int().nonnegative().default(0).describe("Image position/order"),
      })
    )
    .output(
      z.object({
        id: z.string().uuid(),
        productId: z.string().uuid(),
        imageUrl: z.string(),
        position: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify product exists
        const productRows = await db.select().from(products).where(eq(products.id, input.productId));
        if (!productRows[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        // Insert image record
        const [created] = await db
          .insert(productImages)
          .values({
            productId: input.productId,
            imageUrl: input.imageUrl,
            position: input.position,
          })
          .returning();

        return {
          id: created.id,
          productId: created.productId,
          imageUrl: created.imageUrl,
          position: created.position,
        };
      } catch (err: any) {
        if (err?.code === "NOT_FOUND") throw err;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to add product image",
        });
      }
    }),

  /**
   * Get all images for a product
   */
  getImages: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/product/{productId}/images",
        tags: ["Product"],
        summary: "Get product images",
        description: "Retrieves all images associated with a product, ordered by position.",
      },
    })
    .input(z.object({ productId: z.string().uuid() }))
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          productId: z.string().uuid(),
          imageUrl: z.string(),
          position: z.number().int(),
        })
      )
    )
    .query(async ({ input }) => {
      try {
        const images = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, input.productId));

        return images.map((img: any) => ({
          id: img.id,
          productId: img.productId,
          imageUrl: img.imageUrl,
          position: img.position,
        }));
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to fetch product images",
        });
      }
    }),

  /**
   * Delete a product image
   */
  deleteImage: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/product/image/{imageId}",
        tags: ["Product"],
        summary: "Delete a product image",
        description: "Removes an image from a product.",
      },
    })
    .input(z.object({ imageId: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input }) => {
      try {
        await db.delete(productImages).where(eq(productImages.id, input.imageId));
        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to delete product image",
        });
      }
    }),
});