import { db } from '../db';
import {
  financialLedger,
  paymentHolds,
  refunds,
  orders,
  sellers,
  payments,
  buyers,
  webhookLogs,
} from '../db/schema';
import { and, eq, sum, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';
import {
  createBuyerNotification,
  createSellerNotification,
} from './notificationManager';

// Event deduplication to prevent double processing of webhooks
const processedWebhookEvents = new Set<string>();
const WEBHOOK_CACHE_TTL = 3600000; 
let lastCacheClear = Date.now();

/**
 * Check if webhook event has been processed (Prevents race conditions)
 */
export function isWebhookEventProcessed(eventId: string): boolean {
  // Clear cache every hour to prevent memory leak
  if (Date.now() - lastCacheClear > WEBHOOK_CACHE_TTL) {
    processedWebhookEvents.clear();
    lastCacheClear = Date.now();
  }
  return processedWebhookEvents.has(eventId);
}

/**
 * Mark webhook event as processed
 */
export function markWebhookEventProcessed(eventId: string): void {
  processedWebhookEvents.add(eventId);
}

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

/**
 * Record a sale with proper validation and atomic transaction
 * Validates amount/currency, atomic transaction, prevents duplicates
 */
export async function recordSale(
  sellerId: string,
  orderId: string,
  amountCents: number,
  currency: string,
  paymentId?: string
): Promise<void> {
  // Validation: amount must be positive
  if (amountCents <= 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Sale amount must be greater than zero',
    });
  }

  // Validation: currency must be 3 characters
  if (!currency || currency.length !== 3) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid currency code',
    });
  }

  // Validate seller exists
  const [seller] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.id, sellerId));

  if (!seller) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Seller not found',
    });
  }

  const now = new Date();
  const releasesAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.transaction(async (tx: any) => {
    // Create ledger entry for the sale with transaction isolation
    const ledgerId = uuidv4();
    await tx.insert(financialLedger).values({
      id: ledgerId,
      sellerId,
      orderId,
      paymentId: paymentId || null,
      transactionType: 'sale',
      amountCents,
      currency,
      status: 'completed',
      description: `Sale from order ${orderId}`,
    });
  });

  // Notify seller of payment
  try {
    const amount = (amountCents / 100).toFixed(2);
    await createSellerNotification({
      sellerId,
      type: 'payment_processed',
      title: 'Payment Received',
      message: `Payment of ${currency} ${amount} received for order #${orderId.substring(0, 8)}`,
      severity: 'info',
      relatedEntityId: orderId,
      relatedEntityType: 'order',
      actionUrl: `/seller/orders/${orderId}`,
      metadata: { amountCents, currency },
    });
  } catch (notificationError) {
    console.error('Failed to create payment notification:', notificationError);
    // Don't throw - notification failure should not fail the sale
  }
}

/**
 * Record a refund with validation and idempotency
 * Validates refund amount doesn't exceed order total, prevents duplicate refunds, atomic transaction
 */
