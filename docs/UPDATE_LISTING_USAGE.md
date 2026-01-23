# Update Listing - Complete Usage Guide

## Overview

The `updateListing` procedure allows sellers to modify their product listings with full validation, seller ownership checks, and comprehensive field support.

## Quick Start

```typescript
import { useUpdateListing } from '@/modules/sellers';

const UpdateListingComponent = ({ listingId }) => {
  const updateMutation = useUpdateListing();

  const handleUpdate = () => {
    updateMutation.mutate({
      id: listingId,
      priceCents: 9999,
      description: 'Updated product description',
      category: 'men_clothing',
    });
  };

  return (
    <div>
      <button onClick={handleUpdate} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Updating...' : 'Update Listing'}
      </button>
      {updateMutation.isError && (
        <p>Error: {updateMutation.error?.message}</p>
      )}
      {updateMutation.isSuccess && (
        <p>✓ Listing updated successfully!</p>
      )}
    </div>
  );
};
```

## Endpoint Details

**Method**: PUT  
**Path**: `/listing/update`  
**Auth**: Required (protectedProcedure)  
**Validation**: Seller owns listing  

## Request Schema

All fields are **optional** - only include fields you want to update.

```typescript
{
  id: string (uuid, required)
  title?: string
  description?: string | null
  category?: 'men_clothing' | 'women_clothing' | ... (nullable)
  image?: string | null (main image URL)
  images?: string[] (array of additional images)
  priceCents?: number (nullable)
  currency?: string (nullable)
  sizes?: string[]
  supplyCapacity?: 'no_max' | 'limited'
  quantityAvailable?: number
  limitedEditionBadge?: 'show_badge' | 'do_not_show'
  releaseDuration?: '24hrs' | '48hrs' | '72hrs' | '1week' | '2weeks' | '1month'
  materialComposition?: string
  colorsAvailable?: string[]
  additionalTargetAudience?: 'male' | 'female' | 'unisex' | 'kids' | 'teens'
  shippingOption?: 'local' | 'international' | 'both'
  etaDomestic?: 'same_day' | 'next_day' | ... (shipping ETA options)
  etaInternational?: 'same_day' | 'next_day' | ...
}
```

## Response Schema

Returns the **complete updated listing**:

```typescript
{
  id: string (uuid)
  sellerId: string (uuid)
  type: 'single' | 'collection'
  title: string
  description: string | null
  category: string | null
  image: string | null
  priceCents: number | null
  currency: string | null
  sizesJson: string[] | null
  supplyCapacity: 'no_max' | 'limited' | null
  quantityAvailable: number | null
  limitedEditionBadge: 'show_badge' | 'do_not_show' | null
  releaseDuration: string | null
  materialComposition: string | null
  colorsAvailable: string[] | null
  additionalTargetAudience: string | null
  shippingOption: 'local' | 'international' | 'both' | null
  etaDomestic: string | null
  etaInternational: string | null
  itemsJson: any[] | null
  productId: string | null
  createdAt: Date
  updatedAt: Date (will be updated to now)
}
```

## Real-World Examples

### Example 1: Update Price

```typescript
const updateMutation = useUpdateListing();

updateMutation.mutate({
  id: 'listing-uuid-here',
  priceCents: 15999, // $159.99
  currency: 'SOL',
});
```

### Example 2: Update Description Only

```typescript
updateMutation.mutate({
  id: 'listing-uuid-here',
  description: 'Premium cotton blend. Comfortable fit. Perfect for casual wear.',
});
```

### Example 3: Update Category & Images

```typescript
updateMutation.mutate({
  id: 'listing-uuid-here',
  category: 'women_clothing',
  images: [
    'https://cdn.example.com/product-1.jpg',
    'https://cdn.example.com/product-2.jpg',
    'https://cdn.example.com/product-3.jpg',
  ],
});
```

### Example 4: Update Inventory & Stock Info

```typescript
updateMutation.mutate({
  id: 'listing-uuid-here',
  supplyCapacity: 'limited',
  quantityAvailable: 25,
  sizes: ['S', 'M', 'L', 'XL'],
  colorsAvailable: ['Black', 'White', 'Navy Blue'],
});
```

### Example 5: Complete Product Update

```typescript
updateMutation.mutate({
  id: 'listing-uuid-here',
  title: 'Premium Cotton T-Shirt v2',
  description: 'Updated high-quality cotton T-shirt',
  category: 'men_clothing',
  image: 'https://cdn.example.com/main.jpg',
  images: ['https://cdn.example.com/img-1.jpg', 'https://cdn.example.com/img-2.jpg'],
  priceCents: 19999,
  currency: 'SOL',
  supplyCapacity: 'limited',
  quantityAvailable: 100,
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  materialComposition: '100% organic cotton',
  colorsAvailable: ['Black', 'White', 'Gray', 'Navy'],
  additionalTargetAudience: 'male',
  shippingOption: 'both',
  etaDomestic: '2_3_working_days',
  etaInternational: '1_2_weeks',
});
```

## Usage in a Form Component

