import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { db } from '../db';
import { buyers, buyerAccountDetails, buyerBillingAddress, carts, cartItems, discounts, listings, orders, sellers, productImages } from '../db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from "uuid";
import {
  notifyItemAddedToCart,
  notifyItemRemovedFromCart,
  notifyCartCleared,
} from '../services/buyerNotificationService';

// Valid product category enum values
const VALID_PRODUCT_CATEGORIES = [
  'men_clothing',
  'women_clothing',
  'men_shoes',
  'women_shoes',
  'accessories',
  'merch',
  'others',
] as const;

async function ensureBuyer(userId: string) {
  const existing = await db.select().from(buyers).where(eq(buyers.userId, userId));
  if (existing[0]) return existing[0];
  const [created] = await db
    .insert(buyers)
    .values({ id: uuidv4(), userId, createdAt: new Date(), updatedAt: new Date() })
    .returning();
  return created;
}

async function ensureCart(buyerId: string) {
  const existing = await db.select().from(carts).where(eq(carts.buyerId, buyerId));
  if (existing[0]) return existing[0];
  const [created] = await db
    .insert(carts)
    .values({ id: uuidv4(), buyerId, createdAt: new Date(), updatedAt: new Date() })
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
      name: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
      imagesJson: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      colors: z.array(z.any()).nullable().optional(),
      sizes: z.array(z.string()).nullable().optional(),
      material_composition: z.string().nullable().optional(),
      careInstructions: z.string().nullable().optional(),
      refundPolicy: z.string().nullable().optional(),
      videoUrl: z.string().nullable().optional(),
      shippingOption: z.string().nullable().optional(),
      etaDomestic: z.string().nullable().optional(),
      etaInternational: z.string().nullable().optional(),
      sku: z.string().nullable().optional(),
      barcode: z.string().nullable().optional(),
      metaDescription: z.string().nullable().optional(),
      category: z.string().nullable().optional(),
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
        
        // Join cart items with listings to get product details including productId for collection items
        const query = db
          .select({
            // Cart item fields
            id: cartItems.id,
            cartId: cartItems.cartId,
            listingId: cartItems.listingId,
            quantity: cartItems.quantity,
            unitPriceCents: cartItems.unitPriceCents,
            currency: cartItems.currency,
            // Product details from listing
            name: listings.title,
            image: listings.image,
            imagesJson: listings.imagesJson,
            description: listings.description,
            // Product reference for collection items image fallback
            productId: listings.productId,
            // Collection item details with colors and sizes
            itemsJson: listings.itemsJson,
            // Additional listing details
            materialComposition: listings.materialComposition,
            colorsAvailable: listings.colorsAvailable,
            sizesJson: listings.sizesJson,
            careInstructions: listings.careInstructions,
            refundPolicy: listings.refundPolicy,
            videoUrl: listings.videoUrl,
            shippingOption: listings.shippingOption,
            etaDomestic: listings.etaDomestic,
            etaInternational: listings.etaInternational,
            sku: listings.sku,
            barcode: listings.barcode,
            metaDescription: listings.metaDescription,
            category: listings.category,
          })
          .from(cartItems)
          .leftJoin(listings, eq(cartItems.listingId, listings.id))
          .where(eq(cartItems.cartId, cart.id));
        
        let items = await query;
        
        // Parse and enrich items with all collection details
        items = items.map((item: any) => {
          // Parse colors from colorsAvailable
          if (item.colorsAvailable) {
            try {
              if (typeof item.colorsAvailable === 'string') {
                item.colors = JSON.parse(item.colorsAvailable);
              } else if (Array.isArray(item.colorsAvailable)) {
                item.colors = item.colorsAvailable;
              }
            } catch (e) {
              console.error('[Cart] Failed to parse colorsAvailable:', e);
              item.colors = undefined;
            }
          }
          
          // Parse sizes from sizesJson
          if (item.sizesJson) {
            try {
              if (typeof item.sizesJson === 'string') {
                item.sizes = JSON.parse(item.sizesJson);
              } else if (Array.isArray(item.sizesJson)) {
                item.sizes = item.sizesJson;
              }
            } catch (e) {
              console.error('[Cart] Failed to parse sizesJson:', e);
              item.sizes = undefined;
            }
          }
          
          // Map material composition
          if (item.materialComposition) {
            item.material_composition = item.materialComposition;
          }
          
          return item;
        });
        
        // Enhance items with product images
        
        // Enhance items with product images and collection details (colors, sizes)
        const itemsWithProductImages = await Promise.all(
          items.map(async (item: any) => {
            // If listing has image, use it directly
            if (item.image) {
              console.log(`[Cart getCart] Item: ${item.name} - hasImage: true (from listing.image)`);
              return item;
            }
            
            // If listing has imagesJson, try to parse first image
            if (item.imagesJson) {
              try {
                let images: any[] | any;
                if (typeof item.imagesJson === 'string') {
                  const parsed = JSON.parse(item.imagesJson);
                  images = Array.isArray(parsed) ? parsed : [parsed];
                } else if (Array.isArray(item.imagesJson)) {
                  images = item.imagesJson;
                } else {
                  images = [];
                }
                
                if (Array.isArray(images) && images.length > 0) {
                  item.image = images[0];
                  console.log(`[Cart getCart] Item: ${item.name} - hasImage: true (from imagesJson)`);
                  return item;
                }
              } catch (e) {
                console.error('[Cart] Failed to parse imagesJson:', e);
              }
            }
            
            // For collection items without listing image, fetch from productImages table
            if (item.productId) {
              try {
                const productImgs = await db
                  .select({ imageUrl: productImages.imageUrl })
                  .from(productImages)
                  .where(eq(productImages.productId, item.productId))
                  .limit(1);
                
                if (productImgs.length > 0) {
                  item.image = productImgs[0].imageUrl;
                  console.log(`[Cart getCart] Item: ${item.name} - hasImage: true (from productImages)`);
                }
                
                return item;
              } catch (e) {
                console.error('[Cart] Failed to fetch product images:', e);
              }
            }
            
            console.log(`[Cart getCart] Item: ${item.name} - hasImage: false (no image found)`);
            return item;
          })
        );
        
        const discountRow = cart.discountId
          ? (await db.select().from(discounts).where(eq(discounts.id, cart.discountId)))[0]
          : null;
        return { cart, items: itemsWithProductImages, discount: discountRow || null };
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
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in to add items to cart' });
      try {
        const buyer = await ensureBuyer(userId);
        const cart = await ensureCart(buyer.id);
        const listingRows = await db.select().from(listings).where(eq(listings.id, input.listingId));
        const listing = listingRows[0];
        if (!listing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        
        console.log(`[addToCart] Listing:`, { listingId: listing.id, title: listing.title, hasImage: !!listing.image });
        if (listing.status !== 'approved') throw new TRPCError({ code: 'BAD_REQUEST', message: `Product is not available for purchase (status: ${listing.status})` });
        // CRITICAL: Validate price data exists before adding to cart
        if (!listing.priceCents || listing.priceCents <= 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Product price is not set. Please contact the seller.' });
        if (!listing.currency) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Product currency is not configured. Please contact the seller.' });
        // Allow both single listings and items within collections
        if (listing.type !== 'single' && !listing.collectionId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only single products or collection items can be added to cart.' });
        }


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
              id: uuidv4(),
              cartId: cart.id,
              listingId: input.listingId,
              quantity: input.quantity,
              unitPriceCents: listing.priceCents || 0,
              currency: listing.currency || 'USD',
            })
            .returning();
          
          // Notify buyer
          try {
            await notifyItemAddedToCart(
              buyer.id,
              input.listingId,
              listing.title || 'Product',
              input.quantity
            );
          } catch (notifError) {
            console.error('Failed to send cart notification:', notifError);
            // Don't throw - notification failure shouldn't block cart operations
          }
          
          return created;
        }
      } catch (err: any) {
        // Ensure we always have a message
        let errorMessage = 'Failed to add to cart';
        
        if (err instanceof TRPCError) {
          errorMessage = err.message || errorMessage;
        } else if (err?.message) {
          errorMessage = err.message;
        } else if (err?.toString && typeof err.toString === 'function') {
          const str = err.toString();
          if (str && str !== '[object Object]') {
            errorMessage = str;
          }
        }
        
        console.error('[Cart.addToCart] Error:', {
          listingId: input.listingId,
          quantity: input.quantity,
          message: errorMessage,
          code: err?.code,
        });
        
        if (err instanceof TRPCError) {
          throw err;
        }
        throw new TRPCError({ code: 'BAD_REQUEST', message: errorMessage });
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
          
          // Notify buyer - fetch listing for product title
          try {
            const listing = await db
              .select()
              .from(listings)
              .where(eq(listings.id, input.listingId))
              .then((r: any) => r[0]);
            
            if (listing) {
              await notifyItemRemovedFromCart(buyer.id, input.listingId, listing.title || 'Product');
            }
          } catch (notifError) {
            console.error('Failed to send cart notification:', notifError);
          }
          
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
        
        // Notify buyer
        try {
          await notifyCartCleared(buyer.id);
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
        
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
        paymentMethod: z.enum(['card', 'bank_transfer', 'crypto']),
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

        // Get buyer account details - auto-create if missing
        let accountDetails = await db
          .select()
          .from(buyerAccountDetails)
          .where(eq(buyerAccountDetails.buyerId, buyer.id))
          .then((r: any) => r[0]);

        if (!accountDetails) {
          // Auto-create minimal account details from auth user
          const buyerIdShort = buyer.id.substring(0, 8);
          const userEmail = ctx.user?.email || `buyer-${buyerIdShort}@luxela.local`;
          const fullName = ctx.user?.name || ctx.user?.email?.split('@')[0] || 'Buyer';
          
          // Generate unique username with collision handling
          let username: string;
          let usernameAttempt = 0;
          const maxAttempts = 5;
          
          while (usernameAttempt < maxAttempts) {
            username = usernameAttempt === 0 
              ? `buyer_${buyerIdShort}`
              : `buyer_${buyerIdShort}_${Math.random().toString(36).substring(7)}`;
            
            try {
              const [created] = await db
                .insert(buyerAccountDetails)
                .values({
                  id: uuidv4(),
                  buyerId: buyer.id,
                  username: username,
                  fullName: fullName,
                  email: userEmail,
                  country: 'Nigeria',
                  state: 'Lagos',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
                .returning();
              accountDetails = created;
              break; // Success - exit loop
            } catch (err: any) {
              usernameAttempt++;
              // If this is the last attempt, or if it's a different error type, throw
              if (usernameAttempt >= maxAttempts || !err?.message?.includes('unique')) {
                // Try to fetch existing account (race condition)
                const existing = await db
                  .select()
                  .from(buyerAccountDetails)
                  .where(eq(buyerAccountDetails.buyerId, buyer.id))
                  .then((r: any) => r[0]);
                
                if (existing) {
                  accountDetails = existing;
                  break; // Found existing, use it
                } else {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Failed to create buyer account details. Please try again.',
                  });
                }
              }
              // Otherwise, continue loop to retry with different username
            }
          }
        }

        const billingAddress = await db
          .select()
          .from(buyerBillingAddress)
          .where(
            and(
              eq(buyerBillingAddress.buyerId, buyer.id),
              eq(buyerBillingAddress.isDefault, true)
            )
          )
          .then((r: any) => r[0]);

        if (!billingAddress) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Billing address required for checkout. Please add a delivery address.' });

        // Build complete shipping address
        const shippingAddress = `${billingAddress.houseAddress}, ${billingAddress.city}, ${accountDetails.state}, ${accountDetails.country} ${billingAddress.postalCode}`;

        // Calculate totals
        let subtotal = 0;
        for (const it of items) subtotal += it.unitPriceCents * it.quantity;

        let discountCents = 0;
        if (cart.discountId) {
          const discountRow = await db.select().from(discounts).where(eq(discounts.id, cart.discountId)).then((r: any) => r[0]);
          if (discountRow && discountRow.active && (!discountRow.expiresAt || new Date(discountRow.expiresAt) > new Date())) {
            if (discountRow.percentOff) discountCents = Math.floor((subtotal * discountRow.percentOff) / 100);
            if (discountRow.amountOffCents) discountCents += discountRow.amountOffCents;
          }
        }

        const total = Math.max(0, subtotal - discountCents);

        // Create orders per item
        const createdOrders = [] as any[];
        for (const it of items) {
          const listingRow = await db.select().from(listings).where(eq(listings.id, it.listingId)).then((r: any) => r[0]);
          if (!listingRow) continue;

          const sellerRow = await db.select().from(sellers).where(eq(sellers.id, listingRow.sellerId)).then((r: any) => r[0]);
          if (!sellerRow) continue;

          const orderId = uuidv4();
          
          // Validate product category before inserting
          let category = listingRow.category || 'accessories';
          if (!VALID_PRODUCT_CATEGORIES.includes(category as any)) {
            console.warn(`Invalid product category '${category}' for listing ${listingRow.id}, defaulting to 'accessories'`);
            category = 'accessories';
          }
          
          const [order] = await db
            .insert(orders)
            .values({
              id: orderId,
              buyerId: buyer.id,
              sellerId: sellerRow.id,
              listingId: listingRow.id,
              productTitle: listingRow.title,
              productImage: listingRow.image || undefined,
              productCategory: category,
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