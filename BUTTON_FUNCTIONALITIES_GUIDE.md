# Button Functionalities Guide - Orders Management System

## Overview
This document outlines all button functionalities across the sellers and buyers order management pages, including real-time workflows and state management.

---

## 🛍️ SELLERS ORDER MANAGEMENT

### Architecture Pattern
Each seller orders page (`confirmed/`, `processing/`, `shipped/`, `delivered/`) follows this pattern:
- **Single Responsibility**: Each page handles ONE order status
- **Real-time Updates**: Uses `useSellerOrders()` hook with tRPC
- **In-page Actions**: Status transitions happen directly on each page
- **Optimistic Feedback**: Immediate visual feedback with loading states

---

## 1️⃣ CONFIRMED ORDERS PAGE
**Location**: `app/sellers/orders/confirmed/page.tsx`

### Buttons & Actions

#### "Process" Button
```
Status: Confirmed → Processing
Location: Order Card Footer
Color: Yellow/Gold (bg-yellow-600)
Icon: TrendingUp
```

**Functionality**:
- Called: `handleMarkAsProcessing(orderId)`
- Mutation: `updateSaleMutation.mutateAsync({ orderId, orderStatus: "processing" })`
- Loading State: Shows spinner when processing
- Success: Toast notification + Page refresh
- Error: Error toast with message
- Disabled State: While mutation is pending

**User Flow**:
1. Seller views confirmed orders
2. Clicks "Process" button
3. Order immediately moves to "Processing" status
4. Backend updates database
5. UI updates automatically via tRPC invalidation

#### "View" Button
```
Status: Navigation
Location: Order Card Footer
Color: Secondary/Outline
Icon: None
```

**Functionality**:
- Navigates to order detail page: `/sellers/orders/{orderId}`
- Shows full order information including variant details

---

## 2️⃣ PROCESSING ORDERS PAGE
**Location**: `app/sellers/orders/processing/page.tsx`

### Buttons & Actions

#### "Ship" Button
```
Status: Processing → Shipped
Location: Order Card Footer
Color: Purple (bg-purple-600)
Icon: Truck
```

**Functionality**:
- Opens Shipment Dialog (Modal)
- Dialog contains:
  - **Tracking Number** (required, text input)
  - **Carrier** (dropdown: Standard, Express, FedEx, UPS, DHL)
  - **Estimated Delivery Date** (required, date picker)
- Submit Button: "Confirm Shipment"
- Cancel Button: Closes dialog without changes

**State Management**:
```typescript
const [showShipmentDialog, setShowShipmentDialog] = useState(false)
const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null)
const [shipmentData, setShipmentData] = useState<ShipmentData>({
  trackingNumber: "",
  carrier: "standard",
  estimatedDelivery: "",
})
```

**Validation**:
- Tracking Number: Required (non-empty)
- Estimated Delivery: Required (date selected)
- Both fields must be filled before submission

**Submission**:
- Mutation: `updateSaleMutation.mutateAsync({ orderId, orderStatus: "shipped" })`
- Success: Toast + Dialog closes + Shipment data cleared
- Error: Error toast
- Loading: Shows "Processing..." with spinner

#### "View" Button
```
Status: Navigation
Location: Order Card Footer
Color: Secondary/Outline
```
- Navigates to order detail page: `/sellers/orders/{orderId}`

---

## 3️⃣ SHIPPED ORDERS PAGE
**Location**: `app/sellers/orders/shipped/page.tsx`

### Buttons & Actions

#### "View Tracking" Button
```
Status: Information/Navigation
Location: Order Card (Full Width)
Color: Purple (bg-purple-600)
Icon: Truck
```

**Functionality**:
- Navigates to order detail page: `/sellers/orders/{orderId}`
- Displays tracking information and shipment details
- Allows seller to monitor delivery status
- **NO ACTION BUTTONS** on this page
- Orders automatically transition to "Delivered" when marked by buyer

---

## 4️⃣ DELIVERED ORDERS PAGE
**Location**: `app/sellers/orders/delivered/page.tsx`

### Buttons & Actions

#### "View Order" Button
```
Status: Information/Navigation
Location: Order Card (Full Width)
Color: Green (bg-green-600)
Icon: CheckCircle
```

**Functionality**:
- Navigates to order detail page: `/sellers/orders/{orderId}`
- Shows completed order details
- **NO ACTION BUTTONS** on this page
- Archive/History view only

---

## 5️⃣ ORDER DETAIL PAGE
**Location**: `app/sellers/orders/[orderId]/page.tsx`

### Button Functionalities

#### Status-Based Actions
Based on `orderStatus`, shows appropriate action:

- **Pending**: (On pending-orders page)
- **Confirmed**: Show "Mark as Processing" button
- **Processing**: Show "Update Shipment" button
- **Shipped**: Show tracking information, "Update Delivery Status"
- **Delivered**: Show order summary, no actions

