/**
 * Payment Flow Integration Module
 * Orchestrates the complete buyer-seller-payment-escrow-payout-dispute workflow
 */

import { db } from '../db';
import { orders, payments, paymentHolds, financialLedger, notifications } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';
import {
  handlePaymentSuccess,
  handlePaymentFailure,
  handleOrderShipped,
  handleOrderDelivered,
  handleRefundInitiated,
  handleRefundApproved,
  createNotification,
} from './paymentFlowService';
import { processAutomaticPayouts } from './automaticPayoutService';
import {
  initiateDispute,
  resolveDispute,
  autoEscalateOldDisputes,
} from './disputeResolutionService';

/**
 * Complete payment flow orchestration
 * Called when buyer completes checkout
 */
export async function initiateBuyerPaymentFlow(
  buyerId: string,
  orderId: string,
  listingId: string,
  amount: number,
  currency: string = 'NGN'
): Promise<{
  orderId: string;
  paymentId: string;
  status: string;
  message: string;
}> {
  try {
    // Verify order exists
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrders.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const order = existingOrders[0];

    if (order.buyerId !== buyerId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot initiate payment for this order',
      });
    }

    // Create payment record
    const transactionRef = `TXN-${Date.now()}-${orderId.slice(0, 8)}`;

    const paymentResult = await db.insert(payments).values({
      orderId: orderId,
      listingId: listingId,
      buyerId: buyerId,
      transactionRef: transactionRef,
      amountCents: Math.round(amount * 100),
      currency: currency,
      status: 'pending',
      paymentMethod: 'card',
      provider: 'flutterwave',
    });

    const paymentId = transactionRef;

    // Send buyer notification
    await createNotification(
      buyerId,
      'purchase',
      `Your payment of ₦${amount.toFixed(2)} has been initiated. Complete the payment to proceed.`,
      orderId
    );

    console.log(`Payment initiated: ${paymentId} for order ${orderId}`);

    return {
      orderId,
      paymentId,
      status: 'pending',
      message: 'Payment initiated successfully',
    };
  } catch (err: any) {
    console.error('Error initiating buyer payment flow:', err);
    throw err;
  }
}

/**
 * Complete seller fulfillment flow
 * Called when seller marks order as shipped
 */
export async function initiateSellerFulfillmentFlow(
  sellerId: string,
  orderId: string,
  trackingNumber?: string
): Promise<{
  orderId: string;
  status: string;
  message: string;
}> {
  try {
    // Verify order exists and seller owns it
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrders.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const order = existingOrders[0];

    if (order.sellerId !== sellerId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot update this order',
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

    // Handle order shipped flow
    await handleOrderShipped(orderId, trackingNumber);

    console.log(`Order shipped: ${orderId} by seller ${sellerId}`);

    return {
      orderId,
      status: 'in_transit',
      message: 'Order marked as shipped',
    };
  } catch (err: any) {
    console.error('Error initiating seller fulfillment flow:', err);
    throw err;
  }
}

/**
 * Complete buyer delivery confirmation flow
 * Called when buyer confirms delivery
 */
export async function confirmDeliveryFlow(
  buyerId: string,
  orderId: string
): Promise<{
  orderId: string;
  status: string;
  payoutTriggered: boolean;
  message: string;
}> {
  try {
    // Verify order exists and buyer owns it
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrders.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const order = existingOrders[0];

    if (order.buyerId !== buyerId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot confirm delivery for this order',
      });
    }

    // Handle order delivered flow
    await handleOrderDelivered(orderId);

    console.log(`Delivery confirmed: ${orderId} by buyer ${buyerId}`);

    // Trigger automatic payout if configured
    const result = await processAutomaticPayouts();

    return {
      orderId,
      status: 'delivered',
      payoutTriggered: result.processed > 0,
      message: 'Delivery confirmed. Seller payout will be processed.',
    };
  } catch (err: any) {
    console.error('Error confirming delivery flow:', err);
    throw err;
  }
}

/**
 * Initiate buyer refund request flow
 */
export async function initiateBuyerRefundFlow(
  buyerId: string,
  orderId: string,
  reason: string,
  evidenceUrls?: string[]
): Promise<{
  orderId: string;
  status: string;
  message: string;
}> {
  try {
    // Verify order exists and buyer owns it
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrders.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const order = existingOrders[0];

    if (order.buyerId !== buyerId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot request refund for this order',
      });
    }

    // Handle refund initiation
    await handleRefundInitiated(
      orderId,
      buyerId,
      order.amountCents,
      reason
    );

    console.log(`Refund initiated: ${orderId} by buyer ${buyerId}`);

    return {
      orderId,
      status: 'refund_requested',
      message: 'Refund request submitted successfully',
    };
  } catch (err: any) {
    console.error('Error initiating buyer refund flow:', err);
    throw err;
  }
}

/**
 * Approve seller refund (seller approves refund request)
 */
export async function approveSellerRefundFlow(
  sellerId: string,
  orderId: string
): Promise<{
  orderId: string;
  status: string;
  message: string;
}> {
  try {
    // Verify order exists and seller owns it
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrders.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const order = existingOrders[0];

    if (order.sellerId !== sellerId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot approve refund for this order',
      });
    }

    // Approve refund
    await handleRefundApproved(orderId, sellerId, order.amountCents);

    console.log(`Refund approved: ${orderId} by seller ${sellerId}`);

    return {
      orderId,
      status: 'refund_approved',
      message: 'Refund approved and will be processed within 3-5 business days',
    };
  } catch (err: any) {
    console.error('Error approving seller refund flow:', err);
    throw err;
  }
}

