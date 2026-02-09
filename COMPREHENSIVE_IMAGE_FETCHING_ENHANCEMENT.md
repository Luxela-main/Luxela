Comprehensive Image Fetching Enhancement
==========================================

## Overview

Enhanced the buyer product catalog endpoints to match the comprehensive image fetching approach already used in the admin listing review system. All approved listings (single and collection) now fetch complete image data from the productImages table.

## Problem

The `getApprovedListings` endpoint in `server/routers/listing.ts` was only returning the raw `imagesJson` field from the listings table, without fetching the actual image URLs from the `productImages` table where they are properly stored and managed.

This meant:
- Images were incomplete or missing for listings
- Inconsistency between admin view and buyer view
- Buyers couldn't see all product images
- Collection items didn't have their individual product images fetched

## Solution

Updated `getApprovedListings` endpoint to follow the same pattern as the admin system:

### Image Fetching Strategy

1. **Bulk Fetch All Images**: Fetch all `productImages` records for all products in a single query (optimized)
2. **Index by Product ID**: Create a map of `productId -> imageUrls[]` for O(1) lookups
3. **Fallback to imagesJson**: If no images in `productImages` table, parse and use `imagesJson` field
4. **Collection Support**: For collection listings, fetch images for all items in the collection

### Implementation Details

**File Modified**: `server/routers/listing.ts`

**Changes to getApprovedListings endpoint**:

```typescript
// Before: Returns raw imagesJson
imagesJson: l.imagesJson || null

// After: Fetches from productImages table
if (l.productId && imagesByProductId[l.productId]) {
  imagesJson = JSON.stringify(imagesByProductId[l.productId]);
} else if (l.productId && !imagesByProductId[l.productId] && l.imagesJson) {
  // Fallback to parsing imagesJson if no product images
  imagesJson = JSON.stringify(parsed);
}
```

### Bulk Image Query

```typescript
// Get all product IDs for bulk image fetching
const productIds = approvedListings
  .filter(l => l.productId)
  .map(l => l.productId) as string[];

// Fetch all images in one query instead of per-listing
if (productIds.length > 0) {
  allProductImages = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(productImages.position);
}

// Build map for O(1) lookup
const imagesByProductId: Record<string, string[]> = {};
allProductImages.forEach(img => {
  if (!imagesByProductId[img.productId]) {
    imagesByProductId[img.productId] = [];
  }
  imagesByProductId[img.productId].push(img.imageUrl);
});
```

### Collection Items Support

For collection listings, also fetch images for all items in the collection:

```typescript
// For collection listings, fetch all collection items and their images
const collectionListingIds = approvedListings
  .filter(l => l.type === 'collection')
  .map(l => l.id);

if (collectionListingIds.length > 0) {
  // Get all collection items
  collectionItemsData = await db
    .select()
    .from(collectionItems)
    .where(inArray(collectionItems.collectionId, collectionIds));
  
  // Fetch images for all items in collections
  const collectionProductIds = collectionItemsData.map(ci => ci.productId);
  if (collectionProductIds.length > 0) {
    collectionProductImages = await db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, collectionProductIds))
      .orderBy(productImages.position);
  }
}
```

## Image Data Sources (Priority Order)

1. **productImages Table** (Primary - Most Complete)
   - Individually curated images per product
   - Properly ordered via `position` field
   - Most reliable source

2. **imagesJson Field** (Secondary Fallback)
   - Raw JSON string in listings table
   - Used if no images in productImages table
   - Parsed and returned

3. **image Field** (Tertiary Fallback)
   - Single primary image
   - Used only if no other sources available

## Affected Endpoints

### Already Complete (No Changes Needed)

1. **Admin System** (`server/routers/admin-listing-review.ts`)
   - `getPendingListings` - Already fetches complete images
   - `getListingDetails` - Already fetches complete images with collection details
   - Already has full product and collection item image fetching

2. **Buyer Catalog** (`server/routers/buyer-listings-catalog.ts`)
   - `getListingById` - Already fetches all images from productImages
   - `getApprovedListingsCatalog` - Already fetches all images from productImages
   - `getApprovedCollectionById` - Already fetches all images for collection items

### Updated

1. **Seller Listings** (`server/routers/listing.ts`)
   - `getApprovedListings` - NOW fetches all images from productImages with collection support

## Performance Optimization

**Bulk Query Approach**:
- Before: N+1 queries (one per listing to fetch product images)
- After: 1 query for all images across all listings

**Memory Efficient**:
- Single pass through all image records
- Build index map for O(1) lookup
- No duplicated queries or data

## Database Schema Reference

```sql
productImages:
  - productId: UUID (FK to products)
  - imageUrl: String
  - position: Integer (for ordering)

listings:
  - id: UUID
  - productId: UUID (FK to products) - For single listings
  - collectionId: UUID (FK to collections) - For collection listings
  - image: String (primary image URL)
  - imagesJson: String (legacy/fallback JSON array)
  - type: 'single' or 'collection'
  - status: 'approved', 'pending', etc.

collections:
  - id: UUID
  - name: String
  - description: String

collectionItems:
  - collectionId: UUID (FK to collections)
  - productId: UUID (FK to products)
  - position: Integer
```

## Testing Recommendations

1. **Single Listings**: Verify all product images are returned
2. **Collection Listings**: Verify all item images are returned
3. **Fallback**: Test listings without productImages but with imagesJson
4. **Performance**: Monitor query execution time with large datasets
5. **Image Order**: Verify images are returned in correct position order

## Migration Notes

No database migrations required. This is a pure API enhancement that:
- Reads from existing tables
- Doesn't modify any data
- Is fully backward compatible
- Improves data completeness

## Related Files

- `server/routers/listing.ts` - Updated
- `server/routers/buyer-listings-catalog.ts` - Reference implementation (no changes)
- `server/routers/admin-listing-review.ts` - Reference implementation (no changes)
- `server/db/schema.ts` - Schema definitions (no changes)