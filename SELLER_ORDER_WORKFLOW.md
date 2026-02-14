# Seller Order Management - Complete Workflow & UI Guide

## 📋 Overview
The seller order management system consists of 3 main pages that work together to manage the complete order lifecycle. Each page has a specific role and they share a consistent flow and UI patterns.

---

## 🔄 Complete Order Lifecycle

```
PENDING (Awaiting Confirmation)
    ↓
    [Seller Must Explicitly CONFIRM or CANCEL]
    ↓
CONFIRMED (Ready to Process)
    ↓
PROCESSING (Being Prepared)
    ↓
SHIPPED (In Transit)
    ↓
DELIVERED (Completed)

Alternative Path:
ANY STATE → CANCELED (if cancelled with reason)
```

### Key Point ⚠️
**Sellers MUST confirm pending orders before they move to processing.** This is an explicit action, not automatic.

---

## 📄 Page Breakdown

### 1. **PENDING ORDERS PAGE** (`app/sellers/pending-orders/page.tsx`)
**Purpose:** Handle new orders that require seller confirmation/cancellation

#### What It Shows
- Orders with `orderStatus: "pending"` only
- Order cards with product details, customer info, amounts
- TWO ACTION BUTTONS PER ORDER:
  - **Confirm** (Green) - Move to "confirmed" status
  - **Cancel** (Red) - Opens dialog to select cancellation reason

#### UI Components

**Order Card Structure:**
```
┌─────────────────────────────────────────┐
│ ☑ │ [Image] │ Product Details │ Amount │ Actions │
├─────────────────────────────────────────┤
│    │         │ • Order ID       │ ₦5M  │ [View]  │
│    │         │ • Product        │      │ [✓Conf] │
│    │         │ • Customer       │      │ [✗Canc] │
│    │         │ • Email          │      │         │
└─────────────────────────────────────────┘
```

**Confirmation Dialog:**
```
┌────────────────────────────────┐
│ Cancel Order                   │
├────────────────────────────────┤
│ Product: [Product Name]        │
│ Customer: [Name] • [Email]     │
│                                │
│ Cancellation Reason *          │
│ [Select Reason ▼]              │
│  - Out of Stock                │
│  - Customer Request            │
│  - Payment Issue               │
│  - Shipping Delay              │
│  - Other Reason                │
│                                │
│ [Close] [Confirm Cancel]       │
└────────────────────────────────┘
```

#### Key Features

**Single Order Actions:**
```javascript
// Click "Confirm" button
handleConfirmOrder(orderId) 
  → Calls confirmMutation
  → Order moves to "confirmed" status
  → Shows toast success

// Click "Cancel" button
showCancelDialog(orderId)
  → User selects reason from dropdown
  → Click "Confirm Cancel"
  → Calls cancelMutation with reason
  → Order moves to "canceled" status
```

**Bulk Actions:**
- Checkbox to select multiple orders
- "Select All" option
- **Bulk Confirm** button - confirms all selected orders at once
- **Bulk Cancel** button - cancels all selected orders (requires reason)
- Both require confirmation dialog

**Filters:**
- Search by Order ID, Product, or Customer
- Sort by: Date, Amount, Customer Name
- Sort order: Ascending/Descending
- Date range filter (from/to dates)

**Display Format:**
- All amounts use: `helper.toCurrency(amountCents / 100, { currency: '₦', abbreviate: true })`
- Example: `₦5.2M` (5.2 million naira)
- Quantities, customer names, order IDs displayed clearly

---

### 2. **ORDERS HUB PAGE** (`app/sellers/orders/page.tsx`)
**Purpose:** Dashboard showing order statistics and quick navigation to different order statuses

#### What It Shows
Statistics cards for:
- **Total Orders** - Count of all orders
- **Pending** - Orders awaiting confirmation (with link to pending-orders page)
- **Confirmed** - Orders confirmed but not yet processing
- **Processing** - Orders being prepared for shipment
- **Shipped** - Orders in transit to customer
- **Total Revenue** - Sum of all amounts from delivered orders

#### UI Structure

**Stats Dashboard:**
```
┌─────────────┬──────────────┬──────────────┬───────────────┐
│ Total Orders│ Pending [CLK]│ Confirmed[CK]│ Processing[TR]│
│    247      │   12         │     8        │      15       │
│ All time    │ View →       │ View →       │ View →        │
└─────────────┴──────────────┴──────────────┴───────────────┘
```

