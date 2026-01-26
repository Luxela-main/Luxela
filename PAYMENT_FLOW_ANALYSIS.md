# Payment, Webhook & Escrow Flow Analysis

## Executive Summary
The payment, webhook, and escrow system has **solid foundational architecture** but has **critical gaps in automation and integration**. The flow is **partially connected** and requires several enhancements for full end-to-end automation.

---

## 1. WEBHOOK SYSTEM ✓ Good

### Current State
- **Well-defined webhook router** in `server/routers/webhook.ts`
- Tsara payment events are handled: `payment.success`, `payment.failed`, `payment.pending`, `payment.refunded`
- Webhook signature verification implemented (basic)
- Event logging and retry management structure in place
- Admin endpoints for webhook monitoring

### What Works
✅ Webhook handler receives and parses Tsara payment events  
✅ Payment status mapping: `payment.success` → `completed`  
✅ Escrow hold creation triggered on successful payment  
✅ Webhook signature verification (security)  
✅ Event management endpoints for debugging  

### Issues Found
❌ **Incomplete success flow**: After payment success, the webhook:
   - Creates payment hold (escrow) ✓
   - But **doesn't** notify buyer or seller
   - **Doesn't** update order status to "processing"
   
❌ **Missing failure handling**: Payment failure webhook:
   - Updates payment status only
   - **Doesn't** notify buyer about failure
   - **Doesn't** automatically cancel order or release inventory

❌ **No automatic status transitions**:
   - Webhook doesn't trigger `markOrderShipped()` 
   - Webhook doesn't trigger `confirmDelivery()`
   - No cron job for timeout-based automations

❌ **Webhook signature verification is stubbed**:
   ```typescript
   function verifyWebhookSignature(payload: string, signature: string): boolean {
     // TODO: Implement proper HMAC verification
     return true; // INSECURE - accepts all
   }
   ```

---

## 2. PAYMENT FLOW - BUYER SIDE ✓ Good Structure

### Current Flow (Checkout Router)

```
1. prepareCheckout()
   └─ Validates cart, calculates totals
   
2. initializePayment()
   ├─ Creates order in escrow state
   ├─ Creates Tsara payment link (fiat/crypto)
   ├─ Stores payment record (pending)
   └─ Returns paymentUrl for redirect

3. [BUYER PAYS ON TSARA] → Webhook

4. confirmCheckout()
   ├─ Verifies payment with Tsara ✓
   ├─ Updates payment status to "completed"
   ├─ Creates escrow hold ✓
   └─ Clears cart
```

### What Works
✅ Cart validation and total calculation  
✅ Tsara payment link creation (fiat & crypto)  
✅ Proper payment record tracking  
✅ Order created in escrow state  
✅ Payment verification before releasing funds  
✅ Proper transaction handling  

### Issues Found
❌ **Manual confirmation required**: 
   - `confirmCheckout()` is **manual procedure** (buyer must call it)
   - Should be **automatic via webhook** from Tsara
   - Creates race condition if buyer doesn't call it

❌ **No buyer notifications**:
   - No email/push when payment succeeds
   - No notification when order enters escrow
   - No order status updates sent to buyer

❌ **Missing delivery confirmation automation**:
   - `confirmDelivery()` requires buyer action
   - **No auto-release** after 30 days if buyer doesn't confirm
   - Risk of funds stuck in escrow indefinitely

---

## 3. ESCROW SERVICE - Core Logic ✓ Good

### Current State (`escrowService.ts`)

**Key Functions:**
- `createPaymentHold()` - Locks funds (30 days) ✓
- `confirmPayment()` - Verifies & activates escrow ✓
- `markOrderShipped()` - Seller action ✓
- `confirmDelivery()` - Buyer action ✓
- `processRefund()` - Releases escrow on refund ✓
- `autoReleaseExpiredHolds()` - Auto-release function exists ✓

### What Works
✅ Proper escrow states: `in_escrow` → `processing` → `paid`  
✅ 30-day hold period implemented  
✅ Hold amount tracking in financial ledger  
✅ Refund support with partial/full options  
✅ `autoReleaseExpiredHolds()` function exists for cron jobs  

### Critical Issues
❌ **No automatic invocation of hold expiration**:
   - `autoReleaseExpiredHolds()` **exists but is never called**
   - No cron job scheduled
   - **Funds can be stuck indefinitely** if buyer doesn't confirm

❌ **Manual workflow required**:
   - Seller must call `markOrderShipped()`
   - Buyer must call `confirmDelivery()`
   - **No automatic transitions** based on webhooks or time

