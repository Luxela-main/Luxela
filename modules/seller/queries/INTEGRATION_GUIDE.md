# Seller Query Hooks Integration Guide

## Overview

The seller query hooks module provides React Query integration for fetching and managing seller orders, inventory, and business metrics. All hooks follow React Query best practices with proper cache management and invalidation strategies.

## Installation & Setup

### Prerequisites
- React Query v5.x installed
- TRPC client configured
- Next.js 13+ with App Router

### Import Hooks

```typescript
import {
  usePendingOrders,
  useOrdersByStatus,
  useOrderById,
  useOrderStats,
  useConfirmOrder,
  useCancelOrder,
  useUpdateOrderStatus,
  useShipOrder,
} from '@/modules/seller/queries';
```

## Query Hooks

### usePendingOrders

Fetch orders with 'pending' status for seller action.

```typescript
'use client';

import { usePendingOrders } from '@/modules/seller/queries';

export function PendingOrdersList() {
  const { data: orders, isLoading, error } = usePendingOrders(
    {
      status: 'pending',
      limit: 20,
      offset: 0,
    },
    { refetchInterval: 30000 } // Auto-refetch every 30 seconds
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {orders?.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

### useOrdersByStatus

Fetch orders filtered by any status (pending, confirmed, processing, shipped, delivered, canceled).

```typescript
import { useOrdersByStatus } from '@/modules/seller/queries';

export function ProcessingOrdersList() {
  const { data: orders } = useOrdersByStatus('processing', {
    limit: 50,
    offset: 0,
  });

  return (
    <div>
      {orders?.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </div>
  );
}
```

### useOrderById

Fetch a specific order with full details.

```typescript
import { useOrderById } from '@/modules/seller/queries';

export function OrderDetails({ orderId }: { orderId: string }) {
  const { data: order, isLoading } = useOrderById(orderId);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h2>{order?.productTitle}</h2>
      <p>Status: {order?.orderStatus}</p>
      <p>Amount: {order?.amountCents / 100} {order?.currency}</p>
    </div>
  );
}
```

### useOrderStats

Fetch aggregated order statistics (counts, revenue, trends).

```typescript
import { useOrderStats } from '@/modules/seller/queries';

export function DashboardStats() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const { data: stats } = useOrderStats({
    startDate,
    endDate: new Date(),
  });

  return (
    <div>
      <div>Pending: {stats?.pending}</div>
      <div>Confirmed: {stats?.confirmed}</div>
      <div>Total Revenue: {stats?.totalRevenue}</div>
    </div>
  );
}
```

## Mutation Hooks

### useConfirmOrder

Confirm a pending order (transition to processing).

```typescript
import { useConfirmOrder } from '@/modules/seller/queries';
import { toastSvc } from '@/services/toast';

export function ConfirmOrderButton({ orderId }: { orderId: string }) {
  const { mutate, isPending } = useConfirmOrder();

  const handleConfirm = () => {
    mutate(
      { orderId },
      {
        onSuccess: () => {
          toastSvc.success('Order confirmed successfully');
        },
        onError: (error) => {
          toastSvc.apiError(error);
        },
      }
    );
  };

  return (
    <button onClick={handleConfirm} disabled={isPending}>
      {isPending ? 'Confirming...' : 'Confirm Order'}
    </button>
  );
}
```

### useCancelOrder

Cancel an order with a reason.

```typescript
import { useCancelOrder } from '@/modules/seller/queries';

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const { mutate, isPending } = useCancelOrder();

  const handleCancel = () => {
    mutate(
      { 
        orderId,
        reason: 'out_of_stock'
      },
      {
        onSuccess: () => {
          toastSvc.success('Order canceled');
        },
      }
    );
  };

  return (
    <button onClick={handleCancel} disabled={isPending}>
      {isPending ? 'Canceling...' : 'Cancel Order'}
    </button>
  );
}
```

### useUpdateOrderStatus

Update order to any status.

```typescript
import { useUpdateOrderStatus } from '@/modules/seller/queries';

export function UpdateStatusButton({ orderId }: { orderId: string }) {
  const { mutate, isPending } = useUpdateOrderStatus();

  const handleStatusChange = (newStatus: string) => {
    mutate(
      { 
        orderId,
        status: newStatus
      },
      {
        onSuccess: () => {
          toastSvc.success(`Order updated to ${newStatus}`);
        },
      }
    );
  };

  return (
    <button onClick={() => handleStatusChange('shipped')} disabled={isPending}>
      Mark as Shipped
    </button>
  );
}
```

### useShipOrder

Ship an order with optional tracking information.

```typescript
import { useShipOrder } from '@/modules/seller/queries';

