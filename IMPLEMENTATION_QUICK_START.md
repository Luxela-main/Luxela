# Payment Flow Implementation - Quick Start Guide

## Overview
This guide explains how to integrate the automatic payment flow system with Tsara payment gateway, escrow management, and seller payouts.

## Key Components Created

### 1. **Payment Flow Service** (`server/services/paymentFlowService.ts`)
Orchestrates the complete payment lifecycle:
- `handlePaymentSuccess()` - Process successful Tsara payments, create escrow holds, send notifications
- `handlePaymentFailure()` - Handle failed payments, notify buyer
- `handleOrderShipped()` - Mark order as shipped, notify buyer
- `handleOrderDelivered()` - Complete delivery, release escrow hold, trigger payout
- `handleRefundInitiated()` - Initialize refund process
- `handleRefundApproved()` - Approve refund, record in ledger
- `handleRefundCompleted()` - Complete refund transaction
- `createNotification()` - Send notifications to users
- `getPaymentFlowStatus()` - Get complete payment/order/escrow status

### 2. **Automatic Payout Service** (`server/services/automaticPayoutService.ts`)
Manages seller payouts and earnings:
- `processAutomaticPayouts()` - Automatically pay out sellers after delivery confirmation
- `getSellerPayoutBalance()` - Get available, pending, and total balance
- `getSellerPayoutHistory()` - Get seller's payout transaction history
- `requestManualPayout()` - Allow sellers to request payouts (with minimum threshold)
- `getSellerEarningsStats()` - Get comprehensive earnings statistics

### 3. **Dispute Resolution Service** (`server/services/disputeResolutionService.ts`)
Handles buyer protection and dispute management:
- `autoReleaseExpiredHolds()` - Auto-release holds after 30 days (buyer protection)
- `autoEscalateOldDisputes()` - Escalate unresolved disputes for admin review
- `initiateDispute()` - Buyer initiates dispute for an order
- `resolveDispute()` - Admin/system resolves dispute (full refund, seller keeps, or partial)
- `getHoldStatus()` - Check payment hold status

### 4. **Scheduler Service** (`server/services/schedulerService.ts`)
Manages automatic task scheduling:
- `initializeScheduledTasks()` - Start all automatic background jobs
- `cancelScheduledTask()` - Stop a specific task
- `cancelAllScheduledTasks()` - Stop all tasks
- `getScheduledTasksStatus()` - Monitor task status

## Integration Steps

### Step 1: Initialize Scheduler on Server Startup

In your server initialization file (e.g., `server/index.ts` or `server/trpc/router.ts`):

```typescript
import { initializeScheduledTasks } from './services/schedulerService';

// On server startup
initializeScheduledTasks();
console.log('Payment flow automation initialized');
```

### Step 2: Update Webhook Handler

Update `server/routers/webhook.ts` to use the new payment flow service:

```typescript
import { handlePaymentSuccess, handlePaymentFailure } from '../services/paymentFlowService';

export const webhookRouter = createTRPCRouter({
  handleTsaraPaymentWebhook: publicProcedure
    .input(TsaraWebhookPayload)
    .mutation(async ({ input }) => {
      try {
        const { event, data } = input;

        if (event === 'payment.success') {
          await handlePaymentSuccess(data);
        } else if (event === 'payment.failed') {
          await handlePaymentFailure(data);
        }

        return { success: true, message: `Webhook processed: ${event}` };
      } catch (err: any) {
        console.error('Webhook error:', err);
        return { success: false, error: err?.message };
      }
    }),
});
```

### Step 3: Add Payout Endpoints to Finance Router

Update `server/routers/finance.ts` to include:

