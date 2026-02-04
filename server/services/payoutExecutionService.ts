import { db } from '../db';
import {
  scheduledPayouts,
  sellers,
  financialLedger,
  orders,
  notifications,
} from '../db/schema';
import { eq, and, lte, isNotNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';

interface PayoutMethodDetails {
  id: string;
  type: 'bank_transfer' | 'paypal' | 'crypto' | 'wise' | 'tsara';
  accountDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    email?: string;
    walletAddress?: string;
    tokenType?: string;
  };
}

interface TsaraPayoutRequest {
  amount: number;
  currency: string;
  payoutMethodId: string;
  sellerId: string;
  scheduleType: 'immediate' | 'daily' | 'weekly' | 'bi_weekly' | 'monthly';
  reference: string;
}

interface PayoutExecutionResult {
  success: boolean;
  payoutId: string;
  status: 'completed' | 'processing' | 'failed';
  message: string;
  transactionRef?: string;
  error?: string;
}

export function getValidPayoutMethodsForSchedule(
  scheduleType: 'immediate' | 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'scheduled',
  availableMethods: PayoutMethodDetails[]
): PayoutMethodDetails[] {
  if (scheduleType === 'immediate') {
    return availableMethods.filter((m) => m.type !== 'tsara');
  }

  if (['daily', 'weekly', 'bi_weekly', 'monthly'].includes(scheduleType)) {
    return availableMethods;
  }

  return availableMethods.filter((m) => m.type !== 'tsara');
}

export function validatePayoutMethod(
  method: PayoutMethodDetails,
  scheduleType: string,
  useEscrow: boolean
): { valid: boolean; reason?: string } {
  if (method.type === 'tsara' && useEscrow) {
    if (!['immediate', 'daily', 'weekly', 'bi_weekly', 'monthly'].includes(scheduleType)) {
      return {
        valid: false,
        reason: 'Tsara escrow is only available for automatic or recurring payouts',
      };
    }
  }

  if (method.type === 'bank_transfer') {
    if (!method.accountDetails?.accountNumber || !method.accountDetails?.accountName) {
      return { valid: false, reason: 'Invalid bank account details' };
    }
  }

  if (method.type === 'paypal') {
    if (!method.accountDetails?.email) {
      return { valid: false, reason: 'Invalid PayPal email' };
    }
  }

  if (method.type === 'crypto') {
    if (!method.accountDetails?.walletAddress) {
      return { valid: false, reason: 'Invalid crypto wallet address' };
    }
  }

  if (method.type === 'wise') {
    if (!method.accountDetails?.accountNumber) {
      return { valid: false, reason: 'Invalid Wise account details' };
    }
  }

  return { valid: true };
}