```typescript
'use client';

import { useState } from 'react';
import { useUpdateListing } from '@/modules/sellers';

interface UpdateListingFormProps {
  listingId: string;
  initialData: {
    title: string;
    description: string;
    priceCents: number;
    category: string;
  };
}

export function UpdateListingForm({
  listingId,
  initialData,
}: UpdateListingFormProps) {
  const [formData, setFormData] = useState(initialData);
  const updateMutation = useUpdateListing();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'priceCents' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: listingId,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Title</label>
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Product title"
        />
      </div>

      <div>
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Product description"
          rows={5}
        />
      </div>

      <div>
        <label>Price (in cents)</label>
        <input
          type="number"
          name="priceCents"
          value={formData.priceCents}
          onChange={handleChange}
          placeholder="9999 = $99.99"
        />
      </div>

      <div>
        <label>Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
        >
          <option value="men_clothing">Men Clothing</option>
          <option value="women_clothing">Women Clothing</option>
          <option value="men_shoes">Men Shoes</option>
          <option value="women_shoes">Women Shoes</option>
          <option value="accessories">Accessories</option>
          <option value="merch">Merch</option>
          <option value="others">Others</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={updateMutation.isPending}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {updateMutation.isPending ? 'Updating...' : 'Update Listing'}
      </button>

      {updateMutation.isError && (
        <div className="text-red-600">
          Error: {(updateMutation.error as Error)?.message}
        </div>
      )}

      {updateMutation.isSuccess && (
        <div className="text-green-600">
          ✓ Listing updated successfully!
        </div>
      )}
    </form>
  );
}
```

## Validation Rules

### Fields Validation

| Field | Type | Rules | Example |
|-------|------|-------|---------|
| `id` | UUID | Required, must exist, seller must own | `550e8400-e29b-41d4-a716-446655440000` |
| `title` | String | Min 1 character | `"Premium T-Shirt"` |
| `priceCents` | Number | Must be non-negative integer | `9999` |
| `currency` | String | Any string | `"SOL"`, `"USD"` |
| `category` | Enum | Must be valid category | `"men_clothing"` |
| `sizes` | Array<String> | Can be empty | `["S", "M", "L"]` |
| `quantityAvailable` | Number | Non-negative integer | `50` |

### Category Options

```typescript
'men_clothing'
'women_clothing'
'men_shoes'
'women_shoes'
'accessories'
'merch'
'others'
```

### Supply Capacity Options

```typescript
'no_max'    // Unlimited stock
'limited'   // Limited stock (requires quantityAvailable)
```

### Shipping Options

```typescript
'local'          // Domestic only
'international'  // International only
'both'           // Both domestic and international
```

### ETA Options (Shipping Estimate)

```typescript
'same_day'
'next_day'
'48hrs'
'72hrs'
'5_working_days'
'1_2_weeks'
'2_3_weeks'
'custom'
```

## Error Handling

### Common Errors

```typescript
// UNAUTHORIZED - User not authenticated
{
  code: 'UNAUTHORIZED',
  message: 'User must be logged in'
}

// FORBIDDEN - User doesn't own the listing
{
  code: 'FORBIDDEN',
  message: "You don't have permission to update this listing"
}

// BAD_REQUEST - Invalid input
{
  code: 'BAD_REQUEST',
  message: 'Invalid input: priceCents must be non-negative'
}
```

## Advanced: Handling Updates with Cache

The `useUpdateListing` hook automatically invalidates the `sellersKeys.listings()` query cache, but you can access the updated data immediately:

```typescript
const { mutateAsync } = useUpdateListing();

const updatedListing = await mutateAsync({
  id: 'listing-id',
  priceCents: 19999,
});

console.log('Updated listing:', updatedListing);
```

## Backend Implementation Details

**File**: `server/routers/listing.ts:468`  
**Validation Steps**:
1. Fetch seller from authenticated user
2. Verify listing exists
3. Verify seller owns the listing (AND condition)
4. Update only provided fields
5. Handle images if provided
6. Return complete updated listing

**Security**:
- Protected procedure (authentication required)
- Seller ownership validation (FORBIDDEN if not owner)
- Input validation with Zod
- Transaction-safe database operations

## Testing

```typescript
// Test: Update price
expect(response.priceCents).toBe(19999);

// Test: Partial update doesn't overwrite other fields
expect(response.title).toBe(originalTitle);

// Test: Ownership validation
expect(() => updateOtherSellerListing()).toThrow('FORBIDDEN');

// Test: Invalid category rejected
expect(() => updateListing({ category: 'invalid' })).toThrow();
```

## Next Steps

1. **Integration**: Add to your listing management page
2. **Testing**: Test with various update scenarios
3. **UI**: Build update forms for different listing types
4. **Monitoring**: Track update success/failure rates
5. **Analytics**: Monitor which fields are updated most

## Related Procedures

- `createSingle` - Create new listing
- `createCollection` - Create collection listing
- `getMyListings` - Fetch seller's listings
- `restockListing` - Quick stock update
- `deleteListing` - Delete listing
- `addImage` - Add single image to product

---

**Last Updated**: Today  
**Status**: ✅ Production Ready