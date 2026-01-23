# Escrow System Integration Guide

## Quick Start

### 1. Register the Routers

Update `server/index.ts` or your router file:

```typescript
import { checkoutRouter } from './routers/checkout';
import { notificationRouter } from './routers/notificationRouter';
import { cartRouter } from './routers/cart';
import { paymentRouter } from './routers/payment';
import { refundRouter } from './routers/refund';

export const appRouter = createTRPCRouter({
  // ... existing routers
  checkout: checkoutRouter,
  notifications: notificationRouter,
  cart: cartRouter,
  payment: paymentRouter,
  refund: refundRouter,
});
```

### 2. Environment Configuration

Add to `.env`:

```bash
# Tsara Payment Gateway
TSARA_BASE_URL=https://api.tsara.ng/v1
TSARA_SANDBOX_URL=https://sandbox.tsara.ng/v1
TSARA_SECRET_KEY=your_secret_key_here
TSARA_PUBLIC_KEY=your_public_key_here
NODE_ENV=development  # Use sandbox in development

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@luxela.ng

# Application
APP_URL=http://localhost:3000
APP_NAME=Luxela
```

### 3. Database Setup

Ensure all required tables exist in the database:

```sql
-- Run migrations
npm run db:migrate

-- Check schema
psql -U user -d database -c "\dt"
```

### 4. Webhook Configuration

Configure Tsara webhook in dashboard to post to:

```
https://yourdomain.com/api/webhooks/tsara-payment
```

Webhook handler example:

```typescript
// server/trpc/webhooks.ts
import crypto from 'crypto';
import { confirmPayment, createPaymentHold } from '../services/escrowService';

export async function handleTsaraWebhook(req: Request, body: any) {
  // Verify webhook signature
  const signature = req.headers.get('x-tsara-signature');
  const secret = process.env.TSARA_WEBHOOK_SECRET;

  const hash = crypto
    .createHmac('sha256', secret!)
    .update(JSON.stringify(body))
    .digest('hex');

  if (hash !== signature) {
    throw new Error('Invalid webhook signature');
  }

  // Handle payment confirmation
  if (body.event === 'payment.success') {
    const { reference, amount, currency } = body.data;

    // Find payment by reference
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionRef, reference));

    if (!payment || !payment.orderId) {
      console.error(`Payment not found: ${reference}`);
      return;
    }

    // Confirm payment
    await confirmPayment(payment.id, payment.orderId, reference);

    // Create hold for seller
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId));

    if (order) {
      await createPaymentHold(
        payment.id,
        order.id,
        order.sellerId,
        order.amountCents,
        order.currency,
        30
      );
    }

    // Send notifications
    await notifyPaymentConfirmed(payment.buyerId, payment.orderId, payment.amountCents, payment.currency);
    await notifyOrderReceived(order.sellerId, order.id, order.amountCents, order.currency);
  }

  // Handle payment failure
  if (body.event === 'payment.failed') {
    const { reference } = body.data;

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionRef, reference));

    if (payment) {
      await db
        .update(payments)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(payments.id, payment.id));

      // Notify buyer
      await sendNotification({
        type: 'payment',
        userId: payment.buyerId,
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again.',
        orderId: payment.orderId || undefined,
      });
    }
  }
}
```

---

## Frontend Implementation

### 1. Shopping Cart Component

```typescript
// components/ShoppingCart.tsx
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useCheckout';

export function ShoppingCart() {
  const { cart, addItem, removeItem, updateQuantity } = useCart();
  const { prepareCheckout, loading } = useCheckout();

  const handleCheckout = async () => {
    try {
      const summary = await prepareCheckout(cart.id);
      // Navigate to payment
      window.location.href = '/checkout/payment';
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  return (
    <div>
      {cart.items.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          onQuantityChange={(qty) => updateQuantity(item.id, qty)}
          onRemove={() => removeItem(item.id)}
        />
      ))}
      <div>
        <p>Total: ₦{(cart.summary.totalCents / 100).toFixed(2)}</p>
        <button onClick={handleCheckout} disabled={loading}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
```

### 2. Checkout Page

```typescript
// app/checkout/page.tsx
import { CheckoutForm } from '@/components/CheckoutForm';
import { OrderSummary } from '@/components/OrderSummary';

export default function CheckoutPage() {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <h1>Checkout</h1>
        <CheckoutForm />
      </div>
      <div>
        <OrderSummary />
      </div>
    </div>
  );
}
```

