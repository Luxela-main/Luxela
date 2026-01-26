# Enterprise-Level Real-Time Data Architecture for Sellers Dashboard

## Overview

This document outlines the comprehensive real-time data integration strategy implemented across all seller pages. The system is designed to provide real-time updates with enterprise-grade reliability and performance.

## Key Features

✅ **Aggressive Polling Intervals** - Data updates every 3-10 seconds depending on criticality
✅ **Background Refresh** - Updates continue even when tab is not focused
✅ **Immediate Tab Focus Refresh** - Instant data fetch when user returns to window
✅ **Connection Recovery** - Automatic retry with exponential backoff
✅ **Smart Cache Invalidation** - Targeted invalidation based on data changes
✅ **Automatic Retry Logic** - 2-3 retries with exponential backoff

## Polling Configuration by Page/Feature

### 1. Dashboard (`useDashboardData`)
- **Refetch Interval**: 5 seconds
- **Stale Time**: 5 seconds
- **Background Polling**: ✅ ENABLED
- **Window Focus**: ALWAYS refetch
- **Purpose**: Real-time overview of sales, revenue, and metrics
- **Cache Duration**: 10 minutes

**Flow:**
```
1. Component mounts → Fetch data immediately
2. Every 5 seconds → Refetch data in background
3. When tab focused → Immediate refetch
4. Data displayed → Updates every 5 seconds
```

### 2. Sales Page (`useSales`)
- **Refetch Interval**: 5-60 seconds (adaptive based on order status)
  - Active Orders (processing/shipped): 5 seconds
  - Pending Delivery: 15 seconds
  - Completed Orders: 60 seconds
- **Stale Time**: 3 seconds
- **Background Polling**: ✅ ENABLED
- **Window Focus**: STALE refetch
- **Purpose**: Track order status in real-time
- **Cache Duration**: 10 minutes

**Refetch Strategy:**
```
- ORDER STATUS: processing/shipped/in_transit
  └─ Refetch: Every 5 seconds (MOST AGGRESSIVE)

- ORDER STATUS: pending/confirmed
  └─ Refetch: Every 15 seconds

- ORDER STATUS: delivered/completed
  └─ Refetch: Every 60 seconds (LEAST AGGRESSIVE)
```

### 3. Pending Orders Page (`usePendingOrders`)
- **Refetch Interval**: 5 seconds
- **Stale Time**: 3 seconds
- **Background Polling**: ✅ ENABLED
- **Window Focus**: ALWAYS refetch
- **Purpose**: Confirm or cancel pending orders immediately
- **Cache Duration**: 10 minutes
- **Critical**: This page requires the most aggressive polling since actions are time-sensitive

### 4. Order Detail View (`useSaleById`, `useOrderById`)
- **Refetch Interval**: 3 seconds
- **Stale Time**: 2 seconds
- **Background Polling**: ✅ ENABLED
- **Window Focus**: Always refetch
- **Purpose**: Monitor single order status changes in real-time
- **Cache Duration**: 5 minutes

**Use Cases:**
- Customer waiting for order confirmation
- Tracking delivery status
- Monitoring payment processing

### 5. Payouts & Finance (`usePayoutStats`, `usePayoutHistory`)
- **Refetch Interval**: 10 seconds
- **Stale Time**: 5 seconds
- **Background Polling**: ✅ ENABLED
- **Window Focus**: ALWAYS refetch
- **Purpose**: Display real-time balance and transaction history
- **Cache Duration**: 10 minutes

**Significance:**
- Balance updates are critical for seller confidence
- Transaction history needs to reflect payouts immediately
- 10-second interval balances real-time needs with server load

## Implementation Details

### A. Visibility Change Handling

Every hook includes automatic tab visibility detection:

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      // Tab became visible - immediately refetch
      queryClient.invalidateQueries({
        queryKey: /* relevant key */
      });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [queryClient]);