```typescript
import {
  getSellerPayoutBalance,
  getSellerPayoutHistory,
  requestManualPayout,
  getSellerEarningsStats,
} from '../services/automaticPayoutService';

export const financeRouter = createTRPCRouter({
  // ... existing procedures ...

  getPayoutBalance: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return await getSellerPayoutBalance(userId);
    }),

  getPayoutHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return await getSellerPayoutHistory(userId, input.limit);
    }),

  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        accountName: z.string(),
        accountNumber: z.string(),
        bankCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return await requestManualPayout(userId, input.amount, 'NGN', {
        accountName: input.accountName,
        accountNumber: input.accountNumber,
        bankCode: input.bankCode,
      });
    }),

  getEarningsStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return await getSellerEarningsStats(userId);
    }),
});
```

### Step 4: Update Order Status Router

Add delivery confirmation and shipping update endpoints:

```typescript
import {
  handleOrderShipped,
  handleOrderDelivered,
} from '../services/paymentFlowService';
import {
  initiateDispute,
  resolveDispute,
} from '../services/disputeResolutionService';

export const orderStatusRouter = createTRPCRouter({
  // ... existing procedures ...

  markAsShipped: protectedProcedure
    .input(z.object({ orderId: z.string(), trackingNumber: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Verify seller authorization
      const order = await getOrder(input.orderId); // Your implementation
      if (order.sellerId !== ctx.user?.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      await handleOrderShipped(input.orderId, input.trackingNumber);
      return { success: true };
    }),

  confirmDelivery: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify buyer authorization
      const order = await getOrder(input.orderId);
      if (order.buyerId !== ctx.user?.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      await handleOrderDelivered(input.orderId);
      return { success: true };
    }),
});
```

### Step 5: Update Refund Router

Add automatic refund flow:

```typescript
import {
  handleRefundInitiated,
  handleRefundApproved,
  handleRefundCompleted,
} from '../services/paymentFlowService';

export const refundRouter = createTRPCRouter({
  // ... existing procedures ...

  initiateRefundWithFlow: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: z.string(),
        amount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buyerId = ctx.user?.id;
      if (!buyerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const amount = input.amount || 0;
      await handleRefundInitiated(input.orderId, buyerId, amount, input.reason);
      return { success: true, message: 'Refund initiated' };
    }),

  approveRefund: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sellerId = ctx.user?.id;
      if (!sellerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const order = await getOrder(input.orderId);
      if (order.sellerId !== sellerId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await handleRefundApproved(input.orderId, sellerId, order.amountCents);
      return { success: true, message: 'Refund approved' };
    }),
});
```

### Step 6: Frontend Integration

#### Buyer Payment Flow

```typescript
// 1. Initialize payment (redirects to Tsara)
const { paymentUrl } = await trpc.payment.createPayment.mutate({
  buyerId: userId,
  listingId: listingId,
  amount: totalAmount,
  currency: 'NGN',
  paymentMethod: 'card',
  description: 'Fashion purchase',
  successUrl: `${appUrl}/checkout/success`,
  cancelUrl: `${appUrl}/checkout/cancel`,
});

// Redirect to payment URL
window.location.href = paymentUrl;

// 2. On success page, verify payment
const result = await trpc.payment.verifyPayment.query({
  reference: paymentRef,
});

// 3. Confirm checkout
const confirmed = await trpc.checkout.confirmCheckout.mutate({
  paymentId: paymentId,
  transactionRef: paymentRef,
});
```

#### Seller Actions

```typescript
// Mark order as shipped
await trpc.orderStatus.markAsShipped.mutate({
  orderId: orderId,
  trackingNumber: trackingNumber,
});

// Check payout balance
const balance = await trpc.finance.getPayoutBalance.query();

// Request payout
const payout = await trpc.finance.requestPayout.mutate({
  amount: 50000, // ₦500
  accountName: 'John Doe',
  accountNumber: '1234567890',
  bankCode: 'GTB',
});
```

#### Buyer Actions

