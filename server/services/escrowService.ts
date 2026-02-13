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

const VALID_PRODUCT_CATEGORIES = ['men_clothing', 'women_clothing', 'men_shoes', 'women_shoes', 'accessories', 'merch', 'others'] as const;

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

export async function createOrderFromCart(
  buyerId: string,
  sellerId: string,
  cartItems_: Array<{ listingId: string; quantity: number; unitPriceCents: number; currency: string }>,
  customerName: string,
  customerEmail: string,
  paymentMethod: string,
  orderId?: string
): Promise<{ orderId: string; totalAmountCents: number; totalCurrency: string }> {
  if (!cartItems_.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Cart is empty',
    });
  }

  let totalAmountCents = 0;
  let currency = '';

  const result = await db.transaction(async (tx: any) => {
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

      if (!primaryListing) {
        primaryListing = listing;
        productTitle = listing.title || 'Product';
        productImage = listing.image || '';
        
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

    const finalOrderId = orderId || uuidv4();
    const now = new Date();

    await tx.insert(orders).values({
      id: finalOrderId,
      buyerId,
      sellerId,
      listingId: cartItems_[0].listingId,
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

    return { orderId: finalOrderId, totalAmountCents, totalCurrency: currency };
  });

  return result;
}

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
      message: 'Payment record not found in database',
    });
  }

  if (payment.status === 'completed') {
    console.warn('confirmPayment: Payment already completed', { paymentId, transactionRef });
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (order) {
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
  }

  let verification;
  try {
    verification = await verifyTsaraPayment(transactionRef);
  } catch (error) {
    console.error('CRITICAL: confirmPayment - Tsara verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      transactionRef,
      paymentId,
      paymentStatus: payment.status,
    });
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify payment with provider. Please contact support.',
    });
  }

  if (!verification || !verification.success) {
    console.error('CRITICAL: confirmPayment - Tsara returned non-success response', {
      verification,
      paymentId,
      transactionRef,
      paymentDbStatus: payment.status,
      hasData: !!verification?.data,
      dataKeys: verification?.data ? Object.keys(verification.data) : [],
    });
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Payment verification returned invalid response. Please contact support.',
    });
  }

  if (!verification.data) {
    console.error('CRITICAL: confirmPayment - Tsara data object missing', {
      verification,
      paymentId,
      transactionRef,
    });
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Payment verification data missing. Please contact support.',
    });
  }

  if (verification.data.status !== 'success') {
    console.error('CRITICAL: confirmPayment - Tsara payment status not success', {
      transactionRef,
      paymentId,
      expectedStatus: 'success',
      actualStatus: verification.data?.status,
      paymentDbStatus: payment.status,
    });
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: `Payment verification failed - Status: ${verification.data?.status || 'unknown'}`,
    });
  }

  if (verification.data?.reference !== transactionRef) {
    console.error('CRITICAL: confirmPayment - Transaction reference mismatch', {
      expectedRef: transactionRef,
      tsaraRef: verification.data?.reference,
      paymentId,
    });
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Payment reference mismatch. Possible fraud attempt detected.',
    });
  }

  try {
    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: 'completed',
        gatewayResponse: JSON.stringify(verification),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      console.error('confirmPayment: Order not found after payment update', { paymentId, orderId });
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    console.info('confirmPayment: Successfully confirmed payment', {
      paymentId,
      orderId,
      transactionRef,
      amount: updatedPayment.amountCents,
      currency: updatedPayment.currency,
    });

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
  } catch (error) {
    console.error('confirmPayment: Database transaction failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      paymentId,
      orderId,
    });
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to complete payment confirmation. Please contact support.',
    });
  }
}

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
    const [updated] = await tx
      .update(orders)
      .set({
        deliveryStatus: 'delivered',
        payoutStatus: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

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

  await db.transaction(async (tx: any) => {
    await recordRefund(orderId, amountCents, currency, reason);

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

    if (refundType === 'full') {
      await tx
        .update(orders)
        .set({
          payoutStatus: 'in_escrow',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    }
  });
}

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

  return holds.map((result: any) => {
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

  return activeOrders.map((order: any) => ({
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

export async function completePayout(
  orderId: string,
  sellerId: string
): Promise<void> {
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

  await db.transaction(async (tx: any) => {
    await tx
      .update(orders)
      .set({
        payoutStatus: 'paid',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

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
  });
}

export async function sendAutoReleaseReminders(): Promise<number> {
  const now = new Date();
  const reminderDays = 25;
  const reminderDate = new Date(now.getTime() - reminderDays * 24 * 60 * 60 * 1000);

  const holds = await db
    .select()
    .from(paymentHolds)
    .where(
      and(
        eq(paymentHolds.holdStatus, 'active'),
        gte(paymentHolds.createdAt, reminderDate),
        lte(paymentHolds.createdAt, now)
      )
    );

  return holds.length;
}

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
    expiredHolds.map((hold: any) =>
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