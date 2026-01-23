# Luxela Escrow System with Tsara Payment Protocol

## Overview

The Luxela escrow system is an enterprise-level fashion eCommerce platform implementation that ensures secure transactions between buyers and sellers using Tsara as the payment protocol. The system implements a complete order lifecycle from shopping cart through payment, delivery confirmation, and seller payouts.

## System Architecture

### Core Components

1. **Escrow Service** (`server/services/escrowService.ts`)
   - Manages payment holds and releases
   - Coordinates order state transitions
   - Handles refund processing
   - Maintains financial ledger

2. **Checkout Router** (`server/routers/checkout.ts`)
   - Cart preparation and validation
   - Payment initialization with Tsara
   - Payment confirmation and verification
   - Order status queries

3. **Notification Service** (`server/services/notificationService.ts`)
   - In-app notifications
   - Email notifications via SMTP
   - Event-based triggers for buyer and seller
   - Notification templates

4. **Payment Service** (`server/services/paymentService.ts`)
   - Financial ledger management
   - Payment hold tracking
   - Balance calculations
   - Payout processing

5. **Tsara Integration** (`server/services/tsara.ts`)
   - Fiat payment links (card, bank transfer)
   - Stablecoin payments (USDC on Solana)
   - Checkout sessions
   - Payment verification

## Buyer Flow

### Step 1: Shopping Cart
```
GET /cart → Returns cart items with pricing
POST /cart/add → Add product to cart
PATCH /cart/item → Update quantity
DELETE /cart/item → Remove item
```

**Buyer Experience:**
- Browse fashion listings
- Add items to cart with quantity selection
- View cart summary with pricing breakdown
- Apply discount codes

### Step 2: Checkout Preparation
```
POST /checkout/prepare
Input: { cartId }
Returns: {
  items: [...],
  summary: { subtotalCents, taxCents, shippingCents, totalCents },
  sellers: [...]
}
```

**Buyer Experience:**
- Review order items
- See itemized pricing (subtotal, tax, shipping)
- Confirm seller information
- Choose payment method (Card, Bank Transfer, Crypto)

### Step 3: Payment Initialization
```
POST /checkout/initialize-payment
Input: {
  customerName,
  customerEmail,
  paymentMethod: 'card' | 'bank_transfer' | 'crypto',
  currency: 'NGN',
  successUrl?,
  cancelUrl?
}
Returns: {
  paymentId,
  paymentUrl,  // Redirect to Tsara payment page
  orderId,
  totalAmount,
  transactionRef
}
```

**Buyer Experience:**
- Enters delivery information
- Selects payment method
- Redirected to Tsara payment page
- Completes payment securely

**Backend Actions:**
- Creates order in "in_escrow" state
- Creates payment record with "pending" status
- Generates Tsara payment link
- Stores transaction reference

### Step 4: Payment Confirmation
```
POST /checkout/confirm
Input: { paymentId, transactionRef }
Returns: OrderOutput
```

**Flow:**
1. Receives webhook from Tsara confirming payment success
2. Verifies payment with Tsara API
3. Updates payment status to "completed"
4. Creates payment hold (escrow) for seller amount
5. Records sale in financial ledger
6. Clears buyer's cart
7. Sends confirmation email to buyer

**Notifications:**
- `notifyPaymentConfirmed()` - Buyer receives "Payment Confirmed" email
- `notifyOrderReceived()` - Seller receives "New Order" notification

### Step 5: Order Tracking
```
GET /checkout/orders?status=active|completed|all
Returns: OrderOutput[]
```

**Buyer Experience:**
- View all orders with status tracking
- See delivery status (not_shipped, in_transit, delivered)
- Track payment/escrow status
- Access order history

### Step 6: Delivery Confirmation
```
POST /checkout/confirm-delivery
Input: { orderId }
Returns: OrderOutput (with deliveryStatus: 'delivered', payoutStatus: 'processing')
```

**Buyer Experience:**
- Receives package notification after delivery
- Confirms receipt in app or email
- Payment hold automatically released to seller
- Can initiate refund if needed

**Notifications:**
- `notifyOrderDelivered()` - Reminder to confirm receipt
- Seller gets notification when buyer confirms delivery

---

## Seller Flow

### Step 1: Order Receipt Notification
When a buyer completes payment:
- Seller receives in-app and email notification
- Includes order details and amount held in escrow
- Shows customer information for fulfillment

**Notification:**
```
notifyOrderReceived(sellerId, orderId, amountCents, currency)
notifyPaymentHoldCreated(sellerId, orderId, amountCents, currency, 30)
```