**Order Grid Display (2 columns on desktop):**
```
┌──────────────────────────────────┐
│ Order ID: abc123...    [Status]  │
│                                  │
│ Product: iPhone 14 Pro          │
│                                  │
│ Customer: John Doe  │ Amount: ₦5M│
│                                  │
│ Order Date: Jan 15, 2024         │
│                                  │
│ [View Details →]                │
└──────────────────────────────────┘
```

#### Key Features
- **Quick Stats:** See all orders at a glance
- **Navigation:** Click "View →" to see orders in each status category
- **Search & Filter:** Search by Order ID, Product, or Customer
- **Status Filter:** Click status buttons to filter orders (All, Pending, Confirmed, etc.)
- **Polling:** Auto-refreshes order data every 30 seconds
- **Responsive:** Grid layout adapts to screen size

#### Data Flow
```
useSellerOrders() → Fetches all orders
  ↓
Calculate stats (count by status, total revenue)
  ↓
Display in cards with navigation links
```

---

### 3. **SALES PAGE** (`app/sellers/sales/page.tsx`)
**Purpose:** Track revenue and view completed sales

#### What It Shows
- **Total Sales** - Revenue from all orders (₦ with abbreviate)
- Sales filtered by status tabs (Processing, Shipped, Delivered, etc.)
- Detailed order list in table (desktop) or cards (mobile)
- Individual order details modal

#### UI Components

**Tab Navigation:**
```
[All] [Processing] [Shipped] [In transit] [Delivered] [Canceled] [Returned]
```

**Order Table (Desktop) / Card (Mobile):**
```
Desktop Table:
┌────────┬─────────────────┬──────────────┬────────┬────────────┐
│ ID     │ Product         │ Customer     │ Amount │ Status     │
├────────┼─────────────────┼──────────────┼────────┼────────────┤
│ abc123 │ iPhone 14 Pro   │ John Doe     │ ₦5M    │ Delivered  │
│ def456 │ Samsung S23     │ Jane Smith   │ ₦3.2M  │ Shipped    │
└────────┴─────────────────┴──────────────┴────────┴────────────┘

Mobile Card:
┌─────────────────────────────────┐
│ Order ID: abc123...             │
│ Status: [Delivered]             │
│                                 │
│ Product: iPhone 14 Pro          │
│ Customer: John Doe              │
│ Amount: ₦5M                     │
│                                 │
│ [View Details]                  │
└─────────────────────────────────┘
```

**Order Details Modal:**
```
┌──────────────────────────────────┐
│ Order Details                    │
│ Order ID: abc123...              │
├──────────────────────────────────┤
│ Order Information  │  Product    │
│ • Date: Jan 15     │ • Name: ... │
│ • Status: Shipped  │ • Amount:₦5M│
│ • Quantity: 1      │             │
├──────────────────────────────────┤
│ Customer Information             │
│ • Name: John Doe                │
│ • Email: john@example.com       │
├──────────────────────────────────┤
│ Shipping Address                 │
│ [Address details...]             │
├──────────────────────────────────┤
│ Payment Status                   │
│ • Method: Card                  │
│ • Payout: In Escrow             │
├──────────────────────────────────┤
│ Delivery Status                  │
│ [Not Shipped / In Transit / ✓]   │
└──────────────────────────────────┘
```

#### Key Features
- **Status Tabs:** Filter sales by different delivery statuses
- **Search:** Find orders by product name
- **Pagination:** 10 items per page with prev/next navigation
- **Delivery Confirmation:** Button to confirm delivery (updates status to "delivered")
- **Revenue Tracking:** Shows total from delivered orders

---

## 🔗 Flow Relationships

### Between Pages:

**Pending Orders → Orders Hub → Sales**
```
New Order
  ↓
Shows in Pending Orders Page
  → Seller CONFIRMS/CANCELS
  ↓
Updates Stats on Orders Hub
  → If Confirmed, shows in "Confirmed" stat
  ↓
Updates Sales Page
  → Shows in relevant status tab
  → Contributes to revenue if delivered
```

### State Transitions:

**On Pending Orders Page:**
```
pending order → [Confirm] → confirmed status
              → [Cancel]  → canceled status
```

**On Orders Hub:**
```
Shows current counts of orders in each status
Provides navigation to detailed views
```

**On Sales Page:**
```
Shows sales progressing through fulfillment
Track revenue from completed deliveries
```

---

## 💾 Data Model

