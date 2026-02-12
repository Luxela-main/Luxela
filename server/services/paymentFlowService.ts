import { db } from '../db';
import { orders, payments, paymentHolds, notifications, financialLedger } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';
import { createPaymentHold } from './escrowService';

interface PaymentWebhookData {
  id: string;
  reference: string;
  amount?: number;
  currency?: string;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  metadata?: Record<string, any>;
  timestamp?: string;
  orderId?: string;
  listingId?: string;
  buyerId?: string;
}

type NotificationType = 
  | 'purchase'
  | 'review'
  | 'comment'
  | 'reminder'
  | 'order_confirmed'
  | 'payment_failed'
  | 'refund_issued'
  | 'delivery_confirmed';

export async function handlePaymentSuccess(paymentData: PaymentWebhookData): Promise<void> {
  const transactionRef = paymentData.reference;

  const existingPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.transactionRef, transactionRef));

  const payment = existingPayments[0];

  if (!payment) {
    console.warn(`Payment not found for reference: ${transactionRef}`);
    return;
  }

  if (!payment.orderId) {
    console.warn(`No order associated with payment ${payment.id}`);
    return;
  }

  const existingOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.id, payment.orderId));

  const order = existingOrders[0];

  if (!order) {
    console.warn(`Order not found: ${payment.orderId}`);
    return;
  }

  // Create payment hold (escrow)
  await createPaymentHold(
    payment.id,
    order.id,
    order.sellerId,
    order.amountCents,
    order.currency,
    30
  );

  // Update payment status
  await db
    .update(payments)
    .set({
      status: 'completed',
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  // Send seller notification
  await createNotification(
    order.sellerId,
    'order_confirmed',
    `Payment of ₦${(order.amountCents / 100).toFixed(2)} confirmed. Order is being prepared.`,
    order.id
  );

  // Send seller notification - order ready to ship
  await createNotification(
    order.sellerId,
    'order_confirmed',
    `Payment received for order. Please prepare and ship the item.`,
    order.id
  );

  console.log(`Payment success flow completed for order ${order.id}`);
}

export async function handlePaymentFailure(paymentData: PaymentWebhookData): Promise<void> {
  const transactionRef = paymentData.reference;

  const existingPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.transactionRef, transactionRef));

  const payment = existingPayments[0];

  if (!payment) {
    console.warn(`Payment not found for reference: ${transactionRef}`);
    return;
  }

  // Update payment status
  await db
    .update(payments)
    .set({
      status: 'failed',
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  if (payment.orderId) {
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId));

    const order = existingOrders[0];

    if (order) {
      // Send buyer notification
      await createNotification(
        order.buyerId,
        'payment_failed',
        `Your payment failed. Please try again or use a different payment method.`,
        order.id
      );
    }
  }

  console.log(`Payment failure flow completed for payment ${payment.id}`);
}

