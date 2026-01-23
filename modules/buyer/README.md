# Buyer Module

Complete buyer-side functionality for the Luxela marketplace, including profile management, shopping, orders, and refunds.

## Features

### Profile Management
- Create and update buyer profile
- Manage account details
- Upload profile picture
- Manage billing addresses (multiple addresses with default selection)

### Shopping
- Browse and search products/listings
- Filter by brand and collections
- Add items to favorites
- View product details and reviews

### Cart & Checkout
- Add/remove items from cart
- Update quantities
- View cart summary with totals
- Apply coupon codes
- Checkout with payment and shipping address selection

### Orders & Returns
- View all orders with status tracking
- Get order details
- Track order status (pending, processing, shipped, delivered, cancelled)
- Request returns and refunds
- Upload return proof documents
- View refund status

### Reviews & Ratings
- View product reviews with photos
- Post and edit your own reviews
- Rate products (1-5 stars)
- Like helpful reviews
- Delete your reviews

### Payment
- Manage multiple payment methods
- Save card information securely
- Set default payment method
- View transaction history

### Notifications
- Receive order updates
- Promotional notifications
- Support responses

## Usage Examples

### Profile Management
```tsx
import { useProfile, useUpdateProfile, useUploadProfilePicture } from "@/modules/buyer";

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const uploadMutation = useUploadProfilePicture();

  const handleUpdate = (formData) => {
    updateMutation.mutate(formData);
  };

  return (
    <div>
      {profile && <p>Welcome, {profile.fullName}</p>}
      {/* UI */}
    </div>
  );
}
```

### Shopping
```tsx
import { useSearchListings, useBrands, useFavorites, useToggleFavorite } from "@/modules/buyer";

export function ShoppingPage() {
  const { data: listings } = useSearchListings("luxury watch");
  const { data: brands } = useBrands();
  const { data: favorites } = useFavorites();
  const toggleFav = useToggleFavorite();

  return (
    <div>
      {listings?.map(item => (
        <button onClick={() => toggleFav.mutate(item.id)}>
          {favorites?.includes(item.id) ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
```

### Cart & Checkout
```tsx
import { useCartItems, useAddToCart, useCheckout } from "@/modules/buyer";

export function CartPage() {
  const { data: cartItems } = useCartItems();
  const addToCart = useAddToCart();
  const checkout = useCheckout();

  const handleCheckout = () => {
    checkout.mutate({
      paymentMethodId: "method-123",
      shippingAddressId: "address-456",
      couponCode: "SAVE10"
    });
  };

  return (
    <div>
      {cartItems?.map(item => <CartItem key={item.id} {...item} />)}
      <button onClick={handleCheckout}>Proceed to Checkout</button>
    </div>
  );
}
```

### Orders
```tsx
import { useOrders, useOrderById, useOrderStats } from "@/modules/buyer";

export function OrdersPage() {
  const { data: orders } = useOrders();
  const { data: stats } = useOrderStats();

  return (
    <div>
      <p>Total Orders: {stats?.totalOrders}</p>
      <p>Total Spent: ${(stats?.totalSpentCents || 0) / 100}</p>
      {orders?.map(order => <OrderCard key={order.id} {...order} />)}
    </div>
  );
}
```

### Refunds
```tsx
import { useRefunds, useRequestRefund } from "@/modules/buyer";

export function RefundsPage() {
  const { data: refunds } = useRefunds();
  const requestRefund = useRequestRefund();

  const handleRequest = (orderId) => {
    requestRefund.mutate({
      orderId,
      reason: "DEFECTIVE",
      description: "Product has manufacturing defect"
    });
  };

  return (
    <div>
      {refunds?.map(refund => <RefundStatus key={refund.id} {...refund} />)}
    </div>
  );
}
```

### Reviews
```tsx
import { useListingReviews, useCreateReview, useMyReviews } from "@/modules/buyer";

export function ReviewPage() {
  const { data: reviews } = useListingReviews("listing-123");
  const { data: myReviews } = useMyReviews();
  const createReview = useCreateReview();

  const handleCreateReview = (formData) => {
    createReview.mutate({
      listingId: "listing-123",
      rating: 5,
      title: "Great product!",
      comment: "Excellent quality and fast shipping",
      photos: [] // optional
    });
  };

  return (
    <div>
      <ReviewForm onSubmit={handleCreateReview} />
      {reviews?.map(review => <ReviewCard key={review.id} {...review} />)}
    </div>
  );
}
```

