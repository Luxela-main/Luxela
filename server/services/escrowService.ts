import { db } from '../db';
import {
  orders,
  cartItems,
  carts,
  payments,
  paymentHolds,
  financialLedger,
  sellers,
  buyers,
  listings,
} from '../db/schema';
import { and, eq, sum, gte, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';
import { recordSale, recordRefund } from './paymentService';
import { verifyPayment as verifyTsaraPayment } from './tsara';

// Valid product category enum values
const VALID_PRODUCT_CATEGORIES = ['men_clothing', 'women_clothing', 'men_shoes', 'women_shoes', 'accessories', 'merch', 'others'] as const;

/**
 * Escrow Service - Manages the complete payment lifecycle with Tsara
 * Ensures funds are held safely during order processing and released upon completion
 */

export interface EscrowOrder {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amountCents: number;
  currency: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  deliveryStatus: 'not_shipped' | 'in_transit' | 'delivered';
  payoutStatus: 'in_escrow' | 'processing' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

export interface EscrowHold {
  id: string;
  paymentId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  holdStatus: 'active' | 'refunded' | 'released' | 'expired';
  reason: string;
  refundedAt: Date | null;
  releasedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create an order from cart items - initiates escrow process
 * Step 1 in buyer flow: Cart → Order Creation
 */
export async function createOrderFromCart(
  buyerId: string,
  sellerId: string,
  cartItems_: Array<{ listingId: string; quantity: number; unitPriceCents: number; currency: string }>,
  customerName: string,
  customerEmail: string,
  paymentMethod: string
): Promise<{ orderId: string; totalAmountCents: number; totalCurrency: string }> {
  if (!cartItems_.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Cart is empty',
    });
  }

  let totalAmountCents = 0;
  let currency = '';

  const result = await db.transaction(async (tx) => {
    // Verify all items, validate seller, and collect product data
    let primaryListing: any = null;
    let productTitle = '';
    let productImage = '';
    let productCategory: 'men_clothing' | 'women_clothing' | 'men_shoes' | 'women_shoes' | 'accessories' | 'merch' | 'others' = 'accessories';

    for (const item of cartItems_) {
      const [listing] = await tx
        .select()
        .from(listings)
        .where(eq(listings.id, item.listingId));

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Listing ${item.listingId} not found`,
        });
      }

      // Validate seller matches the listing owner
      if (listing.sellerId !== sellerId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Seller mismatch for listing ${item.listingId}`,
        });
      }

      if (listing.type !== 'single') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Listing ${item.listingId} is not a single product`,
        });
      }

      // Capture primary listing details
      if (!primaryListing) {
        primaryListing = listing;
        productTitle = listing.title || 'Product';
        productImage = listing.image || '';
        
        // Validate and set product category - ensure it's a valid enum value
        let category = listing.category || 'accessories';
        if (!VALID_PRODUCT_CATEGORIES.includes(category as any)) {
          console.warn(`Invalid product category '${category}' for listing ${item.listingId}, defaulting to 'accessories'`);
          category = 'accessories';
        }
        productCategory = category as 'men_clothing' | 'women_clothing' | 'men_shoes' | 'women_shoes' | 'accessories' | 'merch' | 'others';
      }

      totalAmountCents += item.unitPriceCents * item.quantity;
      currency = item.currency;
    }

    // Create order in escrow state
    const orderId = uuidv4();
    const now = new Date();

    await tx.insert(orders).values({
      id: orderId,
      buyerId,
      sellerId,
      listingId: cartItems_[0].listingId, // Primary listing
      productTitle: productTitle,
      productImage: productImage,
      productCategory: productCategory,
      customerName,
      customerEmail,
      orderDate: now,
      paymentMethod: paymentMethod as any,
      amountCents: totalAmountCents,
      currency,
      payoutStatus: 'in_escrow',
      deliveryStatus: 'not_shipped',
    });

    return { orderId, totalAmountCents, totalCurrency: currency };
  });

  return result;
}

/**
 * Create payment hold for an order
 * Step 2 in escrow flow: Lock funds on successful payment
 */
export async function createPaymentHold(
  paymentId: string,
  orderId: string,
  sellerId: string,
  amountCents: number,
  currency: string,
  holdDurationDays: number = 30
): Promise<EscrowHold> {
  const now = new Date();
  const releaseableAt = new Date(now.getTime() + holdDurationDays * 24 * 60 * 60 * 1000);

  const [hold] = await db
    .insert(paymentHolds)
    .values({
      sellerId,
      paymentId,
      orderId,
      amountCents,
      currency,
      holdStatus: 'active',
      releaseableAt,
    })
    .returning();

  // Record in financial ledger
  await db.insert(financialLedger).values({
    sellerId,
    orderId,
    transactionType: 'sale',
    amountCents,
    currency,
    status: 'pending',
    description: `Payment hold for order ${orderId}`,
    paymentId,
  });

  return {
    id: hold.id,
    paymentId: hold.paymentId,
    orderId: hold.orderId,
    amountCents: hold.amountCents,
    currency: hold.currency,
    holdStatus: hold.holdStatus,
    reason: hold.reason || '',
    refundedAt: hold.refundedAt,
    releasedAt: hold.releasedAt,
    createdAt: hold.createdAt,
    updatedAt: hold.updatedAt || new Date(),
  };
}

/**
 * Confirm payment and transition order to processing
 * Step 3: Payment confirmation from Tsara webhook
 */
export async function confirmPayment(
  paymentId: string,
  orderId: string,
  transactionRef: string
): Promise<EscrowOrder> {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId));

  if (!payment) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Payment not found',
    });
  }

  // Verify with Tsara
  const verification = await verifyTsaraPayment(transactionRef);

  if (!verification.success || verification.data.status !== 'success') {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Payment verification failed with Tsara',
    });
  }

  // Update payment status
  const [updatedPayment] = await db
    .update(payments)
    .set({
      status: 'completed',
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
    .returning();

  // Update order status
  const [order] = await db
    .update(orders)
    .set({
      payoutStatus: 'in_escrow',
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  return {
    id: order.id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    listingId: order.listingId,
    amountCents: order.amountCents,
    currency: order.currency,
    paymentStatus: 'completed',
    deliveryStatus: order.deliveryStatus as 'not_shipped' | 'in_transit' | 'delivered',
    payoutStatus: 'in_escrow',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * Mark order as shipped - seller action
 * Moves order toward completion
 */
export async function markOrderShipped(
  orderId: string,
  sellerId: string,
  trackingNumber?: string
): Promise<EscrowOrder> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.sellerId, sellerId)));

  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  const [updated] = await db
    .update(orders)
    .set({
      deliveryStatus: 'in_transit',
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  return {
    id: updated.id,
    buyerId: updated.buyerId,
    sellerId: updated.sellerId,
    listingId: updated.listingId,
    amountCents: updated.amountCents,
    currency: updated.currency,
    paymentStatus: 'completed',
    deliveryStatus: 'in_transit',
    payoutStatus: 'in_escrow',
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Confirm delivery - buyer action (or automatic after timeout)
 * Triggers payout process
 */
export async function confirmDelivery(
  orderId: string,
  buyerId: string,
  buyerConfirmation: boolean = true
): Promise<EscrowOrder> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.buyerId, buyerId)));

  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  return await db.transaction(async (tx: any) => {
    // Mark as delivered
    const [updated] = await tx
      .update(orders)
      .set({
        deliveryStatus: 'delivered',
        payoutStatus: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Release payment hold
    const [hold] = await tx
      .select()
      .from(paymentHolds)
      .where(eq(paymentHolds.orderId, orderId));

    if (hold && hold.holdStatus === 'active') {
      await tx
        .update(paymentHolds)
        .set({
          holdStatus: 'released',
          releasedAt: new Date(),
        })
        .where(eq(paymentHolds.id, hold.id));
    }

    return {
      id: updated.id,
      buyerId: updated.buyerId,
      sellerId: updated.sellerId,
      listingId: updated.listingId,
      amountCents: updated.amountCents,
      currency: updated.currency,
      paymentStatus: 'completed',
      deliveryStatus: 'delivered',
      payoutStatus: 'processing',
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    } as any;
  });
}

/**
 * Process refund - handles both buyer-initiated and seller-approved refunds
 * Returns funds to buyer, releases hold
 */
export async function processRefund(
  orderId: string,
  amountCents: number,
  currency: string,
  reason: string,
  refundType: 'full' | 'partial' = 'full'
): Promise<void> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  if (amountCents > order.amountCents) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Refund amount exceeds order total',
    });
  }

  await db.transaction(async (tx) => {
    // Record refund
    await recordRefund(orderId, amountCents, currency, reason);

    // Update hold status
    const [hold] = await tx
      .select()
      .from(paymentHolds)
      .where(eq(paymentHolds.orderId, orderId));

    if (hold && hold.holdStatus === 'active') {
      const newHoldAmount = Math.max(0, hold.amountCents - amountCents);

      if (newHoldAmount > 0) {
        await tx
          .update(paymentHolds)
          .set({
            amountCents: newHoldAmount,
          })
          .where(eq(paymentHolds.id, hold.id));
      } else {
        await tx
          .update(paymentHolds)
          .set({
            holdStatus: 'refunded',
            releasedAt: new Date(),
          })
          .where(eq(paymentHolds.id, hold.id));
      }
    }

    // Update order status if full refund
    if (refundType === 'full') {
      await tx
        .update(orders)
        .set({
          payoutStatus: 'in_escrow', // Reset to escrow since funds are returned
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    }
  });
}

/**
 * Get escrow order details
 */
export async function getEscrowOrder(orderId: string): Promise<EscrowOrder | null> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

  if (!order) return null;

  return {
    id: order.id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    listingId: order.listingId,
    amountCents: order.amountCents,
    currency: order.currency,
    paymentStatus: 'completed',
    deliveryStatus: order.deliveryStatus as 'not_shipped' | 'in_transit' | 'delivered',
    payoutStatus: order.payoutStatus as 'in_escrow' | 'processing' | 'paid',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * Get payment hold information
 */
export async function getPaymentHold(holdId: string): Promise<EscrowHold | null> {
  const [hold] = await db.select().from(paymentHolds).where(eq(paymentHolds.id, holdId));

  if (!hold) return null;

  return {
    id: hold.id,
    paymentId: hold.paymentId,
    orderId: hold.orderId,
    amountCents: hold.amountCents,
    currency: hold.currency,
    holdStatus: hold.holdStatus as 'active' | 'refunded' | 'released' | 'expired',
    reason: hold.reason || '',
    refundedAt: hold.refundedAt,
    releasedAt: hold.releasedAt,
    createdAt: hold.createdAt,
    updatedAt: hold.updatedAt,
  };
}

/**
 * Get active holds for a seller (escrow amounts)
 */
export async function getSellerActiveHolds(
  sellerId: string,
  currency: string
): Promise<EscrowHold[]> {
  const [order] = await db
    .select({ sellerId: orders.sellerId })
    .from(paymentHolds)
    .innerJoin(orders, eq(paymentHolds.orderId, orders.id))
    .where(
      and(
        eq(orders.sellerId, sellerId),
        eq(paymentHolds.currency, currency),
        eq(paymentHolds.holdStatus, 'active')
      )
    );

  if (!order) return [];

  const holds = await db
    .select()
    .from(paymentHolds)
    .innerJoin(orders, eq(paymentHolds.orderId, orders.id))
    .where(
      and(
        eq(orders.sellerId, sellerId),
        eq(paymentHolds.currency, currency),
        eq(paymentHolds.holdStatus, 'active')
      )
    );

  return holds.map((result) => {
    const hold = result.payment_holds;
    return {
      id: hold.id,
      paymentId: hold.paymentId,
      orderId: hold.orderId,
      amountCents: hold.amountCents,
      currency: hold.currency,
      holdStatus: hold.holdStatus as 'active' | 'refunded' | 'released' | 'expired',
      reason: hold.reason || '',
      refundedAt: hold.refundedAt,
      releasedAt: hold.releasedAt,
      createdAt: hold.createdAt,
      updatedAt: hold.updatedAt,
    };
  });
}

/**
 * Get seller's escrow balance (funds in holds)
 */
export async function getSellerEscrowBalance(
  sellerId: string,
  currency: string
): Promise<number> {
  const result = await db
    .select({ total: sum(paymentHolds.amountCents) })
    .from(paymentHolds)
    .where(
      and(
        eq(paymentHolds.sellerId, sellerId),
        eq(paymentHolds.currency, currency),
        eq(paymentHolds.holdStatus, 'active')
      )
    );

  return Number(result[0]?.total) || 0;
}

/**
 * Get buyer's active orders in escrow
 */
export async function getBuyerActiveOrders(buyerId: string): Promise<EscrowOrder[]> {
  const activeOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.buyerId, buyerId),
        eq(orders.payoutStatus, 'in_escrow')
      )
    );

  return activeOrders.map((order) => ({
    id: order.id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    listingId: order.listingId,
    amountCents: order.amountCents,
    currency: order.currency,
    paymentStatus: 'completed',
    deliveryStatus: order.deliveryStatus as 'not_shipped' | 'in_transit' | 'delivered',
    payoutStatus: order.payoutStatus as 'in_escrow' | 'processing' | 'paid',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));
}

/**
 * Auto-release holds after expiration period (buyer protection)
 * Can be called by a cron job for automatic dispute resolution
 */
export async function autoReleaseExpiredHolds(holdDurationDays: number = 30): Promise<number> {
  const now = new Date();

  const expiredHolds = await db
    .select()
    .from(paymentHolds)
    .where(
      and(
        eq(paymentHolds.holdStatus, 'active'),
        lte(paymentHolds.createdAt, new Date(now.getTime() - holdDurationDays * 24 * 60 * 60 * 1000))
      )
    );

  if (!expiredHolds.length) return 0;

  await Promise.all(
    expiredHolds.map((hold) =>
      db
        .update(paymentHolds)
        .set({
          holdStatus: 'released',
          releasedAt: now,
        })
        .where(eq(paymentHolds.id, hold.id))
    )
  );

  return expiredHolds.length;
}