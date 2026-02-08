# Seller Features Documentation

## Overview
This document outlines the seller order management system features, including real-time polling, order tracking, and return/refund management.

---

## 1. Real-Time Order Polling

### Overview
Sellers can now receive **live updates** on their orders without manual refreshing. The polling system is Vercel-compatible and uses intelligent batching to avoid excessive API calls.

### Features

#### 1.1 Dashboard Polling (`useSellerOrderPolling`)
- **Location**: `modules/sellers/hooks/useSellerOrderPolling.ts`
- **Polling Interval**: 30 seconds (default, configurable)
- **Smart Detection**:
  - Detects new incoming orders
  - Tracks status changes for each order
  - Batches multiple notifications

**Usage Example**:
```tsx
const { useSellerOrderPolling } = require('@/modules/sellers/hooks');

export default function DashboardPage() {
  useSellerOrderPolling({
    enabled: true,
    interval: 30000,
    onNewOrders: (count) => {
      console.log(`${count} new orders!`);
      toast.success(`${count} new order${count !== 1 ? 's' : ''}!`);
    },
    onStatusChange: (orderId, oldStatus, newStatus) => {
      console.log(`Order ${orderId} changed: ${oldStatus} -> ${newStatus}`);
    },
    onError: (error) => {
      console.error('Polling error:', error);
    },
  });

  return <DashboardContent />;
}
```

#### 1.2 Order Detail Polling (`useSellerOrderDetailPolling`)
- **Location**: `modules/sellers/hooks/useSellerOrderPolling.ts`
- **Purpose**: Real-time updates on individual order pages
- **Polling Interval**: 30 seconds (default, configurable)
- **Features**:
  - Automatic refresh of order data
  - Visual status change notifications
  - Error handling with retry logic

**Usage Example**:
```tsx
import { useSellerOrderDetailPolling } from '@/modules/sellers/hooks';

export default function OrderDetailPage() {
  const orderId = 'order-123';
  const [order, setOrder] = useState(null);

  useSellerOrderDetailPolling(orderId, {
    enabled: true,
    interval: 30000,
    onStatusChange: (oldStatus, newStatus) => {
      toast.info(`Order status: ${newStatus}`);
    },
  });

  // Order data automatically refreshes via React Query
  return <OrderDetail order={order} />;
}
```

### Architecture

**How It Works**:
1. Polling hook initiates at 30-second intervals
2. React Query `refetch()` is called on registered queries
3. New data is received and component re-renders
4. Status comparison detects changes
5. Callbacks are triggered for UI updates

**Vercel Compatibility**:
- ✅ No WebSocket connections
- ✅ Standard HTTP polling
- ✅ Serverless-friendly
- ✅ No persistent connections required

---

## 2. Returns & Refunds Management

### Overview
Complete return/refund workflow for seller-initiated refunds and buyer return requests.

### Features

#### 2.1 Return Request Models
**Location**: `modules/sellers/model/returns.ts`

**Supported Return Reasons**:
- `defective` - Item doesn't work
- `damaged` - Item arrived damaged
- `not_as_described` - Doesn't match listing
- `unwanted` - Buyer changed mind
- `too_small` / `too_large` - Size issues
- `color_mismatch` - Wrong color received
- `wrong_item` - Wrong item shipped
- `other` - Other reason

**Return Status Flow**:
```
requested → approved → in_transit → received → inspected → completed
         ↓
       rejected
         ↓
       canceled
```

**Refund Status**:
- `pending` - Awaiting approval
- `processing` - Being processed
- `completed` - Refund issued
- `failed` - Payment failed
- `partial` - Partial refund issued
- `canceled` - Refund canceled

#### 2.2 Return Request Handler
**Location**: `modules/sellers/components/ReturnApprovalDialog.tsx`

**Capabilities**:
- View return request details
- Approve/reject returns with notes
- Provide return shipping labels
- Inspect returned items
- Process refunds

**Props**:
```tsx
interface ReturnApprovalDialogProps {
  isOpen: boolean;
  returnId: string;
  orderId: string;
  customerName: string;
  productName: string;
  reason: string;
  reasonDescription: string;
  quantity: number;
  imageUrls?: string[];
  requestedAmount: number;
  currency: string;
  onClose: () => void;
}
```

#### 2.3 Returns API
**Location**: `server/routers/returns.ts`

**Available Endpoints**:

1. **getReturnRequests** (Query)
   - Get all return requests for a seller
   - Filter by status
   - Pagination support

2. **getReturnRequest** (Query)
   - Get specific return details

3. **requestReturn** (Mutation)
   - Create return request (buyer-initiated)
   - Include reason and images

4. **approveReturn** (Mutation)
   - Approve return request
   - Attach return label

5. **rejectReturn** (Mutation)
   - Reject return with reason
   - Notifies buyer

6. **confirmReturnReceipt** (Mutation)
   - Confirm item received
   - Add inspection notes

7. **processRefund** (Mutation)
   - Issue refund to buyer
   - Support multiple refund methods

8. **cancelReturn** (Mutation)
   - Cancel return request

9. **getReturnStats** (Query)
   - Dashboard statistics
   - Approval rates
   - Completion metrics

#### 2.4 React Query Hooks
**Location**: `modules/sellers/queries/useReturns.ts`

**Available Hooks**:

```tsx
// Fetch return requests
const { data, isLoading } = useReturnRequests({ status: 'requested', limit: 20 });

// Fetch single return
const returnRequest = useReturnRequest(returnId);

// Get return statistics
const stats = useReturnStats();

// Mutations
const approveMutation = useApproveReturn();
const rejectMutation = useRejectReturn();
const confirmReceiptMutation = useConfirmReturnReceipt();
const refundMutation = useProcessRefund();
const cancelMutation = useCancelReturn();
```

