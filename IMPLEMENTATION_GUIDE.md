# Implementation Guide: Payment Automation System

## Quick Start - Critical Fixes (Priority 1)

### 1. Fix Webhook Signature Verification

**File:** `server/services/tsara.ts`

Replace the stubbed function:

```typescript
// ---- WEBHOOK VERIFICATION (Node + Edge compatible) ----
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = TSARA_SECRET_KEY
): Promise<boolean> {
  if (typeof crypto?.subtle !== "undefined") {
    // Edge Runtime (Web Crypto API)
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const sigBuffer = Uint8Array.from(Buffer.from(signature, "hex"));
      const dataBuffer = encoder.encode(payload);

      const isValid = await crypto.subtle.verify("HMAC", cryptoKey, sigBuffer, dataBuffer);
      return isValid;
    } catch (err) {
      console.error("Edge signature verification failed:", err);
      return false;
    }
  } else {
    // Node.js Runtime (use native crypto)
    try {
      const crypto = await import("crypto");
      const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      return hash === signature;
    } catch (err) {
      console.error("Node signature verification failed:", err);
      return false;
    }
  }
}
```

✅ This is already implemented correctly in the file! No changes needed.

---

### 2. Create Webhook Endpoint

**File:** `app/api/webhooks/tsara/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { payments, orders, paymentHolds, financialLedger } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyWebhookSignature, type TsaraResponse } from '@/server/services/tsara';
import { v4 as uuidv4 } from 'uuid';

interface TsaraWebhookEvent {
  event: 'payment.success' | 'payment.failed' | 'payment.pending' | 'payment.refunded';
  data: {
    id: string;
    reference: string;
    amount?: number;
    currency?: string;
    status: 'success' | 'failed' | 'pending' | 'refunded';
    metadata?: Record<string, any>;
  };
  signature?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body as TsaraWebhookEvent;

    // Verify webhook signature
    if (event.signature) {
      const isValid = await verifyWebhookSignature(
        JSON.stringify(event),
        event.signature,
        process.env.TSARA_WEBHOOK_SECRET
      );

      if (!isValid) {
        console.warn('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Map Tsara event to status
    const statusMap = {
      'payment.success': 'completed',
      'payment.failed': 'failed',
      'payment.pending': 'processing',
      'payment.refunded': 'refunded',
    };

    const newStatus = statusMap[event.event];

    // Find payment by reference
    const existingPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionRef, event.data.reference));

    if (!existingPayments.length) {
      console.warn(`Payment not found for reference: ${event.data.reference}`);
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = existingPayments[0];

    // Update payment status
    await db
      .update(payments)
      .set({
        status: newStatus as any,
        gatewayResponse: JSON.stringify(event),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Handle successful payment
    if (newStatus === 'completed' && payment.orderId) {
      try {
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, payment.orderId));

        if (order) {
          // Create payment hold (escrow)
          const now = new Date();
          const releaseableAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          await db.insert(paymentHolds).values({
            id: uuidv4(),
            sellerId: order.sellerId,
            paymentId: payment.id,
            orderId: order.id,
            amountCents: order.amountCents,
            currency: order.currency,
            holdStatus: 'active',
            releaseableAt,
            createdAt: now,
            updatedAt: now,
          });

          // Record in ledger
          await db.insert(financialLedger).values({
            id: uuidv4(),
            sellerId: order.sellerId,
            orderId: order.id,
            transactionType: 'sale',
            amountCents: order.amountCents,
            currency: order.currency,
            status: 'pending',
            description: `Payment hold for order ${order.id}`,
            paymentId: payment.id,
            createdAt: now,
          });

          // Update order status
          await db
            .update(orders)
            .set({
              payoutStatus: 'in_escrow',
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          console.log(`Webhook: Payment ${payment.id} confirmed, escrow hold created`);

          // TODO: Send notifications
          // - Notify buyer: payment received
          // - Notify seller: order ready to ship
        }
      } catch (error) {
        console.error('Failed to process successful payment:', error);
        // Still return 200 so Tsara doesn't retry
      }
    }

    // Handle failed payment
    if (newStatus === 'failed' || newStatus === 'refunded') {
      try {
        console.log(`Webhook: Payment ${payment.id} ${newStatus}`);
        // TODO: 
        // - Cancel order
        // - Return inventory
        // - Notify buyer
      } catch (error) {
        console.error('Failed to handle payment failure:', error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Webhook processed: ${event.event}`,
        paymentId: payment.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

