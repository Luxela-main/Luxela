# TanStack Query Setup - Luxela Platform

This directory contains the complete TanStack Query setup for the entire Luxela platform, including providers, hooks, and query client configuration.

## 📁 Structure

```
lib/
├── queryClient.ts           # Query client configuration
├── providers/
│   ├── QueryProvider.tsx    # Main query provider with devtools
│   └── index.ts            # Provider exports
├── hooks/
│   ├── useAuth.ts          # Authentication hooks
│   ├── useProducts.ts      # Product management hooks
│   ├── useCart.ts          # Shopping cart hooks
│   ├── useOrders.ts        # Order management hooks
│   ├── useReviews.ts       # Review system hooks
│   └── index.ts            # Hook exports
└── README.md               # This file
```

## 🚀 Features

- **Global Query Client**: Centralized query client with optimized defaults
- **Authentication Integration**: Automatic Supabase token injection
- **Error Handling**: Built-in error handling with toast notifications
- **Type Safety**: Full TypeScript support with proper interfaces
- **DevTools**: React Query DevTools in development mode
- **Cache Management**: Optimized caching strategies for different data types

## 🔧 Configuration

### Query Client Defaults
- **Stale Time**: 1 minute for most queries
- **Retry**: 1 retry for failed requests
- **Refetch on Window Focus**: Disabled for better UX
- **Error Handling**: Automatic error handling with toast notifications

### API Integration
- **Base URL**: Configurable via `NEXT_PUBLIC_API_URL` environment variable
- **Authentication**: Automatic Supabase token injection
- **Error Handling**: 401 errors trigger automatic logout

## 📚 Available Hooks

### Authentication
```tsx
import { useAuth } from '@/lib/hooks';

function MyComponent() {
  const { data: user, isLoading, error } = useAuth();
  // user: User | null
}
```

### Products
```tsx
import { useProducts, useProduct } from '@/lib/hooks';

// Get all products with filters
const { data: products } = useProducts({
  category: 'men_clothing',
  search: 'shirt',
  limit: 20
});

// Get single product
const { data: product } = useProduct('product-id');
```

### Shopping Cart
```tsx
import { useCart, useAddToCart, useUpdateCartItem, useRemoveFromCart } from '@/lib/hooks';

const { data: cart } = useCart();
const addToCart = useAddToCart();
const updateItem = useUpdateCartItem();
const removeItem = useRemoveFromCart();

// Add to cart
addToCart.mutate({ listingId: '123', quantity: 2 });
```

### Orders
```tsx
import { useOrders, useOrder, useCreateOrder } from '@/lib/hooks';

const { data: orders } = useOrders({ status: 'processing' });
const { data: order } = useOrder('order-id');
const createOrder = useCreateOrder();
```

### Reviews
```tsx
import { useReviews, useCreateReview } from '@/lib/hooks';

const { data: reviews } = useReviews('listing-id');
const createReview = useCreateReview();

createReview.mutate({
  listingId: '123',
  rating: 5,
  comment: 'Great product!'
});
```

## 🎯 Sellers Module

The sellers module has its own specialized hooks in `modules/sellers/queries/`:

```tsx
import { useDashboard, useMyListings, useSales } from '@/modules/sellers';

const { data: dashboardData } = useDashboard();
const { data: listings } = useMyListings();
const { data: sales } = useSales('processing');
```

## 🔄 Cache Management

### Query Invalidation
All mutation hooks automatically invalidate related queries:

```tsx
const createOrder = useCreateOrder();
// This will automatically invalidate ['orders'] and ['cart'] queries
createOrder.mutate(orderData);
```

### Manual Invalidation
```tsx
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: ['products'] });

// Invalidate all queries
queryClient.invalidateQueries();
```

## 🛠️ Development

### DevTools
React Query DevTools are automatically enabled in development mode. Access them via the floating button in the bottom-left corner.

### Debugging
```tsx
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Get all cached data
console.log(queryClient.getQueryData(['products']));

// Get query state
console.log(queryClient.getQueryState(['products']));
```

## 📝 Best Practices

1. **Use Query Keys**: Always use consistent query keys for better cache management
2. **Handle Loading States**: Always handle loading and error states
3. **Optimistic Updates**: Use optimistic updates for better UX
4. **Stale Time**: Set appropriate stale times based on data freshness requirements
5. **Error Boundaries**: Implement error boundaries for better error handling

## 🔗 Integration

The setup is already integrated into:
- **Root Layout**: `app/layout.tsx` - QueryProvider wraps the entire app
- **API Client**: `lib/api.ts` - Automatic authentication and error handling
- **Sellers Module**: `modules/sellers/` - Specialized seller hooks

## 🚀 Getting Started

1. **Import hooks**: `import { useProducts } from '@/lib/hooks';`
2. **Use in components**: `const { data, isLoading, error } = useProducts();`
3. **Handle states**: Show loading/error states appropriately
4. **Use mutations**: Call mutation functions for data changes

The setup is ready to use throughout the entire application!
