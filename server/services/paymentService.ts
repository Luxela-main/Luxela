import { db } from '../db';
import {
  financialLedger,
  paymentHolds,
  refunds,
  orders,
  sellers,
  payments,
} from '../db/schema';
import { and, eq, sum } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';

export interface LedgerEntry {
  id: string;
  sellerId: string;
  orderId: string | null;
  transactionType: 'sale' | 'refund' | 'payout' | 'adjustment' | 'fee';
  amountCents: number;
  currency: string;
  description: string;
  createdAt: Date;
}

export interface PaymentHold {
  id: string;
  paymentId: string;
  orderId: string;
  sellerId: string;
  amountCents: number;
  currency: string;
  releaseableAt: Date;
}

export async function recordSale(
  sellerId: string,
  orderId: string,
  amountCents: number,
  currency: string
): Promise<void> {
  const holdId = uuidv4();
  const now = new Date();
  const releasesAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    // Create ledger entry for the sale
    const ledgerId = uuidv4();
    await tx.insert(financialLedger).values({
      sellerId,
      orderId,
      transactionType: 'sale',
      amountCents,
      currency,
      status: 'completed',
      description: `Sale from order ${orderId}`,
    });
  });
}

export async function recordRefund(
  orderId: string,
  amountCents: number,
  currency: string,
  reason: string
): Promise<void> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  // Fetch the payment associated with this order
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId));

  if (!payment) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Payment not found for this order',
    });
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(refunds).values({
      orderId,
      paymentId: payment.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      amountCents,
      currency,
      refundType: 'full',
      reason,
      refundStatus: 'pending',
    });

    await tx.insert(financialLedger).values({
      sellerId: order.sellerId,
      orderId,
      transactionType: 'refund',
      amountCents: -amountCents,
      currency,
      status: 'pending',
      description: `Refund for order ${orderId}: ${reason}`,
    });

    const holds = await tx
      .select()
      .from(paymentHolds)
      .where(
        and(

          eq(paymentHolds.holdStatus, 'active')
        )
      )
      .limit(1);

    const hold = holds[0];
    if (hold && typeof hold.amountCents === 'number' && hold.amountCents >= amountCents) {
      const newAmount = hold.amountCents - amountCents;
      await tx
        .update(paymentHolds)
        .set({
          amountCents: newAmount,
        })
        .where(eq(paymentHolds.id, hold.id));
    }
  });
}

export async function releasePaymentHold(holdId: string): Promise<void> {
  const [hold] = await db
    .select()
    .from(paymentHolds)
    .where(eq(paymentHolds.id, holdId));

  if (!hold) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Payment hold not found',
    });
  }

  await db.transaction(async (tx) => {
    // Update hold status
    await tx.update(paymentHolds)
      .set({
        holdStatus: 'released',
        releasedAt: new Date(),
      })
      .where(eq(paymentHolds.id, holdId));
  });
}

export async function getSellerBalance(
  sellerId: string,
  currency: string
): Promise<number> {
  const result = await db
    .select({ total: sum(financialLedger.amountCents) })
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.sellerId, sellerId),
        eq(financialLedger.currency, currency)
      )
    );

  const ledgerBalance = Number(result[0]?.total) || 0;

  const holdsResult = await db
    .select({ total: sum(paymentHolds.amountCents) })
    .from(paymentHolds)
    .innerJoin(orders, eq(paymentHolds.orderId, orders.id))
    .where(
      and(
        eq(orders.sellerId, sellerId),
        eq(paymentHolds.currency, currency)
      )
    );

  const heldAmount = Number(holdsResult[0]?.total) || 0;

  return ledgerBalance - heldAmount;
}

export async function getAvailableBalance(
  sellerId: string,
  currency: string
): Promise<number> {
  const result = await db
    .select({ total: sum(financialLedger.amountCents) })
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.sellerId, sellerId),
        eq(financialLedger.currency, currency)
      )
    );

  const ledgerBalance = Number(result[0]?.total) || 0;

  const releasedHoldsResult = await db
    .select({ total: sum(paymentHolds.amountCents) })
    .from(paymentHolds)
    .innerJoin(orders, eq(paymentHolds.orderId, orders.id))
    .where(
      and(
        eq(orders.sellerId, sellerId),
        eq(paymentHolds.currency, currency),
      )
    );

  const unreleasedheldAmount = Number(releasedHoldsResult[0]?.total) || 0;

  return ledgerBalance - unreleasedheldAmount;
}

export async function getSellerLedger(
  sellerId: string,
  limit: number = 100,
  offset: number = 0
): Promise<LedgerEntry[]> {
  const entries = await db
    .select()
    .from(financialLedger)
    .where(eq(financialLedger.sellerId, sellerId))
    .orderBy(financialLedger.createdAt)
    .limit(limit)
    .offset(offset);

  return entries.map(entry => ({
    id: entry.id,
    sellerId: entry.sellerId,
    orderId: entry.orderId || null,
    transactionType: entry.transactionType as 'sale' | 'refund' | 'payout' | 'adjustment' | 'fee',
    amountCents: entry.amountCents,
    currency: entry.currency,
    description: entry.description || '',
    createdAt: entry.createdAt,
  }));
}

export async function recordPayout(
  sellerId: string,
  amountCents: number,
  currency: string,
  method: string
): Promise<string> {
  const payoutId = uuidv4();

  await db.insert(financialLedger).values({
    id: payoutId,
    sellerId,
    transactionType: 'payout',
    amountCents: -amountCents,
    currency,
    status: 'completed',
    description: `Payout via ${method}`,
  });

  return payoutId;
}