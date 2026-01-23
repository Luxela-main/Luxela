# Update Listing - Quick Reference

## One-Page API Reference

### Import
```typescript
import { useUpdateListing } from '@/modules/sellers';
```

### Basic Usage
```typescript
const mutation = useUpdateListing();

mutation.mutate({
  id: 'listing-uuid',
  // Only include fields you want to update
  priceCents: 9999,
  description: 'New description'
});
```

### All Updatable Fields

| Category | Field | Type | Required | Example |
|----------|-------|------|----------|---------|
| **Core** | `id` | UUID | ✓ | `550e8400-e29b-41d4...` |
| | `title` | string | - | `"Premium T-Shirt"` |
| | `description` | string\|null | - | `"High quality cotton"` |
| | `category` | enum | - | `"men_clothing"` |
| **Pricing** | `priceCents` | number | - | `9999` |
| | `currency` | string | - | `"SOL"` |
| **Images** | `image` | string\|null | - | `"https://..."` |
| | `images` | string[] | - | `["url1", "url2"]` |
| **Stock** | `quantityAvailable` | number | - | `50` |
| | `supplyCapacity` | enum | - | `"limited"` |
| **Product** | `sizes` | string[] | - | `["S","M","L"]` |
| | `materialComposition` | string | - | `"100% cotton"` |
| | `colorsAvailable` | string[] | - | `["Black","White"]` |
| **Edition** | `limitedEditionBadge` | enum | - | `"show_badge"` |
| | `releaseDuration` | enum | - | `"24hrs"` |
| **Shipping** | `shippingOption` | enum | - | `"both"` |
| | `etaDomestic` | enum | - | `"2_3_working_days"` |
| | `etaInternational` | enum | - | `"1_2_weeks"` |
| **Audience** | `additionalTargetAudience` | enum | - | `"male"` |

### Enum Values

**Categories**: `men_clothing`, `women_clothing`, `men_shoes`, `women_shoes`, `accessories`, `merch`, `others`

**Supply**: `no_max`, `limited`

**Badge**: `show_badge`, `do_not_show`

**Duration**: `24hrs`, `48hrs`, `72hrs`, `1week`, `2weeks`, `1month`

**Shipping**: `local`, `international`, `both`

**ETA**: `same_day`, `next_day`, `48hrs`, `72hrs`, `5_working_days`, `1_2_weeks`, `2_3_weeks`, `custom`

**Audience**: `male`, `female`, `unisex`, `kids`, `teens`

### Response Object
```typescript
{
  id: UUID
  sellerId: UUID
  type: 'single' | 'collection'
  title: string
  description: string | null
  category: string | null
  image: string | null
  priceCents: number | null
  currency: string | null
  sizesJson: string[] | null
  supplyCapacity: string | null
  quantityAvailable: number | null
  limitedEditionBadge: string | null
  releaseDuration: string | null
  materialComposition: string | null
  colorsAvailable: string[] | null
  additionalTargetAudience: string | null
  shippingOption: string | null
  etaDomestic: string | null
  etaInternational: string | null
  itemsJson: any[] | null
  productId: UUID | null
  createdAt: Date
  updatedAt: Date  // ← Will be current time
}
```

### Common Examples

#### Update Price
```typescript
mutation.mutate({
  id: listingId,
  priceCents: 15999  // $159.99
});
```

#### Update Description
```typescript
mutation.mutate({
  id: listingId,
  description: 'Premium quality product description'
});
```

#### Update Stock
```typescript
mutation.mutate({
  id: listingId,
  supplyCapacity: 'limited',
  quantityAvailable: 50
});
```

#### Multiple Updates
```typescript
mutation.mutate({
  id: listingId,
  priceCents: 9999,
  description: 'Updated',
  category: 'women_clothing',
  supplyCapacity: 'limited',
  quantityAvailable: 100,
  sizes: ['XS', 'S', 'M', 'L', 'XL']
});
```

#### Add Images
```typescript
mutation.mutate({
  id: listingId,
  images: [
    'https://cdn.example.com/1.jpg',
    'https://cdn.example.com/2.jpg'
  ]
});
```

### Loading States
```typescript
mutation.isPending    // true while updating
mutation.isSuccess    // true after success
mutation.isError      // true on error
mutation.data         // Updated listing
mutation.error        // Error details
```

### Error Codes
- **UNAUTHORIZED** - User not authenticated
- **FORBIDDEN** - User doesn't own listing
- **BAD_REQUEST** - Invalid input
- **NOT_FOUND** - Listing doesn't exist

### Validation Rules
- `id`: Must be valid UUID and belong to seller
- `title`: Min 1 character
- `priceCents`: Must be non-negative integer
- `category`: Must be one of 7 valid categories
- `sizes`/`colors`: Arrays can be empty
- `quantityAvailable`: Must be non-negative

### Return Values

**Success Response**:
```typescript
{
  id: '...',
  title: 'Updated Title',
  priceCents: 9999,
  // ... all fields including unchanged ones
}
```

**Error Response**:
```typescript
{
  code: 'FORBIDDEN',
  message: "You don't have permission to update this listing"
}
```

### In React Component
```typescript
'use client';
import { useUpdateListing } from '@/modules/sellers';

export function UpdateForm() {
  const mutation = useUpdateListing();

  const handleUpdate = () => {
    mutation.mutate({
      id: 'listing-id',
      priceCents: 9999
    });
  };

  return (
    <div>
      <button 
        onClick={handleUpdate}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Updating...' : 'Update'}
      </button>
      {mutation.isSuccess && <p>✓ Updated!</p>}
      {mutation.isError && <p>✗ Error</p>}
    </div>
  );
}
```

### Implementation Details

**File**: `server/routers/listing.ts:468`  
**Hook**: `modules/sellers/queries/useMyListings.ts:41`  
**Endpoint**: `PUT /listing/update`  
**Auth**: Required (protectedProcedure)  

### Cache Behavior
- Automatically invalidates `sellersKeys.listings()` cache
- Fetches latest listings after update
- Updates available immediately in `mutation.data`

### Performance
- Uses partial updates (only changed fields)
- Efficient database queries with Drizzle ORM
- React Query handles caching
- Toast notifications for feedback

---

**Status**: ✅ Production Ready  
**Last Updated**: Today