import { pgTable, serial, text, varchar, timestamp, boolean, pgEnum, uuid, integer, numeric, unique, jsonb, index } from 'drizzle-orm/pg-core';
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
export const fiatPayoutMethodEnum = pgEnum('fiat_payout_method', ['bank', 'paypal', 'stripe', 'flutterwave', 'tsara', 'mobile_money', 'wise', 'other']);
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
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'returned']);
export const payoutStatusEnum = pgEnum('payout_status', ['in_escrow', 'processing', 'paid', 'refunded']);
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'resolved', 'closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'urgent']);
export const ticketCategoryEnum = pgEnum('ticket_category', ['general_inquiry', 'technical_issue', 'payment_problem', 'order_issue', 'refund_request', 'account_issue', 'listing_help', 'other']);

export const deliveryStatusEnum = pgEnum('delivery_status', ['not_shipped', 'in_transit', 'delivered']);
export const paymentMethodEnum = pgEnum('payment_method', ['card', 'bank_transfer','crypto','paypal','stripe','flutterwave','tsara']);
export const notificationTypeEnum = pgEnum('notification_type', ['purchase','review','comment','reminder','order_confirmed','payment_failed','refund_issued','delivery_confirmed','listing_approved','listing_rejected','listing_revision_requested','dispute_opened','dispute_resolved','return_initiated','return_completed','payment_processed']);
export const notificationCategoryEnum = pgEnum('notification_category', ['order_confirmed','order_processing','shipment_ready','in_transit','out_for_delivery','delivered','delivery_failed','return_request','refund_processed','review_request','product_back_in_stock','price_drop','dispute','payment_failed','system_alert','urgent_ticket','sla_breach','escalation','team_capacity','new_reply','listing_approved','listing_rejected','listing_revision_requested','order_update','order_pending','shipment_due','dispute_open','new_review','low_inventory','order_canceled','payment_success','refund_initiated','return_initiated','return_completed','dispute_resolved','listing_update']);
export const notificationSeverityEnum = pgEnum('notification_severity', ['info','warning','critical']);
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
export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed_amount', 'buy_one_get_one', 'free_shipping']);
export const discountStatusEnum = pgEnum('discount_status', ['active', 'inactive', 'expired']);
export const paymentFrequencyEnum = pgEnum('payment_frequency', ['weekly', 'bi_weekly', 'monthly', 'quarterly']);
export const payoutScheduleEnum = pgEnum('payout_schedule', ['immediate', 'daily', 'weekly', 'bi_weekly', 'monthly']);
export const disputeStatusEnum = pgEnum('dispute_status', ['open', 'under_review', 'resolved', 'closed']);
export const disputeResolutionEnum = pgEnum('dispute_resolution', ['refund_issued', 'case_closed', 'buyer_compensated', 'seller_warning']);
export const inventoryAdjustmentReasonEnum = pgEnum('inventory_adjustment_reason', ['stock_take', 'damaged_goods', 'lost_items', 'theft', 'supplier_return', 'other']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'reversed']);
export const auditActionEnum = pgEnum('audit_action', ['create', 'update', 'delete', 'login', 'logout', 'password_change', 'role_change']);
export const auditEntityEnum = pgEnum('audit_entity', ['user', 'order', 'payment', 'refund', 'listing', 'brand', 'buyer', 'seller']);
export const auditOutcomeEnum = pgEnum('audit_outcome', ['success', 'failure']);
export const paymentChannelEnum = pgEnum('payment_channel', ['web', 'mobile', 'api', 'pos']);
export const settlementStatusEnum = pgEnum('settlement_status', ['pending', 'completed', 'failed', 'in_review']);
export const rolesInOrgEnum = pgEnum('roles_in_org', ['member', 'manager', 'admin', 'owner']);
export const slaPriorityEnum = pgEnum('sla_priority', ['low', 'medium', 'high', 'critical']);
export const escalationStatusEnum = pgEnum('escalation_status', ['pending', 'triggered', 'resolved', 'cancelled']);
export const listingStatusEnum = pgEnum('listing_status', ['draft', 'pending_review', 'approved', 'rejected', 'archived']);
export const listingReviewStatusEnum = pgEnum('listing_review_status', ['pending', 'approved', 'rejected', 'revision_requested']);

// =======================
// DOMAIN TABLES
// =======================