#### Additional Features:
- Displays complete order information
- Product variant details (size, color, quantity)
- Customer information
- Shipment details (tracking number, carrier, ETA)
- Payment information

---

## 👤 BUYERS ORDER MANAGEMENT

### Architecture Pattern
Buyers can navigate to different order status views, but main page shows all orders with filtering.

---

## 1️⃣ BUYER ORDERS MAIN PAGE
**Location**: `app/buyer/dashboard/orders/page.tsx`

### Filter Buttons
```
Filters: All | In Progress | Shipping | Delivered | Canceled/Returned
```

**Functionality**:
- Clicking filter navigates to specialized page
- All: Shows main orders page
- In Progress: Navigates to `/buyer/dashboard/orders/processing`
- Shipping: Navigates to `/buyer/dashboard/orders/shipped`
- Delivered: Navigates to `/buyer/dashboard/orders/delivered`
- Canceled/Returned: Navigates to `/buyer/dashboard/orders/returned`

### Order List Display
Each order card shows:
- Order ID
- Product title
- Status badge
- Order date
- Amount
- Tracking steps visualization
- Quick action buttons

---

## 2️⃣ BUYER PROCESSING ORDERS PAGE
**Location**: `app/buyer/dashboard/orders/processing/page.tsx`

### Buttons & Actions

#### "Confirm Delivery" Button
```
Status: Shipped → Delivered (Buyer Confirms)
Location: Order Card
Color: Green (bg-green-600)
Icon: CheckCircle
```

**Functionality**:
- Called from `useOrderActions.confirmDelivery(orderId)`
- Mutation: `confirmDeliveryMutation.mutateAsync({ orderId })`
- Success: Toast notification
- Redirects to leave review or back to orders
- Loading state: Shows spinner during request

**User Flow**:
1. Buyer receives delivery notification
2. Clicks "Confirm Delivery"
3. Backend updates order status to "delivered"
4. Enables review writing
5. Automatic page refresh

#### "Request Return" Button
```
Status: Open Return Request
Location: Order Card
Color: Orange/Warning (bg-orange-600)
Icon: RotateCcw
```

**Functionality**:
- Opens return request modal/dialog
- Modal contains:
  - **Return Reason** (dropdown with options):
    - Defective
    - Damaged
    - Not as described
    - Unwanted
    - Too small
    - Too large
    - Color mismatch
    - Wrong item
    - Other
  - **Reason Description** (text area)
  - **Submit** button
  - **Cancel** button

**Submission**:
- Mutation: `requestReturnMutation.mutateAsync({ orderId, reason, reasonDescription })`
- Success: Toast + Notification to seller
- Seller has 2-3 business days to review
- Error: Error toast

#### "Contact Seller" Button
```
Status: Open Messaging Dialog
Location: Order Card
Color: Blue (bg-blue-600)
Icon: MessageCircle
```

**Functionality**:
- Opens direct messaging dialog
- Text input for message
- Sends message to specific seller for this order
- Mutation: `sendMessageMutation.mutateAsync({ orderId, recipientId, message, recipientRole: 'seller' })`
- Success: Toast + Message appears in conversation
- Loading: Shows spinner during send
- Clears input on success

---

## 3️⃣ BUYER SHIPPED ORDERS PAGE
**Location**: `app/buyer/dashboard/orders/shipped/page.tsx`

### Buttons & Actions

#### "View Tracking" Button
```
Status: Information/Navigation
Location: Order Card
Color: Purple (bg-purple-600)
Icon: Truck
```

**Functionality**:
- Opens tracking details modal
- Shows:
  - Carrier information
  - Tracking number (clickable link to carrier website)
  - Estimated delivery date
  - Current delivery status
  - Map/timeline visualization
- "Confirm Delivery" appears when delivery expected

#### "Confirm Delivery" Button
Same as in Processing Orders page

#### "Contact Seller" Button
Same as in Processing Orders page

---

## 4️⃣ BUYER DELIVERED ORDERS PAGE
**Location**: `app/buyer/dashboard/orders/delivered/page.tsx`

### Buttons & Actions

#### "Leave Review" Button
```
Status: Submit Product Review
Location: Order Card
Color: Yellow/Gold (bg-yellow-600)
Icon: Star
```

**Functionality**:
- Opens review modal
- Contains:
  - **Rating** (1-5 stars, clickable)
  - **Review Title** (text input)
  - **Review Text** (textarea)
  - **Submit** button
  - **Cancel** button
- Mutation: `submitReviewMutation.mutateAsync({ orderId, rating, title, text })`
- Success: Toast + Review appears immediately
- One review per order

#### "Track Order" Button (History)
```
Status: Information
Location: Order Card
Color: Secondary
```