/**
 * Initiate dispute resolution flow
 * Called when buyer and seller cannot resolve issue
 */
export async function initiateDisputeFlow(
  buyerId: string,
  orderId: string,
  subject: string,
  description: string,
  evidenceUrls?: string[]
): Promise<{
  disputeId: string;
  orderId: string;
  status: string;
  message: string;
}> {
  try {
    // Verify order exists and buyer owns it
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrders.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const order = existingOrders[0];

    if (order.buyerId !== buyerId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot create dispute for this order',
      });
    }

    // Create dispute
    const dispute = await initiateDispute(
      orderId,
      buyerId,
      subject,
      evidenceUrls || []
    );
    const disputeId = dispute.id;

    console.log(`Dispute initiated: ${disputeId} for order ${orderId}`);

    return {
      disputeId,
      orderId,
      status: 'open',
      message: 'Dispute created. Our team will investigate within 24 hours.',
    };
  } catch (err: any) {
    console.error('Error initiating dispute flow:', err);
    throw err;
  }
}

/**
 * Get complete payment and fulfillment status for order
 */
export async function getOrderFlowStatus(
  orderId: string
): Promise<{
  order: any;
  payment: any;
  escrow: any;
  ledger: any[];
  flowStage: string;
  nextAction?: string;
}> {
  try {
    // Get order
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrders.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const order = existingOrders[0];

    // Get payment
    const existingPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId));

    const payment = existingPayments[0] || null;

    // Get escrow hold
    const existingHolds = await db
      .select()
      .from(paymentHolds)
      .where(eq(paymentHolds.orderId, orderId));

    const escrow = existingHolds[0] || null;

    // Get financial ledger entries
    const ledger = await db
      .select()
      .from(financialLedger)
      .where(eq(financialLedger.orderId, orderId));

    // Determine flow stage
    let flowStage = 'pending';
    let nextAction: string | undefined = undefined;

    if (!payment || payment.status === 'pending') {
      flowStage = 'awaiting_payment';
      nextAction = 'Buyer: Complete payment';
    } else if (payment.status === 'failed') {
      flowStage = 'payment_failed';
      nextAction = 'Buyer: Retry payment';
    } else if (payment.status === 'completed') {
      if (order.deliveryStatus === 'not_shipped') {
        flowStage = 'awaiting_shipment';
        nextAction = 'Seller: Ship order';
      } else if (order.deliveryStatus === 'in_transit') {
        flowStage = 'in_transit';
        nextAction = 'Buyer: Confirm delivery';
      } else if (order.deliveryStatus === 'delivered') {
        if (order.payoutStatus === 'in_escrow') {
          flowStage = 'processing_payout';
          nextAction = 'System: Process payout';
        } else if (['refunded', 'disputed'].includes(order.payoutStatus)) {
          flowStage = order.payoutStatus;
          nextAction = `System: ${order.payoutStatus} payout`;
        } else if (order.payoutStatus === 'paid') {
          flowStage = 'completed';
        }
      }
    }

    return {
      order,
      payment,
      escrow,
      ledger,
      flowStage,
      nextAction,
    };
  } catch (err: any) {
    console.error('Error getting order flow status:', err);
    throw err;
  }
}

/**
 * Get payment flow statistics
 */
export async function getPaymentFlowStats(): Promise<{
  totalOrders: number;
  completedOrders: number;
  pendingPayments: number;
  failedPayments: number;
  activeEscrows: number;
  totalEscrowAmount: number;
  pendingPayouts: number;
  averageTimeToDelivery: number;
}> {
  try {
    const allOrders = await db.select().from(orders);
    const allPayments = await db.select().from(payments);
    const allHolds = await db.select().from(paymentHolds);

    const completedOrders = allOrders.filter(
      (o: any) => o.deliveryStatus === 'delivered' && o.payoutStatus === 'paid'
    );

    const pendingPayments = allPayments.filter((p: any) => p.status === 'pending');
    const failedPayments = allPayments.filter((p: any) => p.status === 'failed');
    const activeEscrows = allHolds.filter((h: any) => h.holdStatus === 'active');

    const pendingPayouts = allOrders.filter(
      (o: any) => o.payoutStatus === 'in_escrow' || o.payoutStatus === 'processing'
    );

    const totalEscrowAmount = activeEscrows.reduce((sum: any, h: any) => sum + h.amountCents, 0);

    const deliveredOrders = allOrders.filter((o: any) => o.deliveryStatus === 'delivered');
    const averageTimeToDelivery =
      deliveredOrders.length > 0
        ? deliveredOrders.reduce((sum: any, o: any) => {
            const created = new Date(o.createdAt).getTime();
            const delivered = new Date(o.updatedAt).getTime();
            return sum + (delivered - created);
          }, 0) / deliveredOrders.length / (1000 * 60 * 60 * 24)
        : 0;

    return {
      totalOrders: allOrders.length,
      completedOrders: completedOrders.length,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      activeEscrows: activeEscrows.length,
      totalEscrowAmount,
      pendingPayouts: pendingPayouts.length,
      averageTimeToDelivery: Math.round(averageTimeToDelivery),
    };
  } catch (err: any) {
    console.error('Error getting payment flow stats:', err);
    throw err;
  }
}