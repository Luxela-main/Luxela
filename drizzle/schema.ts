import { pgTable, type AnyPgColumn, foreignKey, unique, uuid, text, numeric, integer, timestamp, varchar, boolean, index, pgPolicy, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const businessType = pgEnum("business_type", ['individual', 'sole_proprietorship', 'llc', 'corporation', 'partnership', 'cooperative', 'non_profit', 'trust', 'joint_venture'])
export const deliveryStatus = pgEnum("delivery_status", ['not_shipped', 'in_transit', 'delivered'])
export const fiatPayoutMethod = pgEnum("fiat_payout_method", ['bank', 'paypal', 'stripe', 'wise', 'flutterwave', 'mobile_money', 'local_gateway'])
export const holdStatus = pgEnum("hold_status", ['active', 'released', 'refunded', 'expired'])
export const idType = pgEnum("id_type", ['national_id', 'passport', 'drivers_license', 'voters_card', 'business_license', 'tax_id', 'business_registration'])
export const ledgerStatus = pgEnum("ledger_status", ['pending', 'completed', 'failed', 'reversed'])
export const limitedBadge = pgEnum("limited_badge", ['show_badge', 'do_not_show'])
export const listingType = pgEnum("listing_type", ['single', 'collection'])
export const localPricing = pgEnum("local_pricing", ['fiat', 'cryptocurrency', 'both'])
export const notificationType = pgEnum("notification_type", ['purchase', 'review', 'comment', 'reminder', 'order_confirmed', 'payment_failed', 'refund_issued', 'delivery_confirmed'])
export const orderStatus = pgEnum("order_status", ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'canceled', 'returned', 'refunded'])
export const paymentMethod = pgEnum("payment_method", ['card', 'bank_transfer', 'crypto', 'paypal', 'stripe', 'flutterwave', 'tsara'])
export const paymentProvider = pgEnum("payment_provider", ['tsara', 'flutterwave', 'stripe', 'paypal'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'processing', 'completed', 'failed', 'refunded'])
export const payoutStatus = pgEnum("payout_status", ['in_escrow', 'processing', 'paid'])
export const payoutToken = pgEnum("payout_token", ['USDC', 'USDT', 'DAI', 'solana', 'ETH', 'MATIC'])
export const preferredPayoutMethod = pgEnum("preferred_payout_method", ['fiat_currency', 'cryptocurrency', 'both'])
export const productCategory = pgEnum("product_category", ['men_clothing', 'women_clothing', 'men_shoes', 'women_shoes', 'accessories', 'merch', 'others'])
export const refundPolicy = pgEnum("refund_policy", ['no_refunds', '48hrs', '72hrs', '5_working_days', '1week', '14days', '30days', '60days', 'store_credit'])
export const refundStatus = pgEnum("refund_status", ['pending', 'processing', 'completed', 'failed', 'canceled'])
export const refundType = pgEnum("refund_type", ['full', 'partial', 'store_credit'])
export const reservationStatus = pgEnum("reservation_status", ['active', 'confirmed', 'released', 'expired'])
export const roles = pgEnum("roles", ['buyer', 'seller', 'admin'])
export const shippingEta = pgEnum("shipping_eta", ['same_day', 'next_day', '48hrs', '72hrs', '5_working_days', '1_2_weeks', '2_3_weeks', 'custom'])
export const shippingOption = pgEnum("shipping_option", ['local', 'international', 'both'])
export const shippingType = pgEnum("shipping_type", ['same_day', 'next_day', 'express', 'standard', 'domestic', 'international', 'both'])
export const socialMediaPlatform = pgEnum("social_media_platform", ['x', 'instagram', 'facebook', 'whatsapp', 'tiktok'])
export const supplyCapacity = pgEnum("supply_capacity", ['no_max', 'limited'])
export const supportTicketCategory = pgEnum("support_ticket_category", ['general_inquiry', 'technical_issue', 'payment_problem', 'order_issue', 'refund_request', 'account_issue', 'listing_help', 'other'])
export const supportTicketPriority = pgEnum("support_ticket_priority", ['low', 'medium', 'high', 'urgent'])
export const supportTicketStatus = pgEnum("support_ticket_status", ['open', 'in_progress', 'resolved', 'closed'])
export const targetAudience = pgEnum("target_audience", ['male', 'female', 'unisex', 'kids', 'teens'])
export const transactionType = pgEnum("transaction_type", ['sale', 'refund', 'commission', 'payout'])
export const transitionType = pgEnum("transition_type", ['automatic', 'manual', 'system'])
export const walletType = pgEnum("wallet_type", ['phantom', 'solflare', 'backpack', 'magic_eden', 'wallet_connect', 'ledger_live'])
export const webhookEventStatus = pgEnum("webhook_event_status", ['pending', 'processed', 'failed'])


