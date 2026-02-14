# Variant Data Integration Roadmap

## Current System State

The UI is ready to display variant information (color, size), but the backend isn't currently capturing or returning this data.

## Implementation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUYER CHECKOUT FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Buyer selects product variant (size, color)                │
│     └─→ Stored in cart (need to verify)                        │
│                                                                 │
│  2. Buyer proceeds to checkout                                 │
│     └─→ Cart items sent to checkout router                     │
│                                                                 │
│  3. createOrderFromCart() called                               │
│     ├─→ Currently captures: quantity, price, listing           │
│     └─→ MISSING: selected size, color from cart               │
│                                                                 │
│  4. Order created in database                                  │
│     └─→ No variant fields stored                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              SELLER VIEWS ORDER DETAILS FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Seller navigates to order details page                     │
│     └─→ [orderId]/page.tsx loads                              │
│                                                                 │
│  2. useSaleById(orderId) called                                │
│     └─→ TRPC: sales.getSaleById query executed                │
│                                                                 │
│  3. Backend fetches order from database                        │
│     ├─→ Variant fields empty (never captured)                 │
│     └─→ No joining with productVariants table                 │
│                                                                 │
│  4. UI displays order with placeholder for variants            │
│     └─→ "Variant data coming soon" message shown              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Implementation Guide

### Phase 1: Capture Variant Selection at Checkout

**File**: `server/services/escrowService.ts`
**Function**: `createOrderFromCart()`

#### Current Code (Lines ~49-120):
```typescript
export async function createOrderFromCart(
  buyerId: string,
  sellerId: string,
  cartItems_: Array<{ listingId: string; quantity: number; unitPriceCents: number; currency: string }>,
  customerName: string,
  customerEmail: string,
  paymentMethod: string,
  orderId?: string,
  shippingCents: number = 0
): Promise<{ orderId: string; totalAmountCents: number; totalCurrency: string }>
```

#### What Needs to Change:

**Option A: Update Function Signature** (Recommended if cart already has variant data)
```typescript
export async function createOrderFromCart(
  buyerId: string,
  sellerId: string,
  cartItems_: Array<{ 
    listingId: string; 
    quantity: number; 
    unitPriceCents: number; 
    currency: string;
    selectedSize?: string;      // ADD THIS
    selectedColor?: string;     // ADD THIS
    colorHex?: string;          // ADD THIS
  }>,
  // ... rest of parameters
)
```