---

### 3. Update Checkout to Use Webhook

**File:** `server/routers/checkout.ts` - Modify `confirmCheckout`

Change from manual verification to webhook-triggered:

```typescript
// OLD: confirmCheckout mutation (KEEP as backup, but mark as deprecated)
confirmCheckout: protectedProcedure
  .input(...)
  .output(...)
  .mutation(async ({ ctx, input }) => {
    // Add deprecation warning
    console.warn('⚠️ Manual confirmCheckout() called. Use webhook instead.');
    
    // Keep implementation for backward compatibility
    // ... existing code ...
  }),

// NEW: Auto-called by webhook (no public endpoint needed)
// The webhook endpoint calls this logic automatically
```

---

### 4. Fix Financial Ledger Duplication

**File:** `server/routers/finance.ts` - Update all queries

Replace Supabase queries with local database:

```typescript
import { getSellerBalance, getAvailableBalance, getSellerLedger } from '../services/paymentService';

export const financeRouter = createTRPCRouter({
  getLedgerEntries: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // ✅ Use local database instead of Supabase
      const entries = await getSellerLedger(ctx.user.id, input.limit, input.offset);

      return {
        entries,
        total: entries.length,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  getLedgerSummary: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const balance = await getSellerBalance(ctx.user.id, 'NGN');
      const available = await getAvailableBalance(ctx.user.id, 'NGN');

      return {
        totalBalance: balance / 100,
        availableBalance: available / 100,
        inEscrow: (balance - available) / 100,
      };
    }),

  // ... more methods ...

  getPayoutStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // ✅ Query local database
      const balance = await getSellerBalance(ctx.user.id, 'NGN');
      const available = await getAvailableBalance(ctx.user.id, 'NGN');

      return {
        availableBalance: available / 100,
        inEscrowBalance: (balance - available) / 100,
        totalBalance: balance / 100,
        totalPaidOut: 0, // TODO: Calculate from ledger
        pendingPayouts: 0, // TODO: Get from payout requests
        monthlyGrowthPercentage: 0, // TODO: Calculate
      };
    }),
});
```

---

### 5. Create Cron Jobs Service

**File:** `server/jobs/cronJobs.ts` (NEW)

```typescript
import { CronJob } from 'cron';
import { autoReleaseExpiredHolds } from '../services/escrowService';
import { db } from '../db';
import { orders, paymentHolds } from '../db/schema';
import { eq, gte } from 'drizzle-orm';

const jobs: CronJob[] = [];

export function startCronJobs() {
  // Auto-release expired escrow holds (every hour)
  const releaseHoldsJob = new CronJob(
    '0 * * * *', // Every hour
    async () => {
      try {
        console.log('[CRON] Starting auto-release of expired holds...');
        const released = await autoReleaseExpiredHolds(30);
        console.log(`[CRON] Released ${released} expired holds`);
      } catch (error) {
        console.error('[CRON] Error releasing holds:', error);
      }
    }
  );

  // Auto-complete stuck deliveries (every 6 hours)
  const completeStuckJob = new CronJob(
    '0 */6 * * *', // Every 6 hours
    async () => {
      try {
        console.log('[CRON] Checking for stuck deliveries...');
        
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const stuckOrders = await db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.deliveryStatus, 'in_transit'),
              lte(orders.updatedAt, thirtyDaysAgo)
            )
          );

        for (const order of stuckOrders) {
          await db
            .update(orders)
            .set({
              deliveryStatus: 'delivered',
              payoutStatus: 'processing',
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          console.log(
            `[CRON] Auto-completed delivery for order ${order.id}`
          );
        }
      } catch (error) {
        console.error('[CRON] Error auto-completing deliveries:', error);
      }
    }
  );

  // Start all jobs
  jobs.push(releaseHoldsJob, completeStuckJob);
  jobs.forEach(job => job.start());

  console.log(`[CRON] Started ${jobs.length} cron jobs`);
}

export function stopCronJobs() {
  jobs.forEach(job => job.stop());
  console.log(`[CRON] Stopped ${jobs.length} cron jobs`);
}
```

