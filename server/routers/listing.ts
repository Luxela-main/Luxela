import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '../db';
import { listings, sellers } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { randomUUID } from 'crypto';

const SizesEnum = z.enum(['S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
const SupplyCapacityEnum = z.enum(['no_max', 'limited']);
const LimitedBadgeEnum = z.enum(['show_badge', 'do_not_show']);
const CategoryEnum = z.enum([
  'men_clothing',
  'women_clothing',
  'men_shoes',
  'women_shoes',
  'accessories',
  'merch',
  'others',
]);
const ShippingOptionEnum = z.enum(['local', 'international', 'both']);
const ShippingEtaEnum = z.enum(['48hrs', '72hrs', '5_working_days', '1week']);
const TargetAudienceEnum = z.enum(['male', 'female', 'unisex']);

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

function computeStockStatus(supplyCapacity: 'no_max' | 'limited' | null, quantity: number | null): 'in_stock' | 'low_stock' | 'sold_out' {
  if (supplyCapacity === 'no_max') return 'in_stock';
  const qty = quantity ?? 0;
  if (qty <= 0) return 'sold_out';
  if (qty <= 5) return 'low_stock';
  return 'in_stock';
}

export const listingRouter = createTRPCRouter({
  createSingle: protectedProcedure
    .input(SingleListingInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

        // if limited supply, quantity must be provided and > 0
        if (input.supplyCapacity === 'limited' && (!input.quantityAvailable || input.quantityAvailable <= 0)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'quantityAvailable is required for limited supply' });
        }

        const [created] = await db
          .insert(listings)
          .values({
            id: randomUUID(),
            sellerId: seller.id,
            type: 'single',
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
            colorsAvailable: input.colorsAvailable ? JSON.stringify(input.colorsAvailable) : null,
            additionalTargetAudience: input.additionalTargetAudience,
            shippingOption: input.shippingOption,
            etaDomestic: input.etaDomestic,
            etaInternational: input.etaInternational,
          })
          .returning();

        return created;
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to create listing' });
      }
    }),

  createCollection: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        items: z
          .array(
            z.object({ title: z.string().min(1), priceCents: z.number().int().positive(), currency: z.string().min(1).max(16) })
          )
          .min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

        const [created] = await db
          .insert(listings)
          .values({ id: randomUUID(), sellerId: seller.id, type: 'collection', title: input.title, description: input.description, itemsJson: JSON.stringify(input.items) })
          .returning();
        return created;
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to create listing' });
      }
    }),

  getMyListings: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
    try {
      const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, userId));
      const seller = sellerRow[0];
      if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

      const rows = await db.select().from(listings).where(eq(listings.sellerId, seller.id));
      return rows;
    } catch (err: any) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to fetch listings' });
    }
  }),

  getMyListingsByCategory: protectedProcedure
    .input(z.object({ category: CategoryEnum }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

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
          .where(and(eq(listings.sellerId, seller.id), eq(listings.category, input.category)));

        return rows
          .filter((r) => r.type === 'single')
          .map((r) => ({
            id: r.id,
            title: r.title,
            category: r.category,
            priceCents: r.priceCents,
            currency: r.currency,
            stock: r.supplyCapacity === 'no_max' ? null : r.quantityAvailable ?? 0,
            status: computeStockStatus(r.supplyCapacity as any, r.quantityAvailable ?? null),
          }));
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to fetch listings by category' });
      }
    }),

  // Note: endpoints operate on 'listings' which represent products for sale
  // deleteListing = delete product, restockListing = restock product quantity for single listings
  deleteListing: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

        const owned = await db.select().from(listings).where(and(eq(listings.id, input.id), eq(listings.sellerId, seller.id)));
        if (!owned[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });

        await db.delete(listings).where(eq(listings.id, input.id));
        return { success: true };
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to delete listing' });
      }
    }),

  restockListing: protectedProcedure
    .input(z.object({ id: z.string().uuid(), quantityAvailable: z.number().int().nonnegative() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const sellerRow = await db.select().from(sellers).where(eq(sellers.userId, userId));
        const seller = sellerRow[0];
        if (!seller) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seller not found' });

        const owned = await db.select().from(listings).where(and(eq(listings.id, input.id), eq(listings.sellerId, seller.id)));
        const listing = owned[0];
        if (!listing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
        if (listing.type !== 'single') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only single listings can be restocked' });
        if (listing.supplyCapacity === 'no_max') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unlimited supply listing does not require restock' });

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
          status: computeStockStatus(updated.supplyCapacity as any, updated.quantityAvailable ?? null),
        };
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to restock listing' });
      }
    }),
});