❌ **Seller is not notified**:
   - When payment is in escrow
   - When to ship
   - When funds will be released

❌ **No timeout-based delivery confirmation**:
   - After 30 days of "in_transit", should auto-complete
   - Currently requires buyer action indefinitely

---

## 4. SELLER PAYMENT FLOW ✗ Disconnected

### Current State
- Sales router lists orders but **doesn't track escrow holds**
- Finance router tracks ledger entries but **not connected to escrow system**
- Payout stats query Supabase (not local DB)
- **No automatic payout triggering**

### Issues Found
❌ **Finance router uses Supabase** but escrow/payment use local DB:
   ```typescript
   // finance.ts
   const { data } = await ctx.supabase.from('financial_ledger')...
   
   // But escrowService.ts uses:
   await db.insert(financialLedger).values(...)
   ```
   **Two separate ledger systems!** Causes data inconsistency.

❌ **Seller doesn't see escrow holds**:
   - `getPayoutStats()` doesn't include "in_escrow" amount
   - Seller doesn't know funds are held until release
   - Available balance calculation is wrong

❌ **No automatic payout**:
   - When hold is released, funds don't move to seller
   - No bank transfer initiated
   - Seller must manually request payout

❌ **Missing seller notifications**:
   - No notification when order received
   - No notification when payment in escrow
   - No notification when to ship
   - No notification when funds released

---

## 5. REFUND FLOW ✓ Decent Structure

### Current Flows

**Seller-initiated refund:**
```
refundPayment() 
└─ Updates hold status to 'refunded'
└─ Records in ledger
└─ Returns funds to buyer (NOT IMPLEMENTED)
```

**Buyer-initiated return:**
```
requestReturn()
├─ Creates return request
├─ Records RMA number
└─ Waits for seller approval

processReturn() [SELLER]
├─ Approves/rejects with condition
└─ Updates ledger

completeRefund() [SELLER]
└─ Marks refunded, records in ledger
```

### What Works
✅ Return request flow with RMA numbers  
✅ Seller approval process  
✅ Partial & full refunds  
✅ Return condition tracking  
✅ Ledger entries for all transactions  

### Issues Found
❌ **Refund doesn't trigger actual payment**:
   - Only updates database status
   - **Doesn't call Tsara API to reverse payment**
   - Funds never actually returned to buyer

❌ **No automatic refund release**:
   - Hold marked as 'refunded' but not released
   - Escrow state doesn't transition properly

❌ **Buyer doesn't get notification**:
   - No email when return is approved
   - No notification of refund timeline

---

## 6. CRITICAL MISSING FEATURES

### A. Automatic Webhooks from Tsara → System
**Status:** ❌ Missing

Currently:
- System calls Tsara to verify payment
- Webhook handler exists but **not integrated into checkout flow**

Should be:
- Tsara sends webhook → System processes → Order transitions automatically
- Need to implement webhook endpoint in Next.js API routes

### B. Automatic Order Status Transitions
**Status:** ❌ Missing

Currently:
- All transitions are manual (buyer/seller action required)
- Webhook handler doesn't trigger transitions

Should be:
- Payment success → Automatically notify seller + order status "ready to ship"
- 30 days after delivery confirmed → Auto-release hold
- Order stuck in transit > 30 days → Send dispute to support

### C. Automatic Payout Processing
**Status:** ❌ Missing

Currently:
- Funds released to escrow balance manually
- No bank transfer logic
- Seller must manually request payout

Should be:
- When hold released → Funds move to "available balance"
- Weekly/monthly automatic payout to seller's bank account
- Payout status tracked in ledger

### D. Notification System Integration
**Status:** ❌ Missing

No notifications sent for:
- ❌ Payment received
- ❌ Order in escrow
- ❌ Ready to ship notification
- ❌ Delivery confirmed
- ❌ Funds released
- ❌ Payout initiated
- ❌ Refund approved/rejected

### E. Cron Job for Automation
**Status:** ❌ Missing

No scheduled jobs for:
- ❌ Auto-release expired holds
- ❌ Auto-complete stuck deliveries
- ❌ Initiate weekly/monthly payouts
- ❌ Cleanup old webhook logs
- ❌ Send notification reminders

### F. Escrow Hold to Seller Balance Transition
**Status:** ❌ Missing

Currently:
- Payment hold created: `holdStatus: 'active'`
- Hold released: `holdStatus: 'released'`
- **But hold is never transferred to seller's available balance**
- Seller doesn't see released funds in `getAvailableBalance()`