export const brands = pgTable("brands", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	heroImage: text("hero_image"),
	logoImage: text("logo_image"),
	rating: numeric({ precision: 2, scale:  1 }).default('0'),
	totalProducts: integer("total_products").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "brands_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
	unique("brands_slug_unique").on(table.slug),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buyerId: uuid("buyer_id").notNull(),
	listingId: uuid("listing_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const buyerAccountDetails = pgTable("buyer_account_details", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buyerId: uuid("buyer_id").notNull(),
	username: varchar({ length: 100 }).notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	phoneNumber: varchar("phone_number", { length: 50 }),
	email: varchar({ length: 255 }).notNull(),
	country: varchar({ length: 100 }).notNull(),
	state: varchar({ length: 100 }).notNull(),
	profilePicture: text("profile_picture"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "buyer_account_details_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
	unique("buyer_account_details_username_unique").on(table.username),
]);

export const buyerFavorites = pgTable("buyer_favorites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buyerId: uuid("buyer_id").notNull(),
	listingId: uuid("listing_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "buyer_favorites_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [listings.id],
			name: "buyer_favorites_listing_id_listings_id_fk"
		}).onDelete("cascade"),
]);

export const buyerShipping = pgTable("buyer_shipping", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buyerId: uuid("buyer_id").notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
	state: varchar({ length: 100 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	address: text().notNull(),
	postalCode: varchar("postal_code", { length: 32 }).notNull(),
	isDefault: boolean("is_default").default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "buyer_shipping_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
]);

export const collectionItems = pgTable("collection_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	collectionId: uuid("collection_id").notNull(),
	productId: uuid("product_id").notNull(),
	position: integer().default(0),
}, (table) => [
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "collection_items_collection_id_collections_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "collection_items_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("collection_items_collection_id_product_id_unique").on(table.collectionId, table.productId),
]);

export const collections = pgTable("collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	brandId: uuid("brand_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	coverImage: text("cover_image"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "collections_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	unique("collections_brand_id_slug_unique").on(table.brandId, table.slug),
]);

export const emailOtps = pgTable("email_otps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	codeHash: varchar("code_hash", { length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	consumed: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const discounts = pgTable("discounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	percentOff: integer("percent_off"),
	amountOffCents: integer("amount_off_cents"),
	active: boolean().default(true).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("discounts_code_unique").on(table.code),
]);

