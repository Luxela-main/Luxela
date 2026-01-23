import { pgTable, serial, text, varchar, timestamp, boolean, pgEnum, uuid, integer, numeric, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// =======================
// ENUMS
// =======================
export const rolesEnum = pgEnum('roles', ['buyer', 'seller', 'admin']);
export const businessTypeEnum = pgEnum('business_type', ['individual', 'sole_proprietorship', 'llc', 'corporation', 'partnership', 'cooperative', 'non_profit', 'trust', 'joint_venture']);
export const idTypeEnum = pgEnum('id_type', ['national_id', 'passport', 'drivers_license', 'voters_card', 'business_license', 'tax_id', 'business_registration']);
export const shippingTypeEnum = pgEnum('shipping_type', ['same_day', 'next_day', 'express', 'standard', 'domestic', 'international', 'both']);
export const shippingEtaEnum = pgEnum('shipping_eta', ['same_day', 'next_day', '48hrs', '72hrs', '5_working_days', '1_2_weeks', '2_3_weeks', 'custom']);
export const refundPolicyEnum = pgEnum('refund_policy', ['no_refunds', '48hrs', '72hrs', '5_working_days', '1week', '14days', '30days', '60days', 'store_credit']);
export const preferredPayoutMethodEnum = pgEnum('preferred_payout_method', ['fiat_currency', 'cryptocurrency', 'both']);
export const fiatPayoutMethodEnum = pgEnum('fiat_payout_method', ['bank', 'paypal', 'stripe', 'flutterwave', 'tsara', 'mobile_money', 'other']);
export const walletTypeEnum = pgEnum('wallet_type', ['phantom', 'solflare', 'backpack', 'wallet_connect', 'magic_eden', 'ledger_live']);
export const payoutTokenEnum = pgEnum('payout_token', ['USDT', 'USDC', 'solana']);
export const productCategoryEnum = pgEnum('product_category', [
  'men_clothing', 'women_clothing', 'men_shoes', 'women_shoes', 'accessories', 'merch', 'others',
]);
export const targetAudienceEnum = pgEnum('target_audience', ['male', 'female', 'unisex']);
export const localPricingEnum = pgEnum('local_pricing', ['fiat', 'cryptocurrency','both']);
export const socialMediaPlatformEnum = pgEnum('social_media_platform', ['x', 'instagram', 'facebook', 'whatsapp', 'tiktok']);
export const listingTypeEnum = pgEnum('listing_type', ['single', 'collection']);
export const supplyCapacityEnum = pgEnum('supply_capacity', ['no_max', 'limited']);
export const limitedEditionBadgeEnum = pgEnum('limited_badge', ['show_badge', 'do_not_show']);
export const shippingOptionEnum = pgEnum('shipping_option', ['local', 'international', 'both']);
export const orderStatusEnum = pgEnum('order_status', ['processing', 'shipped', 'delivered', 'canceled', 'returned']);
export const payoutStatusEnum = pgEnum('payout_status', ['in_escrow', 'processing', 'paid']);
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'resolved', 'closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'urgent']);
export const ticketCategoryEnum = pgEnum('ticket_category', ['general_inquiry', 'technical_issue', 'payment_problem', 'order_issue', 'refund_request', 'account_issue', 'listing_help', 'other']);

export const deliveryStatusEnum = pgEnum('delivery_status', ['not_shipped', 'in_transit', 'delivered']);
export const paymentMethodEnum = pgEnum('payment_method', ['card', 'bank_transfer','crypto','paypal','stripe','flutterwave','tsara']);
export const notificationTypeEnum = pgEnum('notification_type', ['purchase','review','comment','reminder','order_confirmed','payment_failed','refund_issued','delivery_confirmed']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending','processing','completed','failed','refunded']);
export const WebhookEventStatusEnum = pgEnum('webhook_event_status', ['pending', 'processed', 'failed']);
export const paymentProviderEnum = pgEnum('payment_provider', ['tsara','flutterwave','stripe','paypal']);
export const refundStatusEnum = pgEnum('refund_status', ['pending', 'return_requested', 'return_approved', 'return_rejected', 'refunded', 'canceled']);
export const ledgerStatusEnum = pgEnum('ledger_status', ['pending', 'completed', 'failed', 'reversed']);
export const transactionTypeEnum = pgEnum('transaction_type', ['sale', 'refund', 'return_request', 'return_approved', 'refund_initiated', 'refund_completed', 'commission', 'payout']);
export const reservationStatusEnum = pgEnum('reservation_status', ['active', 'confirmed', 'released', 'expired']);
export const transitionTypeEnum = pgEnum('transition_type', ['automatic', 'manual', 'system']);
export const refundTypeEnum = pgEnum('refund_type', ['full', 'partial', 'store_credit']);
export const holdStatusEnum = pgEnum('hold_status', ['active', 'released', 'refunded', 'expired']);
export const receivedConditionEnum = pgEnum('received_condition', ['excellent', 'good', 'acceptable', 'poor']);
export const nftTierEnum = pgEnum('nft_tier', ['bronze', 'silver', 'gold', 'platinum']);

// =======================
// DOMAIN TABLES
// =======================

// --- Buyers ---
export const buyers = pgTable('buyers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  // FK to Supabase Auth user
  userId: uuid('user_id').notNull().unique(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Sellers ---
export const sellers = pgTable('sellers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  brandId: uuid('brand_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Profiles (optional extension of auth.users) ---
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  displayName: varchar('display_name', { length: 255 }),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ========================
// BUYER DETAILS & SHIPPING
// ========================
export const buyerAccountDetails = pgTable('buyer_account_details', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().unique().references(() => buyers.id, { onDelete: 'cascade' }),
  username: varchar('username', { length: 100 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  dateOfBirth: timestamp('date_of_birth'),
  phoneNumber: varchar('phone_number', { length: 50 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  country: varchar('country', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  profilePicture: text('profile_picture'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const buyerBillingAddress = pgTable('buyer_billing_address', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  houseAddress: text('house_address').notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  postalCode: varchar('postal_code', { length: 32 }).notNull(),
  isDefault: boolean('is_default').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const buyerShipping = pgTable('buyer_shipping', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  address: text('address').notNull(),
  postalCode: varchar('postal_code', { length: 32 }).notNull(),
  isDefault: boolean('is_default').default(true).notNull(),
});

// =======================
// SELLERS
// =======================
export const sellerBusiness = pgTable('seller_business', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  brandName: varchar('brand_name', { length: 255 }).notNull(),
  businessType: businessTypeEnum('business_type').notNull(),
  businessAddress: text('business_address').notNull(),
  officialEmail: varchar('official_email', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  countryCode: varchar('country_code', { length: 10 }),
  country: varchar('country', { length: 100 }).notNull(),
  socialMediaPlatform: socialMediaPlatformEnum('social_media_platform'),
  socialMedia: text('social_media'),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  idType: idTypeEnum('id_type').notNull(),
  idNumber: varchar('id_number', { length: 50 }),
  idVerified: boolean('id_verified').default(false).notNull(),
  bio: text('bio'),
  storeDescription: text('store_description'),
  storeLogo: text('store_logo'),
  storeBanner: text('store_banner'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sellerShipping = pgTable('seller_shipping', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  shippingZone: varchar('shipping_zone', { length: 255 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  shippingAddress: text('shipping_address').notNull(),
  returnAddress: text('return_address').notNull(),
  shippingType: shippingTypeEnum('shipping_type').notNull(),
  estimatedShippingTime: shippingEtaEnum('estimated_shipping_time').notNull(),
  refundPolicy: refundPolicyEnum('refund_policy').notNull(),
  refundPeriod: shippingEtaEnum('refund_period'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =================================
// BRANDS
// =================================
export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  heroImage: text('hero_image'),
  logoImage: text('logo_image'),
  rating: numeric('rating', { precision: 2, scale: 1 }).default('0'),
  totalProducts: integer('total_products').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// COLLECTIONS
// =======================
export const collections = pgTable(
  'collections',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    brandId: uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    uniqueBrandSlug: unique().on(t.brandId, t.slug),
  })
);

// =======================
// COLLECTION ITEMS (Products in Collections)
// =======================
export const collectionItems = pgTable('collection_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// PRODUCTS
// =======================
export const products = pgTable('products', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  brandId: uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  category: productCategoryEnum('category'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 16 }).default('SOL').notNull(),
  type: varchar("type", { length: 50 }),
  sku: text('sku').notNull().unique(),
  inStock: boolean('in_stock').default(true),
  shipsIn: varchar('ships_in', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// LISTINGS
// =======================
export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'set null' }),
  // References products.id (auto-generated unique UUID)
  productId: uuid("product_id").references(() => products.id, { onDelete: 'cascade' }),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  type: listingTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: productCategoryEnum('category'),
  image: text('image'),
  priceCents: integer('price_cents'),
  currency: varchar('currency', { length: 16 }),
  sizesJson: text('sizes_json'),
  supplyCapacity: supplyCapacityEnum('supply_capacity'),
  quantityAvailable: integer('quantity_available'),
  limitedEditionBadge: limitedEditionBadgeEnum('limited_edition_badge'),
  releaseDuration: varchar('release_duration', { length: 255 }),
  materialComposition: text('material_composition'),
  colorsAvailable: text('colors_available'),
  additionalTargetAudience: targetAudienceEnum('additional_target_audience'),
  shippingOption: shippingOptionEnum('shipping_option'),
  etaDomestic: shippingEtaEnum('eta_domestic'),
  etaInternational: shippingEtaEnum('eta_international'),
  refundPolicy: refundPolicyEnum('refund_policy'),
  localPricing: localPricingEnum('local_pricing'), 
  itemsJson: text('items_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// ORDERS
// =======================
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  productTitle: varchar('product_title', { length: 255 }).notNull(),
  productImage: text('product_image'),
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
  shippingAddress: text('shipping_address'),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  estimatedArrival: timestamp('estimated_arrival'),
  deliveredDate: timestamp('delivered_date'),
  recipientEmail: varchar('recipient_email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// PAYMENTS
// =======================
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 16 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  provider: paymentProviderEnum('provider').notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  transactionRef: varchar('transaction_ref', { length: 255 }).notNull().unique(),
  gatewayResponse: text('gateway_response'),
  isRefunded: boolean('is_refunded').default(false).notNull(),
  refundedAt: timestamp('refunded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// REFUNDS
// =======================
export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'set null' }),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 16 }).notNull(),
  refundType: varchar('refund_type', { length: 32 }).notNull(),
  reason: text('reason').notNull(),
  refundStatus: refundStatusEnum('refund_status').default('pending').notNull(),
  description: text('description'),
  rmaNumber: varchar('rma_number', { length: 255 }),
  images: text('images'),
  sellerNote: text('seller_note'),
  restockPercentage: integer('restock_percentage'),
  receivedCondition: receivedConditionEnum('received_condition'),
  notes: text('notes'),
  requestedAt: timestamp('requested_at'),
  processedAt: timestamp('processed_at'),
  refundedAt: timestamp('refunded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// PAYMENT HOLDS
// =======================
export const paymentHolds = pgTable('payment_holds', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 16 }).notNull(),
  holdStatus: holdStatusEnum('hold_status').default('active').notNull(),
  reason: varchar('reason', { length: 255 }),
  heldAt: timestamp('held_at').defaultNow().notNull(),
  releaseableAt: timestamp('releaseable_at'),
  refundedAt: timestamp('refunded_at'),
  releasedAt: timestamp('released_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// FINANCIAL LEDGER
// =======================
export const financialLedger = pgTable('financial_ledger', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'set null' }),
  transactionType: transactionTypeEnum('transaction_type').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 16 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// WEBHOOK EVENTS
// =======================
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: text("event_id").notNull(),  
  eventType: text("event_type").notNull(), 
  status: WebhookEventStatusEnum("status").notNull().default("pending"), 
  receivedAt: timestamp("received_at").defaultNow().notNull(), 
  processedAt: timestamp("processed_at"),            
});

// =======================
// WEBHOOK LOGS - Multi-provider webhook tracking for monitoring & retries
// =======================
export const webhookLogs = pgTable("webhook_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: paymentProviderEnum("provider").notNull(), // tsara, stripe, paypal, flutterwave
  eventType: text("event_type").notNull(), // payment.success, payment.failed, etc.
  externalEventId: text("external_event_id"), // Event ID from payment provider
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: 'set null' }),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: 'set null' }),
  status: WebhookEventStatusEnum("status").notNull().default("pending"), // pending, processed, failed
  errorMessage: text("error_message"), // Error details if failed
  retryCount: integer("retry_count").notNull().default(0),
  lastRetryAt: timestamp("last_retry_at"),
  nextRetryAt: timestamp("next_retry_at"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =======================
// SALES
// =======================
export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  totalCents: integer('total_cents').notNull(),
  currency: varchar('currency', { length: 16 }).notNull(),
  isRefunded: boolean('is_refunded').default(false).notNull(),
  refundedAt: timestamp('refunded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// CARTS & CART ITEMS
// =======================
export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  discountId: uuid('discount_id').references(() => discounts.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  currency: varchar('currency', { length: 16 }).notNull(),
});

// ============================
// INVENTORY & PRODUCT VARIANTS
// ============================
export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  // References products.id (auto-generated unique UUID)
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  size: text('size').notNull(),
  colorName: text('color_name').notNull(),
  colorHex: text('color_hex').notNull(),
});

export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id),
  quantity: integer('quantity').notNull().default(0),
  reservedQuantity: integer('reserved_quantity').notNull().default(0),
});

// ==================================
// NOTIFICATIONS, REVIEWS, EMAIL OTPS
// ==================================
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id').references(() => buyers.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  isStarred: boolean('is_starred').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviews = pgTable('review', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// USERS
// =======================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  oauthId: varchar('oauth_id', { length: 255 }),
  name: varchar('name', { length: 255 }),
  displayName: varchar('display_name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  role: rolesEnum('role').default('buyer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// BUYER FAVORITES
// =======================
export const buyerFavorites = pgTable('buyer_favorites', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// SELLER PAYMENT
// =======================
export const sellerPayment = pgTable('seller_payment', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  preferredPayoutMethod: preferredPayoutMethodEnum('preferred_payout_method').notNull(),
  fiatPayoutMethod: fiatPayoutMethodEnum('fiat_payout_method'),
  bankCountry: varchar('bank_country', { length: 100 }),
  bankName: varchar('bank_name', { length: 255 }),
  accountName: varchar('account_name', { length: 255 }),
  accountHolderName: varchar('account_holder_name', { length: 255 }),
  accountNumber: varchar('account_number', { length: 255 }),
  walletType: walletTypeEnum('wallet_type'),
  walletAddress: varchar('wallet_address', { length: 255 }),
  preferredPayoutToken: payoutTokenEnum('preferred_payout_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// SELLER ADDITIONAL
// =======================
export const sellerAdditional = pgTable('seller_additional', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  productCategory: productCategoryEnum('product_category'),
  targetAudience: targetAudienceEnum('target_audience'),
  localPricing: localPricingEnum('local_pricing'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// INVENTORY RESERVATIONS
// =======================
export const inventoryReservations = pgTable('inventory_reservations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  inventoryId: uuid('inventory_id').notNull().references(() => inventory.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('reserved'),
  reservedAt: timestamp('reserved_at').defaultNow().notNull(),
  releasedAt: timestamp('released_at'),
  confirmedAt: timestamp('confirmed_at'),
  expiresAt: timestamp('expires_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// ORDER STATE TRANSITIONS
// =======================
export const orderStateTransitions = pgTable('order_state_transitions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  fromStatus: orderStatusEnum('from_status').notNull(),
  toStatus: orderStatusEnum('to_status').notNull(),
  reason: text('reason'),
  triggeredBy: uuid('triggered_by').notNull(),
  triggeredByRole: rolesEnum('triggered_by_role').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// CATEGORIES & SUBCATEGORIES
// =======================
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull().unique(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subcategories = pgTable('subcategories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// FOLLOWS
// =======================
export const follows = pgTable('follows', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  followerId: uuid('follower_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// MESSAGES & CONVERSATIONS
// =======================
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull(),
  senderRole: rolesEnum('sender_role').notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// SHIPPING RATES
// =======================
export const shippingRates = pgTable('shipping_rates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  shippingZone: varchar('shipping_zone', { length: 255 }).notNull(),
  minWeight: numeric('min_weight', { precision: 10, scale: 2 }).notNull(),
  maxWeight: numeric('max_weight', { precision: 10, scale: 2 }).notNull(),
  rateCents: integer('rate_cents').notNull(),
  currency: varchar('currency', { length: 16 }).notNull(),
  estimatedDays: integer('estimated_days').notNull(),
  shippingType: shippingTypeEnum('shipping_type').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// DISCOUNTS
// =======================
export const discounts = pgTable('discounts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 50 }).notNull().unique(),
  percentOff: integer('percent_off'),
  amountOffCents: integer('amount_off_cents'),
  active: boolean('active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// SUPPORT TICKETS
// =======================
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').references(() => sellers.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: ticketCategoryEnum('category').notNull(),
  priority: ticketPriorityEnum('priority').default('medium').notNull(),
  status: ticketStatusEnum('status').default('open').notNull(),
  assignedTo: uuid('assigned_to').references(() => sellers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

export const supportTicketReplies = pgTable('support_ticket_replies', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull(),
  senderRole: rolesEnum('sender_role').notNull(),
  message: text('message').notNull(),
  attachmentUrl: text('attachment_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// LOYALTY NFTs
// =======================
export const loyaltyNFTs = pgTable('loyalty_nfts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  tier: nftTierEnum('tier').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  image: text('image').notNull(),
  loyaltyPoints: integer('loyalty_points').notNull(),
  earnedDate: timestamp('earned_date').defaultNow().notNull(),
  rarity: varchar('rarity', { length: 50 }).notNull(),
  property: varchar('property', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// PRODUCT IMAGES
// =======================
export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  position: integer('position').notNull(),
});

// =======================
// RELATIONS
// =======================

// Users → Buyers & Sellers
export const usersRelations = relations(users, ({ many }) => ({
  buyers: many(buyers),
  sellers: many(sellers),
}));

export const buyersRelations = relations(buyers, ({ one, many }) => ({
  user: one(users),
  account: one(buyerAccountDetails),
  shipping: many(buyerShipping),
  favorites: many(buyerFavorites),
  carts: many(carts),
  orders: many(orders),
  payments: many(payments),
  sales: many(sales),
  reviews: many(reviews),
  loyaltyNFTs: many(loyaltyNFTs),
}));

export const sellersRelations = relations(sellers, ({ one, many }) => ({
  user: one(users),
  business: one(sellerBusiness),
  shipping: one(sellerShipping),
  payment: one(sellerPayment),
  additional: one(sellerAdditional),
  listings: many(listings),
  orders: many(orders),
  payments: many(payments),
  notifications: many(notifications),
  sales: many(sales),
  brands: many(brands),
  shippingRates: many(shippingRates),
}));

// Brands → Collections & Products
export const brandsRelations = relations(brands, ({ one, many }) => ({
  seller: one(sellers),
  collections: many(collections),
  products: many(products),
}));

// Collections → Products & Items
export const collectionsRelations = relations(collections, ({ one, many }) => ({
  brand: one(brands),
  products: many(products),
  items: many(collectionItems),
}));

// Products → Collections, Variants, Listings, Images
export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands),
  collection: one(collections),
  images: many(productImages),
  variants: many(productVariants),
  listings: many(listings),
  inventory: many(inventory),
  collectionItems: many(collectionItems),
}));

// Product Variants → Inventory
export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products),
  inventory: many(inventory),
}));

// Inventory → Variants & Reservations
export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  variant: one(productVariants),
  product: one(products),
  reservations: many(inventoryReservations),
}));

// Listings → Seller & Product
export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(sellers),
  product: one(products),
  cartItems: many(cartItems),
  orders: many(orders),
  payments: many(payments),
  sales: many(sales),
  reviews: many(reviews),
  favorites: many(buyerFavorites),
}));

// Orders → Buyer, Seller, Listing
export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(buyers),
  seller: one(sellers),
  listing: one(listings),
  payments: many(payments),
  sales: many(sales),
  reservations: many(inventoryReservations),
  stateTransitions: many(orderStateTransitions),
}));

// Payments → Buyer, Listing, Order
export const paymentsRelations = relations(payments, ({ one, many }) => ({
  buyer: one(buyers),
  listing: one(listings),
  order: one(orders),
  refunds: many(refunds),
  holds: many(paymentHolds),
}));

// Refunds → Buyer, Seller, Order, Payment
export const refundsRelations = relations(refunds, ({ one }) => ({
  buyer: one(buyers),
  seller: one(sellers),
  order: one(orders),
  payment: one(payments),
}));

// Payment Holds → Order, Payment
export const paymentHoldsRelations = relations(paymentHolds, ({ one }) => ({
  order: one(orders),
  payment: one(payments),
}));

// Financial Ledger → Seller, Order, Payment
export const financialLedgerRelations = relations(financialLedger, ({ one }) => ({
  seller: one(sellers),
  order: one(orders),
  payment: one(payments),
}));

// Webhook Events → none
export const webhookEventsRelations = relations(webhookEvents, ({}) => ({}));

// Webhook Logs → Payments & Orders
export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  payment: one(payments, {
    fields: [webhookLogs.paymentId],
    references: [payments.id],
  }),
  order: one(orders, {
    fields: [webhookLogs.orderId],
    references: [orders.id],
  }),
}));

// Sales → Buyer, Seller, Listing, Order
export const salesRelations = relations(sales, ({ one }) => ({
  buyer: one(buyers),
  seller: one(sellers),
  listing: one(listings),
  order: one(orders),
  payment: one(payments),
}));

// Carts → Buyer & Items
export const cartRelations = relations(carts, ({ one, many }) => ({
  buyer: one(buyers, { fields: [carts.buyerId], references: [buyers.id] }),
  discount: one(discounts, { fields: [carts.discountId], references: [discounts.id] }),
  items: many(cartItems),
}));

// Cart Items → Cart & Listing
export const cartItemRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts),
  listing: one(listings),
}));

// Reviews → Buyer & Listing
export const reviewsRelations = relations(reviews, ({ one }) => ({
  buyer: one(buyers),
  listing: one(listings),
}));

// Notifications → Seller
export const notificationsRelations = relations(notifications, ({ one }) => ({
  seller: one(sellers),
}));

// Buyer Account Details → Buyer
export const buyerAccountDetailsRelations = relations(buyerAccountDetails, ({ one }) => ({
  buyer: one(buyers),
}));

// Loyalty NFTs → Buyer
export const loyaltyNFTsRelations = relations(loyaltyNFTs, ({ one }) => ({
  buyer: one(buyers),
}));

// Buyer Shipping → Buyer
export const buyerShippingRelations = relations(buyerShipping, ({ one }) => ({
  buyer: one(buyers),
}));

// Buyer Favorites → Buyer & Listing
export const buyerFavoritesRelations = relations(buyerFavorites, ({ one }) => ({
  buyer: one(buyers),
  listing: one(listings),
}));

// Seller Payment → Seller
export const sellerPaymentRelations = relations(sellerPayment, ({ one }) => ({
  seller: one(sellers),
}));

// Seller Additional → Seller
export const sellerAdditionalRelations = relations(sellerAdditional, ({ one }) => ({
  seller: one(sellers),
}));

// Discounts → none (referenced by carts)
export const discountsRelations = relations(discounts, ({}) => ({}));

// Product Images → Product
export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products),
}));