// --- Buyers ---
export const buyers = pgTable('buyers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  // FK to Supabase Auth user
  userId: uuid('user_id').notNull().unique(),
  // Payment provider customer IDs
  tsaraCustomerId: varchar('tsara_customer_id', { length: 255 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Sellers ---
export const sellers = pgTable('sellers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  brandId: uuid('brand_id'),
  profilePhoto: text('profile_photo'),
  payoutMethods: text('payout_methods'),
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
  orderUpdates: boolean('order_updates').default(true).notNull(),
  promotionalEmails: boolean('promotional_emails').default(true).notNull(),
  securityAlerts: boolean('security_alerts').default(true).notNull(),
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
  verificationStatus: varchar('verification_status', { length: 50 }).default('pending').notNull(),
  firstName: varchar('verified_first_name', { length: 255 }),
  lastName: varchar('verified_last_name', { length: 255 }),
  dateOfBirth: varchar('verified_date_of_birth', { length: 20 }),
  verificationCountry: varchar('verification_country', { length: 100 }),
  verificationDate: timestamp('verification_date'),
  dojahResponse: jsonb('dojah_response'),
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
export const brands = pgTable(
  'brands',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    heroImage: text('hero_image'),
    logoImage: text('logo_image'),
    rating: numeric('rating', { precision: 2, scale: 1 }).default(sql`0`),
    totalProducts: integer('total_products').default(sql`0`),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    uniqueSellerSlug: unique().on(t.sellerId, t.slug),
  })
);

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
  priceCents: integer('price_cents').notNull(),
  currency: varchar('currency', { length: 16 }).default('SOL').notNull(),
  type: varchar("type", { length: 50 }),
  sku: text('sku').notNull().unique(),
  inStock: boolean('in_stock').default(true),
  shipsIn: varchar('ships_in', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
},
(t) => ({
  uniqueBrandSlug: unique().on(t.brandId, t.slug),
})
);

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
  imagesJson: text('images_json'),
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
  sku: text('sku'),
  slug: text('slug'),
  metaDescription: text('meta_description'),
  barcode: text('barcode'),
  videoUrl: text('video_url'),
  careInstructions: text('care_instructions'),
  itemsJson: text('items_json'),
  status: listingStatusEnum('status').default('pending_review').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
},
(t) => ({
  sellerIdIdx: index('idx_listings_seller_id').on(t.sellerId),
})
);

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
  // Product variant details - stored at order time for consistency
  selectedSize: text('selected_size'),
  selectedColor: text('selected_color'),
  selectedColorHex: text('selected_color_hex'),
  // Cart quantity
  quantity: integer('quantity').default(1).notNull(),
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
// DISPUTES
// =======================
export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  evidence: text('evidence'),
  status: disputeStatusEnum('status').default('open').notNull(),
  resolution: disputeResolutionEnum('resolution'),
  resolutionNote: text('resolution_note'),
  amountInDispute: integer('amount_in_dispute'),
  currency: varchar('currency', { length: 16 }),
  openedAt: timestamp('opened_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
// SCHEDULED PAYOUTS
// =======================
export const scheduledPayouts = pgTable('scheduled_payouts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 16 }).notNull().default('NGN'),
  payoutMethodId: varchar('payout_method_id', { length: 255 }).notNull(),
  schedule: payoutScheduleEnum('schedule').notNull(),
  scheduledDate: timestamp('scheduled_date'),
  frequency: varchar('frequency', { length: 50 }),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  lastProcessedAt: timestamp('last_processed_at'),
  nextScheduledAt: timestamp('next_scheduled_at'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
  // Product variant selections made at time of cart addition
  selectedSize: text('selected_size'),
  selectedColor: text('selected_color'),
  selectedColorHex: text('selected_color_hex'),
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

// Buyer notifications - persistent storage for real-time updates
export const buyerNotifications = pgTable('buyer_notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  type: notificationCategoryEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  isStarred: boolean('is_starred').default(false).notNull(),
  relatedEntityId: uuid('related_entity_id'),
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  actionUrl: text('action_url'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('buyer_notifications_buyer_id_idx').on(t.buyerId),
  index('buyer_notifications_is_read_idx').on(t.isRead),
  index('buyer_notifications_created_at_idx').on(t.createdAt),
]);

// Admin notifications - persistent storage for real-time updates
export const adminNotifications = pgTable('admin_notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  adminId: uuid('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationCategoryEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: notificationSeverityEnum('severity').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  isStarred: boolean('is_starred').default(false).notNull(),
  relatedEntityId: uuid('related_entity_id'),
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  actionUrl: text('action_url'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('admin_notifications_admin_id_idx').on(t.adminId),
  index('admin_notifications_is_read_idx').on(t.isRead),
  index('admin_notifications_created_at_idx').on(t.createdAt),
]);

// Seller notifications - persistent storage for real-time updates
export const sellerNotifications = pgTable('seller_notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  type: notificationCategoryEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: notificationSeverityEnum('severity').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  isStarred: boolean('is_starred').default(false).notNull(),
  relatedEntityId: uuid('related_entity_id'),
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  actionUrl: text('action_url'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('seller_notifications_seller_id_idx').on(t.sellerId),
  index('seller_notifications_is_read_idx').on(t.isRead),
  index('seller_notifications_created_at_idx').on(t.createdAt),
]);

// Admin settings - persistent storage for admin configuration
export const adminSettings = pgTable('admin_settings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  settingKey: varchar('setting_key', { length: 255 }).notNull().unique(),
  settingValue: jsonb('setting_value').notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  updatedBy: uuid('updated_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('admin_settings_category_idx').on(t.category),
  index('admin_settings_setting_key_idx').on(t.settingKey),
]);

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
// BUYER BRAND FOLLOWS
// =======================
export const buyerBrandFollows = pgTable(
  'buyer_brand_follows',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
    followedAt: timestamp('followed_at').defaultNow().notNull(),
  },
  (t) => ({
    uniqueFollows: unique('buyer_brand_follows_unique').on(t.buyerId, t.brandId),
    buyerIdIdx: index('idx_buyer_brand_follows_buyer_id').on(t.buyerId),
    brandIdIdx: index('idx_buyer_brand_follows_brand_id').on(t.brandId),
  })
);

// =======================
// SELLER PAYMENT CONFIG
// =======================
export const sellerPaymentConfig = pgTable('seller_payment_config', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().unique().references(() => sellers.id, { onDelete: 'cascade' }),
  preferredPayoutMethod: preferredPayoutMethodEnum('preferred_payout_method').notNull(),
  payoutSchedule: payoutScheduleEnum('payout_schedule').default('weekly').notNull(),
  minimumPayoutThreshold: numeric('minimum_payout_threshold', { precision: 15, scale: 2 }).default('0').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// SELLER PAYOUT METHODS (Fiat & Digital)
// =======================
export const sellerPayoutMethods = pgTable('seller_payout_methods', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  methodType: fiatPayoutMethodEnum('method_type').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  verificationToken: varchar('verification_token', { length: 255 }),
  
  // Bank Transfer Details
  bankCountry: varchar('bank_country', { length: 100 }),
  bankName: varchar('bank_name', { length: 255 }),
  bankCode: varchar('bank_code', { length: 100 }),
  accountHolderName: varchar('account_holder_name', { length: 255 }),
  accountNumber: varchar('account_number', { length: 255 }),
  accountType: varchar('account_type', { length: 50 }),
  swiftCode: varchar('swift_code', { length: 50 }),
  iban: varchar('iban', { length: 50 }),
  
  // Digital Payment Service Details
  email: varchar('email', { length: 255 }),
  accountId: varchar('account_id', { length: 255 }),
  
  // Mobile Money Details
  phoneNumber: varchar('phone_number', { length: 50 }),
  mobileMoneyProvider: varchar('mobile_money_provider', { length: 100 }),
  
  // Metadata
  metadata: jsonb('metadata'),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// SELLER CRYPTO PAYOUT METHODS
// =======================
export const sellerCryptoPayoutMethods = pgTable('seller_crypto_payout_methods', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  walletType: walletTypeEnum('wallet_type').notNull(),
  blockchainNetwork: varchar('blockchain_network', { length: 100 }).notNull(),
  walletAddress: varchar('wallet_address', { length: 255 }).notNull(),
  payoutToken: payoutTokenEnum('payout_token').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  verificationSignature: text('verification_signature'),
  lastUsedAt: timestamp('last_used_at'),
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
  buyerId: uuid('buyer_id').references(() => buyers.id, { onDelete: 'cascade' }),
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
// FAQs - DYNAMIC CONTENT
// =======================
export const faqs = pgTable('faqs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  question: varchar('question', { length: 500 }).notNull(),
  answer: text('answer').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  userRole: rolesEnum('user_role').default('buyer').notNull(),
  order: integer('order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  views: integer('views').default(0).notNull(),
  helpful: integer('helpful').default(0).notNull(),
  notHelpful: integer('not_helpful').default(0).notNull(),
  tags: text('tags'),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =======================
// ENTERPRISE SUPPORT
// =======================
export const supportTeamMembers = pgTable('support_team_members', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 100 }).notNull(),
  department: varchar('department', { length: 100 }),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  maxCapacity: integer('max_capacity').default(10).notNull(),
  currentLoadCount: integer('current_load_count').default(0).notNull(),
  responseTimeAverage: integer('response_time_average'),
  resolutionRate: numeric('resolution_rate', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const slaMetrics = pgTable('sla_metrics', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  policyName: varchar('policy_name', { length: 255 }).notNull(),
  priority: slaPriorityEnum('priority').notNull(),
  responseTimeMinutes: integer('response_time_minutes').notNull(),
  resolutionTimeMinutes: integer('resolution_time_minutes').notNull(),
  workingHoursOnly: boolean('working_hours_only').default(false).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const slaTracking = pgTable('sla_tracking', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  slaMetricId: uuid('sla_metric_id').notNull().references(() => slaMetrics.id, { onDelete: 'cascade' }),
  responseDeadline: timestamp('response_deadline').notNull(),
  resolutionDeadline: timestamp('resolution_deadline').notNull(),
  responseBreached: boolean('response_breached').default(false).notNull(),
  resolutionBreached: boolean('resolution_breached').default(false).notNull(),
  breachNotificationSentAt: timestamp('breach_notification_sent_at'),
  actualResponseTime: integer('actual_response_time'),
  actualResolutionTime: integer('actual_resolution_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const escalationRules = pgTable('escalation_rules', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  trigger: varchar('trigger', { length: 100 }).notNull(),
  triggerValue: varchar('trigger_value', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const supportAuditLogs = pgTable('support_audit_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ticketId: uuid('ticket_id').references(() => supportTickets.id, { onDelete: 'cascade' }),
  actionType: varchar('action_type', { length: 100 }).notNull(),
  performedBy: uuid('performed_by').notNull(),
  performedByRole: varchar('performed_by_role', { length: 50 }).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const supportAnalytics = pgTable('support_analytics', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp('date').notNull(),
  totalTicketsCreated: integer('total_tickets_created').default(0),
  totalTicketsResolved: integer('total_tickets_resolved').default(0),
  totalTicketsOpen: integer('total_tickets_open').default(0),
  averageResponseTime: integer('average_response_time'),
  averageResolutionTime: integer('average_resolution_time'),
  slaBreachCount: integer('sla_breach_count').default(0),
  customerSatisfactionScore: numeric('customer_satisfaction_score', { precision: 3, scale: 2 }),
  agentUtilization: numeric('agent_utilization', { precision: 5, scale: 2 }),
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
// LISTING REVIEWS
// =======================
export const listingReviews = pgTable('listing_reviews', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  status: listingReviewStatusEnum('status').notNull(),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  rejectionReason: text('rejection_reason'),
  revisionRequests: jsonb('revision_requests'),
  comments: text('comments'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const listingActivityLog = pgTable('listing_activity_log', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  actionType: varchar('action_type', { length: 50 }).notNull(),
  details: jsonb('details'),
  performedBy: uuid('performed_by'),
  performedByRole: rolesEnum('performed_by_role'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =======================
// RELATIONS
// =======================

// Users ? Buyers & Sellers
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
  disputes: many(disputes),
  loyaltyNFTs: many(loyaltyNFTs),
}));

export const sellersRelations = relations(sellers, ({ one, many }) => ({
  user: one(users),
  business: one(sellerBusiness),
  shipping: one(sellerShipping),
  paymentConfig: one(sellerPaymentConfig),
  payoutMethods: many(sellerPayoutMethods),
  cryptoPayoutMethods: many(sellerCryptoPayoutMethods),
  additional: one(sellerAdditional),
  listings: many(listings),
  orders: many(orders),
  payments: many(payments),
  notifications: many(notifications),
  sales: many(sales),
  disputes: many(disputes),
  brands: many(brands),
  shippingRates: many(shippingRates),
  scheduledPayouts: many(scheduledPayouts),
  listingReviews: many(listingReviews),
  listingActivityLog: many(listingActivityLog),
}));


// Brands ? Collections & Products
export const brandsRelations = relations(brands, ({ one, many }) => ({
  seller: one(sellers),
  collections: many(collections),
  products: many(products),
}));

// Collections ? Products & Items
export const collectionsRelations = relations(collections, ({ one, many }) => ({
  brand: one(brands),
  products: many(products),
  items: many(collectionItems),
}));

// Products ? Collections, Variants, Listings, Images
export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands),
  collection: one(collections),
  images: many(productImages),
  variants: many(productVariants),
  listings: many(listings),
  inventory: many(inventory),
  collectionItems: many(collectionItems),
}));

// Product Variants ? Inventory
export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products),
  inventory: many(inventory),
}));

// Inventory ? Variants & Reservations
export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  variant: one(productVariants),
  product: one(products),
  reservations: many(inventoryReservations),
}));

// Listings ? Seller, Product, Collection, Reviews, Activity
export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(sellers),
  product: one(products),
  collection: one(collections),
  cartItems: many(cartItems),
  orders: many(orders),
  payments: many(payments),
  sales: many(sales),
  reviews: many(reviews),
  favorites: many(buyerFavorites),
  listingReviews: many(listingReviews),
  activityLog: many(listingActivityLog),
}));

