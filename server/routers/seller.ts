import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '../db';
import { sellers, sellerBusiness, sellerShipping, sellerPayment, sellerAdditional } from '../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

async function ensureSeller(userId: string) {
  let existingSeller = await db.select().from(sellers).where(eq(sellers.userId, userId));
  let seller = existingSeller[0];
  if (!seller) {
    const inserted = await db
      .insert(sellers)
      .values({ id: randomUUID(), userId, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    seller = inserted[0];
  }
  return seller;
}


export const sellerRouter = createTRPCRouter({
   getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    try {
      // Fetch seller row
      const seller = (await db.select().from(sellers).where(eq(sellers.userId, userId)))[0];
      // // Fetch seller with all related sections
      // const seller = await db.query.sellers.findFirst({
      //   where: (s: { userId: any; }, { eq }: any) => eq(s.userId, userId),
      //   with: {
      //     business: true,
      //     shipping: true,
      //     payment: true,
      //     additional: true,
      //   },
      // });

      if (!seller) {
        // Return an empty profile instead of error → frontend knows it's first-time setup
        return {
          seller: null,
          business: null,
          shipping: null,
          payment: null,
          additional: null,
        };
      }

      const business = (await db.select().from(sellerBusiness).where(eq(sellerBusiness.sellerId, seller.id)))[0] || null;
      const shipping = (await db.select().from(sellerShipping).where(eq(sellerShipping.sellerId, seller.id)))[0] || null;
      const payment = (await db.select().from(sellerPayment).where(eq(sellerPayment.sellerId, seller.id)))[0] || null;
      const additional = (await db.select().from(sellerAdditional).where(eq(sellerAdditional.sellerId, seller.id)))[0] || null;

      return {
        seller: {
          id: seller.id,
          userId: seller.userId,
          status: (seller as any).status,
          createdAt: seller.createdAt,
          updatedAt: seller.updatedAt,
        },
        business,
        shipping,
        payment,
        additional,
      };
    } catch (err) {
      console.error('Error fetching seller profile:', err);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to load seller profile',
      });
    }
  }),

  updateSellerBusiness: protectedProcedure.input(
   z.object({
     brandName: z.string().min(1),
     businessType: z.enum(['individual', 'business']),
     businessAddress: z.string().min(1),
     officialEmail: z.string().email(),
     phoneNumber: z.string().min(3),
     country: z.string().min(2),
     socialMedia: z.string().optional(),
     fullName: z.string().min(1),
     idType: z.enum(['passport', 'drivers_license', 'voters_card', 'national_id']),
   })
 ).mutation(async ({ ctx, input }) => {
   const userId = ctx.user?.id;
   if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
   try {
     const seller = await ensureSeller(userId);
     const found = await db.select().from(sellerBusiness).where(eq(sellerBusiness.sellerId, seller.id));
     if (found[0]) {
       await db.update(sellerBusiness).set({ ...input, updatedAt: new Date() }).where(eq(sellerBusiness.sellerId, seller.id));
     } else {
       await db.insert(sellerBusiness).values({ id: randomUUID(), sellerId: seller.id, ...input });
     }
     return { success: true };
   } catch (err: any) {
     throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to update business info' });
   }
 }),

  updateSellerShipping: protectedProcedure.input(
   z.object({
     shippingZone: z.string().min(1),
     city: z.string().min(1),
     shippingAddress: z.string().min(1),
     returnAddress: z.string().min(1),
     shippingType: z.enum(['domestic']),
     estimatedShippingTime: z.enum(['48hrs', '72hrs', '5_working_days', '1week']),
     refundPolicy: z.enum(['no_refunds', 'accept_refunds']),
     refundPeriod: z.enum(['48hrs', '72hrs', '5_working_days', '1week']),
   })
 ).mutation(async ({ ctx, input }) => {
   const userId = ctx.user?.id;
   if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
   try {
     const seller = await ensureSeller(userId);
     const found = await db.select().from(sellerShipping).where(eq(sellerShipping.sellerId, seller.id));
     if (found[0]) {
       await db.update(sellerShipping).set({ ...input, updatedAt: new Date() }).where(eq(sellerShipping.sellerId, seller.id));
     } else {
       await db.insert(sellerShipping).values({ id: randomUUID(), sellerId: seller.id, ...input });
     }
     return { success: true };
   } catch (err: any) {
     throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to update shipping info' });
   }
 }),

  updateSellerPayment: protectedProcedure.input(
   z.object({
     preferredPayoutMethod: z.enum(['fiat_currency', 'cryptocurrency', 'both']),
     // fiat fields optional
     fiatPayoutMethod: z.enum(['bank', 'paypal', 'stripe', 'flutterwave']).optional(),
     bankCountry: z.string().optional(),
     accountHolderName: z.string().optional(),
     accountNumber: z.string().optional(),
     // crypto fields optional
     walletType: z.enum(['phantom', 'solflare', 'backpack', 'wallet_connect']).optional(),
     walletAddress: z.string().optional(),
     preferredPayoutToken: z.enum(['USDT', 'USDC', 'solana']).optional(),
   })
 ).mutation(async ({ ctx, input }) => {
   const userId = ctx.user?.id;
   if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
   try {
     const seller = await ensureSeller(userId);
     const found = await db.select().from(sellerPayment).where(eq(sellerPayment.sellerId, seller.id));
     if (found[0]) {
       await db.update(sellerPayment).set({ ...input, updatedAt: new Date() }).where(eq(sellerPayment.sellerId, seller.id));
     } else {
       await db.insert(sellerPayment).values({ id: randomUUID(), sellerId: seller.id, ...input });
     }
     return { success: true };
   } catch (err: any) {
     throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to update payment info' });
   }
 }),

  updateSellerAdditional: protectedProcedure.input(
   z.object({
     productCategory: z.enum([
       'men_clothing',
       'women_clothing',
       'men_shoes',
       'women_shoes',
       'accessories',
       'merch',
       'others',
     ]),
     targetAudience: z.enum(['male', 'female', 'unisex']),
     localPricing: z.enum(['fiat', 'cryptocurrency']),
   })
 )
 .mutation(async ({ ctx, input }) => {
   const userId = ctx.user?.id;
   if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
   try {
     const seller = await ensureSeller(userId);
     const found = await db.select().from(sellerAdditional).where(eq(sellerAdditional.sellerId, seller.id));
     if (found[0]) {
       await db.update(sellerAdditional).set({ ...input, updatedAt: new Date() }).where(eq(sellerAdditional.sellerId, seller.id));
     } else {
       await db.insert(sellerAdditional).values({ id: randomUUID(), sellerId: seller.id, ...input });
     }
     return { success: true };
   } catch (err: any) {
     throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to update additional info' });
   }
 }),
});