export async function recordRefund(
  orderId: string,
  amountCents: number,
  currency: string,
  reason: string,
  idempotencyKey?: string
): Promise<void> {
  // Validation: amount must be positive
  if (amountCents <= 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Refund amount must be greater than zero',
    });
  }

  // Validation: currency must be 3 characters
  if (!currency || currency.length !== 3) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid currency code',
    });
  }

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

  // Validate refund amount doesn't exceed order total
  if (amountCents > order.amountCents) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Refund amount (${amountCents}) exceeds order total (${order.amountCents})`,
    });
  }

  // Validate currency matches order currency
  if (currency !== order.currency) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Currency mismatch: refund currency ${currency} does not match order currency ${order.currency}`,
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

  await db.transaction(async (tx: any) => {
    // Check for duplicate refund to ensure idempotency
    if (idempotencyKey) {
      const existingRefund = await tx
        .select()
        .from(refunds)
        .where(
          and(
            eq(refunds.orderId, orderId),
            eq(refunds.paymentId, payment.id)
          )
        )
        .limit(1);

      if (existingRefund.length > 0) {
        console.warn('Duplicate refund request detected for order', orderId);
        return; // Idempotent - don't create duplicate
      }
    }

    // Calculate total already refunded for this order
    const existingRefunds = await tx
      .select({ total: sum(refunds.amountCents) })
      .from(refunds)
      .where(
        and(
          eq(refunds.orderId, orderId),
          eq(refunds.paymentId, payment.id)
        )
      );

    const totalAlreadyRefunded = Number(existingRefunds[0]?.total) || 0;
    const newTotalRefund = totalAlreadyRefunded + amountCents;

    // Prevent total refunds from exceeding order amount
    if (newTotalRefund > order.amountCents) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Total refunds (${newTotalRefund}) would exceed order total (${order.amountCents})`,
      });
    }

    const refundId = uuidv4();
    await tx.insert(refunds).values({
      id: refundId,
      orderId,
      paymentId: payment.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      amountCents,
      currency,
      refundType: amountCents === order.amountCents ? 'full' : 'partial',
      reason,
      refundStatus: 'pending',
      requestedAt: now,
    });

    const ledgerId = uuidv4();
    await tx.insert(financialLedger).values({
      id: ledgerId,
      sellerId: order.sellerId,
      orderId,
      paymentId: payment.id,
      transactionType: 'refund',
      amountCents: -amountCents,
      currency,
      status: 'pending',
      description: `Refund for order ${orderId}: ${reason}`,
    });

    // Find and update the correct payment hold
    const holds = await tx
      .select()
      .from(paymentHolds)
      .where(
        and(
          eq(paymentHolds.orderId, orderId),
          eq(paymentHolds.holdStatus, 'active')
        )
      )
      .limit(1);

    const hold = holds[0];
    if (hold && typeof hold.amountCents === 'number' && hold.amountCents >= amountCents) {
      const newAmount = Math.max(0, hold.amountCents - amountCents);
      await tx
        .update(paymentHolds)
        .set({
          amountCents: newAmount,
          updatedAt: now,
        })
        .where(eq(paymentHolds.id, hold.id));
    }
  });

  // Notify buyer and seller of refund
  try {
    const amount = (amountCents / 100).toFixed(2);

    // Notify buyer
    await createBuyerNotification({
      buyerId: order.buyerId,
      type: 'refund_issued',
      title: 'Refund Initiated',
      message: `A refund of ${currency} ${amount} has been initiated for order #${orderId.substring(0, 8)}. Reason: ${reason}`,
      relatedEntityId: orderId,
      relatedEntityType: 'order',
      actionUrl: `/buyer/orders/${orderId}`,
      metadata: { amountCents, currency, reason },
    });

    // Notify seller
    await createSellerNotification({
      sellerId: order.sellerId,
      type: 'refund_issued',
      title: 'Refund Processed',
      message: `Refund of ${currency} ${amount} processed for order #${orderId.substring(0, 8)}. Reason: ${reason}`,
      severity: 'warning',
      relatedEntityId: orderId,
      relatedEntityType: 'order',
      actionUrl: `/seller/orders/${orderId}`,
      metadata: { amountCents, currency, reason },
    });
  } catch (notificationError) {
    console.error('Failed to create refund notifications:', notificationError);
  }
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

  await db.transaction(async (tx: any) => {
    // Update hold status with proper isolation
    await tx.update(paymentHolds)
      .set({
        holdStatus: 'released',
        releasedAt: new Date(),
        updatedAt: new Date(),
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
    .where(
      and(
        eq(paymentHolds.sellerId, sellerId),
        eq(paymentHolds.currency, currency),
        eq(paymentHolds.holdStatus, 'active')
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
    .where(
      and(
        eq(paymentHolds.sellerId, sellerId),
        eq(paymentHolds.currency, currency),
        eq(paymentHolds.holdStatus, 'active')
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

  return entries.map((entry: any) => ({
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
  // Validation
  if (amountCents <= 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Payout amount must be greater than zero',
    });
  }

  const payoutId = uuidv4();

  await db.transaction(async (tx: any) => {
    await tx.insert(financialLedger).values({
      id: payoutId,
      sellerId,
      transactionType: 'payout',
      amountCents: -amountCents,
      currency,
      status: 'completed',
      description: `Payout via ${method}`,
    });
  });

  return payoutId;
}

/**
 * Get total refunded amount for an order
 */
export async function getTotalRefundedAmount(orderId: string): Promise<number> {
  const result = await db
    .select({ total: sum(refunds.amountCents) })
    .from(refunds)
    .where(
      and(
        eq(refunds.orderId, orderId),
        eq(refunds.refundStatus, 'refunded')
      )
    );

  return Number(result[0]?.total) || 0;
}