**File:** `server/index.ts` - Start cron jobs

```typescript
import { startCronJobs, stopCronJobs } from './jobs/cronJobs';

// Start cron jobs when server starts
startCronJobs();

// Graceful shutdown
process.on('SIGTERM', () => {
  stopCronJobs();
  process.exit(0);
});
```

---

### 6. Add Notifications System

**File:** `server/services/notificationService.ts` (Existing)

Update to send automatic notifications:

```typescript
export async function notifyPaymentReceived(
  buyerId: string,
  orderId: string,
  amount: number,
  currency: string
) {
  // Get buyer email/user
  const [buyer] = await db.select().from(buyers).where(eq(buyers.id, buyerId));
  
  if (buyer?.email) {
    // Send email
    await sendEmail({
      to: buyer.email,
      subject: 'Payment Received - Order Confirmed',
      template: 'payment-received',
      data: {
        buyerName: buyer.name,
        orderId: orderId.slice(0, 8),
        amount: (amount / 100).toFixed(2),
        currency,
      },
    });
  }

  // Send in-app notification
  await db.insert(notifications).values({
    id: uuidv4(),
    userId: buyerId,
    type: 'payment_received',
    title: 'Payment Received',
    message: `Your payment of ${currency} ${(amount / 100).toFixed(2)} has been received`,
    data: { orderId },
    createdAt: new Date(),
  });
}

export async function notifyReadyToShip(
  sellerId: string,
  orderId: string,
  buyerName: string
) {
  const [seller] = await db.select().from(sellers).where(eq(sellers.id, sellerId));
  
  if (seller?.email) {
    await sendEmail({
      to: seller.email,
      subject: 'New Order - Ready to Ship',
      template: 'ready-to-ship',
      data: {
        sellerName: seller.name,
        orderId: orderId.slice(0, 8),
        buyerName,
      },
    });
  }

  await db.insert(notifications).values({
    id: uuidv4(),
    userId: sellerId,
    type: 'ready_to_ship',
    title: 'Order Ready to Ship',
    message: `Order ${orderId.slice(0, 8)} is ready to ship`,
    data: { orderId },
    createdAt: new Date(),
  });
}

export async function notifyFundsReleased(
  sellerId: string,
  orderId: string,
  amount: number,
  currency: string
) {
  const [seller] = await db.select().from(sellers).where(eq(sellers.id, sellerId));
  
  if (seller?.email) {
    await sendEmail({
      to: seller.email,
      subject: 'Funds Released to Your Account',
      template: 'funds-released',
      data: {
        sellerName: seller.name,
        orderId: orderId.slice(0, 8),
        amount: (amount / 100).toFixed(2),
        currency,
      },
    });
  }

  await db.insert(notifications).values({
    id: uuidv4(),
    userId: sellerId,
    type: 'funds_released',
    title: 'Funds Released',
    message: `${currency} ${(amount / 100).toFixed(2)} released for order ${orderId.slice(0, 8)}`,
    data: { orderId },
    createdAt: new Date(),
  });
}
```

---

### 7. Call Notifications from Webhook

**File:** `app/api/webhooks/tsara/route.ts` - Add notifications

```typescript
import {
  notifyPaymentReceived,
  notifyReadyToShip,
} from '@/server/services/notificationService';

// In the webhook handler, after updating payment status:

if (newStatus === 'completed' && payment.orderId) {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId));

    if (order) {
      // Create hold...
      // Update order status...

      // 🚀 SEND NOTIFICATIONS
      await notifyPaymentReceived(
        order.buyerId,
        order.id,
        order.amountCents,
        order.currency
      );

      await notifyReadyToShip(
        order.sellerId,
        order.id,
        order.customerName
      );
    }
  } catch (error) {
    console.error('Failed to process successful payment:', error);
  }
}
```

---

## Phase 2: Seller Payout Automation

### 1. Create Payout Request Router

**File:** `server/routers/payout.ts` (NEW)

