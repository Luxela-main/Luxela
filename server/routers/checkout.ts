import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { carts, cartItems, orders, payments, listings, buyers, buyerNotifications, shippingRates } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  createOrderFromCart,
  createPaymentHold,
  confirmPayment,
  getBuyerActiveOrders,
} from '../services/escrowService';
import { notifyDeliveryConfirmed } from '../services/notificationService';
import { buyerConfirmDelivery } from '../services/orderConfirmationService';
import {
  createFiatPaymentLink,
  createStablecoinPaymentLink,
  createCheckoutSession,
  verifyPayment as verifyTsaraPayment,
} from '../services/tsara';
import { getBuyer } from './utils';

/**
 * Checkout Router - Handles buyer payment and order flow
 * 
 * Flow:
 * 1. prepareCheckout - Validate cart and calculate totals
 * 2. initializePayment - Create Tsara payment link
 * 3. confirmCheckout - Verify payment and create order
 * 4. confirmDelivery - Buyer confirms receipt
 */

const CheckoutInput = z.object({
  customerName: z.string().min(2).max(255),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),
  paymentMethod: z.enum(['card', 'bank_transfer', 'crypto']),
  currency: z.string().default('NGN'),
  redirectUrl: z.string().url().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const CheckoutOutput = z.object({
  orderId: z.string().uuid(),
  totalAmount: z.number(),
  currency: z.string(),
  paymentUrl: z.string().url(),
  paymentId: z.string(),
  estimatedDeliveryDays: z.number(),
});

const OrderOutput = z.object({
  id: z.string().uuid(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  listingId: z.string().uuid(),
  amountCents: z.number(),
  currency: z.string(),
  deliveryStatus: z.enum(['not_shipped', 'in_transit', 'delivered']),
  payoutStatus: z.enum(['in_escrow', 'processing', 'paid']),
  createdAt: z.date(),
  updatedAt: z.date(),
  productTitle: z.string().optional(),
  productImage: z.string().optional(),
  orderDate: z.date(),
});

export const checkoutRouter = createTRPCRouter({
  /**
   * Prepare checkout - validate cart and calculate totals
   * Returns cart summary with pricing
   */
  prepareCheckout: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/checkout/prepare',
        tags: ['Checkout'],
        summary: 'Prepare cart for checkout',
      },
    })
    .input(
      z.object({
        cartId: z.string().uuid(),
      })
    )
    .output(
      z.object({
        items: z.array(
          z.object({
            id: z.string().uuid(),
            listingId: z.string().uuid(),
            productTitle: z.string(),
            quantity: z.number().int(),
            unitPriceCents: z.number().int(),
            totalPriceCents: z.number().int(),
            currency: z.string(),
            image: z.string().optional(),
            sellerId: z.string().uuid(),
          })
        ),
        summary: z.object({
          subtotalCents: z.number().int(),
          shippingCents: z.number().int(),
          totalCents: z.number().int(),
          currency: z.string(),
        }),
        sellers: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string(),
            rating: z.number().optional(),
          })
        ),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // Get or create buyer profile
        const buyer = await getBuyer(userId);
        
        const [cart] = await db.select().from(carts).where(eq(carts.id, input.cartId));

        if (!cart || cart.buyerId !== buyer.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Cart not found',
          });
        }

        const items = await db
          .select()
          .from(cartItems)
          .where(eq(cartItems.cartId, cart.id));

        if (!items.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cart is empty',
          });
        }

        // Fetch listing details for each item
        const itemsWithDetails = await Promise.all(
          items.map(async (item: any) => {
            const [listing] = await db
              .select()
              .from(listings)
              .where(eq(listings.id, item.listingId));

            if (!listing) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: `Listing ${item.listingId} not found`,
              });
            }

            // Use imagesJson as fallback when image is NULL
            let imageUrl = listing.image;
            if (!imageUrl && listing.imagesJson) {
              try {
                const images = JSON.parse(listing.imagesJson);
                if (Array.isArray(images) && images.length > 0) {
                  imageUrl = images[0];
                } else if (images && images.imageUrl) {
                  imageUrl = images.imageUrl;
                }
              } catch (e) {
                // Fall back to empty if parsing fails
              }
            }

            return {
              id: item.id,
              listingId: item.listingId,
              productTitle: listing.title,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              totalPriceCents: item.unitPriceCents * item.quantity,
              currency: item.currency,
              image: imageUrl || undefined,
              sellerId: listing.sellerId,
            };
          })
        );

        // Calculate subtotal
        const subtotalCents = itemsWithDetails.reduce((sum: any, item: any) => sum + item.totalPriceCents, 0);
        
        // Calculate shipping cost dynamically from seller settings
        let shippingCents = 0;
        
        try {
          // Group items by seller
          const sellerGroups = new Map<string, typeof itemsWithDetails>();
          itemsWithDetails.forEach((item) => {
            if (!sellerGroups.has(item.sellerId)) {
              sellerGroups.set(item.sellerId, []);
            }
            sellerGroups.get(item.sellerId)!.push(item);
          });
          
          // Calculate shipping for each seller and sum them up
          for (const [sellerId] of sellerGroups.entries()) {
            try {
              // Fetch active shipping rates for this seller (get most recent)
              const sellerShippingRates = await db
                .select()
                .from(shippingRates)
                .where(
                  and(
                    eq(shippingRates.sellerId, sellerId),
                    eq(shippingRates.active, true)
                  )
                )
                .orderBy(sql`${shippingRates.createdAt} DESC`)
                .limit(1);
              
              if (sellerShippingRates.length > 0) {
                const rate = sellerShippingRates[0];
                // Add this seller's shipping cost
                shippingCents += rate.rateCents || 0;
              }
              // If no shipping rates configured for this seller, default to free shipping for them
            } catch (sellerShippingErr) {
              console.warn(`Failed to fetch shipping rates for seller ${sellerId}:`, sellerShippingErr);
              // Default to free shipping for this seller on error
            }
          }
        } catch (shippingErr) {
          console.warn('Failed to calculate shipping:', shippingErr);
          // Default to free shipping on error
          shippingCents = 0;
        }
        
        const totalCents = subtotalCents + shippingCents;

        // Get unique sellers
        const sellerIds = [...new Set(itemsWithDetails.map((item) => item.sellerId))];
        const sellers = sellerIds.map((sellerId) => ({
          id: sellerId,
          name: `Seller ${sellerId.slice(0, 8)}`,
          rating: 4.5,
        }));

        return {
          items: itemsWithDetails,
          summary: {
            subtotalCents,
            shippingCents,
            totalCents,
            currency: items[0].currency,
          },
          sellers,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err?.message || 'Failed to prepare checkout',
        });
      }
    }),

  /**
   * Initialize payment - Create Tsara payment link
   * Returns payment URL for redirect
   */
  initializePayment: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/checkout/initialize-payment',
        tags: ['Checkout'],
        summary: 'Initialize payment with Tsara',
      },
    })
    .input(CheckoutInput)
    .output(
      z.object({
        paymentId: z.string(),
        paymentUrl: z.string().url(),
        orderId: z.string().uuid(),
        totalAmount: z.number(),
        transactionRef: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // Get or create buyer profile
        const buyer = await getBuyer(userId);
        
        // Get buyer's cart
        const cartResult = await db
          .select()
          .from(carts)
          .where(eq(carts.buyerId, buyer.id))
          .limit(1);

        const cart = cartResult[0];

        if (!cart) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Cart not found',
          });
        }

        const items = await db
          .select()
          .from(cartItems)
          .where(eq(cartItems.cartId, cart.id));

        if (!items.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cart is empty',
          });
        }

        // Get all unique sellers from cart items
        const itemsWithListings = await Promise.all(
          items.map(async (item: any) => {
            const [listing] = await db
              .select()
              .from(listings)
              .where(eq(listings.id, item.listingId))
              .limit(1);
            return { item, listing };
          })
        );

        // Validate all listings exist
        const missingListings = itemsWithListings.filter((x) => !x.listing);
        if (missingListings.length > 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Some items in your cart are no longer available',
          });
        }

        // Check if all items are from the same seller
        const sellerIds = new Set(itemsWithListings.map((x) => x.listing!.sellerId));
        if (sellerIds.size > 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Your cart contains items from multiple sellers. Please remove items or create separate orders.',
          });
        }

        // Calculate subtotal and shipping
        const subtotalCents = items.reduce((sum: any, item: any) => sum + item.unitPriceCents * item.quantity, 0);
        
        // Get seller ID from the primary listing (already validated to be same for all items)
        const sellerId = itemsWithListings[0].listing!.sellerId;
        
        // Calculate shipping cost dynamically from seller settings
        let shippingCents = 0;
        try {
          // Fetch active shipping rates for this seller (get most recent)
          const sellerShippingRates = await db
            .select()
            .from(shippingRates)
            .where(
              and(
                eq(shippingRates.sellerId, sellerId),
                eq(shippingRates.active, true)
              )
            )
            .orderBy(sql`${shippingRates.createdAt} DESC`)
            .limit(1);
          
          if (sellerShippingRates.length > 0) {
            const rate = sellerShippingRates[0];
            shippingCents = rate.rateCents || 0;
          }
          // If no shipping rates configured, default to free shipping
        } catch (shippingErr) {
          console.warn('Failed to fetch shipping rates for payment:', shippingErr);
          // Default to free shipping on error
          shippingCents = 0;
        }
        
        const totalCents = subtotalCents + shippingCents;
        const totalAmount = totalCents / 100; // Convert to currency units

        // Generate IDs before payment initialization (but don't create order yet)
        const paymentId = uuidv4();
        const orderId = uuidv4();
        const transactionRef = `order_${orderId}`;

        // Validate payment method
        if (!['card', 'bank_transfer', 'crypto'].includes(input.paymentMethod)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid payment method',
          });
        }

        // Note: We don't create the order until AFTER successful payment initialization

        // Create Tsara payment link
        let paymentResponse;

        const paymentMetadata = {
          orderId,
          buyerId: buyer.id,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          shippingAddress: input.shippingAddress || '',
          shippingCity: input.shippingCity || '',
          shippingState: input.shippingState || '',
          shippingPostalCode: input.shippingPostalCode || '',
          shippingCountry: input.shippingCountry || '',
        };

        if (input.paymentMethod === 'crypto') {
          // Stablecoin payment via Solana
          paymentResponse = await createStablecoinPaymentLink({
            amount: totalCents.toString(),
            asset: 'USDC',
            network: 'solana',
            wallet_id: buyer.id,
            description: `Fashion purchase - Order ${orderId}`,
            metadata: paymentMetadata,
          });
        } else {
          // Fiat payment (card or bank transfer)
          if (input.successUrl && input.cancelUrl) {
            paymentResponse = await createCheckoutSession({
              amount: totalCents,
              currency: input.currency,
              reference: transactionRef,
              customer_id: buyer.id,
              success_url: input.successUrl,
              cancel_url: input.cancelUrl,
              metadata: paymentMetadata,
            });
          } else {
            paymentResponse = await createFiatPaymentLink({
              amount: totalCents,
              currency: input.currency,
              description: `Fashion purchase - Order ${orderId}`,
              customer_id: buyer.id,
              redirect_url: input.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
              metadata: paymentMetadata,
            });
          }
        }

        // Now that payment initialization succeeded, create the order
        const orderResult = await createOrderFromCart(
          buyer.id,
          sellerId,
          items.map((item: any) => ({
            listingId: item.listingId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            currency: item.currency,
          })),
          input.customerName,
          input.customerEmail,
          input.paymentMethod,
          orderId,
          shippingCents // Include shipping fee in order
        );
        
        // Use the actual orderId from the created order
        const actualOrderId = orderResult.orderId;

        // Store payment in database
        const [payment] = await db
          .insert(payments)
          .values({
            id: paymentId,
            buyerId: buyer.id,
            listingId: items[0].listingId,
            orderId: actualOrderId,
            amountCents: totalCents,
            currency: input.currency,
            paymentMethod: input.paymentMethod as any,
            provider: 'tsara',
            status: 'pending',
            transactionRef,
            gatewayResponse: JSON.stringify(paymentResponse),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // Extract payment URL from response
        let paymentUrl: string;
        if (typeof paymentResponse === 'string') {
          paymentUrl = paymentResponse;
        } else if (paymentResponse?.data) {
          // Handle TsaraResponse wrapper
          const data = paymentResponse.data;
          if ('url' in data) {
            // PaymentLink or StablecoinPaymentLink
            paymentUrl = data.url;
          } else if ('checkout_url' in data) {
            // CheckoutSession
            paymentUrl = data.checkout_url;
          } else {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to extract payment URL from provider response',
            });
          }
        } else {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate payment URL from provider',
          });
        }

        if (!paymentUrl || !paymentUrl.startsWith('http')) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Invalid payment URL received from provider',
          });
        }

        return {
          paymentId: payment.id,
          paymentUrl,
          orderId: actualOrderId,
          totalAmount,
          transactionRef,
        };
      } catch (err: any) {
        console.error('Payment initialization error:', {
          message: err?.message,
          code: err?.code,
          status: err?.status,
          response: err?.response?.data,
          tsaraError: (err as any).tsaraError,
        });
        
        // Extract error message from various sources, prioritizing user-friendly messages
        let errorMessage = 'Payment initialization failed. Please try again.';
        let errorCode = 'BAD_REQUEST';
        
        try {
          // Try to get message from custom error properties (set by tsara.ts)
          if (err?.message && typeof err.message === 'string' && err.message.length > 0) {
            errorMessage = err.message;
            errorCode = err.code || 'BAD_REQUEST';
          }
          // Try Axios error response structure
          else if (err?.response?.data?.error?.message) {
            errorMessage = err.response.data.error.message;
            errorCode = err.response.data.error.code || 'BAD_REQUEST';
          }
          // Try generic Tsara response
          else if (err?.response?.data?.message) {
            errorMessage = err.response.data.message;
          }
        } catch (msgErr) {
          console.error('Error extracting error message from exception:', msgErr);
        }
        
        // Ensure message is never empty or corrupted
        if (!errorMessage || (typeof errorMessage === 'string' && errorMessage.trim().length === 0)) {
          errorMessage = 'Payment service error. Please try again or contact support.';
        }
        
        // Validate and map error code to valid tRPC codes
        const validTRPCCodes = ['BAD_REQUEST', 'INTERNAL_SERVER_ERROR', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'TIMEOUT', 'CONFLICT', 'PRECONDITION_FAILED', 'UNPROCESSABLE_CONTENT', 'TOO_MANY_REQUESTS', 'CLIENT_CLOSED_REQUEST'] as const;
        const mappedCode: typeof validTRPCCodes[number] = (typeof errorCode === 'string' && (validTRPCCodes as readonly string[]).includes(errorCode)) ? (errorCode as typeof validTRPCCodes[number]) : 'INTERNAL_SERVER_ERROR';
        
        throw new TRPCError({
          code: mappedCode,
          message: errorMessage,
          cause: err,
        });
      }
    }),

  /**
   * Confirm checkout - Verify payment and activate escrow hold
   * Called after successful Tsara payment callback
   */
  confirmCheckout: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/checkout/confirm',
        tags: ['Checkout'],
        summary: 'Confirm payment and create order',
      },
    })
    .input(
      z.object({
        paymentId: z.string().uuid(),
        transactionRef: z.string(),
      })
    )
    .output(CheckoutOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // Get or create buyer profile
        const buyer = await getBuyer(userId);

        // Verify payment with Tsara - CRITICAL CHECK
        let verification: any;
        try {
          verification = await verifyTsaraPayment(input.transactionRef);
        } catch (verifyErr: any) {
          console.error('Critical: Payment verification error', verifyErr);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to verify payment with provider. Please contact support.',
          });
        }

        // Verify payment was actually successful
        if (!verification || !verification.success) {
          console.error('Payment verification failed: invalid response structure', verification);
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Payment verification returned invalid response',
          });
        }

        if (verification.data?.status !== 'success') {
          console.error('Payment not successful. Status:', verification.data?.status);
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: `Payment verification failed - Status: ${verification.data?.status || 'unknown'}`,
          });
        }

        // Get payment record
        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.id, input.paymentId));

        if (!payment || payment.buyerId !== buyer.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Payment not found',
          });
        }

        if (!payment.orderId) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Order not associated with payment',
          });
        }

        // Confirm payment status - MUST succeed before notification
        let confirmResult;
        try {
          confirmResult = await confirmPayment(input.paymentId, payment.orderId, input.transactionRef);
        } catch (confirmErr: any) {
          console.error('Payment confirmation failed:', confirmErr);
          // If confirmation fails, order cannot proceed
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Payment confirmation failed. Please try again or contact support.',
          });
        }

        // Create payment hold (escrow)
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, payment.orderId));

        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found',
          });
        }

        // Create the hold
        await createPaymentHold(
          input.paymentId,
          payment.orderId,
          order.sellerId,
          order.amountCents,
          order.currency,
          30 // 30-day hold
        );

        // CRITICAL: Verify payment was actually completed before sending notification
        const [finalPaymentCheck] = await db
          .select()
          .from(payments)
          .where(eq(payments.id, input.paymentId));

        if (!finalPaymentCheck || finalPaymentCheck.status !== 'completed') {
          console.error('CRITICAL: Payment status mismatch at notification stage', {
            paymentId: input.paymentId,
            orderId: order.id,
            expectedStatus: 'completed',
            actualStatus: finalPaymentCheck?.status,
            paymentExists: !!finalPaymentCheck,
          });
          
          // Rollback order status to indicate payment pending
          await db
            .update(orders)
            .set({
              orderStatus: 'pending',
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));
          
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Payment verification failed: Payment status not confirmed in system. Please try again.',
          });
        }

        // Create notification for buyer - ONLY after payment is verified in DB
        try {
          await db.insert(buyerNotifications).values({
            id: uuidv4(),
            buyerId: buyer.id,
            type: 'order_placed' as any,
            title: 'Order Placed Successfully',
            message: `Your order #${order.id.slice(0, 8)} for ${order.currency} ${order.amountCents / 100} has been placed successfully! Payment confirmed.`,
            relatedEntityId: order.id,
            relatedEntityType: 'order',
            actionUrl: `/buyer/orders/${order.id}`,
            isRead: false,
            isStarred: false,
            metadata: {
              notificationType: 'order_placed',
              orderId: order.id,
              amount: order.amountCents / 100,
              currency: order.currency,
              sellerId: order.sellerId,
              paymentVerified: true,
              paymentStatus: finalPaymentCheck.status,
              paymentId: input.paymentId,
              verificationTimestamp: new Date().toISOString(),
              tsaraTransactionRef: input.transactionRef,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } catch (notifErr) {
          // Log but don't fail checkout if notification fails
          console.error('Failed to create order notification:', notifErr);
        }

        // Clear cart
        const [cart] = await db
          .select()
          .from(carts)
          .where(and(eq(carts.buyerId, buyer.id)));

        if (cart) {
          await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
        }

        return {
          orderId: order.id,
          totalAmount: order.amountCents / 100,
          currency: order.currency,
          paymentUrl: '', // Not needed after confirmation
          paymentId: input.paymentId,
          estimatedDeliveryDays: 7,
        };
      } catch (err: any) {
        console.error('Checkout confirmation error:', err);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err?.message || 'Checkout confirmation failed',
        });
      }
    }),

  /**
   * Get active orders for buyer
   * Shows all orders in various states
   */
  getBuyerOrders: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/checkout/orders',
        tags: ['Checkout'],
        summary: 'Get buyer orders',
      },
    })
    .input(
      z.object({
        status: z.enum(['active', 'completed', 'all']).default('all'),
      })
    )
    .output(z.array(OrderOutput))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        let query;

        if (input.status === 'active') {
          query = db
            .select()
            .from(orders)
            .where(
              and(
                eq(orders.buyerId, userId),
                eq(orders.deliveryStatus, 'not_shipped')
              )
            );
        } else if (input.status === 'completed') {
          query = db
            .select()
            .from(orders)
            .where(
              and(
                eq(orders.buyerId, userId),
                eq(orders.deliveryStatus, 'delivered')
              )
            );
        } else {
          query = db.select().from(orders).where(eq(orders.buyerId, userId));
        }

        const buyerOrders = await query;

        return buyerOrders.map((order: any) => ({
          id: order.id,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          listingId: order.listingId,
          amountCents: order.amountCents,
          currency: order.currency,
          deliveryStatus: order.deliveryStatus as 'not_shipped' | 'in_transit' | 'delivered',
          payoutStatus: order.payoutStatus as 'in_escrow' | 'processing' | 'paid',
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          productTitle: order.productTitle,
          productImage: order.productImage ?? undefined,
          orderDate: order.orderDate,
        }));
      } catch (err: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err?.message || 'Failed to get orders',
        });
      }
    }),

  /**
   * Confirm delivery - buyer marks order as received
   * Triggers payment hold release and seller payout
   */
  confirmDelivery: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/checkout/confirm-delivery',
        tags: ['Checkout'],
        summary: 'Confirm order delivery',
      },
    })
    .input(
      z.object({
        orderId: z.string().uuid(),
      })
    )
    .output(OrderOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // Use orderConfirmationService which handles hold verification and release
        const updated = await buyerConfirmDelivery(userId, input.orderId);

        return {
          id: updated.id,
          buyerId: updated.buyerId,
          sellerId: updated.sellerId,
          listingId: updated.listingId,
          amountCents: updated.amountCents,
          currency: updated.currency,
          deliveryStatus: updated.deliveryStatus,
          payoutStatus: updated.payoutStatus,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          productTitle: updated.productTitle,
          productImage: updated.productImage || undefined,
          orderDate: updated.orderDate,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err?.message || 'Failed to confirm delivery',
        });
      }
    }),
});