---

## 7. DATABASE INCONSISTENCIES

### Issue: Two Financial Ledger Systems

**Ledger 1 - Local Database** (`escrowService.ts`):
```typescript
await db.insert(financialLedger).values({
  sellerId,
  orderId,
  transactionType: 'sale',
  amountCents,
  status: 'pending',
  description: `Payment hold for order ${orderId}`
})
```

**Ledger 2 - Supabase** (`finance.ts`):
```typescript
const { data } = await ctx.supabase
  .from('financial_ledger')
  .select('*')
  .eq('seller_id', ctx.user.id)
```

**Result:** Sellers see **inconsistent balances** depending on which API they query.

---

## 8. SECURITY ISSUES

### A. Webhook Signature Verification Stubbed
```typescript
function verifyWebhookSignature(payload: string, signature: string): boolean {
  // TODO: Implement proper HMAC verification
  return true; // 🚨 ACCEPTS ALL REQUESTS
}
```

**Risk:** Anyone can forge Tsara webhook events and steal funds.

**Fix:**
```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.TSARA_WEBHOOK_SECRET!;
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return hash === signature;
}
```

### B. Payment Confirmation Race Condition
- Webhook from Tsara says payment succeeded
- Buyer also calls `confirmCheckout()` manually
- **Both could execute simultaneously**, creating duplicate holds

---

## 9. CURRENT FLOW DIAGRAM

```
┌─────────────┐
│    BUYER    │
└──────┬──────┘
       │
       ├─→ prepareCheckout() ✓
       │   (validate cart, calc total)
       │
       ├─→ initializePayment() ✓
       │   (create Tsara link)
       │
       ├─→ [REDIRECT TO TSARA]
       │   (buyer pays on Tsara)
       │
       ├─→ confirmCheckout() ⚠️ MANUAL
       │   (verify payment)
       │   ├─→ Create hold ✓
       │   └─→ Clear cart ✓
       │
       ├─→ [Seller ships] ⚠️ MANUAL
       │   (markOrderShipped)
       │
       └─→ confirmDelivery() ⚠️ MANUAL
           (confirm receipt)
           ├─→ Release hold
           └─→ Seller gets paid

❌ MISSING:
- Auto confirmCheckout() via webhook
- Auto markOrderShipped notification
- Auto release after 30 days
- Notifications at each step
```

---

## 10. RECOMMENDED ACTION PLAN

### Phase 1: IMMEDIATE (Critical)
**Timeline: 1-2 weeks**

1. **Fix webhook signature verification**
   - Implement proper HMAC-SHA256 validation
   - Test with Tsara webhook events

2. **Implement Next.js webhook endpoint**
   - `app/api/webhooks/tsara.ts` → route webhook to tRPC
   - Verify signature → call `handleTsaraPaymentWebhook()`

3. **Auto-trigger confirmCheckout() from webhook**
   - When webhook receives `payment.success`
   - Automatically call `confirmPayment()` and `createPaymentHold()`
   - Remove manual `confirmCheckout()` requirement

4. **Fix financial ledger split**
   - Standardize on local database only
   - Remove Supabase queries from finance router
   - Create migration script

5. **Add seller notifications**
   - Notify when payment in escrow
   - Notify when ready to ship
   - Notify when funds released

### Phase 2: AUTOMATION (Important)
**Timeline: 2-3 weeks**

1. **Create cron job service**
   ```typescript
   // server/jobs/cronJobs.ts
   export async function startCronJobs() {
     // Every hour
     schedule('0 * * * *', async () => {
       await autoReleaseExpiredHolds(30);
       await autoCompleteStuckDeliveries();
       await initiateWeeklyPayouts();
     });
   }
   ```

2. **Implement automatic delivery confirmation**
   - After 30 days in "in_transit" → auto-mark "delivered"
   - Send reminder notification before auto-confirming

3. **Implement automatic payout**
   - Weekly job that releases funds from escrow to seller balance
   - Integrate with bank transfer API (Flutterwave, etc.)

4. **Add transaction history tracking**
   - Track hold creation, release, payout in ledger
   - Show seller clear payout timeline

### Phase 3: ENHANCEMENT (Nice-to-have)
**Timeline: 3-4 weeks**

1. **Implement dispute resolution**
   - If buyer hasn't confirmed delivery in 30 days → auto-release
   - If seller hasn't shipped in 5 days → send reminder
   - Admin can manually release or hold

