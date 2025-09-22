import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '../db';
import { buyers, buyerShipping, carts, cartItems, discounts, listings, orders, sellers } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { randomUUID } from 'crypto';

async function ensureBuyer(userId: string) {
  const existing = await db.select().from(buyers).where(eq(buyers.userId, userId));
  if (existing[0]) return existing[0];
  const [created] = await db
    .insert(buyers)
    .values({ id: randomUUID(), userId, createdAt: new Date(), updatedAt: new Date() })
    .returning();
  return created;
}

async function ensureCart(buyerId: string) {
  const existing = await db.select().from(carts).where(eq(carts.buyerId, buyerId));
  if (existing[0]) return existing[0];
  const [created] = await db
    .insert(carts)
    .values({ id: randomUUID(), buyerId, createdAt: new Date(), updatedAt: new Date() })
    .returning();
  return created;
}

export const cartRouter = createTRPCRouter({
  getCart: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
    try {
      const buyer = await ensureBuyer(userId);
      const cart = await ensureCart(buyer.id);
      const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
      const discountRow = cart.discountId
        ? (await db.select().from(discounts).where(eq(discounts.id, cart.discountId)))[0]
        : null;
      return { cart, items, discount: discountRow || null };
    } catch (err: any) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to load cart' });
    }
  }),

  addToCart: protectedProcedure
    .input(z.object({ listingId: z.string().uuid(), quantity: z.number().int().positive().default(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const buyer = await ensureBuyer(userId);
        const cart = await ensureCart(buyer.id);
        const listingRows = await db.select().from(listings).where(eq(listings.id, input.listingId));
        const listing = listingRows[0];
        if (!listing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        if (listing.type !== 'single') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only single products can be added to cart' });

        const existing = await db
          .select()
          .from(cartItems)
          .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.listingId, input.listingId)));
        if (existing[0]) {
          const newQty = existing[0].quantity + input.quantity;
          const [updated] = await db
            .update(cartItems)
            .set({ quantity: newQty })
            .where(eq(cartItems.id, existing[0].id))
            .returning();
          return updated;
        } else {
          const [created] = await db
            .insert(cartItems)
            .values({
              id: randomUUID(),
              cartId: cart.id,
              listingId: input.listingId,
              quantity: input.quantity,
              unitPriceCents: listing.priceCents!,
              currency: listing.currency!,
            })
            .returning();
          return created;
        }
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to add to cart' });
      }
    }),

  setItemQuantity: protectedProcedure
    .input(z.object({ listingId: z.string().uuid(), quantity: z.number().int().nonnegative() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const buyer = await ensureBuyer(userId);
        const cart = await ensureCart(buyer.id);
        const rows = await db
          .select()
          .from(cartItems)
          .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.listingId, input.listingId)));
        const item = rows[0];
        if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not in cart' });
        if (input.quantity === 0) {
          await db.delete(cartItems).where(eq(cartItems.id, item.id));
          return { success: true };
        }
        const [updated] = await db
          .update(cartItems)
          .set({ quantity: input.quantity })
          .where(eq(cartItems.id, item.id))
          .returning();
        return updated;
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to update item quantity' });
      }
    }),

  removeItem: protectedProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const buyer = await ensureBuyer(userId);
        const cart = await ensureCart(buyer.id);
        await db
          .delete(cartItems)
          .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.listingId, input.listingId)));
        return { success: true };
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to remove item' });
      }
    }),

  clearCart: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
    try {
      const buyer = await ensureBuyer(userId);
      const cart = await ensureCart(buyer.id);
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      await db
        .update(carts)
        .set({ discountId: null as any, updatedAt: new Date() })
        .where(eq(carts.id, cart.id));
      return { success: true };
    } catch (err: any) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to clear cart' });
    }
  }),

  applyDiscount: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        const buyer = await ensureBuyer(userId);
        const cart = await ensureCart(buyer.id);
        const rows = await db.select().from(discounts).where(eq(discounts.code, input.code));
        const disc = rows[0];
        if (!disc || !disc.active) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid discount code' });
        if (disc.expiresAt && new Date(disc.expiresAt) < new Date()) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Discount expired' });
        const [updated] = await db
          .update(carts)
          .set({ discountId: disc.id, updatedAt: new Date() })
          .where(eq(carts.id, cart.id))
          .returning();
        return updated;
      } catch (err: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Failed to apply discount' });
      }
    }),

  checkout: protectedProcedure
    .input(
      z.object({
        shipping: z
          .object({
            fullName: z.string().min(1),
            email: z.string().email(),
            phoneNumber: z.string().min(3),
            state: z.string().min(1),
            city: z.string().min(1),
            address: z.string().min(1),
            postalCode: z.string().min(1),
          })
          .optional(),
        paymentMethod: z.enum(['card', 'bank_transfer', 'paypal', 'stripe', 'flutterwave', 'crypto']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const buyer = await ensureBuyer(userId);
      const cart = await ensureCart(buyer.id);
      const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
      if (items.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });

      // Shipping: use provided or default existing
      let ship = (await db.select().from(buyerShipping).where(and(eq(buyerShipping.buyerId, buyer.id), eq(buyerShipping.isDefault, true))))[0];
      if (input.shipping) {
        if (ship) {
          await db
            .update(buyerShipping)
            .set({ ...input.shipping })
            .where(eq(buyerShipping.id, ship.id));
        } else {
          const [createdShip] = await db
            .insert(buyerShipping)
            .values({ id: randomUUID(), buyerId: buyer.id, isDefault: true, ...input.shipping })
            .returning();
          ship = createdShip;
        }
      } else if (!ship) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Shipping information required' });
      }

      // Totals
      let subtotal = 0;
      for (const it of items) subtotal += it.unitPriceCents * it.quantity;
      let discountCents = 0;
      let discountRow = null as any;
      if (cart.discountId) {
        discountRow = (await db.select().from(discounts).where(eq(discounts.id, cart.discountId)))[0];
        if (discountRow && discountRow.active && (!discountRow.expiresAt || new Date(discountRow.expiresAt) > new Date())) {
          if (discountRow.percentOff) discountCents = Math.floor((subtotal * discountRow.percentOff) / 100);
          if (discountRow.amountOffCents) discountCents += discountRow.amountOffCents;
        }
      }
      const total = Math.max(0, subtotal - discountCents);

      // Create orders per item
      const createdOrders = [] as any[];
      for (const it of items) {
        const listingRow = (await db.select().from(listings).where(eq(listings.id, it.listingId)))[0];
        if (!listingRow) continue;
        const sellerRow = (await db.select().from(sellers).where(eq(sellers.id, listingRow.sellerId)))[0];
        if (!sellerRow) continue;
        const orderId = randomUUID();
        const [order] = await db
          .insert(orders)
          .values({
            id: orderId,
            sellerId: sellerRow.id,
            listingId: listingRow.id,
            productTitle: listingRow.title,
            productCategory: listingRow.category!,
            customerName: ship!.fullName,
            customerEmail: ship!.email,
            paymentMethod: input.paymentMethod,
            amountCents: it.unitPriceCents * it.quantity, // per item line total
            currency: it.currency,
          })
          .returning();
        createdOrders.push(order);

        // decrement stock if limited
        if (listingRow.supplyCapacity === 'limited' && listingRow.quantityAvailable != null) {
          await db
            .update(listings)
            .set({ quantityAvailable: Math.max(0, (listingRow.quantityAvailable || 0) - it.quantity) })
            .where(eq(listings.id, listingRow.id));
        }
      }

      // Clear cart
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      await db.update(carts).set({ discountId: null as any, updatedAt: new Date() }).where(eq(carts.id, cart.id));

      return { orders: createdOrders, subtotal, discountCents, total };
    }),
});
