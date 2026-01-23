# Seller Module

React Query hooks and utilities for seller operations including orders, inventory, payouts, and analytics.

## Quick Start

### Import Query Hooks

```typescript
import {
  usePendingOrders,
  useOrdersByStatus,
  useOrderId,
  useOrderStats,
  useConfirmOrder,
  useCancelOrder,
  useUpdateOrderStatus,
  useShipOrder,
} from '@/modules/seller/queries';
```

## Key Hooks

### usePendingOrders
Fetches orders awaiting seller action with filtering and pagination support.

```typescript
const { data: orders, isLoading } = usePendingOrders({
  status: 'pending',
  limit: 20,
  offset: 0,
});
```

### useOrdersByStatus
Fetch orders filtered by any status.

```typescript
const { data: orders } = useOrdersByStatus('processing', {
  limit: 50,
  offset: 0,
});
```

### useConfirmOrder
Confirm a pending order.

```typescript
const { mutate, isPending } = useConfirmOrder();
mutate({ orderId });
```

### useCancelOrder
Cancel an order with reason.

```typescript
const { mutate } = useCancelOrder();
mutate({ orderId, reason: 'out_of_stock' });
```

### useShipOrder
Update order status to shipped.

```typescript
const { mutate } = useShipOrder();
mutate({ orderId, trackingNumber, carrier });
```

## Features

✅ **React Query Integration** - Automatic caching and invalidation
✅ **TRPC Type Safety** - Full TypeScript support
✅ **Status Filtering** - Filter by pending, confirmed, processing, shipped, delivered, canceled
✅ **Pagination** - Built-in limit/offset support
✅ **Real-time Updates** - Auto-refetch and manual invalidation
✅ **Error Handling** - Proper error propagation
✅ **Performance** - Optimized cache strategy with prefetching

## Query Keys

All query keys are centralized in `queryKeys.ts`:

```typescript
import { sellerQueryKeys } from '@/modules/seller/queries';

// Invalidate pending orders
queryClient.invalidateQueries({
  queryKey: sellerQueryKeys.pendingOrders(),
});
```

## Complete Example

See `app/sellers/pending-orders/page.tsx` for a full implementation using `usePendingOrders`.

## Architecture

```
modules/seller/
├── queries/
│   ├── index.ts                 # Main exports
│   ├── queryKeys.ts            # Query key definitions
│   ├── usePendingOrders.ts     # Query and mutation hooks
│   └── INTEGRATION_GUIDE.md    # Detailed usage guide
└── README.md                    # This file
```

## Cache Strategy

- **Stale Time**: 30-60 seconds
- **GC Time**: 5-10 minutes
- **Refetch Interval**: Configurable (default: manual)
- **Auto-invalidation**: On successful mutations

## See Also

- [Server Router Documentation](../../server/routers/checkout.ts)
- [Escrow System Documentation](../../ESCROW_SYSTEM_SUMMARY.md)
- [Complete Buyer Flow Guide](../../docs/COMPLETE_BUYER_FLOW_GUIDE.md)