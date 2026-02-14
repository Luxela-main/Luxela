# Order Management Pages - Complete Guide

## Overview

The seller order management system has been redesigned to provide easy, real-time order processing across different status pages. Each page is now equipped with inline action buttons to move orders through the workflow without requiring navigation to a separate detail page.

---

## Order Status Workflow

```
PENDING ORDERS
    ↓
    [Sellers must CONFIRM]
    ↓
CONFIRMED ORDERS
    ↓
    [Sellers mark as PROCESSING]
    ↓
PROCESSING ORDERS
    ↓
    [Sellers provide SHIPMENT details & mark as SHIPPED]
    ↓
SHIPPED ORDERS
    ↓
    [Awaiting buyer confirmation of delivery]
    ↓
DELIVERED ORDERS
    ↓
    [Order complete - view history]
```

---

## Page-by-Page Breakdown

### 1. **Pending Orders** (`/sellers/pending-orders/page.tsx`)

**Status:** Orders waiting for seller confirmation

**Actions Available:**
- ✅ **Confirm** - Move order to "confirmed" status
- ❌ **Cancel** - Cancel order with reason selection
- 📋 **Bulk Actions** - Confirm/Cancel multiple orders at once

**Key Features:**
- Required confirmation before any processing
- Select-all checkbox for bulk operations
- Cancel reason dropdown (required field):
  - Out of Stock
  - Customer Request
  - Payment Issue
  - Shipping Delay
  - Other Reason

**Currency Display:** NGN with K,M,B,T abbreviation (e.g., ₦5M)

**How It Works:**
1. Orders arrive in "pending" status
2. Seller reviews order details
3. Seller clicks "Confirm" button
4. Order moves to "confirmed" status and appears in Confirmed Orders page
5. Buyer receives notification that order has been confirmed

---

### 2. **Confirmed Orders** (`/sellers/orders/confirmed/page.tsx`)

**Status:** Orders confirmed by seller, ready to be processed

**Actions Available:**
- ⚙️ **Process** - Mark order as being processed
- 👁️ **View** - Go to order detail page

**Key Features:**
- Card-based grid layout
- Shows order ID, product, customer, and amount
- Confirmed date display
- Real-time update on button click

**Currency Display:** NGN with K,M,B,T abbreviation

**How It Works:**
1. Seller reviews confirmed order
2. Clicks "Process" button to start preparing the order
3. Order immediately moves to "processing" status
4. Success toast notification appears
5. Order appears in Processing Orders page

---

### 3. **Processing Orders** (`/sellers/orders/processing/page.tsx`)

**Status:** Orders being prepared by seller

**Actions Available:**
- 🚚 **Ship** - Opens shipment details dialog
- 👁️ **View** - Go to order detail page

**Dialog: Mark Order as Shipped**

When seller clicks "Ship", a dialog appears with fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Tracking Number | Text | ✓ | Unique tracking number for shipment |
| Carrier | Dropdown | ✗ | Shipping provider (Standard, Express, FedEx, UPS, DHL) |
| Estimated Delivery Date | Date | ✓ | Expected delivery date |

**Key Features:**
- Form validation (no empty required fields)
- Loading state while submitting
- Product preview in dialog
- Error handling with toast notifications

**Currency Display:** NGN with K,M,B,T abbreviation

**How It Works:**
1. Seller finishes preparing order
2. Clicks "Ship" button
3. Enters tracking information in dialog
4. Clicks "Confirm Shipment"
5. Order moves to "shipped" status
6. Buyer receives notification with tracking details
7. Order appears in Shipped Orders page

---

### 4. **Shipped Orders** (`/sellers/orders/shipped/page.tsx`)

**Status:** Orders shipped and in transit to buyer

**Actions Available:**
- 📍 **View Tracking** - Go to order detail page to see tracking info
- (No seller action required - awaiting buyer confirmation)

**Key Features:**
- Read-only information display
- Shows shipped date
- Tracking information maintained on detail page
- Awaiting buyer delivery confirmation

**Currency Display:** NGN with K,M,B,T abbreviation

**How It Works:**
1. Order is displayed with "Shipped" status
2. Buyer tracks delivery
3. Once buyer receives and confirms, order moves to "delivered"
4. Seller can view tracking details on order page
5. Order appears in Delivered Orders page

---

### 5. **Delivered Orders** (`/sellers/orders/delivered/page.tsx`)

**Status:** Orders successfully delivered and confirmed by buyer

**Actions Available:**
- 📋 **View Order** - Go to order detail page (read-only)

**Key Features:**
- Historical record of completed orders
- Shows delivery date
- Read-only information
- Green badge indicating completion
- Order timeline visible on detail page

**Currency Display:** NGN with K,M,B,T abbreviation