```

**When User:**
1. Switches to another tab → Refetch stops (background polling may continue)
2. Returns to app tab → **Immediate refetch** triggered
3. Maximum stale time: 5-10 seconds before old data shown

### B. Background Polling Strategy

All hooks use **`refetchIntervalInBackground: true`** which means:

```
Tab Hidden → Still fetches every X seconds
App Minimized → Still fetches every X seconds
Browser in Background → Still fetches every X seconds
```

This ensures sellers never miss important updates.

### C. Cache Invalidation

When mutations occur (confirm order, cancel order, schedule payout), multiple related queries are invalidated:

```typescript
onSuccess: () => {
  // Invalidate specific item
  queryClient.invalidateQueries({
    queryKey: sellerQueryKeys.orderById(orderId),
  });
  
  // Invalidate lists to show updated counts
  queryClient.invalidateQueries({
    queryKey: sellerQueryKeys.pendingOrders(),
  });
  
  // Invalidate stats
  queryClient.invalidateQueries({
    queryKey: sellerQueryKeys.orderStats(),
  });
}
```

### D. Retry & Connection Recovery

All hooks include automatic recovery:

```typescript
{
  retry: 2-3,  // Number of retries
  retryDelay: (attemptIndex) => 
    Math.min(1000 * 2 ** attemptIndex, 10000-15000), // Exponential backoff
  refetchOnReconnect: true, // Refetch when connection restored
}
```

**Retry Sequence:**
```
1st attempt fails → Wait 1 second → Retry
2nd attempt fails → Wait 2 seconds → Retry
3rd attempt fails → Wait 4 seconds → Retry
4th attempt fails → Show error to user
```

## Performance Considerations

### Server Impact
- **Dashboard**: 1 request per 5 seconds (aggressive but necessary)
- **Sales List**: 1 request per 5-60 seconds (adaptive)
- **Pending Orders**: 1 request per 5 seconds (critical)
- **Order Details**: 1 request per 3 seconds (user-focused)
- **Payouts**: 1 request per 10 seconds (important)

### Optimization Techniques

1. **Request Coalescing**: Multiple requests for same data within stale time are deduplicated
2. **Background Polling Only**: When tab hidden, still polls but with reduced urgency
3. **Smart Cache**: Keep frequently accessed data in memory for 10 minutes
4. **Garbage Collection**: Old cache entries cleaned after 10 minutes of inactivity

## Testing Real-Time Updates

### Manual Testing Checklist

1. **Test Background Polling:**
   - Open sales page
   - Change order status from backend/admin panel
   - Switch to another tab for 30 seconds
   - Return to app tab
   - ✅ Order status should update within 5 seconds

2. **Test Window Focus Refresh:**
   - Open pending orders page
   - New order appears in backend
   - Switch to another tab
   - Return to app
   - ✅ New order should appear immediately

3. **Test Connection Recovery:**
   - Open any page with real-time data
   - Disconnect network (browser dev tools)
   - Wait 15 seconds
   - Reconnect network
   - ✅ Data should refetch and display

4. **Test Mutation Invalidation:**
   - Confirm a pending order
   - ✅ Pending orders list should update
   - ✅ Order count should change
   - ✅ Stats should recalculate

## Configuration by Business Logic

### High Priority (Fast Updates)
- Pending Order Confirmation: 5 seconds
- Order Status Changes: 5 seconds  
- Payout Balance: 10 seconds

### Medium Priority (Regular Updates)
- Sales History: 5-60 seconds (adaptive)
- Transaction History: 10 seconds
- Dashboard Stats: 5 seconds

### Low Priority (Slower Updates)
- Archived Orders: 60+ seconds
- Completed Transactions: 60+ seconds

## API Endpoints Involved

All queries use these tRPC endpoints:

1. **Sales**
   - `trpc.sales.getAllSales` - Used by useSales
   - `trpc.sales.getSaleById` - Used by useSaleById

2. **Orders**
   - `trpc.orderStatus.getPendingOrders` - Used by usePendingOrders
   - `trpc.orderStatus.getOrdersByStatus` - Used by useOrdersByStatus
   - `trpc.orderStatus.getOrderById` - Used by useOrderById

3. **Finance**
   - `trpc.finance.getPayoutStats` - Used by usePayoutStats
   - `trpc.finance.getPayoutHistory` - Used by usePayoutHistory

4. **Listings**
   - `trpc.listing.getMyListings` - Used by useDashboardData

## Migration Notes

When implementing this system:

1. **Ensure Query Key Consistency**: Use `sellerQueryKeys` helpers consistently
2. **Test in Production**: Monitor server load before and after
3. **User Communication**: Consider showing "Last Updated: XX seconds ago" badge
4. **Error Boundaries**: Wrap pages with error boundaries for better error handling
5. **Loading States**: Implement proper loading states during refetch

## Future Enhancements

1. **WebSocket Integration**: Replace polling with WebSocket for true real-time
2. **Server-Sent Events (SSE)**: Implement server push without WebSocket overhead
3. **Selective Polling**: Only refetch data that actually changed
4. **Smart Rate Limiting**: Adjust polling based on server response times
5. **Analytics**: Track which pages benefit most from real-time updates

## Troubleshooting

### Data Not Updating
- Check: Is `refetchInterval` set?
- Check: Is `refetchIntervalInBackground` true?
- Check: Has API endpoint changed?
- Check: Browser console for errors

### High Server Load
- Reduce `refetchInterval` for less critical pages
- Implement query coalescing
- Use pagination to fetch fewer items
- Monitor API response times

### Stale Data Issues
- Reduce `staleTime` if data appears old
- Check `gcTime` - should be longer than `refetchInterval`
- Verify mutation invalidations are working
- Test with network throttling

## Summary

This real-time architecture ensures:
- ✅ Sellers see updates within 3-10 seconds
- ✅ No missed critical events (pending orders, payouts)
- ✅ Seamless background updates
- ✅ Automatic error recovery
- ✅ Optimized server/client performance
- ✅ Enterprise-grade reliability