export async function handleOrderShipped(orderId: string, trackingNumber?: string): Promise<void> {
  const existingOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  const order = existingOrders[0];

  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  // Update order status
  await db
    .update(orders)
    .set({
      deliveryStatus: 'in_transit',
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // Send buyer notification
  await createNotification(
    order.buyerId,
    'order_confirmed',
    `Your order has been shipped${trackingNumber ? ` with tracking number: ${trackingNumber}` : ''}.`,
    orderId
  );

  console.log(`Order shipped notification sent for order ${orderId}`);
}

export async function handleOrderDelivered(orderId: string): Promise<void> {
  const existingOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  const order = existingOrders[0];

  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  // Update order status
  await db
    .update(orders)
    .set({
      deliveryStatus: 'delivered',
      payoutStatus: 'processing',
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // Release payment hold
  const existingHolds = await db
    .select()
    .from(paymentHolds)
    .where(eq(paymentHolds.orderId, orderId));

  const hold = existingHolds[0];

  if (hold && hold.holdStatus === 'active') {
    await db
      .update(paymentHolds)
      .set({
        holdStatus: 'released',
        releasedAt: new Date(),
      })
      .where(eq(paymentHolds.id, hold.id));
  }

  // Record payout in financial ledger
  await db.insert(financialLedger).values({
    id: uuidv4(),
    sellerId: order.sellerId,
    orderId: orderId,
    transactionType: 'sale',
    amountCents: order.amountCents,
    currency: order.currency,
    status: 'completed',
    description: `Payout for delivered order ${orderId.slice(0, 8)}`,
    createdAt: new Date(),
  });

  // Send seller notification - funds released
  await createNotification(
    order.sellerId,
    'delivery_confirmed',
    `Order has been delivered. Funds are being processed to your account.`,
    orderId
  );

  console.log(`Order delivered flow completed for order ${orderId}`);
}

export async function handleRefundInitiated(
  orderId: string,
  buyerId: string,
  amount: number,
  reason: string
): Promise<void> {
  const existingOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  const order = existingOrders[0];

  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  if (order.buyerId !== buyerId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Cannot initiate refund for this order',
    });
  }

  // Record refund in financial ledger
  await db.insert(financialLedger).values({
    id: uuidv4(),
    sellerId: order.sellerId,
    orderId: orderId,
    transactionType: 'refund_initiated',
    amountCents: -amount,
    currency: order.currency,
    status: 'pending',
    description: `Refund initiated - ${reason}`,
    createdAt: new Date(),
  });

  // Send buyer notification
  await createNotification(
    buyerId,
    'refund_issued',
    `Your refund request has been submitted. We will process it shortly.`,
    orderId
  );

  // Send seller notification
  await createNotification(
    order.sellerId,
    'refund_issued',
    `A customer has requested a refund for order ${orderId.slice(0, 8)}: ${reason}`,
    orderId
  );

  console.log(`Refund initiated for order ${orderId}`);
}

export async function handleRefundApproved(
  orderId: string,
  sellerId: string,
  amount: number
): Promise<void> {
  const existingOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  const order = existingOrders[0];

  if (!order || order.sellerId !== sellerId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Cannot approve refund for this order',
    });
  }

  // Record refund approval in financial ledger
  await db.insert(financialLedger).values({
    sellerId: sellerId,
    orderId: orderId,
    transactionType: 'return_approved',
    amountCents: -amount,
    currency: order.currency,
    status: 'pending',
    description: `Refund approved`,
  });

  // Send buyer notification
  await createNotification(
    order.buyerId,
    'refund_issued',
    `Your refund has been approved. You will receive ₦${(amount / 100).toFixed(2)} within 3-5 business days.`,
    orderId
  );

  console.log(`Refund approved for order ${orderId}`);
}

export async function handleRefundCompleted(
  orderId: string,
  amount: number
): Promise<void> {
  const existingOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  const order = existingOrders[0];

  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  // Record refund completion in financial ledger
  await db.insert(financialLedger).values({
    id: uuidv4(),
    sellerId: order.sellerId,
    orderId: orderId,
    transactionType: 'refund_completed',
    amountCents: -amount,
    currency: order.currency,
    status: 'completed',
    description: `Refund completed`,
    createdAt: new Date(),
  });

  // Send buyer notification
  await createNotification(
    order.buyerId,
    'refund_issued',
    `Your refund of ₦${(amount / 100).toFixed(2)} has been completed.`,
    orderId
  );

  console.log(`Refund completed for order ${orderId}`);
}

export async function createNotification(
  sellerId: string,
  type: NotificationType,
  message: string,
  orderId?: string
): Promise<void> {
  try {
    await db
      .insert(notifications)
      .values({
        sellerId,
        type,
        message,
        orderId: orderId || undefined,
        isRead: false,
      });
  } catch (err: any) {
    console.error(`Failed to create notification for seller ${sellerId}:`, err);
  }
}

export async function getPaymentFlowStatus(orderId: string): Promise<{
  order: any;
  payment: any;
  hold: any;
  ledgerEntries: any[];
}> {
  const existingOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  const order = existingOrders[0];

  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  const existingPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId));

  const payment = existingPayments[0];

  const existingHolds = await db
    .select()
    .from(paymentHolds)
    .where(eq(paymentHolds.orderId, orderId));

  const hold = existingHolds[0];

  const ledgerEntries = await db
    .select()
    .from(financialLedger)
    .where(eq(financialLedger.orderId, orderId));

  return {
    order,
    payment,
    hold,
    ledgerEntries,
  };
}

export async function createBuyerNotification(
  buyerId: string,
  type: string,
  title: string,
  message: string,
  orderId?: string,
  actionUrl?: string,
  metadata?: any
): Promise<void> {
  try {
    const { buyerNotifications } = await import('../db/schema');
    await db
      .insert(buyerNotifications)
      .values({
        buyerId,
        type: type as any,
        title,
        message,
        isRead: false,
        isStarred: false,
        relatedEntityId: orderId,
        relatedEntityType: 'order',
        actionUrl,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
  } catch (err: any) {
    console.error(`Failed to create buyer notification for buyer ${buyerId}:`, err);
  }
}