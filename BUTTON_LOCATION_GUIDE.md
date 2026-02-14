# 🎯 Button Locations in Sellers Order Management

## Summary

There are **3 main action buttons** for sellers, but they appear in **different pages** based on order status:

---

## 📍 Button Locations by Page

### **1. CONFIRM ORDER Button** ✅
**Location:** `app/sellers/orders/[orderId]/page.tsx` (Line 385)

**Where it appears:**
- On the **individual order detail page** when viewing a pending order
- Shows ONLY when `order.orderStatus === "pending"`
- Located in the **Actions** section at the bottom of the page

**Visual:**
```
┌─────────────────────────────────────────┐
│          ORDER DETAILS PAGE              │
│  (When viewing a specific pending order) │
├─────────────────────────────────────────┤
│                                         │
│  [Order Info, Customer, Products...]    │
│                                         │
│  ──────── ACTIONS ────────              │
│  ┌──────────────────────────────────┐   │
│  │  ✓ CONFIRM ORDER (Green Button) │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

### **2. CANCEL ORDER Button** ✅
**Location:** `app/sellers/orders/pending/page.tsx` (Line 370)

**Where it appears:**
- On the **pending orders list page** (table view)
- Shows for EACH pending order row
- Located in the **actions column** next to the "Confirm" button
- Clicking opens a dialog to select cancellation reason

**Visual:**
```
┌────────────────────────────────────────────────────────────┐
│          PENDING ORDERS LIST PAGE                          │
│  (View all pending orders in a table)                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Order ID  │ Product  │ Customer │ Amount │   ACTIONS     │
│  ─────────────────────────────────────────────────────────│
│  bb452c1b  │ T-Shirt  │ John     │ $50    │ ✓ ✗ (Icons)  │
│            │          │          │        │ Confirm Cancel│
│  ─────────────────────────────────────────────────────────│
│  cc563d2c  │ Shoes    │ Sarah    │ $120   │ ✓ ✗           │
│            │          │          │        │ Confirm Cancel│
│                                                            │
└────────────────────────────────────────────────────────────┘

✓ = Confirm Button (Green)
✗ = Cancel Button (Red outline)
```

---

### **3. Status Update Buttons** ✅
**Location:** `app/sellers/orders/[orderId]/page.tsx` (Line 390+)

**These buttons appear sequentially based on current order status:**

| Current Status | Button Shown | Location |
|---|---|---|
| **pending** | "Confirm Order" (Green) | Order detail page, Actions section |
| **confirmed** | "Mark as Processing" (Yellow) | Order detail page, Actions section |
| **processing** | "Mark as Shipped" (Purple) | Order detail page, Actions section |
| **shipped** | "Confirm Delivery" (if for buyer) | Only on buyer's side |
| **delivered** | None | Order complete |

---

## 🔄 Complete Order Workflow (Sellers)

```
PENDING ORDER (List Page)
    ↓
  [Confirm] or [Cancel] buttons on the list
    ↓
CONFIRMED ORDER (Detail Page)
    ↓
  [Mark as Processing] button
    ↓
PROCESSING ORDER (Detail Page)
    ↓
  [Mark as Shipped] button + Shipment Dialog
    ↓
SHIPPED ORDER (Detail Page)
    ↓
  [Waiting for Buyer to Confirm] 
    ↓
DELIVERED (Order Complete)
```

---

## 📋 Button States & Behaviors

### **Confirm Order** 
- **Appears:** When `orderStatus === "pending"`
- **Page:** Detail page (`/sellers/orders/[orderId]`)
- **Action:** Moves order to "confirmed" status
- **Loading:** Shows spinner during submission
- **Disabled:** When mutation is pending

### **Cancel Order**
- **Appears:** On the pending orders list for each row
- **Page:** List page (`/sellers/orders/pending`)
- **Action:** Opens dialog to select cancellation reason
- **Options:** Out of Stock, Customer Request, Payment Issue, Shipping Delay, Other
- **Disabled:** When mutation is pending

### **Mark as Processing**
- **Appears:** When `orderStatus === "confirmed"`
- **Page:** Detail page (`/sellers/orders/[orderId]`)
- **Action:** Updates status to "processing"
- **Disabled:** When mutation is pending

### **Mark as Shipped**
- **Appears:** When `orderStatus === "processing"`
- **Page:** Detail page (`/sellers/orders/[orderId]`)
- **Action:** Opens shipment dialog for tracking info
- **Dialog Fields:** Tracking number, Delivery date, Carrier name
- **Icon:** Truck icon (Lucide)

---

## ⚠️ Missing Buttons

**"Confirm Delivery"** button:
- This is a **BUYER-SIDE** button, not for sellers
- Appears in buyers' order pages when order is shipped
- Allows buyer to confirm they received the package

---

## 🗂️ File Reference

- **Pending Orders List:** `app/sellers/orders/pending/page.tsx`
- **Order Detail Page:** `app/sellers/orders/[orderId]/page.tsx`
- **Confirmed Orders:** `app/sellers/orders/confirmed/page.tsx`
- **Processing Orders:** `app/sellers/orders/processing/page.tsx`
- **Shipped Orders:** `app/sellers/orders/shipped/page.tsx`

---

## 🔗 Related Hooks & Mutations

All buttons use these hooks from `modules/sellers/hooks/usePendingOrders.ts`:
- `confirmOrderMutation` - For Confirm Order
- `cancelOrderMutation` - For Cancel Order
- `updateSaleMutation` - For status updates

All mutations use React Query with automatic cache invalidation.