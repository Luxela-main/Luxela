import { db } from '../db';
import { orders, paymentHolds, financialLedger, sellers } from '../db/schema';
import { eq, and, gte, sum } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';
import { createNotification } from './paymentFlowService';

interface PayoutRecord {
  id: string;
  sellerId: string;
  amountCents: number;
  currency: string;
  orderId: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  createdAt: Date;
  paidAt?: Date | null;
}

/**
 * Process automatic payouts for sellers when orders are delivered
 * This function can be called by a cron job
 */
export async function processAutomaticPayouts(): Promise<{
  processed: number;
  failed: number;
  totalAmount: number;
  errors: Array<{ payoutId: string; error: string }>;
}> {
  try {
    // Find all orders that are delivered and have released holds
    const releasedHolds = await db
      .select()
      .from(paymentHolds)
      .where(eq(paymentHolds.holdStatus, 'released'));

    if (!releasedHolds.length) {
      console.log('No released payment holds found for processing');
      return { processed: 0, failed: 0, totalAmount: 0, errors: [] };
    }

    let processed = 0;
    let failed = 0;
    let totalAmount = 0;
    const errors: Array<{ payoutId: string; error: string }> = [];

    for (const hold of releasedHolds) {
      try {
        const existingOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.id, hold.orderId));

        const order = existingOrders[0];

        if (!order) {
          console.warn(`Order not found for hold ${hold.id}`);
          errors.push({
            payoutId: hold.id,
            error: 'Order not found',
          });
          failed++;
          continue;
        }

        // Update financial ledger to mark as paid
        await db
          .insert(financialLedger)
          .values({
            id: uuidv4(),
            sellerId: order.sellerId,
            orderId: order.id,
            transactionType: 'payout',
            amountCents: order.amountCents,
            currency: order.currency,
            status: 'paid',
            description: `Payout for delivered order ${order.id.slice(0, 8)}`,
            createdAt: new Date(),
          });

        // Update order payout status
        await db
          .update(orders)
          .set({
            payoutStatus: 'paid',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        totalAmount += hold.amountCents;
        processed++;

        console.log(
          `Payout processed for order ${order.id}: ₦${(hold.amountCents / 100).toFixed(2)}`
        );
      } catch (err: any) {
        console.error(`Failed to process payout for hold ${hold.id}:`, err);
        errors.push({
          payoutId: hold.id,
          error: err.message || 'Unknown error',
        });
        failed++;
      }
    }

    return {
      processed,
      failed,
      totalAmount,
      errors,
    };
  } catch (err: any) {
    console.error('Automatic payout processing error:', err);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to process automatic payouts',
    });
  }
}

/**
 * Get seller's available payout amount
 */
export async function getSellerPayoutBalance(
  sellerId: string,
  currency: string = 'NGN'
): Promise<{
  available: number;
  pending: number;
  total: number;
}> {
  // Get all paid transactions for seller
  const paidResult = await db
    .select({ total: sum(financialLedger.amountCents) })
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.sellerId, sellerId),
        eq(financialLedger.currency, currency),
        eq(financialLedger.status, 'paid')
      )
    );

  const availablePayout = Number(paidResult[0]?.total) || 0;

  // Get all pending transactions for seller
  const pendingResult = await db
    .select({ total: sum(financialLedger.amountCents) })
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.sellerId, sellerId),
        eq(financialLedger.currency, currency),
        eq(financialLedger.status, 'pending')
      )
    );

  const pendingPayout = Number(pendingResult[0]?.total) || 0;

  return {
    available: availablePayout,
    pending: pendingPayout,
    total: availablePayout + pendingPayout,
  };
}

/**
 * Get seller's payout history
 */
export async function getSellerPayoutHistory(
  sellerId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Array<{
  id: string;
  orderId: string;
  amountCents: number;
  currency: string;
  status: string;
  paidAt: Date;
}>> {
  const entries = await db
    .select()
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.sellerId, sellerId),
        eq(financialLedger.transactionType, 'payout')
      )
    )
    .limit(limit)
    .offset(offset);

  return entries.map((entry) => ({
    id: entry.id,
    orderId: entry.orderId || '',
    amountCents: entry.amountCents,
    currency: entry.currency,
    status: entry.status,
    paidAt: entry.createdAt,
  }));
}