**How It Works:**
1. Buyer confirms receipt of order
2. Order automatically moves to "delivered" status
3. Seller can view completed order details
4. Payment may be released (check payout status on detail page)
5. Order serves as historical record

---

## Order Detail Page (`/sellers/orders/[orderId]/page.tsx`)

**Accessible from:** Any order page or direct link

**Sections:**

### Left Panel (Main Content)
- **Order Information**
  - Product name
  - Quantity
  - Order date
  - Amount (NGN format)

- **Buyer Information**
  - Customer name
  - Email
  - Buyer ID

- **Shipping Address**
  - Full delivery address (if available)

- **Payment Information**
  - Payment method (Card, Transfer, etc.)
  - Payout status (Paid, In Escrow, Pending)

- **Delivery Information**
  - Current delivery status
  - Tracking details (if shipped)

### Right Panel (Actions Sidebar)

**Sticky action buttons** that change based on order status:

| Status | Action Button |
|--------|----------------|
| pending | ✅ Confirm Order |
| confirmed | ⚙️ Mark as Processing |
| processing | 🚚 Mark as Shipped (opens dialog) |
| shipped | 📦 In Transit (read-only) |
| delivered | ✅ Order Delivered (read-only) |

**Timeline Section**
- Visual representation of order progress
- Shows completed stages with timestamps
- Color-coded status indicators

---

## Currency Formatting

**All pages use:** `helper.toCurrency()` with NGN currency

**Format Example:**
```
Amount: ₦5,000,000
Displays as: ₦5M

Amount: ₦250,000
Displays as: ₦250K

Amount: ₦1,500,000,000
Displays as: ₦1.5B
```

**Implementation:**
```typescript
helper.toCurrency((order.amountCents || 0) / 100, { 
  currency: '₦', 
  abbreviate: true 
})
```

---

## Real-Time Updates

### Automatic Updates
- Pages use `useSellerOrders()` hook with polling
- Order list updates when mutations complete
- Toast notifications confirm actions

### Manual Refresh
- Pull-to-refresh or page reload
- Orders reflect new status immediately

### Polling
- Detail page polls every 30 seconds
- Live update indicator shows in top-right
- Can be disabled if needed

---

## User Experience Flow

### Quick Example: Processing an Order

**Seller Journey:**

1. **Login** → Navigate to "Pending Orders"
2. **View** pending order → Click "Confirm"
3. **Order Confirmed** → Navigates to "Confirmed Orders"
4. **Review** → Click "Process"
5. **Order Processing** → Navigates to "Processing Orders"
6. **Prepare** order → Click "Ship"
7. **Enter Tracking** → Confirm shipping details
8. **Order Shipped** → Navigates to "Shipped Orders"
9. **Wait** for delivery confirmation
10. **Order Delivered** → Appears in "Delivered Orders"

**Total Time:** ~30 seconds of actual seller interaction (rest is buyer/system)

---

## Best Practices

### For Sellers

1. ✅ **Always confirm pending orders** within a reasonable time
2. ✅ **Provide accurate tracking numbers** for shipments
3. ✅ **Set realistic estimated delivery dates**
4. ✅ **Monitor shipped orders** for delivery issues
5. ✅ **Keep bulk operations consistent** (same carrier, timeframe)

### For Support/Admin

1. Review "in transit" orders for stuck shipments
2. Monitor cancellation reasons for patterns
3. Escalate delivery issues quickly
4. Track average processing time per seller
5. Identify slow movers and follow up

---

## Troubleshooting

### Problem: Order won't move to next status
- **Solution:** Check that all required fields are filled
- **For shipped:** Tracking number and delivery date required

### Problem: Changes not reflected
- **Solution:** Page will auto-update; if not, refresh manually
- **Check:** Toast notification for error messages

### Problem: Can't find an order
- **Solution:** Use search bar to filter by Order ID, customer, or product
- **Note:** Orders only appear in their current status page (not in previous stages)

---

## API Integration

**Mutations Used:**

```typescript
// Confirm order
trpc.sales.confirmOrder.useMutation()

// Update order status
trpc.sales.updateSale.useMutation({
  orderId: string
  orderStatus: "confirmed" | "processing" | "shipped" | "delivered"
})

// Cancel order
trpc.sellers.cancelOrder.useMutation({
  orderId: string
  reason: string
})
```

---

## Summary Table

| Page | Primary Action | Status Input | Dialog Required | Notes |
|------|---|---|---|---|
| Pending Orders | Confirm/Cancel | None | Yes (cancel) | Bulk actions available |
| Confirmed Orders | Mark as Processing | None | No | Immediate status change |
| Processing Orders | Mark as Shipped | Tracking + Date | Yes | Multiple carrier options |
| Shipped Orders | View Details | None | No | Read-only, awaiting delivery |
| Delivered Orders | View Details | None | No | Historical, read-only |

---

**Last Updated:** Today
**Version:** 2.0 (Real-time action pages)