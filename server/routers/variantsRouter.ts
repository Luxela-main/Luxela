import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { productVariants, listings } from '../db/schema';

export const variantsRouter = createTRPCRouter({
  getVariants: protectedProcedure
    .query(async ({ ctx }) => {
      const variants = await db
        .select()
        .from(productVariants);

      return variants;
    }),

  getVariantsByProduct: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const variants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, input.productId));

      return variants;
    }),

  createVariant: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        size: z.string().min(1),
        colorName: z.string().min(1),
        colorHex: z.string().regex(/^#[0-9A-F]{6}$/i),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.productId));

      if (!product.length) {
        throw new Error('Product not found');
      }

      const variant = await db
        .insert(productVariants)
        .values({
          productId: input.productId,
          size: input.size,
          colorName: input.colorName,
          colorHex: input.colorHex,
        })
        .returning();

      return variant[0];
    }),

  updateVariant: protectedProcedure
    .input(
      z.object({
        variantId: z.string().uuid(),
        size: z.string().optional(),
        colorName: z.string().optional(),
        colorHex: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const variant = await db
        .update(productVariants)
        .set({
          ...(input.size && { size: input.size }),
          ...(input.colorName && { colorName: input.colorName }),
          ...(input.colorHex && { colorHex: input.colorHex }),
        })
        .where(eq(productVariants.id, input.variantId))
        .returning();

      return variant[0];
    }),

  deleteVariant: protectedProcedure
    .input(z.object({ variantId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(productVariants)
        .where(eq(productVariants.id, input.variantId));

      return { success: true };
    }),
});