export const inventoryReservations = pgTable("inventory_reservations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	listingId: uuid("listing_id").notNull(),
	buyerId: uuid("buyer_id").notNull(),
	orderId: uuid("order_id"),
	quantityReserved: integer("quantity_reserved").notNull(),
	status: reservationStatus().default('active').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
	releasedAt: timestamp("released_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "inventory_reservations_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [listings.id],
			name: "inventory_reservations_listing_id_listings_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "inventory_reservations_order_id_orders_id_fk"
		}).onDelete("cascade"),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buyerId: uuid("buyer_id").notNull(),
	sellerId: uuid("seller_id").notNull(),
	listingId: uuid("listing_id").notNull(),
	productTitle: varchar("product_title", { length: 255 }).notNull(),
	productImage: text("product_image"),
	productCategory: productCategory("product_category").notNull(),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	customerEmail: varchar("customer_email", { length: 255 }).notNull(),
	orderDate: timestamp("order_date", { mode: 'string' }).defaultNow().notNull(),
	paymentMethod: paymentMethod("payment_method").notNull(),
	amountCents: integer("amount_cents").notNull(),
	currency: varchar({ length: 16 }).notNull(),
	payoutStatus: payoutStatus("payout_status").default('in_escrow').notNull(),
	deliveryStatus: deliveryStatus("delivery_status").default('not_shipped').notNull(),
	orderStatus: orderStatus("order_status").default('pending').notNull(),
	shippingAddress: text("shipping_address"),
	trackingNumber: varchar("tracking_number", { length: 255 }),
	estimatedArrival: timestamp("estimated_arrival", { mode: 'string' }),
	deliveredDate: timestamp("delivered_date", { mode: 'string' }),
	recipientEmail: varchar("recipient_email", { length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "orders_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [listings.id],
			name: "orders_listing_id_listings_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "orders_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id"),
	buyerId: uuid("buyer_id"),
	orderId: uuid("order_id"),
	type: notificationType().notNull(),
	message: text().notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	isStarred: boolean("is_starred").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "notifications_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "notifications_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "notifications_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const paymentHolds = pgTable("payment_holds", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	paymentId: uuid("payment_id").notNull(),
	orderId: uuid("order_id").notNull(),
	sellerId: uuid("seller_id").notNull(),
	amountCents: integer("amount_cents").notNull(),
	currency: varchar({ length: 16 }).notNull(),
	holdStatus: holdStatus("hold_status").default('active').notNull(),
	heldAt: timestamp("held_at", { mode: 'string' }).defaultNow().notNull(),
	releaseableAt: timestamp("releaseable_at", { mode: 'string' }).notNull(),
	releasedAt: timestamp("released_at", { mode: 'string' }),
	refundedAt: timestamp("refunded_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payment_holds_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "payment_holds_payment_id_payments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "payment_holds_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const inventory = pgTable("inventory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id").notNull(),
	quantity: integer().default(0).notNull(),
	reservedQuantity: integer("reserved_quantity").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "inventory_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "inventory_variant_id_product_variants_id_fk"
		}),
]);

export const orderStateTransitions = pgTable("order_state_transitions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	fromState: orderStatus("from_state").notNull(),
	toState: orderStatus("to_state").notNull(),
	transitionType: transitionType("transition_type").notNull(),
	initiatedBy: uuid("initiated_by"),
	reason: text(),
	validationErrors: text("validation_errors"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_state_transitions_order_id_orders_id_fk"
		}).onDelete("cascade"),
]);

export const financialLedger = pgTable("financial_ledger", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	orderId: uuid("order_id"),
	transactionType: transactionType("transaction_type").notNull(),
	amountCents: integer("amount_cents").notNull(),
	currency: varchar({ length: 16 }).notNull(),
	status: ledgerStatus().default('pending').notNull(),
	description: text(),
	paymentId: uuid("payment_id"),
	relatedLedgerId: uuid("related_ledger_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "financial_ledger_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "financial_ledger_payment_id_payments_id_fk"
		}),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "financial_ledger_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const refunds = pgTable("refunds", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	paymentId: uuid("payment_id").notNull(),
	buyerId: uuid("buyer_id").notNull(),
	sellerId: uuid("seller_id").notNull(),
	amountCents: integer("amount_cents").notNull(),
	currency: varchar({ length: 16 }).notNull(),
	refundType: refundType("refund_type").notNull(),
	reason: text().notNull(),
	refundStatus: refundStatus("refund_status").default('pending').notNull(),
	processedBy: uuid("processed_by"),
	gatewayRefundId: varchar("gateway_refund_id", { length: 255 }),
	gatewayResponse: text("gateway_response"),
	requestedAt: timestamp("requested_at", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "refunds_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "refunds_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "refunds_payment_id_payments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "refunds_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const review = pgTable("review", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buyerId: uuid("buyer_id").notNull(),
	listingId: uuid("listing_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "review_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [listings.id],
			name: "review_listing_id_listings_id_fk"
		}).onDelete("cascade"),
]);

