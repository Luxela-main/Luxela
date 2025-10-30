import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '../db';
import { buyers, buyerAccountDetails, buyerBillingAddress, carts, cartItems, discounts, listings, orders, sellers } from '../db/schema';
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

const CartOutput = z.object({
  cart: z.object({
    id: z.string().uuid(),
    discountId: z.string().uuid().nullable().optional(),
  }),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      cartId: z.string().uuid(),
      listingId: z.string().uuid(),
      quantity: z.number().int(),
      unitPriceCents: z.number().int(),
      currency: z.string(),
    })
  ),
  discount: z
    .object({
      id: z.string().uuid(),
      code: z.string(),
      percentOff: z.number().nullable().optional(),
      amountOffCents: z.number().nullable().optional(),
      active: z.boolean(),
      expiresAt: z.date().nullable().optional(),
    })
    .nullable(),
});

export const cartRouter = createTRPCRouter({
  getCart: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/cart',
        tags: ['Cart'],
        summary: 'Get user cart',
      },
    })
    .output(CartOutput)
    .query(async ({ ctx }) => {
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
    .meta({
      openapi: {
        method: 'POST',
        path: '/cart/add',
        tags: ['Cart'],
        summary: 'Add an item to the user cart',
        description: 'Adds a listing to the authenticated user cart or increases quantity if it already exists.',
      },
    })
    .input(z.object({ listingId: z.string().uuid(), quantity: z.number().int().positive().default(1) }))
    .output(
      z.object({
        id: z.string().uuid(),
        cartId: z.string().uuid(),
        listingId: z.string().uuid(),
        quantity: z.number().int(),
        unitPriceCents: z.number().int(),
        currency: z.string(),
      })
    )
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
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/cart/item',
        tags: ['Cart'],
        summary: 'Set or update the quantity of a specific cart item',
        description:
          'Updates the quantity of a specific item in the user cart. If the quantity is set to 0, the item is removed from the cart.',
      },
    })
    .input(z.object({ listingId: z.string().uuid(), quantity: z.number().int().nonnegative() }))
    .output(
      z.union([
        z.object({
          id: z.string().uuid(),
          cartId: z.string().uuid(),
          listingId: z.string().uuid(),
          quantity: z.number().int(),
          unitPriceCents: z.number().int(),
          currency: z.string(),
        }),
        z.object({ success: z.literal(true) }),
      ])
    )
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
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/cart/item',
        tags: ['Cart'],
        summary: 'Remove an item from the cart',
        description: 'Removes a specific product listing from the user cart by its listing ID.',
      },
    })
    .input(z.object({ listingId: z.string().uuid() }))
    .output(
      z.object({
        success: z.literal(true).describe('Indicates that the item was successfully removed'),
      })
    )
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

  clearCart: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/cart/clear',
        tags: ['Cart'],
        summary: 'Clear user cart',
        description: 'Removes all items and any applied discounts from the authenticated user cart.',
      },
    })
    .output(
      z.object({
        success: z.literal(true).describe('Indicates that the cart was successfully cleared'),
      })
    )
    .mutation(async ({ ctx }) => {
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
    .meta({
      openapi: {
        method: 'POST',
        path: '/cart/discount',
        tags: ['Cart'],
        summary: 'Apply discount code to user cart',
        description: 'Applies a valid discount code to the authenticated user cart.',
      },
    })
    .input(z.object({ code: z.string().min(1) }))
    .output(
      z.object({
        id: z.string().uuid().describe('Cart ID'),
        buyerId: z.string().uuid().describe('Buyer ID'),
        discountId: z.string().uuid().nullable().describe('Applied discount ID'),
        updatedAt: z.date().describe('Timestamp of cart update'),
      })
    )
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
    .meta({
      openapi: {
        method: 'POST',
        path: '/checkout',
        tags: ['Cart'],
        summary: 'Checkout and create orders',
        description:
          'Performs checkout for the authenticated buyer. Creates orders for all items in the user cart, applies discounts, updates stock quantities, and clears the cart after success. Uses buyer account details and billing address for shipping information.',
      },
    })
    .input(
      z.object({
        paymentMethod: z.enum(['card', 'bank_transfer', 'paypal', 'stripe', 'flutterwave', 'crypto']),
      })
    )
    .output(
      z.object({
        orders: z.array(
          z.object({
            id: z.string().uuid(),
            sellerId: z.string().uuid(),
            listingId: z.string().uuid(),
            productTitle: z.string(),
            productCategory: z.string(),
            customerName: z.string(),
            customerEmail: z.string().email(),
            paymentMethod: z.enum([
              'card',
              'bank_transfer',
              'paypal',
              'stripe',
              'flutterwave',
              'crypto',
            ]),
            amountCents: z.number().int(),
            currency: z.string(),
          })
        ),
        subtotal: z.number().int(),
        discountCents: z.number().int(),
        total: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        const buyer = await ensureBuyer(userId);
        const cart = await ensureCart(buyer.id);
        const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cart.id));

        if (items.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });

        // Get buyer account details and billing address
        const accountDetails = await db
          .select()
          .from(buyerAccountDetails)
          .where(eq(buyerAccountDetails.buyerId, buyer.id))
          .then((r) => r[0]);

        const billingAddress = await db
          .select()
          .from(buyerBillingAddress)
          .where(
            and(
              eq(buyerBillingAddress.buyerId, buyer.id),
              eq(buyerBillingAddress.isDefault, true)
            )
          )
          .then((r) => r[0]);

        if (!accountDetails) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Account details required for checkout' });
        if (!billingAddress) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Billing address required for checkout' });

        // Build complete shipping address
        const shippingAddress = `${billingAddress.houseAddress}, ${billingAddress.city}, ${accountDetails.state}, ${accountDetails.country} ${billingAddress.postalCode}`;

        // Calculate totals
        let subtotal = 0;
        for (const it of items) subtotal += it.unitPriceCents * it.quantity;

        let discountCents = 0;
        if (cart.discountId) {
          const discountRow = await db.select().from(discounts).where(eq(discounts.id, cart.discountId)).then((r) => r[0]);
          if (discountRow && discountRow.active && (!discountRow.expiresAt || new Date(discountRow.expiresAt) > new Date())) {
            if (discountRow.percentOff) discountCents = Math.floor((subtotal * discountRow.percentOff) / 100);
            if (discountRow.amountOffCents) discountCents += discountRow.amountOffCents;
          }
        }

        const total = Math.max(0, subtotal - discountCents);

        // Create orders per item
        const createdOrders = [] as any[];
        for (const it of items) {
          const listingRow = await db.select().from(listings).where(eq(listings.id, it.listingId)).then((r) => r[0]);
          if (!listingRow) continue;

          const sellerRow = await db.select().from(sellers).where(eq(sellers.id, listingRow.sellerId)).then((r) => r[0]);
          if (!sellerRow) continue;

          const orderId = randomUUID();
          const [order] = await db
            .insert(orders)
            .values({
              id: orderId,
              buyerId: buyer.id,
              sellerId: sellerRow.id,
              listingId: listingRow.id,
              productTitle: listingRow.title,
              productImage: listingRow.image,
              productCategory: listingRow.category!,
              customerName: accountDetails.fullName,
              customerEmail: accountDetails.email,
              paymentMethod: input.paymentMethod,
              amountCents: it.unitPriceCents * it.quantity,
              currency: it.currency,
              shippingAddress: shippingAddress,
            })
            .returning();

          createdOrders.push(order);

          // Decrement stock if limited
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
      } catch (err: any) {
        console.error('Checkout error:', err);
        throw new TRPCError({ code: 'BAD_REQUEST', message: err?.message || 'Checkout failed' });
      }
    }),
});