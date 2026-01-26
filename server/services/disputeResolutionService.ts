import { db } from '../db';
import { paymentHolds, orders, financialLedger, notifications } from '../db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';

interface DisputeCase {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  reason: string;
  evidence: string[];
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  resolution?: 'buyer_refund' | 'seller_keep' | 'partial_refund';
  createdAt: Date;
  resolvedAt?: Date;
}

/**
 * Auto-release payment holds after expiration period
 * Can be called by a cron job to automatically release funds to sellers
 * if buyer doesn't confirm delivery within the hold period
 */
export async function autoReleaseExpiredHolds(holdDurationDays: number = 30): Promise<{
  released: number;
  failed: number;
}> {
  try {
    const now = new Date();
    const expirationDate = new Date(
      now.getTime() - holdDurationDays * 24 * 60 * 60 * 1000
    );

    // Find all active holds that have expired
    const expiredHolds = await db
      .select()
      .from(paymentHolds)
      .where(
        and(
          eq(paymentHolds.holdStatus, 'active'),
          lte(paymentHolds.createdAt, expirationDate)
        )
      );

    if (!expiredHolds.length) {
      console.log('No expired payment holds to release');
      return { released: 0, failed: 0 };
    }

    let released = 0;
    let failed = 0;

    for (const hold of expiredHolds) {
      try {
        // Get order details
        const existingOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.id, hold.orderId));

        const order = existingOrders[0];

        if (!order) {
          console.warn(`Order not found for hold ${hold.id}`);
          failed++;
          continue;
        }

        // Release the hold
        await db
          .update(paymentHolds)
          .set({
            holdStatus: 'released',
            releasedAt: now,
          })
          .where(eq(paymentHolds.id, hold.id));

        // Update order payout status
        await db
          .update(orders)
          .set({
            payoutStatus: 'processing',
            updatedAt: now,
          })
          .where(eq(orders.id, hold.orderId));

        // Record in financial ledger
        await db.insert(financialLedger).values({
          sellerId: order.sellerId,
          orderId: order.id,
          transactionType: 'sale',
          amountCents: hold.amountCents,
          currency: hold.currency,
          status: 'completed',
          description: `Auto-released payment hold after ${holdDurationDays} days`,
        });

        // Notify seller - hold is expiring
        await createDisputeNotification(
          order.sellerId,
          'delivery_confirmed',
          `Your payment hold for order ${order.id.slice(0, 8)} has been auto-released to the seller.`,
          order.id
        );

        // Notify seller - hold released
        await createDisputeNotification(
          order.sellerId,
          'delivery_confirmed',
          `Your payment hold for order ${order.id.slice(0, 8)} has been released. Funds will be processed.`,
          order.id
        );

        released++;
        console.log(`Payment hold released for order ${order.id}`);
      } catch (err: any) {
        console.error(`Failed to release hold ${hold.id}:`, err);
        failed++;
      }
    }

    return { released, failed };
  } catch (err: any) {
    console.error('Auto-release holds error:', err);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to auto-release payment holds',
    });
  }
}

/**
 * Auto-escalate disputes if not resolved within timeframe
 */
export async function autoEscalateOldDisputes(): Promise<{
  escalated: number;
  failed: number;
}> {
  try {
    const now = new Date();
    const disputeResolutionDays = 7;
    const escalationDate = new Date(
      now.getTime() - disputeResolutionDays * 24 * 60 * 60 * 1000
    );

    // Find all open disputes that are older than resolution period
    // This is a placeholder - actual implementation depends on disputes table
    console.log(
      `Checking for disputes to escalate older than ${escalationDate.toISOString()}`
    );

    return { escalated: 0, failed: 0 };
  } catch (err: any) {
    console.error('Auto-escalate disputes error:', err);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to auto-escalate disputes',
    });
  }
}

/**
 * Initiate dispute for an order
 */
export async function initiateDispute(
  orderId: string,
  buyerId: string,
  reason: string,
  evidence: string[]
): Promise<DisputeCase> {
  try {
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    const order = existingOrders[0];

    if (!order || order.buyerId !== buyerId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot initiate dispute for this order',
      });
    }

    // Check if order is eligible for dispute (not completed with payout)
    if (order.payoutStatus === 'paid') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot dispute completed orders',
      });
    }

    const disputeId = uuidv4();
    const now = new Date();

    // Record dispute in financial ledger
    await db.insert(financialLedger).values({
      sellerId: order.sellerId,
      orderId: orderId,
      transactionType: 'refund_initiated',
      amountCents: 0,
      currency: order.currency,
      status: 'pending',
      description: `Dispute initiated - ${reason}`,
    });

    // Notify seller about dispute
    await createDisputeNotification(
      order.sellerId,
      'reminder',
      `A customer has initiated a dispute for order ${orderId.slice(0, 8)}: ${reason}`,
      orderId
    );

    console.log(`Dispute initiated for order ${orderId}`);

    return {
      id: disputeId,
      orderId,
      buyerId,
      sellerId: order.sellerId,
      reason,
      evidence,
      status: 'open',
      createdAt: now,
    };
  } catch (err: any) {
    if (err instanceof TRPCError) throw err;
    console.error('Dispute initiation error:', err);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to initiate dispute',
    });
  }
}