// Orders ? Buyer, Seller, Listing
export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(buyers),
  seller: one(sellers),
  listing: one(listings),
  payments: many(payments),
  sales: many(sales),
  reservations: many(inventoryReservations),
  stateTransitions: many(orderStateTransitions),
  disputes: many(disputes),
}));

// Payments ? Buyer, Listing, Order
export const paymentsRelations = relations(payments, ({ one, many }) => ({
  buyer: one(buyers),
  listing: one(listings),
  order: one(orders),
  refunds: many(refunds),
  holds: many(paymentHolds),
}));

// Refunds ? Buyer, Seller, Order, Payment
export const refundsRelations = relations(refunds, ({ one }) => ({
  buyer: one(buyers),
  seller: one(sellers),
  order: one(orders),
  payment: one(payments),
}));

// Disputes ? Buyer, Seller, Order
export const disputesRelations = relations(disputes, ({ one }) => ({
  buyer: one(buyers),
  seller: one(sellers),
  order: one(orders),
}));

// Payment Holds ? Order, Payment
export const paymentHoldsRelations = relations(paymentHolds, ({ one }) => ({
  order: one(orders),
  payment: one(payments),
}));

// Financial Ledger ? Seller, Order, Payment
export const financialLedgerRelations = relations(financialLedger, ({ one }) => ({
  seller: one(sellers),
  order: one(orders),
  payment: one(payments),
}));