### Step 2: Order Fulfillment
Seller prepares and ships order:

**Expected Endpoints:**
```
POST /seller/orders/{orderId}/mark-shipped
Input: { orderId, trackingNumber? }
Returns: OrderOutput (deliveryStatus: 'in_transit')
```

**Backend Actions:**
- Updates order status to "in_transit"
- Stores tracking information
- Sends notification to buyer

**Notification:**
```
notifyOrderShipped(buyerId, orderId, trackingNumber)
```

### Step 3: Payment Hold Active
During the 30-day hold period:
- Payment is secured in escrow
- Neither buyer nor seller can access funds directly
- Automatic release after delivery confirmation by buyer
- Protected against seller non-delivery

### Step 4: Payment Release
When buyer confirms delivery OR 30 days pass:
```
POST /seller/payout/initialize
Returns: { payoutId, status }
```

**Backend Actions:**
1. Payment hold status changes to "released"
2. Amount added to seller's available balance
3. Seller can request payout to bank account
4. Funds transferred via Tsara/banking partner

**Notifications:**
```
notifyPaymentReleased(sellerId, orderId, amountCents, currency)
```

### Step 5: Seller Dashboard
Seller can view:
- Active orders (in fulfillment)
- Escrow balance (funds in hold)
- Available balance (released, ready to payout)
- Transaction history (sales, refunds, payouts)
- Financial reports

**Expected Endpoints:**
```
GET /seller/dashboard/summary
GET /seller/orders
GET /seller/balance?currency=NGN
GET /seller/payouts
GET /seller/ledger
```

---

## Refund Flow

### Initiator: Buyer

**Scenario:** Product damaged, wrong item, doesn't match description

```
POST /refund/request-refund
Input: {
  orderId,
  reason: string,
  refundType: 'full' | 'partial',
  amountCents?: number,
  evidence?: string[] // URLs to images
}
Returns: { refundId, status }
```

**Flow:**
1. Buyer initiates refund request with evidence
2. Notification sent to seller with details
3. Seller can accept or contest within 48 hours
4. If accepted: Refund processed immediately
5. If contested: Support team arbitrates (up to 7 days)

**Notifications:**
```
// Buyer
notifyRefundInitiated(buyerId, orderId, amountCents, currency, reason)

// Seller
notifyRefundProcessing(sellerId, orderId, amountCents, currency, reason)
```

### Initiator: Seller

**Scenario:** Non-delivery protection, buyer not accessible, auto-refund deadline

**Flow:**
1. Seller can accept refund request within 48 hours
2. Amount released from buyer account
3. Funds returned via original payment method (or balance)
4. Refund hold released from seller escrow

### Completion

```
// Once refund is approved/completed
notifyRefundCompleted(buyerId, orderId, amountCents, currency)
notifyRefundCompleteForSeller(sellerId, orderId, amountCents, currency)
```

**Refund Processing:**
- Returned to Tsara account (instant)
- Buyer sees refund in 3-5 business days
- Financial ledger updated with refund entry
- Seller's escrow reduced by refund amount

---

## Database Schema

### Key Tables

```typescript
// Orders
orders {
  id: uuid
  buyerId: uuid (fk)
  sellerId: uuid (fk)
  listingId: uuid (fk)
  amountCents: int
  currency: varchar
  paymentMethod: enum (card|bank_transfer|crypto)
  deliveryStatus: enum (not_shipped|in_transit|delivered)
  payoutStatus: enum (in_escrow|processing|paid)
  createdAt: timestamp
  updatedAt: timestamp
}

// Payments
payments {
  id: uuid
  buyerId: uuid (fk)
  orderId: uuid (fk)
  amountCents: int
  currency: varchar
  paymentMethod: enum
  provider: enum (tsara)
  status: enum (pending|processing|completed|failed|refunded)
  transactionRef: varchar (unique)
  gatewayResponse: text (JSON)
  createdAt: timestamp
  updatedAt: timestamp
}

// Payment Holds (Escrow)
paymentHolds {
  id: uuid
  paymentId: uuid (fk)
  orderId: uuid (fk)
  sellerId: uuid (fk)
  amountCents: int
  currency: varchar
  releaseableAt: timestamp (30 days after order)
  holdStatus: enum (active|released|refunded)
  releasedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}

// Financial Ledger
financialLedger {
  id: uuid
  sellerId: uuid (fk)
  orderId: uuid (fk)
  transactionType: enum (sale|refund|payout|adjustment|fee)
  amountCents: int
  currency: varchar
  description: text
  createdAt: timestamp
}

// Notifications
notifications {
  id: uuid
  userId: uuid (fk)
  type: enum (purchase|review|comment|reminder|order_update|payment|refund)
  title: varchar
  message: text
  orderId: uuid (fk)
  isRead: boolean
  createdAt: timestamp
}

// Refunds
refunds {
  id: uuid
  orderId: uuid (fk)
  paymentId: uuid (fk)
  buyerId: uuid (fk)
  sellerId: uuid (fk)
  amountCents: int
  currency: varchar
  refundType: enum (full|partial)
  reason: text
  refundStatus: enum (pending|return_requested|return_approved|return_rejected|refunded)
  evidence?: text[]
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## API Endpoints Summary

### Buyer Endpoints

```
# Cart Management
GET /cart
POST /cart/add
PATCH /cart/item
DELETE /cart/item