2. **Add webhook retry logic**
   - Queue failed webhooks for retry
   - Exponential backoff (5m, 15m, 1h, etc.)

3. **Implement seller dashboard widgets**
   - "Funds in Escrow" widget
   - "Pending Payouts" widget
   - Payment timeline visualization

4. **Add webhook analytics**
   - Track success/failure rates per event type
   - Monitor Tsara API latency
   - Alert on unusual patterns

---

## 11. IMPLEMENTATION CHECKLIST

### Webhook & Automation
- [ ] Fix `verifyWebhookSignature()` implementation
- [ ] Create `app/api/webhooks/tsara.ts` endpoint
- [ ] Auto-call `confirmPayment()` on webhook success
- [ ] Auto-send notifications on payment success
- [ ] Create `server/jobs/cronJobs.ts` for scheduled tasks
- [ ] Implement `autoReleaseExpiredHolds()` job
- [ ] Implement auto-delivery-confirmation job
- [ ] Add webhook retry queue

### Payment Flow
- [ ] Remove manual `confirmCheckout()` requirement
- [ ] Auto-update seller order status
- [ ] Send buyer "payment received" email
- [ ] Send seller "ready to ship" notification

### Escrow & Ledger
- [ ] Consolidate ledger to local database only
- [ ] Fix `getAvailableBalance()` calculation
- [ ] Add hold-to-balance transition logic
- [ ] Create seller "escrow summary" endpoint
- [ ] Add payout status tracking

### Refunds
- [ ] Implement Tsara refund API call
- [ ] Auto-release hold on refund approval
- [ ] Send refund status notifications
- [ ] Track refund timeline in ledger

### Notifications
- [ ] Payment received email/push
- [ ] Escrow confirmation
- [ ] Shipping reminder (seller)
- [ ] Ready for pickup/delivery (buyer)
- [ ] Delivery confirmed
- [ ] Funds released notification (seller)
- [ ] Payout initiated notification

---

## 12. TESTING STRATEGY

### Unit Tests
- [ ] Webhook signature verification
- [ ] Payment hold creation and release
- [ ] Automatic status transitions
- [ ] Ledger entry calculations

### Integration Tests
- [ ] Full payment flow: checkout → payment → hold → delivery → payout
- [ ] Refund flow: refund request → approval → release → ledger
- [ ] Timeout scenarios: 30-day hold expiration
- [ ] Concurrent operations: simultaneous webhook + API call

### End-to-End Tests
- [ ] Buyer journey: browse → checkout → pay → receive → confirm
- [ ] Seller journey: list → receive order → ship → get paid
- [ ] Support journey: issue refund → verify ledger → confirm payout

---

## 13. MONITORING & ALERTS

### Metrics to Track
- Payment success rate (goal: > 99%)
- Webhook processing latency (goal: < 1s)
- Escrow-to-payout time (goal: < 31 days)
- Failed webhooks (alert if > 5 in 1 hour)
- Stuck orders (alert if > 0 after 30 days)

### Alerts to Set Up
- 🚨 Webhook failure rate > 5%
- 🚨 Escrow hold not released after 32 days
- 🚨 Payment received but no order created
- 🚨 Order marked shipped but no tracking number
- ⚠️ Webhook processing latency > 2s

---

## 14. MIGRATION STRATEGY

### Safe Rollout Plan
1. **Phase 1:** Deploy webhook verification fix (no breaking changes)
2. **Phase 2:** Deploy cron job service (runs in parallel, non-blocking)
3. **Phase 3:** Migrate ledger queries gradually (test both systems)
4. **Phase 4:** Enable automatic transitions (with manual override)
5. **Phase 5:** Notify users of auto-features, monitor closely

### Rollback Plan
- Keep manual procedures available as fallback
- Database transactions ensure consistency
- Webhook retry queue prevents data loss

---

## SUMMARY

| Component | Status | Priority |
|-----------|--------|----------|
| Webhook Handler | ✓ Exists | 🔴 Secure & Automate |
| Payment Creation | ✓ Works | 🟢 OK |
| Escrow Hold Logic | ✓ Works | 🟡 Add Automation |
| Auto-Release | ⚠️ Stubbed | 🔴 Implement |
| Seller Payouts | ❌ Missing | 🔴 Implement |
| Notifications | ❌ Missing | 🔴 Implement |
| Cron Jobs | ❌ Missing | 🔴 Implement |
| Ledger Consolidation | ❌ Fragmented | 🔴 Fix |

**Overall Grade: 5/10** (Foundation is solid, but automation is critical gap)