**Option B: Extract from ProductVariants** (If cart doesn't have variant data)
```typescript
// Inside the transaction, for each cart item:
const variant = await tx
  .select()
  .from(productVariants)
  .where(eq(productVariants.id, cartItem.variantId));

selectedSize = variant[0]?.size;
selectedColor = variant[0]?.colorName;
colorHex = variant[0]?.colorHex;
```

#### Modify Order Insert:
```typescript
await tx.insert(orders).values({
  id: finalOrderId,
  buyerId,
  sellerId,
  listingId: cartItems_[0].listingId,
  productTitle: productTitle,
  productImage: productImage,
  productCategory: productCategory,
  customerName,
  customerEmail,
  orderDate: now,
  paymentMethod: paymentMethod as any,
  amountCents: totalAmountCents,
  currency,
  payoutStatus: 'in_escrow',
  deliveryStatus: 'not_shipped',
  // ADD THESE:
  selectedSize: selectedSize,      // NEW
  selectedColor: selectedColor,    // NEW
  colorHex: colorHex,              // NEW
});
```

---

### Phase 2: Update Database Schema

**File**: `server/db/schema.ts`
**Table**: `orders` (Line ~327)

#### Add New Columns:
```typescript
export const orders = pgTable('orders', {
  // ... existing columns ...
  
  // ADD THESE NEW COLUMNS:
  selectedSize: varchar('selected_size', { length: 100 }),
  selectedColor: varchar('selected_color', { length: 100 }),
  colorHex: varchar('color_hex', { length: 7 }), // e.g., "#000000"
  
  // ... rest of columns ...
});
```

#### Create Migration:
```bash
# Run drizzle-kit to generate migration
npm run db:generate

# Apply migration
npm run db:migrate
```

---

### Phase 3: Update TRPC Procedures

**File**: `server/routers/sales.ts`

#### Update `getAllSales` Output Schema (Line ~42):
```typescript
.output(
  z.array(
    z.object({
      id: z.string(),
      orderId: z.string(),
      product: z.string(),
      customer: z.string(),
      customerEmail: z.string().optional(),
      orderDate: z.date(),
      paymentMethod: z.string(),
      amountCents: z.number(),
      currency: z.string(),
      payoutStatus: z.string(),
      deliveryStatus: z.string(),
      orderStatus: z.string(),
      // ADD THESE:
      productImage: z.string().optional(),
      productCategory: z.string().optional(),
      selectedSize: z.string().optional(),
      selectedColor: z.string().optional(),
      colorHex: z.string().optional(),
    })
  )
)
```

#### Update `getSaleById` Output Schema (Line ~97):
```typescript
.output(
  z.object({
    id: z.string(),
    orderId: z.string(),
    product: z.string(),
    customer: z.string(),
    customerEmail: z.string().optional(),
    orderDate: z.date(),
    paymentMethod: z.string(),
    amountCents: z.number(),
    currency: z.string(),
    quantity: z.number().optional(),
    shippingAddress: z.string().optional(),
    payoutStatus: z.string(),
    deliveryStatus: z.string(),
    orderStatus: z.string(),
    // ADD THESE:
    productImage: z.string().optional(),
    productCategory: z.string().optional(),
    selectedSize: z.string().optional(),
    selectedColor: z.string().optional(),
    colorHex: z.string().optional(),
  })
)
```

#### Update `getAllSales` Query Implementation (Line ~89):
```typescript
return rows.map((o: any) => ({
  id: o.id,
  orderId: o.id,
  product: o.productTitle,
  customer: o.customerName,
  customerEmail: o.customerEmail,
  orderDate: o.orderDate,
  paymentMethod: o.paymentMethod,
  amountCents: o.amountCents,
  currency: o.currency,
  payoutStatus: o.payoutStatus,
  deliveryStatus: o.deliveryStatus,
  orderStatus: o.orderStatus,
  // ADD THESE:
  productImage: o.productImage,
  productCategory: o.productCategory,
  selectedSize: o.selectedSize,
  selectedColor: o.selectedColor,
  colorHex: o.colorHex,
}))
```

#### Update `getSaleById` Query Implementation (Line ~176):
```typescript
return {
  id: order.id,
  orderId: order.id,
  product: order.productTitle,
  customer: order.customerName,
  customerEmail: order.customerEmail,
  orderDate: order.orderDate,
  paymentMethod: order.paymentMethod,
  amountCents: order.amountCents,
  currency: order.currency,
  quantity: order.quantity,
  shippingAddress: order.shippingAddress,
  payoutStatus: order.payoutStatus,
  deliveryStatus: order.deliveryStatus,
  orderStatus: order.orderStatus,
  // ADD THESE:
  productImage: order.productImage,
  productCategory: order.productCategory,
  selectedSize: order.selectedSize,
  selectedColor: order.selectedColor,
  colorHex: order.colorHex,
};
```

---

### Phase 4: Testing

#### Unit Test for Variant Capture:
```typescript
// Test that variant data is captured during order creation
const result = await createOrderFromCart(
  buyerId,
  sellerId,
  [{
    listingId: 'test-listing',
    quantity: 2,
    unitPriceCents: 50000,
    currency: 'NGN',
    selectedSize: 'M',          // Test data
    selectedColor: 'Black',     // Test data
    colorHex: '#000000'         // Test data
  }],
  'Test Buyer',
  'buyer@test.com',
  'card'
);

// Verify order was created with variant data
const order = await db.select().from(orders).where(eq(orders.id, result.orderId));
expect(order[0].selectedSize).toBe('M');
expect(order[0].selectedColor).toBe('Black');
expect(order[0].colorHex).toBe('#000000');
```

#### Integration Test:
```typescript
// Test the TRPC query returns variant data
const order = await client.sales.getSaleById.query({ orderId: 'test-order-id' });

expect(order.selectedSize).toBeDefined();
expect(order.selectedColor).toBeDefined();
expect(order.colorHex).toBeDefined();
```

---

## Checklist

- [ ] **Phase 1**: Update `createOrderFromCart()` to capture variant selection
- [ ] **Phase 2**: Add columns to orders table schema
- [ ] **Phase 2**: Generate and apply database migration
- [ ] **Phase 3**: Update TRPC output schemas
- [ ] **Phase 3**: Update TRPC query implementations
- [ ] **Phase 4**: Run unit tests for variant capture
- [ ] **Phase 4**: Run integration tests for full flow
- [ ] **Phase 4**: Manual testing in development environment
- [ ] **Phase 4**: Verify seller order details page shows variant data
- [ ] Deploy to staging for QA testing
- [ ] Deploy to production

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Breaking existing orders | Low | High | Add nullable columns, migrate existing orders |
| Data migration issues | Medium | High | Test migration script thoroughly |
| Performance impact | Low | Medium | Add indexes on variant columns |
| UI not updating | Low | Low | Verify cache invalidation in React Query |

---

## Timeline Estimate

- **Phase 1**: 1-2 hours
- **Phase 2**: 30 minutes (migration included)
- **Phase 3**: 1-2 hours
- **Phase 4**: 2-3 hours
- **Total**: 5-8 hours of development

---

## Related Files for Reference

- `app/sellers/orders/[orderId]/page.tsx` - UI that displays variant data
- `modules/sellers/model/sales.ts` - Sale interface with variant fields
- `server/db/schema.ts` - Database schema for orders table
- `server/routers/sales.ts` - TRPC procedures for order queries
- `server/services/escrowService.ts` - Order creation service