# Checkout Flow
POST /checkout/prepare
POST /checkout/initialize-payment
POST /checkout/confirm
GET /checkout/orders
POST /checkout/confirm-delivery

# Notifications
GET /notifications
POST /notifications/{id}/read
POST /notifications/read-all
GET /notifications/unread-count

# Refunds
POST /refund/request-refund
GET /refund/status/{refundId}
POST /refund/cancel/{refundId}
```

### Seller Endpoints

```
# Order Management
GET /seller/orders
POST /seller/orders/{orderId}/mark-shipped
GET /seller/orders/{orderId}/details

# Dashboard
GET /seller/dashboard/summary
GET /seller/balance
GET /seller/active-escrow

# Financial
GET /seller/ledger
GET /seller/payouts
POST /seller/payout/initialize

# Refund Handling
POST /seller/refund/{refundId}/accept
POST /seller/refund/{refundId}/contest
```

---

## Security Features

### Payment Security
1. **Tsara Integration:**
   - PCI-DSS compliant payment processing
   - Encrypted card data handling
   - Fraud detection and prevention

2. **Escrow Protection:**
   - Funds held during entire transaction lifecycle
   - Automatic release after delivery confirmation
   - Time-based protection for disputes

3. **Transaction Verification:**
   - All payments verified with Tsara before order confirmation
   - Webhook signature validation
   - Double verification on refunds

### Data Security
- End-to-end encryption for sensitive data
- Audit logging for all financial transactions
- GDPR compliant data handling
- Role-based access control

---

## Error Handling & Recovery

### Payment Failures
- Automatic retry with exponential backoff
- Clear error messaging to buyer
- Option to retry payment
- Abandoned cart recovery emails

### Delivery Issues
- Extended dispute window (7 days after delivery)
- Automatic payment release after 30 days
- Support ticket integration for complex cases
- Evidence-based arbitration

### Refund Edge Cases
- Partial refunds tracked separately
- Multiple refunds per order handled correctly
- Seller contest mechanism
- Automatic resolution after timeout

---

## Monitoring & Analytics

### Key Metrics
- Payment success rate
- Average order value
- Refund rate and reasons
- Delivery confirmation rate
- Seller payout frequency
- Escrow balance trend

### Health Checks
- Payment processor connectivity
- Notification delivery status
- Database transaction integrity
- Ledger reconciliation

---

## Testing Checklist

- [ ] Complete buyer checkout flow with card payment
- [ ] Complete buyer checkout flow with crypto payment
- [ ] Order creation and escrow hold creation
- [ ] Payment hold automatic release after 30 days
- [ ] Buyer-initiated refund flow
- [ ] Seller-accepted refund
- [ ] Seller-contested refund (support arbitration)
- [ ] Multi-seller order handling
- [ ] Notification delivery (in-app and email)
- [ ] Payment hold queries and balance calculations
- [ ] Ledger reconciliation and accuracy
- [ ] Webhook reliability and retry logic
- [ ] Concurrent transaction handling
- [ ] Edge cases (canceled orders, partial refunds, etc.)

---

## Future Enhancements

1. **Dispute Resolution System:**
   - AI-powered arbitration
   - Support ticket prioritization
   - Community voting on disputes

2. **Advanced Analytics:**
   - Seller performance scoring
   - Buyer trust signals
   - Market trends and insights

3. **Payment Options:**
   - Cryptocurrency payments on multiple blockchains
   - Buy-now-pay-later (BNPL) options
   - Wallet integrations

4. **Loyalty & Rewards:**
   - Buyer cashback on purchases
   - Seller milestone bonuses
   - Referral program integration

5. **International Expansion:**
   - Multi-currency support beyond NGN
   - Cross-border shipping integration
   - International payment methods