// Webhook Events ? none
export const webhookEventsRelations = relations(webhookEvents, ({}) => ({}));

// Webhook Logs ? Payments & Orders
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

// Sales ? Buyer, Seller, Listing, Order
export const salesRelations = relations(sales, ({ one }) => ({
  buyer: one(buyers),
  seller: one(sellers),
  listing: one(listings),
  order: one(orders),
  payment: one(payments),
}));

// Carts ? Buyer & Items
export const cartRelations = relations(carts, ({ one, many }) => ({
  buyer: one(buyers, { fields: [carts.buyerId], references: [buyers.id] }),
  discount: one(discounts, { fields: [carts.discountId], references: [discounts.id] }),
  items: many(cartItems),
}));

// Cart Items ? Cart & Listing
export const cartItemRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts),
  listing: one(listings),
}));

// Reviews ? Buyer & Listing
export const reviewsRelations = relations(reviews, ({ one }) => ({
  buyer: one(buyers, {
    fields: [reviews.buyerId],
    references: [buyers.id],
  }),
  listing: one(listings, {
    fields: [reviews.listingId],
    references: [listings.id],
  }),
}));

// Notifications ? Seller
export const notificationsRelations = relations(notifications, ({ one }) => ({
  seller: one(sellers),
}));

// Buyer Account Details ? Buyer
export const buyerAccountDetailsRelations = relations(buyerAccountDetails, ({ one }) => ({
  buyer: one(buyers, {
    fields: [buyerAccountDetails.buyerId],
    references: [buyers.id],
  }),
}));