```typescript
import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { db } from '../db';
import { payments, payouts, orders, financialLedger } from '../db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';

export const payoutRouter = createTRPCRouter({
  // Get available balance for payout
  getAvailableForPayout: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const sellerId = ctx.user.id;

      // Get all released holds
      const releasedHolds = await db
        .select()
        .from(paymentHolds)
        .innerJoin(orders, eq(paymentHolds.orderId, orders.id))
        .where(
          and(
            eq(orders.sellerId, sellerId),
            eq(paymentHolds.holdStatus, 'released')
          )
        );

      const totalReleased = releasedHolds.reduce(
        (sum, row) => sum + row.payment_holds.amountCents,
        0
      );

      // Get already paid out amounts
      const paidOutEntries = await db
        .select()
        .from(financialLedger)
        .where(
          and(
            eq(financialLedger.sellerId, sellerId),
            eq(financialLedger.transactionType, 'payout')
          )
        );

      const totalPaidOut = paidOutEntries.reduce(
        (sum, entry) => sum + Math.abs(entry.amountCents),
        0
      );

      return {
        availableBalance: totalReleased - totalPaidOut,
        totalReleased,
        totalPaidOut,
        currency: 'NGN', // TODO: Support multiple currencies
      };
    }),

  // Request payout
  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive('Amount must be positive'),
        bankCode: z.string().optional(),
        accountNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const sellerId = ctx.user.id;

      // Get available balance
      const available = await db.query.payoutRouter.getAvailableForPayout();

      if (input.amount > available.availableBalance / 100) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Insufficient balance for payout',
        });
      }

      // Create payout record
      const payoutId = uuidv4();
      const amountCents = Math.round(input.amount * 100);

      await db.insert(payouts).values({
        id: payoutId,
        sellerId,
        amountCents,
        currency: 'NGN',
        status: 'pending',
        requestedAt: new Date(),
      });

      // Record in ledger
      await db.insert(financialLedger).values({
        id: uuidv4(),
        sellerId,
        transactionType: 'payout',
        amountCents: -amountCents,
        currency: 'NGN',
        status: 'pending',
        description: `Payout request for ${(amountCents / 100).toFixed(2)}`,
        payoutId,
        createdAt: new Date(),
      });

      return {
        success: true,
        payoutId,
        amount: input.amount,
        status: 'pending',
      };
    }),

  // Get payout history
  getPayoutHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const history = await db
        .select()
        .from(payouts)
        .where(eq(payouts.sellerId, ctx.user.id))
        .orderBy((t) => desc(t.requestedAt))
        .limit(input.limit)
        .offset(input.offset);

      return history;
    }),
});
```

---

## Testing Checklist

```bash
# 1. Test webhook signature verification
npm test -- webhook.test.ts

# 2. Test payment flow
npm test -- checkout.test.ts

# 3. Test escrow hold creation/release
npm test -- escrow.test.ts

# 4. Test cron jobs
npm test -- cronJobs.test.ts

# 5. Test payout logic
npm test -- payout.test.ts

# 6. Manual testing
curl -X POST http://localhost:3000/api/webhooks/tsara \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

---

## Deployment Checklist

- [ ] Environment variables configured:
  - `TSARA_SECRET_KEY`
  - `TSARA_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_APP_URL`
  - Email service credentials
- [ ] Database migrations run
- [ ] Webhook endpoint registered with Tsara
- [ ] Email service configured (SendGrid, Resend, etc.)
- [ ] Cron job service tested
- [ ] Monitoring/alerts configured
- [ ] Rollback plan documented
- [ ] Team trained on new workflow

---

## Monitoring & Support

### Key Metrics
```typescript
// Track these in your analytics
- Payment webhook success rate
- Escrow hold to release time
- Seller payout processing time
- Failed refunds
- Stuck orders
```

### Debug Commands
```bash
# Check payment status
SELECT * FROM payments WHERE transaction_ref = 'order_xyz';

# Check escrow holds
SELECT * FROM payment_holds WHERE order_id = 'xyz';

# Check payout status
SELECT * FROM payouts WHERE seller_id = 'xyz';

# Check ledger entries
SELECT * FROM financial_ledger WHERE seller_id = 'xyz';
```