### Return Workflow Example

```tsx
import { ReturnApprovalDialog } from '@/modules/sellers/components';
import { useReturnRequests, useApproveReturn } from '@/modules/sellers/queries/useReturns';

export default function ReturnsPage() {
  const [selectedReturn, setSelectedReturn] = useState(null);
  const { data: returns } = useReturnRequests({ status: 'requested' });
  const approveMutation = useApproveReturn();

  const handleApprove = async (returnId) => {
    await approveMutation.mutateAsync({
      returnId,
      returnShippingLabel: 'https://label.example.com/abc123',
    });
  };

  return (
    <>
      <div>
        {returns?.map((ret) => (
          <div key={ret.id} onClick={() => setSelectedReturn(ret)}>
            {ret.productName} - {ret.reason}
          </div>
        ))}
      </div>

      <ReturnApprovalDialog
        isOpen={!!selectedReturn}
        returnId={selectedReturn?.id}
        orderId={selectedReturn?.orderId}
        customerName={selectedReturn?.buyerName}
        productName={selectedReturn?.productName}
        reason={selectedReturn?.reason}
        reasonDescription={selectedReturn?.reasonDescription}
        quantity={selectedReturn?.quantity}
        requestedAmount={selectedReturn?.amount}
        currency="USD"
        onClose={() => setSelectedReturn(null)}
      />
    </>
  );
}
```

---

## 3. Order Timeline & Status Tracking

### Features
- Visual order lifecycle timeline
- Status progression: Pending → Confirmed → Processing → Shipped → Delivered
- Real-time status update notifications
- Order action buttons (context-aware)
- Shipment tracking information

### Status-Specific Actions

| Status | Available Actions |
|--------|-------------------|
| **Pending** | Confirm Order |
| **Confirmed** | Mark as Processing |
| **Processing** | Mark as Shipped (with tracking) |
| **Shipped** | View Tracking (read-only) |
| **Delivered** | View Details (read-only) |

---

## 4. Order Information Display

### Displayed Information
- **Order Details**: Product, quantity, amount, date
- **Buyer Info**: Name, email, ID
- **Shipping Address**: Full delivery address
- **Payment Info**: Method, payout status
- **Delivery Info**: Status, tracking details
- **Timeline**: Visual progression with timestamps

---

## 5. Real-Time Features Summary

| Feature | Interval | Enabled By Default | Configurable |
|---------|----------|-------------------|--------------|
| Dashboard Polling | 30s | Yes | Yes |
| Order Detail Polling | 30s | Yes | Yes |
| New Order Detection | 30s | Yes | Yes |
| Status Change Detection | 30s | Yes | Yes |

---

## 6. Future Enhancements

### Database Schema Needed
- `returns` table for storing return requests
- `refunds` table for refund tracking
- `order_state_transitions` table (partially implemented)

### Additional Features (Phase 2)
- [ ] Automated return labels (integration with shipping APIs)
- [ ] Bulk return approvals
- [ ] Return deadline enforcement
- [ ] Automatic refund processing
- [ ] Return analytics dashboard
- [ ] Return window customization
- [ ] Return shipping cost tracking
- [ ] Dispute resolution workflow

### Notification Enhancements
- [ ] Email notifications for return requests
- [ ] SMS alerts for high-value returns
- [ ] In-app notification center
- [ ] Browser push notifications
- [ ] Webhook integrations

---

## 7. Testing

### Testing Polling Locally
```tsx
// In development, check browser console
// You should see polling intervals every 30 seconds

// Mock real-time updates:
// 1. Open order detail page
// 2. In another tab, mark order as shipped
// 3. First tab should show update within 30 seconds
// 4. Toast notification confirms update
```

### Testing Returns
```tsx
// 1. Navigate to returns management page
// 2. Click "Return Request" button
// 3. Fill in return details and submit
// 4. Approve/reject the return
// 5. Verify refund is processed
```

---

## 8. Performance Considerations

### Polling Optimization
- **Stale Time**: 30 seconds before refetch considered "stale"
- **Cache Duration**: 5 minutes (configurable)
- **Error Handling**: Stops after 3 consecutive errors
- **Page Visibility**: Automatically adjusts when tab is hidden (future)

### Database Queries
- **Pagination**: Limit 100 orders per page
- **Caching**: Seller data cached for 30 seconds
- **Batching**: Multiple updates batched in single notification

---

## 9. Error Handling

### Polling Errors
- Auto-retry up to 3 times
- Graceful degradation (manual refresh available)
- Error logging for debugging

### Return Processing Errors
- Clear error messages to user
- Rollback on partial failures
- Audit trail for troubleshooting

---

## 10. Integration Points

### TRPC Integration
All features are accessed through TRPC endpoints:
- `/trpc/returns.*` - Return management endpoints
- `/trpc/sales.*` - Order management endpoints
- `/trpc/sellers.*` - Seller data endpoints

### React Query Integration
Automatic data synchronization with:
- `useQuery` - Data fetching
- `useMutation` - Data mutations
- Query invalidation for fresh data

---

## 11. Configuration

### Polling Configuration
```tsx
interface SellerOrderPollingConfig {
  enabled?: boolean;           // Enable/disable polling
  interval?: number;           // Interval in milliseconds (default: 30000)
  onNewOrders?: (count) => void;
  onStatusChange?: (orderId, oldStatus, newStatus) => void;
  onError?: (error) => void;
}
```

---

## Support & Questions

For issues or questions regarding these features:
1. Check the implementation in `modules/sellers/`
2. Review TRPC routes in `server/routers/returns.ts`
3. Test with React Query DevTools (`@tanstack/react-query-devtools`)

---

**Last Updated**: February 6, 2026
**Version**: 1.0.0