```typescript
// Confirm delivery
await trpc.checkout.confirmDelivery.mutate({
  orderId: orderId,
});

// Initiate refund if needed
await trpc.refund.initiateRefundWithFlow.mutate({
  orderId: orderId,
  reason: 'Item not as described',
  amount: totalAmount,
});

// Initiate dispute
await trpc.orderStatus.initiateDispute.mutate({
  orderId: orderId,
  reason: 'Payment issue',
  evidence: ['image1.jpg', 'image2.jpg'],
});
```

## Automatic Processes

### 1. Payment Hold Release (Every 6 hours)
- Checks for active holds older than 30 days
- Automatically releases funds to seller
- Sends notifications to both parties
- Records transaction in ledger

### 2. Payout Processing (Every 4 hours)
- Finds all released holds
- Processes seller payouts
- Updates financial ledger
- Records payout completion

### 3. Dispute Escalation (Every 24 hours)
- Checks for disputes open for more than 7 days
- Escalates to admin for review
- Sends notifications about escalation

## Database Schema Requirements

Ensure these tables exist in your database:

```sql
-- Payment holds (escrow)
CREATE TABLE payment_holds (
  id UUID PRIMARY KEY,
  seller_id UUID NOT NULL,
  payment_id UUID NOT NULL,
  order_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3),
  hold_status VARCHAR(20), -- 'active', 'released', 'refunded', 'expired'
  reason VARCHAR(255),
  releaseable_at TIMESTAMP,
  released_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Financial ledger
CREATE TABLE financial_ledger (
  id UUID PRIMARY KEY,
  seller_id UUID NOT NULL,
  order_id UUID,
  transaction_type VARCHAR(50), -- 'sale', 'refund', 'payout', etc.
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3),
  status VARCHAR(20), -- 'pending', 'completed', 'failed'
  description TEXT,
  payment_id UUID,
  created_at TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  order_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

## Testing

```bash
# Test payment webhook
curl -X POST http://localhost:3000/api/trpc/webhook.handleTsaraPaymentWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.success",
    "data": {
      "id": "tsara_123",
      "reference": "order_abc123",
      "amount": 50000,
      "currency": "NGN",
      "status": "success"
    }
  }'

# Check scheduled tasks
curl http://localhost:3000/api/health/tasks
```

## Monitoring

Monitor these key metrics:
1. **Payment Success Rate** - % of payments completing successfully
2. **Escrow Hold Duration** - Average time from payment to delivery
3. **Payout Processing Time** - Time from delivery to seller receiving funds
4. **Dispute Resolution Time** - Average time to resolve disputes
5. **Automatic Release Rate** - % of holds auto-released vs manually

## Troubleshooting

### Payments not being confirmed
- Check webhook URL configuration in Tsara dashboard
- Verify webhook signature verification is enabled
- Check database connection for financial_ledger table

### Payouts not processing
- Verify `processAutomaticPayouts()` is running
- Check that orders have `payoutStatus = 'processing'` after delivery
- Verify payment holds exist and are released

### Notifications not sending
- Check notifications table exists
- Verify user IDs are correct
- Check frontend is polling for new notifications

## Performance Optimization

For high-volume platforms:

1. **Database Indexes**
```sql
CREATE INDEX idx_payment_holds_status ON payment_holds(hold_status);
CREATE INDEX idx_payment_holds_seller ON payment_holds(seller_id);
CREATE INDEX idx_financial_ledger_seller ON financial_ledger(seller_id);
CREATE INDEX idx_financial_ledger_status ON financial_ledger(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
```

2. **Batch Processing**
- Process holds/payouts in batches of 100
- Use database transactions to ensure consistency
- Implement idempotency for webhook handling

3. **Caching**
- Cache seller payout balance (invalidate on transaction)
- Cache recent notifications
- Cache order status for quick lookups

## Support & Troubleshooting

For issues, check:
1. Logs in `server/services/*.ts`
2. Database entries in respective tables
3. Scheduled task status via `getScheduledTasksStatus()`
4. Webhook delivery logs from Tsara dashboard