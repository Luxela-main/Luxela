import { pgTable, text, varchar, timestamp, boolean, pgEnum, uuid, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const rolesEnum = pgEnum('roles', ['buyer', 'seller', 'ADMIN']);

export const businessTypeEnum = pgEnum('business_type', ['individual', 'business']);
export const idTypeEnum = pgEnum('id_type', ['passport', 'drivers_license', 'voters_card', 'national_id']);
export const shippingTypeEnum = pgEnum('shipping_type', ['domestic']);
export const shippingEtaEnum = pgEnum('shipping_eta', ['48hrs', '72hrs', '5_working_days', '1week']);
export const refundPolicyEnum = pgEnum('refund_policy', ['no_refunds', 'accept_refunds']);

export const preferredPayoutMethodEnum = pgEnum('preferred_payout_method', ['fiat_currency', 'cryptocurrency', 'both']);
export const fiatPayoutMethodEnum = pgEnum('fiat_payout_method', ['bank', 'paypal', 'stripe', 'flutterwave']);
export const walletTypeEnum = pgEnum('wallet_type', ['phantom', 'solflare', 'backpack', 'wallet_connect']);
export const payoutTokenEnum = pgEnum('payout_token', ['USDT', 'USDC', 'solana']);

export const productCategoryEnum = pgEnum('product_category', [
  'men_clothing',
  'women_clothing',
  'men_shoes',
  'women_shoes',
  'accessories',
  'merch',
  'others',
]);
export const targetAudienceEnum = pgEnum('target_audience', ['male', 'female', 'unisex']);
export const localPricingEnum = pgEnum('local_pricing', ['fiat', 'cryptocurrency']);

export const listingTypeEnum = pgEnum('listing_type', ['single', 'collection']);
export const supplyCapacityEnum = pgEnum('supply_capacity', ['no_max', 'limited']);
export const limitedEditionBadgeEnum = pgEnum('limited_badge', ['show_badge', 'do_not_show']);
export const shippingOptionEnum = pgEnum('shipping_option', ['local', 'international', 'both']);

export const orderStatusEnum = pgEnum('order_status', ['processing', 'shipped', 'delivered', 'canceled', 'returned']);
export const payoutStatusEnum = pgEnum('payout_status', ['in_escrow', 'processing', 'paid']);
export const deliveryStatusEnum = pgEnum('delivery_status', ['not_shipped', 'in_transit', 'delivered']);
export const paymentMethodEnum = pgEnum('payment_method', ['card', 'bank_transfer','crypto' ]);
export const notificationTypeEnum = pgEnum('notification_type', ['purchase','review','comment','reminder',]);
export const paymentStatusEnum = pgEnum('payment_status', ['pending','processing','successful', 'failed','refunded',]);
export const paymentProviderEnum = pgEnum('payment_provider', ['tsara','flutterwave','stripe','paypal']);


export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  oauthId: varchar('oauth_id', { length: 255 }),
  name: varchar('name', { length: 255 }),
  displayName: varchar('display_name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: rolesEnum('role').default('buyer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const buyers = pgTable('buyers', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const buyerShipping = pgTable('buyer_shipping', {
  id: uuid('id').primaryKey(),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  address: text('address').notNull(),
  postalCode: varchar('postal_code', { length: 32 }).notNull(),
  isDefault: boolean('is_default').default(true).notNull(),
});

export const discounts = pgTable('discounts', {
  id: uuid('id').primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  percentOff: integer('percent_off'),
  amountOffCents: integer('amount_off_cents'),
  active: boolean('active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),
});

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey(),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id),
  discountId: uuid('discount_id').references(() => discounts.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id),
  listingId: uuid('listing_id').notNull().references(() => listings.id),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  currency: varchar('currency', { length: 16 }).notNull(),
});

export const sellers = pgTable('sellers', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sellerBusiness = pgTable('seller_business', {
  id: uuid('id').primaryKey(),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id),
  brandName: varchar('brand_name', { length: 255 }).notNull(),
  businessType: businessTypeEnum('business_type').notNull(),
  businessAddress: text('business_address').notNull(),
  officialEmail: varchar('official_email', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  socialMedia: text('social_media'),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  idType: idTypeEnum('id_type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sellerShipping = pgTable('seller_shipping', {
  id: uuid('id').primaryKey(),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id),
  shippingZone: varchar('shipping_zone', { length: 255 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  shippingAddress: text('shipping_address').notNull(),
  returnAddress: text('return_address').notNull(),
  shippingType: shippingTypeEnum('shipping_type').notNull(),
  estimatedShippingTime: shippingEtaEnum('estimated_shipping_time').notNull(),
  refundPolicy: refundPolicyEnum('refund_policy').notNull(),
  refundPeriod: shippingEtaEnum('refund_period').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sellerPayment = pgTable('seller_payment', {
  id: uuid('id').primaryKey(),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id),
  preferredPayoutMethod: preferredPayoutMethodEnum('preferred_payout_method').notNull(),
  // Fiat payment fields
  fiatPayoutMethod: fiatPayoutMethodEnum('fiat_payout_method'),
  bankCountry: varchar('bank_country', { length: 100 }),
  accountHolderName: varchar('account_holder_name', { length: 255 }),
  accountNumber: varchar('account_number', { length: 50 }),
  // Crypto payment fields
  walletType: walletTypeEnum('wallet_type'),
  walletAddress: varchar('wallet_address', { length: 255 }),
  preferredPayoutToken: payoutTokenEnum('preferred_payout_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sellerAdditional = pgTable('seller_additional', {
  id: uuid('id').primaryKey(),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id),
  productCategory: productCategoryEnum('product_category').notNull(),
  targetAudience: targetAudienceEnum('target_audience').notNull(),
  localPricing: localPricingEnum('local_pricing').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sellersRelations = relations(sellers, ({ one }) => ({
  business: one(sellerBusiness, { fields: [sellers.id], references: [sellerBusiness.sellerId] }),
  shipping: one(sellerShipping, { fields: [sellers.id], references: [sellerShipping.sellerId] }),
  payment: one(sellerPayment, { fields: [sellers.id], references: [sellerPayment.sellerId] }),
  additional: one(sellerAdditional, { fields: [sellers.id], references: [sellerAdditional.sellerId] }),
}));


export const listings = pgTable('listings', {
  id: uuid('id').primaryKey(),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id),
  type: listingTypeEnum('type').notNull(),
  // Personal information (required)
  title: varchar('title', { length: 255 }).notNull(), 
  description: text('description'), 
  category: productCategoryEnum('category'),
  image: text('image'),
  priceCents: integer('price_cents'),
  currency: varchar('currency', { length: 16 }),
  sizesJson: text('sizes_json'), // JSON array of sizes
  supplyCapacity: supplyCapacityEnum('supply_capacity'),
  quantityAvailable: integer('quantity_available'),
  limitedEditionBadge: limitedEditionBadgeEnum('limited_edition_badge'),
  releaseDuration: varchar('release_duration', { length: 64 }),
  // Additional information (optional)
  materialComposition: text('material_composition'),
  colorsAvailable: text('colors_available'), // e.g., JSON or CSV
  additionalTargetAudience: targetAudienceEnum('additional_target_audience'),
  shippingOption: shippingOptionEnum('shipping_option'),
  etaDomestic: shippingEtaEnum('eta_domestic'),
  etaInternational: shippingEtaEnum('eta_international'),
  // For collections only
  itemsJson: text('items_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// export const orders = pgTable('orders', {
//   id: uuid('id').primaryKey(), // orderId
//   sellerId: uuid('seller_id').notNull().references(() => sellers.id),
//   listingId: uuid('listing_id').notNull().references(() => listings.id),
//   productTitle: varchar('product_title', { length: 255 }).notNull(),
//   productCategory: productCategoryEnum('product_category').notNull(),
//   customerName: varchar('customer_name', { length: 255 }).notNull(),
//   customerEmail: varchar('customer_email', { length: 255 }).notNull(),
//   orderDate: timestamp('order_date').defaultNow().notNull(),
//   paymentMethod: paymentMethodEnum('payment_method').notNull(),
//   amountCents: integer('amount_cents').notNull(),
//   currency: varchar('currency', { length: 16 }).notNull(),
//   payoutStatus: payoutStatusEnum('payout_status').default('in_escrow').notNull(),
//   deliveryStatus: deliveryStatusEnum('delivery_status').default('not_shipped').notNull(),
//   orderStatus: orderStatusEnum('order_status').default('processing').notNull(),
// });

export const emailOtps = pgTable('email_otps', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  codeHash: varchar('code_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  consumed: boolean('consumed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey(),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id),
  type: notificationTypeEnum('type').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  isStarred: boolean('is_starred').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
 
export const reviews = pgTable ('review', {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1–5 scale
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),

});


export const reviewRelations = relations(reviews, ({ one }) => ({
  listing: one(listings, {
    fields: [reviews.listingId],
    references: [listings.id],
  }),
  buyer: one(users, {
    fields: [reviews.buyerId],
    references: [users.id],
  }),
}));

export const payments =  pgTable ('payments',{
  id: uuid('id').primaryKey().defaultRandom(),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 16 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(), 
  provider: paymentProviderEnum('provider').notNull(), 
  status: paymentStatusEnum('status').default('pending').notNull(),
  transactionRef: varchar('transaction_ref', { length: 255 }).notNull().unique(),
  gatewayResponse: text('gateway_response'), //  JSON response
  isRefunded: boolean('is_refunded').default(false).notNull(),
  refundedAt: timestamp('refunded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Add these to your existing schema.ts file

export const buyerAccountDetails = pgTable('buyer_account_details', {
  id: uuid('id').primaryKey(),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id),
  username: varchar('username', { length: 100 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  dateOfBirth: timestamp('date_of_birth'), // optional
  phoneNumber: varchar('phone_number', { length: 50 }), // optional
  email: varchar('email', { length: 255 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  profilePicture: text('profile_picture'), // URL to uploaded image
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const buyerBillingAddress = pgTable('buyer_billing_address', {
  id: uuid('id').primaryKey(),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id),
  houseAddress: text('house_address').notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  postalCode: varchar('postal_code', { length: 32 }).notNull(),
  isDefault: boolean('is_default').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const buyerFavorites = pgTable('buyer_favorites', {
  id: uuid('id').primaryKey(),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id),
  listingId: uuid('listing_id').notNull().references(() => listings.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Update the orders table to include tracking info
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey(),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id),
  listingId: uuid('listing_id').notNull().references(() => listings.id),
  productTitle: varchar('product_title', { length: 255 }).notNull(),
  productImage: text('product_image'), // Add this for history
  productCategory: productCategoryEnum('product_category').notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  orderDate: timestamp('order_date').defaultNow().notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 16 }).notNull(),
  payoutStatus: payoutStatusEnum('payout_status').default('in_escrow').notNull(),
  deliveryStatus: deliveryStatusEnum('delivery_status').default('not_shipped').notNull(),
  orderStatus: orderStatusEnum('order_status').default('processing').notNull(),
  // Shipping tracking info
  shippingAddress: text('shipping_address'),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  estimatedArrival: timestamp('estimated_arrival'),
  deliveredDate: timestamp('delivered_date'),
  recipientEmail: varchar('recipient_email', { length: 255 }),
});

// Add relations
export const buyerAccountDetailsRelations = relations(buyerAccountDetails, ({ one }) => ({
  buyer: one(buyers, { fields: [buyerAccountDetails.buyerId], references: [buyers.id] }),
}));

export const buyerBillingAddressRelations = relations(buyerBillingAddress, ({ one }) => ({
  buyer: one(buyers, { fields: [buyerBillingAddress.buyerId], references: [buyers.id] }),
}));

export const buyerFavoritesRelations = relations(buyerFavorites, ({ one }) => ({
  buyer: one(buyers, { fields: [buyerFavorites.buyerId], references: [buyers.id] }),
  listing: one(listings, { fields: [buyerFavorites.listingId], references: [listings.id] }),
}));