### Order/Sale Object Structure:
```typescript
{
  id: string                        // Internal ID
  orderId: string                   // Unique order identifier
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "canceled"
  deliveryStatus: "not_shipped" | "in_transit" | "delivered"
  payoutStatus: "in_escrow" | "processing" | "paid"
  product: string                   // Product name
  customer: string                  // Customer name
  customerEmail: string             // Customer email
  amountCents: number              // Amount in cents (divide by 100 for display)
  quantity: number                  // Quantity ordered
  orderDate: ISO string            // When order was placed
  shippingAddress: string          // Delivery address
  paymentMethod: string            // Payment method used
}
```

---

## 🎨 UI Design Patterns

### Colors & Status Mapping:

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Pending | Gray | ⏰ | Awaiting seller action |
| Confirmed | Blue | ✓ | Seller approved |
| Processing | Yellow | 📈 | Being prepared |
| Shipped | Purple | 🚚 | In transit |
| Delivered | Green | ✓ | Completed |
| Canceled | Red | ✗ | Cancelled by seller |

### Currency Display:
- All amounts display with **₦** symbol (Nigerian Naira)
- All amounts use **abbreviate: true** option
  - Converts to K, M, B, T format
  - Examples: ₦5M (5 million), ₦1.2K (1,200)
- Divide `amountCents` by 100 before passing to formatter

---

## ✅ User Actions & Workflows

### Workflow 1: Confirm Single Order
```
1. Seller opens Pending Orders Page
2. Reviews order details in card
3. Clicks "Confirm" button (green)
4. Order status changes to "confirmed"
5. Toast message shows success
6. Page refreshes, order disappears from pending list
```

### Workflow 2: Cancel Order with Reason
```
1. Seller opens Pending Orders Page
2. Clicks "Cancel" button (red) on order
3. Cancel dialog opens
4. Seller selects cancellation reason (dropdown)
5. Clicks "Confirm Cancel"
6. Order status changes to "canceled"
7. Page refreshes, order disappears from pending list
```

### Workflow 3: Bulk Confirm Orders
```
1. Seller selects multiple orders using checkboxes
2. Clicks "Confirm All" button at top
3. Confirmation dialog appears
4. Seller confirms
5. All selected orders move to "confirmed" status
6. Page refreshes
7. Selection is cleared
```

### Workflow 4: Check Order Statistics
```
1. Seller opens Orders Hub Page
2. Views statistics cards at top
3. Sees breakdown by status (Pending: 12, Confirmed: 8, etc.)
4. Clicks "View →" on a status card
5. Navigates to detailed view for that status
```

### Workflow 5: Track Sales Revenue
```
1. Seller opens Sales Page
2. Sees total revenue at top (₦5M)
3. Uses tabs to filter by status
4. Clicks on "Delivered" tab
5. Views only delivered orders (these count toward revenue)
6. Can view detailed information in modal
```

---

## 🔄 Mutation Operations

### Confirm Order
```javascript
confirmMutation = useConfirmOrder()

Call: confirmMutation.mutate({ orderId: "order123" })

Result:
  - Order moves from "pending" → "confirmed"
  - List updates
  - Toast shown
```

### Cancel Order
```javascript
cancelMutation = useCancelOrder()

Call: cancelMutation.mutate({ 
  orderId: "order123", 
  reason: "out_of_stock" 
})

Result:
  - Order moves to "canceled" status
  - Reason stored in database
  - List updates
  - Cancel reason field cleared
```

### Confirm Delivery (Sales Page)
```javascript
confirmDeliveryMutation = trpc.sellerOrders.confirmDelivery.useMutation()

Call: confirmDeliveryMutation.mutateAsync({ orderId: "order123" })

Result:
  - deliveryStatus changes to "delivered"
  - Order may contribute to revenue
  - List updates
```

---

## 📊 Summary Table

| Page | Purpose | Shows | Actions | Statuses |
|------|---------|-------|---------|----------|
| **Pending Orders** | Confirm/Cancel new orders | Pending orders only | Confirm, Cancel, View Details | Pending only |
| **Orders Hub** | Overview dashboard | Order counts by status | Navigate to status views | All statuses |
| **Sales** | Track revenue & deliveries | All orders with filters | Confirm Delivery, View Details | All (with tabs) |

---

## 🎯 Key Takeaways

1. **Pending Orders Page** is the critical action point - sellers MUST confirm orders here
2. **Orders Hub** provides quick overview and navigation
3. **Sales Page** tracks revenue and fulfillment status
4. All amounts use **₦ with abbreviation** (K, M, B, T)
5. Orders flow through statuses: pending → confirmed → processing → shipped → delivered
6. At any point, orders can be canceled with a reason
7. Each page has consistent UI patterns for cards, buttons, and status displays