**Functionality**:
- Shows full order timeline
- Displays all tracking steps with dates
- Shows delivery confirmation details

#### "Return/Exchange" Button (if applicable)
```
Status: Open Return Portal
Location: Order Card (within return window)
Color: Orange
```

**Functionality**:
- Only appears if within return period (configurable per seller)
- Opens same return request modal as shipped orders
- Same flow as "Request Return"

---

## 📊 REAL-TIME UPDATE FLOW

### Seller Side
```
Confirmed Orders Page
    ↓
Click "Process" Button
    ↓
Order moves to Processing Orders Page
    ↓
Fill Shipment Info + Click "Ship"
    ↓
Order moves to Shipped Orders Page
    ↓
[Awaiting Buyer Confirmation]
    ↓
Moved to Delivered Orders Page (automatically)
```

### Buyer Side
```
Processing Orders Page
    ↓
Receives Shipment Notification
    ↓
Clicks "Confirm Delivery"
    ↓
Order moves to Delivered Orders Page
    ↓
Can Leave Review
    ↓
Can Request Return (within window)
```

### Synchronization
- Uses tRPC mutations with optimistic updates
- Pages refetch data after mutations
- Real-time updates via `useRealtimeOrders()` hook on buyer side
- Toast notifications provide immediate feedback
- Loading states prevent duplicate submissions

---

## 🔄 Mutation Error Handling

### Standard Pattern
All mutations follow this error handling:
```typescript
try {
  await mutation.mutateAsync(data)
  toastSvc.success("Success message")
  // Optional: refetch or refresh page
} catch (error: any) {
  toastSvc.error(error.message || "Failed to update")
}
```

### User-Facing Messages
- Clear error messages from server
- Fallback generic messages if specific message unavailable
- Retry buttons on critical errors
- Automatic retry with exponential backoff on some queries

---

## 🎨 UI/UX Patterns

### Button States
1. **Normal**: Clickable, full opacity
2. **Hover**: Darker shade, pointer cursor
3. **Loading**: Disabled, shows spinner, text changes
4. **Disabled**: Gray, no pointer, no hover effect
5. **Success**: Briefly highlights, shows checkmark

### Modal Dialogs
- Backdrop click closes
- Escape key closes
- Clear title and description
- Required fields marked with asterisk (*)
- Validation on submit
- Clear action buttons (Cancel, Confirm)

### Toast Notifications
- Success: Green, 5 second duration
- Error: Red, 5 second duration
- Auto-dismiss or manual close
- No duplicate notifications within 1 second

---

## 📝 Implementation Notes

### Key Files
- `app/sellers/orders/confirmed/page.tsx` - Confirmed orders
- `app/sellers/orders/processing/page.tsx` - Processing orders with shipment dialog
- `app/sellers/orders/shipped/page.tsx` - Shipped orders (view only)
- `app/sellers/orders/delivered/page.tsx` - Delivered orders (view only)
- `app/seller/orders/[orderId]/page.tsx` - Order detail view
- `app/buyer/dashboard/orders/page.tsx` - Buyer all orders
- `app/buyer/dashboard/orders/processing/page.tsx` - Buyer processing orders
- `app/buyer/dashboard/orders/shipped/page.tsx` - Buyer shipped orders
- `app/buyer/dashboard/orders/delivered/page.tsx` - Buyer delivered orders
- `app/buyer/dashboard/orders/useOrderActions.ts` - Buyer action hooks

### Hooks Used
- `useSellerOrders()` - Fetches seller's orders
- `useOrderActions()` - Buyer order actions (confirm, return, contact)
- `useRealtimeOrders()` - Real-time order updates for buyers
- `trpc.useMutation()` - All backend mutations

### tRPC Endpoints
**Sellers**:
- `sales.updateSale` - Change order status

**Buyers**:
- `buyer.getPurchaseHistory` - Fetch orders
- `buyerOrderActions.confirmDelivery` - Confirm delivery received
- `returns.requestReturn` - Request order return
- `buyerOrderActions.sendMessage` - Message to seller
- `support.createTicket` - Create support ticket

---

## 🚀 Best Practices

1. **Always Show Loading State**: Prevents double-clicks
2. **Clear Feedback**: Every action gets toast notification
3. **Validation First**: Check required fields before submission
4. **Graceful Errors**: Show user-friendly error messages
5. **Data Consistency**: Refresh data after mutations
6. **Navigation**: Link buttons to detail pages for more info
7. **Status Isolation**: Each page handles ONE status only
8. **Real-time Updates**: Use polling/subscriptions for live data

---

## 📱 Responsive Behavior

All buttons maintain functionality across:
- **Desktop**: Full layout, multiple columns
- **Tablet**: Adjusted spacing, stacked layouts
- **Mobile**: Single column, touch-friendly button sizes

---

**Last Updated**: Current Session
**Version**: 1.0