/**
 * Request manual payout from seller
 * Only available if balance is above minimum threshold
 */
export async function requestManualPayout(
  sellerId: string,
  amount: number,
  currency: string = 'NGN',
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankCode: string;
  }
): Promise<{
  success: boolean;
  payoutId: string;
  status: string;
  message: string;
}> {
  const minPayout = 50000; // ₦500 minimum

  if (amount < minPayout) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Minimum payout is ₦${(minPayout / 100).toFixed(2)}`,
    });
  }

  // Get seller's available balance
  const balance = await getSellerPayoutBalance(sellerId, currency);

  if (balance.available < amount) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Insufficient balance. Available: ₦${(balance.available / 100).toFixed(2)}`,
    });
  }

  const payoutId = uuidv4();

  try {
    // Record payout request in financial ledger
    await db.insert(financialLedger).values({
      sellerId,
      transactionType: 'payout',
      amountCents: -amount,
      currency,
      status: 'pending',
      description: `Manual payout request to ${bankDetails.bankCode} - ${bankDetails.accountNumber}`,
    });

    // Send seller notification
    // await createNotification(
    //   sellerId,
    //   'payout_requested',
    //   'Payout Requested',
    //   `Your payout of ₦${(amount / 100).toFixed(2)} has been requested and will be processed within 1-3 business days.`
    // );

    console.log(`Payout request created: ${payoutId} for seller ${sellerId}`);

    return {
      success: true,
      payoutId,
      status: 'pending',
      message: `Payout of ₦${(amount / 100).toFixed(2)} requested. Processing within 1-3 business days.`,
    };
  } catch (err: any) {
    console.error('Payout request error:', err);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create payout request',
    });
  }
}

/**
 * Get seller's total earnings and statistics
 */
export async function getSellerEarningsStats(
  sellerId: string,
  currency: string = 'NGN'
): Promise<{
  totalEarnings: number;
  totalPayedOut: number;
  availableBalance: number;
  pendingBalance: number;
  totalOrders: number;
  totalRefunds: number;
}> {
  // Total sales
  const salesResult = await db
    .select({ total: sum(financialLedger.amountCents) })
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.sellerId, sellerId),
        eq(financialLedger.currency, currency),
        eq(financialLedger.transactionType, 'sale')
      )
    );

  const totalEarnings = Number(salesResult[0]?.total) || 0;

  // Total paid out
  const paidResult = await db
    .select({ total: sum(financialLedger.amountCents) })
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.sellerId, sellerId),
        eq(financialLedger.currency, currency),
        eq(financialLedger.transactionType, 'payout'),
        eq(financialLedger.status, 'paid')
      )
    );

  const totalPayedOut = Number(paidResult[0]?.total) || 0;

  // Available balance
  const availableResult = await db
    .select({ total: sum(financialLedger.amountCents) })
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.sellerId, sellerId),
        eq(financialLedger.currency, currency),
        eq(financialLedger.status, 'paid')
      )
    );

  const availableBalance = Math.max(
    0,
    Number(availableResult[0]?.total) || 0 - totalPayedOut
  );

  // Pending balance
  const pendingResult = await db
    .select({ total: sum(financialLedger.amountCents) })
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.sellerId, sellerId),
        eq(financialLedger.currency, currency),
        eq(financialLedger.status, 'pending')
      )
    );

  const pendingBalance = Number(pendingResult[0]?.total) || 0;

  // Total orders
  const ordersResult = await db
    .select()
    .from(orders)
    .where(eq(orders.sellerId, sellerId));

  // Total refunds
  const refundsResult = await db
    .select({ total: sum(financialLedger.amountCents) })
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.sellerId, sellerId),
        eq(financialLedger.currency, currency),
        eq(financialLedger.transactionType, 'refund_completed')
      )
    );

  const totalRefunds = Math.abs(Number(refundsResult[0]?.total) || 0);

  return {
    totalEarnings,
    totalPayedOut,
    availableBalance,
    pendingBalance,
    totalOrders: ordersResult.length,
    totalRefunds,
  };
}