## Available Hooks

### Profile
- `useProfile()` - Get current buyer profile
- `useCreateBuyerProfile()` - Create new profile
- `useUpdateProfile()` - Update profile info
- `useUploadProfilePicture()` - Upload profile image

### Billing
- `useBillingAddresses()` - Get all addresses
- `useBillingAddressById(id)` - Get specific address
- `useCreateBillingAddress()` - Add new address
- `useUpdateBillingAddress()` - Update address
- `useDeleteBillingAddress()` - Remove address
- `useSetDefaultBillingAddress()` - Set default

### Favorites
- `useFavorites()` - Get favorite listings
- `useAddToFavorites()` - Add to favorites
- `useRemoveFromFavorites()` - Remove favorite
- `useToggleFavorite()` - Toggle favorite status

### Shopping
- `useSearchListings(query, filters)` - Search products
- `useListingById(id)` - Get product details
- `useBrands()` - Get all brands
- `useBrandById(id)` - Get brand details
- `useBrandListings(id)` - Get brand's products
- `useCollections()` - Get all collections
- `useCollectionById(id)` - Get collection details
- `useCollectionListings(id)` - Get collection's products

### Cart
- `useCartItems()` - Get cart contents
- `useCartSummary()` - Get totals
- `useAddToCart()` - Add item
- `useUpdateCartItem()` - Change quantity
- `useRemoveFromCart()` - Delete item
- `useClearCart()` - Empty cart
- `useCheckout()` - Process checkout

### Orders
- `useOrders(filters)` - Get all orders
- `useOrderById(id)` - Get order details
- `useOrderStats()` - Get statistics
- `useCancelOrder()` - Cancel pending order
- `useReturnOrder()` - Request return

### Reviews
- `useListingReviews(id)` - Get product reviews
- `useMyReviews()` - Get your reviews
- `useCreateReview()` - Post review
- `useUpdateReview()` - Edit review
- `useDeleteReview()` - Remove review
- `useLikeReview()` - Like review

### Refunds
- `useRefunds(filters)` - Get your refunds
- `useRefundById(id)` - Get refund details
- `useRefundsByOrder(id)` - Get order refunds
- `useRequestRefund()` - Request refund
- `useCancelRefundRequest()` - Cancel request
- `useUploadRefundProof()` - Upload evidence

### Payment
- `usePaymentMethods()` - Get saved cards
- `usePaymentMethodById(id)` - Get card details
- `useAddPaymentMethod()` - Save new card
- `useUpdatePaymentMethod()` - Edit card info
- `useDeletePaymentMethod()` - Remove card
- `usePaymentTransactions()` - Get transactions
- `usePaymentTransactionById(id)` - Get transaction

## Query Keys

All query keys are exported via `buyerQueryKeys`:

```tsx
import { buyerQueryKeys } from "@/modules/buyer";

// Invalidate profile queries
queryClient.invalidateQueries({
  queryKey: buyerQueryKeys.profile()
});

// Invalidate specific order
queryClient.invalidateQueries({
  queryKey: buyerQueryKeys.orderById("order-123")
});
```

## Error Handling

All mutations automatically handle errors with toast notifications:

```tsx
const mutation = useAddToCart();

// Errors automatically shown as toasts
mutation.mutate({ listingId: "123", quantity: 1 });

// Still can catch manually if needed
mutation.mutate(data, {
  onError: (error) => {
    console.error("Custom error handling", error);
  }
});
```

## Caching Strategy

- **Profiles**: 1-2 minute stale time
- **Orders**: 1 minute stale time  
- **Cart**: 30 second stale time (frequently changes)
- **Products**: 2-5 minute stale time (less volatile)
- **Addresses**: 2 minute stale time
- **Favorites**: 1 minute stale time

## Performance

- Automatic background refetch on window focus
- Query deduplication prevents redundant requests
- Mutations invalidate only affected queries
- Optimistic updates for better UX

## Type Safety

All hooks are fully typed with TypeScript:

```tsx
const { data: profile } = useProfile(); // Typed
const { mutate: update } = useUpdateProfile(); // Input types

// Type inference for results
update({ username: "john" }, {
  onSuccess: (data) => {
    // data is fully typed
    console.log(data.id);
  }
});
```