export const productVariants = pgTable("product_variants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	size: text().notNull(),
	colorName: text("color_name").notNull(),
	colorHex: text("color_hex").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_variants_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const sales = pgTable("sales", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	sellerId: uuid("seller_id").notNull(),
	buyerId: uuid("buyer_id").notNull(),
	listingId: uuid("listing_id").notNull(),
	quantity: integer().default(1).notNull(),
	totalCents: integer("total_cents").notNull(),
	currency: varchar({ length: 16 }).notNull(),
	isRefunded: boolean("is_refunded").default(false).notNull(),
	refundedAt: timestamp("refunded_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "sales_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [listings.id],
			name: "sales_listing_id_listings_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "sales_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "sales_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const sellerAdditional = pgTable("seller_additional", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	productCategory: productCategory("product_category"),
	targetAudience: targetAudience("target_audience"),
	localPricing: localPricing("local_pricing"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_additional_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const productImages = pgTable("product_images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	imageUrl: text("image_url").notNull(),
	position: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_images_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const profiles = pgTable("profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	displayName: varchar("display_name", { length: 255 }),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buyerId: uuid("buyer_id").notNull(),
	listingId: uuid("listing_id").notNull(),
	orderId: uuid("order_id"),
	amountCents: integer("amount_cents").notNull(),
	currency: varchar({ length: 16 }).notNull(),
	paymentMethod: paymentMethod("payment_method").notNull(),
	provider: paymentProvider().notNull(),
	status: paymentStatus().default('pending').notNull(),
	transactionRef: varchar("transaction_ref", { length: 255 }).notNull(),
	gatewayResponse: text("gateway_response"),
	isRefunded: boolean("is_refunded").default(false).notNull(),
	refundedAt: timestamp("refunded_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "payments_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [listings.id],
			name: "payments_listing_id_listings_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payments_order_id_orders_id_fk"
		}).onDelete("set null"),
	unique("payments_transaction_ref_unique").on(table.transactionRef),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	oauthId: varchar("oauth_id", { length: 255 }),
	name: varchar({ length: 255 }),
	displayName: varchar("display_name", { length: 255 }),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }),
	emailVerified: boolean("email_verified").default(false),
	image: text(),
	role: roles().default('buyer'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const sellers = pgTable("sellers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	brandId: uuid("brand_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const buyerBillingAddress = pgTable("buyer_billing_address", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buyerId: uuid("buyer_id").notNull(),
	houseAddress: text("house_address").notNull(),
	city: varchar({ length: 255 }).notNull(),
	postalCode: varchar("postal_code", { length: 32 }).notNull(),
	isDefault: boolean("is_default").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "buyer_billing_address_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
]);

export const buyers = pgTable("buyers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cartId: uuid("cart_id").notNull(),
	listingId: uuid("listing_id").notNull(),
	quantity: integer().notNull(),
	unitPriceCents: integer("unit_price_cents").notNull(),
	currency: varchar({ length: 16 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_items_cart_id_carts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [listings.id],
			name: "cart_items_listing_id_listings_id_fk"
		}).onDelete("cascade"),
]);

export const carts = pgTable("carts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buyerId: uuid("buyer_id").notNull(),
	discountId: uuid("discount_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [buyers.id],
			name: "carts_buyer_id_buyers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.discountId],
			foreignColumns: [discounts.id],
			name: "carts_discount_id_discounts_id_fk"
		}),
]);

export const webhookEvents = pgTable("webhook_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: text("event_id").notNull(),
	eventType: text("event_type").notNull(),
	status: webhookEventStatus().default('pending').notNull(),
	receivedAt: timestamp("received_at", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
});

export const listings = pgTable("listings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	collectionId: uuid("collection_id"),
	productId: uuid("product_id"),
	sellerId: uuid("seller_id").notNull(),
	type: listingType().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	category: productCategory(),
	image: text(),
	priceCents: integer("price_cents"),
	currency: varchar({ length: 16 }),
	sizesJson: text("sizes_json"),
	supplyCapacity: supplyCapacity("supply_capacity"),
	quantityAvailable: integer("quantity_available"),
	limitedEditionBadge: limitedBadge("limited_edition_badge"),
	releaseDuration: varchar("release_duration", { length: 255 }),
	materialComposition: text("material_composition"),
	colorsAvailable: text("colors_available"),
	additionalTargetAudience: targetAudience("additional_target_audience"),
	shippingOption: shippingOption("shipping_option"),
	etaDomestic: shippingEta("eta_domestic"),
	etaInternational: shippingEta("eta_international"),
	itemsJson: text("items_json"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "listings_collection_id_collections_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "listings_product_id_products_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "listings_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const sellerShipping = pgTable("seller_shipping", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	shippingZone: varchar("shipping_zone", { length: 255 }).notNull(),
	city: varchar({ length: 255 }).notNull(),
	shippingAddress: text("shipping_address").notNull(),
	returnAddress: text("return_address").notNull(),
	shippingType: shippingType("shipping_type").notNull(),
	estimatedShippingTime: shippingEta("estimated_shipping_time").notNull(),
	refundPolicy: refundPolicy("refund_policy").notNull(),
	refundPeriod: shippingEta("refund_period"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_shipping_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const sellerBusiness = pgTable("seller_business", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	brandName: varchar("brand_name", { length: 255 }).notNull(),
	businessType: businessType("business_type").notNull(),
	businessAddress: text("business_address").notNull(),
	officialEmail: varchar("official_email", { length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
	country: varchar({ length: 100 }).notNull(),
	socialMedia: text("social_media"),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	idType: idType("id_type").notNull(),
	idNumber: varchar("id_number", { length: 50 }),
	idVerified: boolean("id_verified").default(false).notNull(),
	bio: text(),
	storeDescription: text("store_description"),
	storeLogo: text("store_logo"),
	storeBanner: text("store_banner"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	countryCode: varchar("country_code", { length: 10 }),
	socialMediaPlatform: socialMediaPlatform("social_media_platform"),
}, (table) => [
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_business_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const sellerPayment = pgTable("seller_payment", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	preferredPayoutMethod: preferredPayoutMethod("preferred_payout_method").notNull(),
	fiatPayoutMethod: fiatPayoutMethod("fiat_payout_method"),
	bankCountry: varchar("bank_country", { length: 100 }),
	bankName: varchar("bank_name", { length: 255 }),
	accountName: varchar("account_name", { length: 255 }),
	accountHolderName: varchar("account_holder_name", { length: 255 }),
	accountNumber: varchar("account_number", { length: 255 }),
	walletType: walletType("wallet_type"),
	walletAddress: varchar("wallet_address", { length: 255 }),
	preferredPayoutToken: payoutToken("preferred_payout_token"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	bankCode: varchar("bank_code", { length: 50 }),
	localPricing: localPricing("local_pricing"),
}, (table) => [
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_payment_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const shippingRates = pgTable("shipping_rates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	zone: varchar({ length: 100 }).notNull(),
	country: varchar({ length: 100 }).notNull(),
	baseCostCents: integer("base_cost_cents").notNull(),
	costPerKgCents: integer("cost_per_kg_cents").notNull(),
	currency: varchar({ length: 16 }).default('NGN').notNull(),
	estimatedDays: integer("estimated_days").notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const supportTickets = pgTable("support_tickets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	subject: text().notNull(),
	description: text().notNull(),
	category: supportTicketCategory().notNull(),
	status: supportTicketStatus().default('open').notNull(),
	priority: supportTicketPriority().default('medium').notNull(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_support_tickets_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_support_tickets_seller_id").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("idx_support_tickets_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "support_tickets_seller_id_fkey"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	brandId: uuid("brand_id").notNull(),
	collectionId: uuid("collection_id"),
	name: text().notNull(),
	slug: text().notNull(),
	description: text().default('').notNull(),
	priceCents: numeric("price_cents", { precision: 10, scale:  2 }).default('0').notNull(),
	currency: varchar({ length: 16 }).default('SOL').notNull(),
	sku: text().notNull(),
	inStock: boolean("in_stock").default(true),
	shipsIn: varchar("ships_in", { length: 64 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	type: varchar({ length: 50 }),
	category: varchar({ length: 50 }).default('others').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "products_brand_id_brands_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "products_collection_id_collections_id_fk"
		}).onDelete("set null"),
	unique("products_sku_unique").on(table.sku),
	pgPolicy("products_insert_seller", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`((brand_id = ( SELECT auth.uid() AS uid)) OR (collection_id = ( SELECT auth.uid() AS uid)))`  }),
]);