/**
 * Resolve a dispute
 */
export async function resolveDispute(
  disputeId: string,
  resolution: 'buyer_refund' | 'seller_keep' | 'partial_refund',
  refundAmount?: number
): Promise<void> {
  try {
    // Get dispute details from financial ledger
    const disputes = await db
      .select()
      .from(financialLedger)
      .where(eq(financialLedger.id, disputeId));

    const dispute = disputes[0];

    if (!dispute || !dispute.orderId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Dispute not found',
      });
    }

    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, dispute.orderId));

    const order = existingOrders[0];

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const now = new Date();

    if (resolution === 'buyer_refund') {
      // Full refund to buyer
      const existingHolds = await db
        .select()
        .from(paymentHolds)
        .where(eq(paymentHolds.orderId, order.id));

      const hold = existingHolds[0];

      if (hold) {
        await db
          .update(paymentHolds)
          .set({
            holdStatus: 'refunded',
            refundedAt: now,
          })
          .where(eq(paymentHolds.id, hold.id));
      }

      // Record refund in ledger
      await db.insert(financialLedger).values({
        sellerId: order.sellerId,
        orderId: order.id,
        transactionType: 'refund_completed',
        amountCents: -order.amountCents,
        currency: order.currency,
        status: 'completed',
        description: `Dispute resolution: Full refund to buyer`,
      });

      // Notify seller - refund required
      await createDisputeNotification(
        order.sellerId,
        'refund_issued',
        `A dispute has been resolved against you. You must refund ₦${(order.amountCents / 100).toFixed(2)}.`,
        order.id
      );
    } else if (resolution === 'seller_keep') {
      // Seller keeps funds
      const existingHolds = await db
        .select()
        .from(paymentHolds)
        .where(eq(paymentHolds.orderId, order.id));

      const hold = existingHolds[0];

      if (hold) {
        await db
          .update(paymentHolds)
          .set({
            holdStatus: 'released',
            releasedAt: now,
          })
          .where(eq(paymentHolds.id, hold.id));
      }

      // Record in ledger
      await db.insert(financialLedger).values({
        sellerId: order.sellerId,
        orderId: order.id,
        transactionType: 'sale',
        amountCents: 0,
        currency: order.currency,
        status: 'completed',
        description: `Dispute resolution: Seller keeps funds`,
      });

      // Notify seller
      await createDisputeNotification(
        order.sellerId,
        'order_confirmed',
        `The dispute has been resolved in your favor. You may keep the payment.`,
        order.id
      );

      // Notify buyer
    } else if (resolution === 'partial_refund' && refundAmount) {
      // Partial refund
      const existingHolds = await db
        .select()
        .from(paymentHolds)
        .where(eq(paymentHolds.orderId, order.id));

      const hold = existingHolds[0];

      if (hold) {
        const remainingAmount = Math.max(0, hold.amountCents - refundAmount);

        if (remainingAmount > 0) {
          await db
            .update(paymentHolds)
            .set({
              amountCents: remainingAmount,
            })
            .where(eq(paymentHolds.id, hold.id));
        } else {
          await db
            .update(paymentHolds)
            .set({
              holdStatus: 'released',
              releasedAt: now,
            })
            .where(eq(paymentHolds.id, hold.id));
        }
      }

      // Record partial refund
      await db.insert(financialLedger).values({
        sellerId: order.sellerId,
        orderId: order.id,
        transactionType: 'refund_completed',
        amountCents: -refundAmount,
        currency: order.currency,
        status: 'completed',
        description: `Dispute resolution: Partial refund`,
      });

      // Notify seller about partial refund requirement
      await createDisputeNotification(
        order.sellerId,
        'refund_issued',
        `A dispute has been resolved. You must refund ₦${(refundAmount / 100).toFixed(2)} to the buyer.`,
        order.id
      );
    }

    console.log(`Dispute resolved: ${disputeId} with resolution: ${resolution}`);
  } catch (err: any) {
    if (err instanceof TRPCError) throw err;
    console.error('Dispute resolution error:', err);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to resolve dispute',
    });
  }
}

async function createDisputeNotification(
  sellerId: string,
  type: 'purchase' | 'review' | 'comment' | 'reminder' | 'order_confirmed' | 'payment_failed' | 'refund_issued' | 'delivery_confirmed',
  message: string,
  orderId?: string
): Promise<void> {
  try {
    await db.insert(notifications).values({
      sellerId,
      type,
      message,
      orderId: orderId || undefined,
      isRead: false,
    });
  } catch (err: any) {
    console.error(`Failed to create dispute notification for seller ${sellerId}:`, err);
  }
}

/**
 * Get hold status for an order
 */
export async function getHoldStatus(orderId: string): Promise<{
  holdId: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: Date;
  releaseableAt: Date | null;
  releasedAt?: Date | null;
} | null> {
  const existingHolds = await db
    .select()
    .from(paymentHolds)
    .where(eq(paymentHolds.orderId, orderId));

  const hold = existingHolds[0];

  if (!hold) return null;

  return {
    holdId: hold.id,
    status: hold.holdStatus,
    amountCents: hold.amountCents,
    currency: hold.currency,
    createdAt: hold.createdAt,
    releaseableAt: hold.releaseableAt,
    releasedAt: hold.releasedAt,
  };
}