# Collection Items Details Fetcher

This directory contains scripts to fetch and display all collection product details from your database.

## Files

### 1. `fetch-collection-details.ts`
**TypeScript script** - Programmatic approach to fetch collection data with complete details.

**Features:**
- ✅ Fetches all collections and their products
- ✅ Includes complete listing details (prices, images, materials, sizes, colors, etc.)
- ✅ Fetches real customer reviews with reviewer names
- ✅ Groups items by collection
- ✅ Calculates review statistics (count, average rating)
- ✅ Formats output with nice console formatting
- ✅ Returns structured JavaScript object for further processing

**How to run:**
```bash
# Make sure you're in the project root
cd server

# Run the script with ts-node
pnpm exec ts-node scripts/fetch-collection-details.ts

# Or compile and run
pnpm exec tsc scripts/fetch-collection-details.ts
node scripts/fetch-collection-details.js
```

**Output Example:**
```
📦 COLLECTION ITEMS DETAILS

📚 Collection: Summer 2024
   ID: uuid-here
   Slug: summer-2024
   Description: Best summer collection
   Items: 5

   1. Blue T-Shirt
      ID: listing-uuid
      Price: NGN 15,000
      Stock: 10 units
      Category: men_clothing
      Material: 100% Cotton
      Colors: Blue, White, Black
      Sizes: S, M, L, XL
      Seller: John's Store (john@store.com)
      Reviews: 12 (4.8 avg)
      Video: ✅
      Care Instructions: ✅
      Status: approved
      Shipping: both (Domestic: 3-5 business days, Intl: 1-2 weeks)
      Refund Policy: 14days
      Recent Reviews:
        - Sarah: 5/5 - "Perfect fit!"
        - Mike: 4/5 - "Good quality"
        - Lisa: 5/5 - "Great colors"
```

### 2. `fetch-collection-items-all-details.sql`
**SQL script** - Direct database queries to fetch collection data.

**Contains multiple useful queries:**
- **Main Query**: Fetch all collection products with complete details in a single query
- **Count Query**: Get summary statistics per collection
- **Export Query**: Generate JSON export of all collections

**How to run:**
```bash
# Using psql
psql -U your_user -d your_database -f server/scripts/fetch-collection-items-all-details.sql

# Or copy paste individual queries into your database client (pgAdmin, DBeaver, etc.)
```

**Key Fields Retrieved:**

| Field | Description |
|-------|-------------|
| Collection Info | ID, name, slug, description |
| Product Info | ID, title |
| Listing Details | Title, description, category, images |
| Pricing | Price (in cents), currency |
| Inventory | Quantity available |
| Product Details | Material, colors, sizes, weight |
| Shipping | Options, domestic ETA, international ETA |
| Returns | Refund policy |
| Identifiers | SKU, barcode |
| Media | Video URL, care instructions, meta description |
| Reviews | Count, average rating, individual reviews with reviewer details |
| Seller Info | ID, name, email |

## What Data is Available

### Per Collection Product

#### Basic Info
- Listing ID, title, description
- Product ID, name
- Seller name and email

#### Pricing & Inventory
- Price (in cents and formatted)
- Currency
- Stock available
- Status (draft, pending_review, approved, etc.)

#### Product Details
- Category (men_clothing, women_clothing, etc.)
- Material composition
- Available colors
- Available sizes
- Care instructions

#### Media
- Primary image
- Additional images (JSON array)
- Product video URL

#### Shipping & Returns
- Shipping option (local, international, both)
- Domestic shipping ETA (same_day, next_day, 48hrs, etc.)
- International shipping ETA
- Refund policy (5_working_days, 14days, 30days, etc.)

#### SEO & Organization
- SKU
- Barcode
- Meta description
- Product slug

#### Reviews
- Total review count
- Average rating (0-5)
- Individual reviews with:
  - Rating (1-5)
  - Comment/text
  - Reviewer name
  - Reviewer email
  - Review creation date

## Examples

### Find products without videos
```typescript
// In the TypeScript output, look for:
// Video: ❌
```

### Find products with low stock
```typescript
// Look for: Stock: < 5 units
```

### Find products without reviews
```typescript
// Look for: Reviews: 0
```

### Find collections with most items
```sql
-- From the SQL Count Query:
SELECT 
  c.name,
  COUNT(ci.id) AS total_items
FROM collections c
LEFT JOIN collection_items ci ON c.id = ci.collection_id
GROUP BY c.name
ORDER BY total_items DESC;
```

## Integration with Your App

### 1. For Admin Dashboard
Use the TypeScript script to create an admin endpoint:

```typescript
// In your API router
app.get('/admin/collections/all-details', async (req, res) => {
  const details = await fetchAllCollectionDetails();
  res.json(details);
});
```

### 2. For Data Export
Use the SQL JSON export query to export collections to JSON:

```typescript
const jsonExport = await db.query(/* JSON export query */);
fs.writeFileSync('collections-export.json', JSON.stringify(jsonExport, null, 2));
```

### 3. For Reporting
Use the count query to generate statistics:

```typescript
const stats = await db.query(/* Count query */);
console.log(`Total Collections: ${stats.length}`);
stats.forEach(row => {
  console.log(`${row.name}: ${row.total_items} items`);
});
```

## Troubleshooting

**Script won't run?**
- Ensure database connection is configured in `db/index.ts`
- Check that all imports are correct
- Verify database credentials

**Missing data?**
- Verify sellers have set all product details
- Check that products are linked to collections
- Ensure reviews have been submitted

**Performance issues?**
- Use WHERE clause in SQL to filter specific collections
- Add pagination for large datasets
- Create database indexes on foreign keys

## Notes

- All prices are stored in cents (divide by 100 for display)
- Images are stored as JSON arrays - parse accordingly
- Review ratings are integers 1-5
- Dates are ISO 8601 timestamps