// Collection Items → Collection & Product
export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(collections),
  product: one(products),
}));

// Support Tickets → Buyer, Seller, Order
export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  buyer: one(buyers),
  seller: one(sellers),
  order: one(orders),
  assignedToSeller: one(sellers, {
    fields: [supportTickets.assignedTo],
    references: [sellers.id],
    relationName: 'assignedTickets',
  }),
  replies: many(supportTicketReplies),
}));

// Support Ticket Replies → Ticket
export const supportTicketRepliesRelations = relations(supportTicketReplies, ({ one }) => ({
  ticket: one(supportTickets),
}));

// Inventory Reservations → Inventory & Order
export const inventoryReservationsRelations = relations(inventoryReservations, ({ one }) => ({
  inventory: one(inventory),
  order: one(orders),
}));

// Order State Transitions → Order
export const orderStateTransitionsRelations = relations(orderStateTransitions, ({ one }) => ({
  order: one(orders),
}));

// Shipping Rates → Seller
export const shippingRatesRelations = relations(shippingRates, ({ one }) => ({
  seller: one(sellers),
}));

// Categories → Subcategories
export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
}));

// Subcategories → Category
export const subcategoriesRelations = relations(subcategories, ({ one }) => ({
  category: one(categories),
}));

// Follows → Sellers
export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(sellers, {
    fields: [follows.followerId],
    references: [sellers.id],
    relationName: 'followers',
  }),
  following: one(sellers, {
    fields: [follows.followingId],
    references: [sellers.id],
    relationName: 'following',
  }),
}));

// Conversations → Buyer & Seller
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  buyer: one(buyers),
  seller: one(sellers),
  messages: many(messages),
}));

// Messages → Conversation
export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations),
}));