// Loyalty NFTs ? Buyer
export const loyaltyNFTsRelations = relations(loyaltyNFTs, ({ one }) => ({
  buyer: one(buyers, {
    fields: [loyaltyNFTs.buyerId],
    references: [buyers.id],
  }),
}));

// Buyer Shipping ? Buyer
export const buyerShippingRelations = relations(buyerShipping, ({ one }) => ({
  buyer: one(buyers),
}));

// Buyer Favorites ? Buyer & Listing
export const buyerFavoritesRelations = relations(buyerFavorites, ({ one }) => ({
  buyer: one(buyers, {
    fields: [buyerFavorites.buyerId],
    references: [buyers.id],
  }),
  listing: one(listings, {
    fields: [buyerFavorites.listingId],
    references: [listings.id],
  }),
}));

// Seller Payment Config ? Seller
export const sellerPaymentConfigRelations = relations(sellerPaymentConfig, ({ one }) => ({
  seller: one(sellers),
}));

// Seller Payout Methods ? Seller
export const sellerPayoutMethodsRelations = relations(sellerPayoutMethods, ({ one }) => ({
  seller: one(sellers),
}));

// Seller Crypto Payout Methods ? Seller
export const sellerCryptoPayoutMethodsRelations = relations(sellerCryptoPayoutMethods, ({ one }) => ({
  seller: one(sellers),
}));

