# Seller Order Management Workflow

## 🎯 Overview

The seller order management system has been restructured to provide a clear, simplified workflow across three main pages:

1. **Pending Orders Page** - Confirm orders before they can be processed
2. **Orders Page** - Central hub and detailed order management
3. **Sales Page** - Display-only sales metrics and order history

---

## 📋 Page Breakdown

### 1. **Pending Orders Page** (`/sellers/pending-orders`)

**Purpose:** First checkpoint for new orders

**What Sellers See:**
- List of all orders with "pending" status
- Order details: ID, product, customer, amount, date
- Bulk selection for batch operations
- Real-time updates

**Actions Available:**
- ✅ **Confirm Order** - Move order to "confirmed" status (REQUIRED before processing)
- ❌ **Cancel Order** - Cancel with a reason if needed
- 📦 **Bulk Confirm/Cancel** - Process multiple orders at once

**Currency Formatting:**
- All amounts display in **NGN (₦)** with **K, M, B, T** abbreviation
- Example: ₦5,000,000 displays as **₦5M**

**After Action:**
- Order moves to "confirmed" status
- Seller goes to Orders page to continue workflow

---

### 2. **Orders Page** (`/sellers/orders`)

**Two Sections:**

#### A. Orders Hub (Main Dashboard)
- Overview cards showing:
  - Total Orders
  - Pending count
  - Confirmed count
  - Processing count
  - Shipped count
  - Total Revenue (from delivered orders)
- Quick links to each status category
- Search and filter capabilities
- Real-time polling for live updates

#### B. Order Status Categories
Links to view orders by status:
- Pending
- Confirmed
- Processing
- Shipped
- Delivered

#### C. Order Detail Page (`/sellers/orders/[orderId]`)
**THE PLACE FOR ALL ORDER MANAGEMENT**

**Displays:**
- Full order information (product, quantity, customer)
- Buyer information & contact details
- Shipping address
- Payment and payout status
- Delivery status and timeline

**Actions Available (All In One Place):**

**1. When Status = PENDING:**
   - 🟢 **Confirm Order** - Seller explicitly confirms they can fulfill
   - → Moves to CONFIRMED

**2. When Status = CONFIRMED:**
   - 🟡 **Mark as Processing** - Start preparing the order
   - → Moves to PROCESSING

**3. When Status = PROCESSING:**
   - 🟣 **Mark as Shipped** - Order is on its way
   - Requires: Tracking number, Carrier, Estimated delivery date
   - → Moves to SHIPPED (In Transit)

**4. When Status = SHIPPED:**
   - ⏳ **Waiting for Buyer Confirmation**
   - Buyer confirms delivery when they receive it

**5. When Status = DELIVERED:**
   - ✅ **Order Complete**
   - Payout released to seller (if not already)

**Currency Formatting:**
- All amounts display in **NGN (₦)** with **K, M, B, T** abbreviation
- Orders hub shows total revenue as: **₦8.5M** instead of **₦8,500,000**

---

### 3. **Sales Page** (`/sellers/sales`)

**Purpose:** Sales metrics and order history review (READ-ONLY)

**What Sellers See:**
- Summary Cards:
  - Total Sales (sum of all order amounts)
  - Total Orders (count)
  - Delivered Orders (count)
  - Pending Orders (count)
- Sales table/cards with:
  - Order ID, Product, Customer
  - Amount in NGN with abbreviation
  - Delivery status
  - Payment status
  - Order date

**Actions Available:**
- ❌ **NO order management actions** on this page
- 📊 Filter and search orders
- 📥 Export sales data
- ℹ️ View order summary in modal

**Note:** Modal shows: "💡 To manage this order, go to the Orders page"

**Currency Formatting:**
- All amounts display in **NGN (₦)** with **K, M, B, T** abbreviation
- Desktop table: ₦2.5M, ₦450K, ₦1.2B
- Mobile cards: Same format for consistency

---

## 🔄 Complete Order Workflow

```
NEW ORDER
    ↓
PENDING (Pending Orders Page)
    ↓ [Seller Confirms]
CONFIRMED (Orders Detail Page)
    ↓ [Seller Marks Processing]
PROCESSING (Orders Detail Page)
    ↓ [Seller Adds Shipment Details]
SHIPPED / IN_TRANSIT (Orders Detail Page)
    ↓ [Buyer Confirms Receipt]
DELIVERED (Orders Detail Page)
    ↓
PAYMENT RELEASED (Sales Page)
```

---

## 💰 Currency Format Specification

### Format: Nigerian Naira (NGN) with Truncation

**Implementation:**
```javascript
helper.toCurrency(amount, { currency: '₦', abbreviate: true })
```

**Examples:**
| Amount | Display |
|--------|---------|
| 500 | ₦500 |
| 1,200 | ₦1.2K |
| 50,000 | ₦50K |
| 1,500,000 | ₦1.5M |
| 2,300,000,000 | ₦2.3B |
| 5,000,000,000,000 | ₦5T |

**Applied To:**
- ✅ Total Sales (Orders Hub)
- ✅ Order amounts (all views)
- ✅ Revenue metrics
- ✅ Sales page statistics
- ✅ Order detail modal
- ✅ Mobile and desktop views

---

## 📱 Responsive Design

### Desktop View
- Full table with all columns
- Hover effects for interactivity
- Sticky sidebar for actions

### Mobile View
- Card-based layout
- Stacked information
- Touch-friendly buttons
- Same currency formatting as desktop

---

## ⚡ Real-Time Features

### Pending Orders Page
- 30-second refresh interval
- Live status updates
- Bulk action support

### Orders Hub
- 30-second refresh interval
- Live polling for order changes
- Updated statistics

### Order Detail Page
- 30-second refresh interval (enabled by default)
- Live indicator showing polling status
- Real-time status changes from system

---

## 🛠️ Key Features Summary

| Feature | Pending | Orders | Sales |
|---------|---------|--------|-------|
| **View Orders** | ✅ | ✅ | ✅ |
| **Search** | ✅ | ✅ | ✅ |
| **Filter** | ✅ | ✅ | ✅ |
| **Confirm Order** | ✅ | ✅ | ❌ |
| **Mark Processing** | ❌ | ✅ | ❌ |
| **Mark Shipped** | ❌ | ✅ | ❌ |
| **View Details** | ✅ | ✅ | ✅ (read-only) |
| **NGN Currency** | ✅ | ✅ | ✅ |
| **Abbreviate Format** | ✅ | ✅ | ✅ |
| **Real-time Updates** | ✅ | ✅ | ✅ |

---

## 📌 Best Practices for Sellers

1. **Start Here:** Go to Pending Orders page first
2. **Confirm Orders:** Confirm all pending orders you can fulfill
3. **Manage:** Go to Orders page to process and ship
4. **Track Revenue:** Check Sales page for metrics
5. **Take Action:** All order management happens in Orders page
6. **Monitor:** Keep polling on for real-time updates

---

## 🔐 Permission Model

- **Pending Orders:** Confirm/Cancel pending orders only
- **Orders Page:** Full management of order status
- **Sales Page:** View only, no modifications

---

## 📞 Support

For issues or questions about order management:
- Check order detail page timeline for history
- Use real-time updates to monitor changes
- Contact support for payment/payout questions