```typescript
// components/CheckoutForm.tsx
import { useCheckout } from '@/hooks/useCheckout';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CheckoutForm() {
  const router = useRouter();
  const { initializePayment, loading } = useCheckout();
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    paymentMethod: 'card' as 'card' | 'bank_transfer' | 'crypto',
    currency: 'NGN',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await initializePayment({
        ...formData,
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout/cancel`,
      });

      // Redirect to Tsara payment page
      window.location.href = result.paymentUrl;
    } catch (err) {
      console.error('Payment initialization failed:', err);
      alert('Payment initialization failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Full Name"
        value={formData.customerName}
        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.customerEmail}
        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
        required
      />
      <select
        value={formData.paymentMethod}
        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
      >
        <option value="card">Debit Card</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="crypto">Cryptocurrency (USDC)</option>
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Continue to Payment'}
      </button>
    </form>
  );
}
```

### 3. Payment Success/Callback

```typescript
// app/checkout/success/page.tsx
import { useSearchParams } from 'next/navigation';
import { useCheckout } from '@/hooks/useCheckout';
import { useEffect, useState } from 'react';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const { confirmCheckout, loading } = useCheckout();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paymentId = searchParams.get('paymentId');
    const transactionRef = searchParams.get('reference');

    if (!paymentId || !transactionRef) {
      setError('Invalid payment reference');
      return;
    }

    confirmCheckout({ paymentId, transactionRef })
      .then(() => setConfirmed(true))
      .catch((err) => setError(err.message));
  }, [searchParams, confirmCheckout]);

  if (loading) return <div>Processing payment confirmation...</div>;

  if (error) {
    return (
      <div className="error">
        <h2>Payment Confirmation Failed</h2>
        <p>{error}</p>
        <a href="/cart">Return to Cart</a>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="success">
        <h2>✓ Order Confirmed!</h2>
        <p>Your payment has been received and held securely in escrow.</p>
        <p>The seller will prepare your order for shipment.</p>
        <a href="/orders">View Your Orders</a>
      </div>
    );
  }

  return <div>Confirming payment...</div>;
}
```

### 4. Order Tracking Component

```typescript
// components/OrderTracker.tsx
import { useQuery } from '@/hooks/useQuery';
import { format } from 'date-fns';