// Seller Additional ? Seller
export const sellerAdditionalRelations = relations(sellerAdditional, ({ one }) => ({
  seller: one(sellers),
}));

// Discounts ? none (referenced by carts)
export const discountsRelations = relations(discounts, ({}) => ({}));

// Product Images ? Product
export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products),
}));

// Collection Items ? Collection & Product
export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(collections),
  product: one(products),
}));

// Support Tickets ? Buyer, Seller, Order
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

// Support Ticket Replies ? Ticket
export const supportTicketRepliesRelations = relations(supportTicketReplies, ({ one }) => ({
  ticket: one(supportTickets),
}));

// Inventory Reservations ? Inventory & Order
export const inventoryReservationsRelations = relations(inventoryReservations, ({ one }) => ({
  inventory: one(inventory),
  order: one(orders),
}));

// Order State Transitions ? Order
export const orderStateTransitionsRelations = relations(orderStateTransitions, ({ one }) => ({
  order: one(orders),
}));

// Shipping Rates ? Seller
export const shippingRatesRelations = relations(shippingRates, ({ one }) => ({
  seller: one(sellers),
}));

// Categories ? Subcategories
export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
}));

// Subcategories ? Category
export const subcategoriesRelations = relations(subcategories, ({ one }) => ({
  category: one(categories),
}));

// Follows ? Sellers
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

// Conversations ? Buyer & Seller
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  buyer: one(buyers),
  seller: one(sellers),
  messages: many(messages),
}));

// Messages ? Conversation
export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations),
}));

// =======================
// ENTERPRISE SUPPORT - RELATIONS
// =======================

// Support Team Members ? none
export const supportTeamMembersRelations = relations(supportTeamMembers, ({}) => ({}));

// SLA Metrics ? SLA Tracking
export const slaMetricsRelations = relations(slaMetrics, ({ many }) => ({
  tracking: many(slaTracking),
}));

// SLA Tracking ? Metrics & Tickets
export const slaTrackingRelations = relations(slaTracking, ({ one }) => ({
  slaMetric: one(slaMetrics),
  ticket: one(supportTickets),
}));

// Escalation Rules ? none
export const escalationRulesRelations = relations(escalationRules, ({}) => ({}));

// Support Audit Logs ? Tickets
export const supportAuditLogsRelations = relations(supportAuditLogs, ({ one }) => ({
  ticket: one(supportTickets),
}));

// Scheduled Payouts ? Seller
export const scheduledPayoutsRelations = relations(scheduledPayouts, ({ one }) => ({
  seller: one(sellers),
}));

// Support Analytics ? none
export const supportAnalyticsRelations = relations(supportAnalytics, ({}) => ({}));

// Listing Reviews ? Listing & Seller
export const listingReviewsRelations = relations(listingReviews, ({ one }) => ({
  listing: one(listings),
  seller: one(sellers),
}));

// Listing Activity Log ? Listing & Seller
export const listingActivityLogRelations = relations(listingActivityLog, ({ one }) => ({
  listing: one(listings),
  seller: one(sellers),
}));

// Buyer Brand Follows ? Buyer & Brand
export const buyerBrandFollowsRelations = relations(buyerBrandFollows, ({ one }) => ({
  buyer: one(buyers),
  brand: one(brands),
}));