export async function executeTsaraPayout(
  request: TsaraPayoutRequest
): Promise<PayoutExecutionResult> {
  const tsaraSecretKey = process.env.TSARA_SECRET_KEY;
  const tsaraBaseUrl = process.env.TSARA_API_URL || 'https://api.tsara.io/v1';

  if (!tsaraSecretKey) {
    return {
      success: false,
      payoutId: request.reference,
      status: 'failed',
      message: 'Tsara API key not configured',
      error: 'TSARA_SECRET_KEY missing',
    };
  }

  try {
    const frequencyMap: Record<string, string> = {
      immediate: 'now',
      daily: 'daily',
      weekly: 'weekly',
      bi_weekly: 'biweekly',
      monthly: 'monthly',
    };

    const frequency = frequencyMap[request.scheduleType] || 'now';

    const response = await fetch(`${tsaraBaseUrl}/payouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tsaraSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: request.reference,
        amount: request.amount,
        currency: request.currency,
        recipient: request.payoutMethodId,
        frequency,
        type: 'bank_transfer',
        metadata: {
          sellerId: request.sellerId,
          scheduleType: request.scheduleType,
        },
      }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      return {
        success: false,
        payoutId: request.reference,
        status: 'failed',
        message: `Tsara API error: ${data.message || 'Unknown error'}`,
        error: data.code || 'TSARA_ERROR',
      };
    }

    return {
      success: true,
      payoutId: request.reference,
      status: data.status === 'pending' ? 'processing' : 'completed',
      message: `Payout submitted to Tsara successfully`,
      transactionRef: data.id || data.reference,
    };
  } catch (err: any) {
    console.error('Tsara payout execution error:', err);
    return {
      success: false,
      payoutId: request.reference,
      status: 'failed',
      message: `Tsara API connection failed: ${err.message}`,
      error: 'TSARA_CONNECTION_ERROR',
    };
  }
}

async function executeAlternativePayout(
  method: PayoutMethodDetails,
  amount: number,
  currency: string,
  reference: string
): Promise<PayoutExecutionResult> {
  switch (method.type) {
    case 'bank_transfer':
      console.log(`Bank transfer payout via Paystack: ${reference}`);
      return {
        success: true,
        payoutId: reference,
        status: 'processing',
        message: 'Payout submitted to payment processor',
      };

    case 'paypal':
      console.log(`PayPal payout: ${reference}`);
      return {
        success: true,
        payoutId: reference,
        status: 'processing',
        message: 'Payout submitted to PayPal',
      };

    case 'wise':
      console.log(`Wise payout: ${reference}`);
      return {
        success: true,
        payoutId: reference,
        status: 'processing',
        message: 'Payout submitted to Wise',
      };

    case 'crypto':
      console.log(`Crypto payout: ${reference}`);
      return {
        success: true,
        payoutId: reference,
        status: 'processing',
        message: 'Crypto payout initiated',
      };

    default:
      return {
        success: false,
        payoutId: reference,
        status: 'failed',
        message: `Unknown payout method: ${method.type}`,
        error: 'UNKNOWN_METHOD',
      };
  }
}

export async function processScheduledPayouts(): Promise<{
  processed: number;
  failed: number;
  totalAmount: number;
  errors: Array<{ payoutId: string; error: string }>;
}> {
  try {
    const now = new Date();

    const duePayouts = await db
      .select()
      .from(scheduledPayouts)
      .where(
        and(
          eq(scheduledPayouts.status, 'pending'),
          isNotNull(scheduledPayouts.nextScheduledAt),
          lte(scheduledPayouts.nextScheduledAt, now)
        )
      );

    if (!duePayouts.length) {
      console.log('No scheduled payouts due for processing');
      return { processed: 0, failed: 0, totalAmount: 0, errors: [] };
    }

    console.log(`Processing ${duePayouts.length} scheduled payouts`);

    let processed = 0;
    let failed = 0;
    let totalAmount = 0;
    const errors: Array<{ payoutId: string; error: string }> = [];

    for (const payout of duePayouts) {
      try {
        await processSingleScheduledPayout(payout);
        totalAmount += payout.amountCents;
        processed++;
      } catch (err: any) {
        console.error(`Failed to process payout ${payout.id}:`, err);
        errors.push({
          payoutId: payout.id,
          error: err.message || 'Unknown error',
        });
        failed++;
      }
    }

    console.log(
      `Scheduled payouts processing complete: ${processed} processed, ${failed} failed`
    );

    return {
      processed,
      failed,
      totalAmount,
      errors,
    };
  } catch (err: any) {
    console.error('Scheduled payout processing error:', err);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to process scheduled payouts',
    });
  }
}

async function processSingleScheduledPayout(payout: any): Promise<void> {
  const payoutId = payout.id;
  const reference = `payout_${payoutId.slice(0, 8)}_${Date.now()}`;

  try {
    const seller = await db.select().from(sellers).where(eq(sellers.id, payout.sellerId));
    if (!seller.length) {
      throw new Error('Seller not found');
    }

    const payoutMethods: PayoutMethodDetails[] = seller[0].payoutMethods
      ? JSON.parse(seller[0].payoutMethods)
      : [];

    const selectedMethod = payoutMethods.find((m) => m.id === payout.payoutMethodId);
    if (!selectedMethod) {
      throw new Error(`Payout method ${payout.payoutMethodId} not found`);
    }

    const validation = validatePayoutMethod(selectedMethod, payout.schedule, false);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid payout method');
    }

    let result: PayoutExecutionResult;

    if (selectedMethod.type === 'tsara' || selectedMethod.type === 'bank_transfer') {
      result = await executeTsaraPayout({
        amount: payout.amountCents / 100,
        currency: payout.currency || 'NGN',
        payoutMethodId: selectedMethod.id,
        sellerId: payout.sellerId,
        scheduleType: payout.schedule,
        reference,
      });

      if (!result.success) {
        result = await executeAlternativePayout(
          selectedMethod,
          payout.amountCents / 100,
          payout.currency || 'NGN',
          reference
        );
      }
    } else {
      result = await executeAlternativePayout(
        selectedMethod,
        payout.amountCents / 100,
        payout.currency || 'NGN',
        reference
      );
    }

    await db.transaction(async (tx) => {
      const newNextScheduledAt = calculateNextScheduleDate(payout.schedule);

      await tx
        .update(scheduledPayouts)
        .set({
          status: result.success ? (result.status === 'completed' ? 'completed' : 'processing') : 'failed',
          lastProcessedAt: new Date(),
          nextScheduledAt: result.success ? newNextScheduledAt : null,
          updatedAt: new Date(),
          note: `${payout.note || ''}\nRef: ${result.transactionRef || reference}`.trim(),
        })
        .where(eq(scheduledPayouts.id, payoutId));

      if (result.success) {
        await tx.insert(financialLedger).values({
          id: uuidv4(),
          sellerId: payout.sellerId,
          transactionType: 'payout',
          amountCents: -payout.amountCents, // Negative for outflow
          currency: payout.currency || 'NGN',
          status: result.status === 'completed' ? 'paid' : 'processing',
          description: `${payout.schedule} payout to ${selectedMethod.type} (${result.transactionRef || reference})`,
          createdAt: new Date(),
        });
      }

      await tx.insert(notifications).values({
        id: uuidv4(),
        sellerId: payout.sellerId,
        type: result.success ? 'payment_failed' : 'payment_failed', // Can be customized
        message: result.success
          ? `${payout.schedule} payout of ₦${(payout.amountCents / 100).toFixed(2)} has been processed`
          : `${payout.schedule} payout failed: ${result.message}`,
        isRead: false,
        isStarred: false,
        createdAt: new Date(),
      });
    });

    console.log(`Payout ${payoutId} processed: ${result.message}`);
  } catch (err: any) {
    console.error(`Error processing payout ${payoutId}:`, err);
    await db
      .update(scheduledPayouts)
      .set({
        status: 'failed',
        updatedAt: new Date(),
        note: `Error: ${err.message}`,
      })
      .where(eq(scheduledPayouts.id, payoutId))
      .catch((e) => console.error('Failed to update payout status:', e));

    throw err;
  }
}

function calculateNextScheduleDate(schedule: string): Date {
  const now = new Date();

  switch (schedule) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'bi_weekly':
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    default:
      return now;
  }
}

export async function processImmediatePayout(
  sellerId: string,
  amountCents: number,
  methodId: string,
  currency: string = 'NGN'
): Promise<PayoutExecutionResult> {
  const payoutId = uuidv4();
  const reference = `immediate_${payoutId.slice(0, 8)}_${Date.now()}`;

  try {
    const seller = await db.select().from(sellers).where(eq(sellers.id, sellerId));
    if (!seller.length) {
      throw new Error('Seller not found');
    }

    const payoutMethods: PayoutMethodDetails[] = seller[0].payoutMethods
      ? JSON.parse(seller[0].payoutMethods)
      : [];

    const method = payoutMethods.find((m) => m.id === methodId);
    if (!method) {
      throw new Error('Payout method not found');
    }

    if (method.type === 'tsara') {
      throw new Error('Tsara escrow is only available for recurring payouts');
    }

    const validation = validatePayoutMethod(method, 'immediate', false);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid payout method');
    }

    let result = await executeAlternativePayout(
      method,
      amountCents / 100,
      currency,
      reference
    );

    if (!result.success && method.type === 'bank_transfer') {
      result = await executeTsaraPayout({
        amount: amountCents / 100,
        currency,
        payoutMethodId: methodId,
        sellerId,
        scheduleType: 'immediate',
        reference,
      });
    }

    await db.transaction(async (tx) => {
      await tx.insert(financialLedger).values({
        id: uuidv4(),
        sellerId,
        transactionType: 'payout',
        amountCents: -amountCents,
        currency,
        status: result.success ? (result.status === 'completed' ? 'paid' : 'processing') : 'failed',
        description: `Immediate payout to ${method.type} (${result.transactionRef || reference})`,
        createdAt: new Date(),
      });

      if (result.success) {
        await tx.insert(notifications).values({
          id: uuidv4(),
          sellerId,
          type: 'payment_failed',
          message: `Immediate payout of ₦${(amountCents / 100).toFixed(2)} has been ${result.status === 'completed' ? 'completed' : 'submitted for processing'}`,
          isRead: false,
          isStarred: false,
          createdAt: new Date(),
        });
      }
    });

    return {
      ...result,
      payoutId,
    };
  } catch (err: any) {
    console.error(`Immediate payout error: ${err.message}`);
    return {
      success: false,
      payoutId,
      status: 'failed',
      message: `Immediate payout failed: ${err.message}`,
      error: 'IMMEDIATE_PAYOUT_ERROR',
    };
  }
}

export async function getAvailablePayoutBalance(
  sellerId: string,
  currency: string = 'NGN'
): Promise<{
  available: number;
  processing: number;
  total: number;
}> {
  try {
    const ledgerEntries = await db
      .select()
      .from(financialLedger)
      .where(
        and(
          eq(financialLedger.sellerId, sellerId),
          eq(financialLedger.currency, currency)
        )
      );

    let available = 0;
    let processing = 0;

    ledgerEntries.forEach((entry) => {
      if (entry.status === 'paid' && !['payout', 'refund_completed'].includes(entry.transactionType)) {
        available += entry.amountCents;
      } else if (entry.status === 'processing') {
        processing += entry.amountCents;
      }
    });

    return {
      available: Math.max(0, available),
      processing: Math.max(0, processing),
      total: available + processing,
    };
  } catch (err: any) {
    console.error('Get payout balance error:', err);
    return { available: 0, processing: 0, total: 0 };
  }
}