export function OrderTracker({ orderId }: { orderId: string }) {
  const { data: order } = useQuery(
    ['orders', orderId],
    async () => {
      const response = await fetch(`/api/checkout/orders/${orderId}`);
      return response.json();
    }
  );

  if (!order) return <div>Loading order details...</div>;

  const steps = [
    {
      id: 'payment',
      label: 'Payment Confirmed',
      completed: order.paymentStatus === 'completed',
      date: order.orderDate,
    },
    {
      id: 'processing',
      label: 'Processing',
      completed: order.deliveryStatus !== 'not_shipped',
      date: order.updatedAt,
    },
    {
      id: 'shipped',
      label: 'Shipped',
      completed: order.deliveryStatus === 'in_transit',
      date: order.updatedAt,
    },
    {
      id: 'delivered',
      label: 'Delivered',
      completed: order.deliveryStatus === 'delivered',
      date: order.updatedAt,
    },
  ];

  return (
    <div className="order-tracker">
      <h2>Order Status</h2>
      <div className="steps">
        {steps.map((step, idx) => (
          <div key={step.id} className={`step ${step.completed ? 'completed' : ''}`}>
            <div className="dot" />
            <div className="label">
              <p>{step.label}</p>
              {step.date && <small>{format(step.date, 'MMM dd, yyyy')}</small>}
            </div>
            {idx < steps.length - 1 && <div className="line" />}
          </div>
        ))}
      </div>

      {order.deliveryStatus === 'delivered' && order.payoutStatus === 'in_escrow' && (
        <div className="action">
          <p>Please confirm receipt to release payment to seller.</p>
          <button onClick={() => handleConfirmDelivery(orderId)}>
            Confirm Delivery
          </button>
        </div>
      )}
    </div>
  );
}
```

### 5. Notifications Component

```typescript
// components/NotificationCenter.tsx
import { useQuery } from '@/hooks/useQuery';
import { Bell, X } from 'lucide-react';
import { useState } from 'react';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: summary, refetch } = useQuery(
    ['notifications', 'summary'],
    async () => {
      const response = await fetch('/api/notifications/summary');
      return response.json();
    }
  );

  const handleMarkAsRead = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
    refetch();
  };

  const handleMarkAllAsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    refetch();
  };

  return (
    <div className="notification-center">
      <button onClick={() => setIsOpen(!isOpen)} className="bell-icon">
        <Bell />
        {summary?.totalUnread > 0 && (
          <span className="badge">{summary.totalUnread}</span>
        )}
      </button>

      {isOpen && (
        <div className="dropdown">
          <div className="header">
            <h3>Notifications</h3>
            {summary?.totalUnread > 0 && (
              <button onClick={handleMarkAllAsRead}>Mark all as read</button>
            )}
          </div>
          <div className="notifications">
            {summary?.recentNotifications.map((notif) => (
              <div key={notif.id} className={`notification ${notif.isRead ? 'read' : 'unread'}`}>
                <div>
                  <p className="title">{notif.title}</p>
                  <p className="message">{notif.message}</p>
                </div>
                {!notif.isRead && (
                  <button onClick={() => handleMarkAsRead(notif.id)}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 6. Seller Dashboard Component

```typescript
// components/SellerDashboard.tsx
import { useQuery } from '@/hooks/useQuery';
import { SellerOrders } from './SellerOrders';
import { EscrowBalance } from './EscrowBalance';
import { FinancialLedger } from './FinancialLedger';

export function SellerDashboard() {
  const { data: summary } = useQuery(
    ['seller', 'dashboard'],
    async () => {
      const response = await fetch('/api/seller/dashboard/summary');
      return response.json();
    }
  );

  return (
    <div className="seller-dashboard">
      <div className="cards">
        <Card>
          <h3>Active Orders</h3>
          <p className="value">{summary?.activeOrders}</p>
        </Card>
        <Card>
          <h3>Escrow Balance</h3>
          <p className="value">₦{(summary?.escrowBalance / 100).toFixed(2)}</p>
        </Card>
        <Card>
          <h3>Available Balance</h3>
          <p className="value">₦{(summary?.availableBalance / 100).toFixed(2)}</p>
        </Card>
        <Card>
          <h3>Total Revenue</h3>
          <p className="value">₦{(summary?.totalRevenue / 100).toFixed(2)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-8">
        <SellerOrders />
        <FinancialLedger />
      </div>
    </div>
  );
}
```

---

## Hooks for Frontend

### useCheckout Hook

```typescript
// hooks/useCheckout.ts
import { trpc } from '@/utils/trpc';

export function useCheckout() {
  const prepareCheckout = trpc.checkout.prepareCheckout.useMutation();
  const initializePayment = trpc.checkout.initializePayment.useMutation();
  const confirmCheckout = trpc.checkout.confirmCheckout.useMutation();
  const getBuyerOrders = trpc.checkout.getBuyerOrders.useQuery({ status: 'all' });
  const confirmDelivery = trpc.checkout.confirmDelivery.useMutation();

  return {
    prepareCheckout: (cartId: string) => prepareCheckout.mutateAsync({ cartId }),
    initializePayment: (data: any) => initializePayment.mutateAsync(data),
    confirmCheckout: (data: any) => confirmCheckout.mutateAsync(data),
    orders: getBuyerOrders.data,
    confirmDelivery: (orderId: string) => confirmDelivery.mutateAsync({ orderId }),
    loading:
      prepareCheckout.isPending ||
      initializePayment.isPending ||
      confirmCheckout.isPending,
  };
}
```

### useNotifications Hook

```typescript
// hooks/useNotifications.ts
import { trpc } from '@/utils/trpc';

export function useNotifications() {
  const getNotifications = trpc.notifications.getNotifications.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (lastPage) => lastPage.page + 1 }
  );

  const getUnreadCount = trpc.notifications.getUnreadCount.useQuery();
  const markAsRead = trpc.notifications.markAsRead.useMutation();
  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation();
  const getNotificationSummary = trpc.notifications.getNotificationSummary.useQuery();

  return {
    notifications: getNotifications.data?.pages.flatMap((p) => p.notifications) || [],
    unreadCount: getUnreadCount.data || 0,
    markAsRead: (id: string) => markAsRead.mutateAsync({ notificationId: id }),
    markAllAsRead: () => markAllAsRead.mutateAsync(),
    summary: getNotificationSummary.data,
    isLoading: getNotifications.isLoading || getUnreadCount.isLoading,
  };
}
```

---

## Testing the System

### 1. Manual Testing Flow

```bash
# 1. Start development server
npm run dev

# 2. In browser, sign in as buyer
# 3. Add items to cart
# 4. Proceed to checkout
# 5. Fill form and select payment method
# 6. Use Tsara sandbox test credentials
# 7. Complete payment
# 8. Receive confirmation notification
# 9. View order in dashboard
# 10. Sign in as seller to see order notification
```

### 2. Automated Tests

```typescript
// __tests__/escrow.test.ts
import { createOrderFromCart, createPaymentHold, confirmDelivery } from '@/server/services/escrowService';
import { db } from '@/server/db';
import { orders, paymentHolds } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

describe('Escrow System', () => {
  it('should create order from cart', async () => {
    const result = await createOrderFromCart(
      'buyer-id',
      'seller-id',
      [{ listingId: 'listing-1', quantity: 1, unitPriceCents: 10000, currency: 'NGN' }],
      'John Doe',
      'john@example.com',
      'card'
    );

    expect(result.orderId).toBeDefined();
    expect(result.totalAmountCents).toBe(10000);
  });

  it('should create payment hold', async () => {
    const { orderId } = await createOrderFromCart(
      'buyer-id',
      'seller-id',
      [{ listingId: 'listing-1', quantity: 1, unitPriceCents: 10000, currency: 'NGN' }],
      'John Doe',
      'john@example.com',
      'card'
    );

    const hold = await createPaymentHold('payment-id', orderId, 'seller-id', 10000, 'NGN', 30);

    expect(hold.holdStatus).toBe('active');
    expect(hold.amountCents).toBe(10000);
  });

  it('should release payment hold on delivery confirmation', async () => {
    // Setup
    const { orderId } = await createOrderFromCart(
      'buyer-id',
      'seller-id',
      [{ listingId: 'listing-1', quantity: 1, unitPriceCents: 10000, currency: 'NGN' }],
      'John Doe',
      'john@example.com',
      'card'
    );

    await createPaymentHold('payment-id', orderId, 'seller-id', 10000, 'NGN', 30);

    // Confirm delivery
    const result = await confirmDelivery(orderId, 'buyer-id');

    expect(result.deliveryStatus).toBe('delivered');
    expect(result.payoutStatus).toBe('processing');

    // Verify hold was released
    const [hold] = await db.select().from(paymentHolds).where(eq(paymentHolds.orderId, orderId));
    expect(hold.holdStatus).toBe('released');
  });
});
```

---

## Troubleshooting

### Payment Not Confirming

1. Check Tsara webhook is configured correctly
2. Verify webhook signature validation
3. Check server logs for webhook processing errors
4. Manually verify payment in Tsara dashboard

### Notifications Not Sending

1. Check SMTP credentials in `.env`
2. Test email delivery with test send
3. Check spam folder for emails
4. Verify email template rendering

### Escrow Hold Issues

1. Verify `releaseableAt` is set 30 days in future
2. Check `holdStatus` is 'active'
3. Verify seller ID matches order seller
4. Check financial ledger for duplicate entries

---

## Performance Optimization

### 1. Database Queries

```typescript
// Use indexes on frequently queried columns
// paymentHolds table:
CREATE INDEX idx_payment_holds_seller_status ON paymentHolds(sellerId, holdStatus);
CREATE INDEX idx_payment_holds_order_id ON paymentHolds(orderId);

// orders table:
CREATE INDEX idx_orders_buyer_status ON orders(buyerId, payoutStatus);
CREATE INDEX idx_orders_seller_status ON orders(sellerId, deliveryStatus);
```

### 2. Caching

```typescript
// Cache seller balance queries
import { Redis } from 'ioredis';

const redis = new Redis();

export async function getSellerBalanceCached(sellerId: string, currency: string) {
  const cacheKey = `seller:balance:${sellerId}:${currency}`;
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const balance = await getSellerBalance(sellerId, currency);
  await redis.setex(cacheKey, 3600, JSON.stringify(balance)); // Cache 1 hour

  return balance;
}
```

### 3. Background Jobs

```typescript
// Auto-release expired holds
import { CronJob } from 'cron';

const releaseHoldsJob = new CronJob('0 0 * * *', async () => {
  // Run daily at midnight
  const released = await autoReleaseExpiredHolds();
  console.log(`Released ${released} expired payment holds`);
});

releaseHoldsJob.start();
```