export function ShipOrderButton({ orderId }: { orderId: string }) {
  const { mutate, isPending } = useShipOrder();

  const handleShip = () => {
    mutate(
      { 
        orderId,
        trackingNumber: 'TRACK123456',
        carrier: 'fedex'
      },
      {
        onSuccess: () => {
          toastSvc.success('Order shipped successfully');
        },
      }
    );
  };

  return (
    <button onClick={handleShip} disabled={isPending}>
      Ship Order
    </button>
  );
}
```

## Complete Example: Pending Orders Page

```typescript
'use client';

import { useState, useMemo } from 'react';
import { 
  usePendingOrders, 
  useConfirmOrder, 
  useCancelOrder 
} from '@/modules/seller/queries';
import { toastSvc } from '@/services/toast';

export default function PendingOrdersPage() {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Fetch pending orders
  const { 
    data: orders = [], 
    isLoading, 
    error 
  } = usePendingOrders(
    { status: 'pending', limit, offset },
    { refetchInterval: 30000 }
  );

  // Setup mutations
  const { mutate: confirmOrder, isPending: confirming } = useConfirmOrder();
  const { mutate: cancelOrder, isPending: canceling } = useCancelOrder();

  // Filter orders by search
  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.orderId.toLowerCase().includes(search.toLowerCase()) ||
        order.productTitle.toLowerCase().includes(search.toLowerCase()) ||
        order.buyerName.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  const handleConfirm = (orderId: string) => {
    confirmOrder(
      { orderId },
      {
        onSuccess: () => {
          toastSvc.success('Order confirmed');
        },
        onError: (error) => {
          toastSvc.apiError(error);
        },
      }
    );
  };

  const handleCancel = (orderId: string) => {
    cancelOrder(
      { orderId, reason: 'out_of_stock' },
      {
        onSuccess: () => {
          toastSvc.success('Order canceled');
        },
      }
    );
  };

  if (error) {
    return <div className="error">Failed to load orders: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Pending Orders ({filteredOrders.length})</h1>
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="border p-4 rounded">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-semibold">{order.productTitle}</p>
                  <p className="text-sm text-gray-600">{order.buyerName}</p>
                  <p className="text-sm text-gray-600">Order: {order.orderId}</p>
                </div>
                <p className="text-lg font-bold">
                  ${(order.amountCents / 100).toFixed(2)}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirm(order.orderId)}
                  disabled={confirming}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  {confirming ? 'Confirming...' : 'Confirm'}
                </button>
                <button
                  onClick={() => handleCancel(order.orderId)}
                  disabled={canceling}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  {canceling ? 'Canceling...' : 'Cancel'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Query Key Management

All query keys are centralized in `queryKeys.ts` for consistent cache management:

```typescript
import { sellerQueryKeys } from '@/modules/seller/queries';

// Manual invalidation example
const queryClient = useQueryClient();

queryClient.invalidateQueries({
  queryKey: sellerQueryKeys.pendingOrders(),
});

queryClient.invalidateQueries({
  queryKey: sellerQueryKeys.orders(),
});
```

## Cache Configuration

- **Stale Time**: 30 seconds for list queries, 60 seconds for single item
- **GC Time**: 5-10 minutes (data kept in cache for quick re-access)
- **Auto-refetch**: Configurable per hook (default: manual refetch)

## Performance Tips

1. **Prefetch data** before navigation:
```typescript
import { prefetchPendingOrders } from '@/modules/seller/queries';

const queryClient = useQueryClient();
// In route change handler:
prefetchPendingOrders(queryClient, { limit: 20 });
```

2. **Use pagination** for large datasets:
```typescript
const { data, hasMore } = usePendingOrders({ limit: 20, offset: 0 });
```

3. **Combine queries** in a single component when related:
```typescript
const orders = usePendingOrders();
const stats = useOrderStats();
// Both queries cached independently but share invalidation strategy
```

## Error Handling

All hooks properly propagate TRPC errors. Use React Query's error boundary:

```typescript
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

export function PendingOrdersWithErrorBoundary() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset}>
          <PendingOrdersList />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

## Migration from Direct TRPC Calls

**Before:**
```typescript
const { data } = (trpc.sales as any).getPendingOrders.useQuery({});
```

**After:**
```typescript
const { data } = usePendingOrders();
```

The hooks handle caching, invalidation, and best practices automatically.