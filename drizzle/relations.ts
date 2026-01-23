import { relations } from "drizzle-orm/relations";
import { sellers, brands, buyers, buyerAccountDetails, buyerFavorites, listings, buyerShipping, collections, collectionItems, products, inventoryReservations, orders, notifications, paymentHolds, payments, inventory, productVariants, orderStateTransitions, financialLedger, refunds, review, sales, sellerAdditional, productImages, buyerBillingAddress, carts, cartItems, discounts, sellerShipping, sellerBusiness, sellerPayment, supportTickets } from "./schema";

export const brandsRelations = relations(brands, ({one, many}) => ({
	seller: one(sellers, {
		fields: [brands.sellerId],
		references: [sellers.id],
		relationName: "brands_sellerId_sellers_id"
	}),
	collections: many(collections),
	sellers: many(sellers, {
		relationName: "sellers_brandId_brands_id"
	}),
	products: many(products),
}));

export const sellersRelations = relations(sellers, ({one, many}) => ({
	brands: many(brands, {
		relationName: "brands_sellerId_sellers_id"
	}),
	orders: many(orders),
	notifications: many(notifications),
	paymentHolds: many(paymentHolds),
	financialLedgers: many(financialLedger),
	refunds: many(refunds),
	sales: many(sales),
	sellerAdditionals: many(sellerAdditional),
	brand: one(brands, {
		fields: [sellers.brandId],
		references: [brands.id],
		relationName: "sellers_brandId_brands_id"
	}),
	listings: many(listings),
	sellerShippings: many(sellerShipping),
	sellerBusinesses: many(sellerBusiness),
	sellerPayments: many(sellerPayment),
	supportTickets: many(supportTickets),
}));

export const buyerAccountDetailsRelations = relations(buyerAccountDetails, ({one}) => ({
	buyer: one(buyers, {
		fields: [buyerAccountDetails.buyerId],
		references: [buyers.id]
	}),
}));

export const buyersRelations = relations(buyers, ({many}) => ({
	buyerAccountDetails: many(buyerAccountDetails),
	buyerFavorites: many(buyerFavorites),
	buyerShippings: many(buyerShipping),
	inventoryReservations: many(inventoryReservations),
	orders: many(orders),
	notifications: many(notifications),
	refunds: many(refunds),
	reviews: many(review),
	sales: many(sales),
	payments: many(payments),
	buyerBillingAddresses: many(buyerBillingAddress),
	carts: many(carts),
}));

export const buyerFavoritesRelations = relations(buyerFavorites, ({one}) => ({
	buyer: one(buyers, {
		fields: [buyerFavorites.buyerId],
		references: [buyers.id]
	}),
	listing: one(listings, {
		fields: [buyerFavorites.listingId],
		references: [listings.id]
	}),
}));

export const listingsRelations = relations(listings, ({one, many}) => ({
	buyerFavorites: many(buyerFavorites),
	inventoryReservations: many(inventoryReservations),
	orders: many(orders),
	reviews: many(review),
	sales: many(sales),
	payments: many(payments),
	cartItems: many(cartItems),
	collection: one(collections, {
		fields: [listings.collectionId],
		references: [collections.id]
	}),
	product: one(products, {
		fields: [listings.productId],
		references: [products.id]
	}),
	seller: one(sellers, {
		fields: [listings.sellerId],
		references: [sellers.id]
	}),
}));

export const buyerShippingRelations = relations(buyerShipping, ({one}) => ({
	buyer: one(buyers, {
		fields: [buyerShipping.buyerId],
		references: [buyers.id]
	}),
}));

export const collectionItemsRelations = relations(collectionItems, ({one}) => ({
	collection: one(collections, {
		fields: [collectionItems.collectionId],
		references: [collections.id]
	}),
	product: one(products, {
		fields: [collectionItems.productId],
		references: [products.id]
	}),
}));

export const collectionsRelations = relations(collections, ({one, many}) => ({
	collectionItems: many(collectionItems),
	brand: one(brands, {
		fields: [collections.brandId],
		references: [brands.id]
	}),
	listings: many(listings),
	products: many(products),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	collectionItems: many(collectionItems),
	inventories: many(inventory),
	productVariants: many(productVariants),
	productImages: many(productImages),
	listings: many(listings),
	brand: one(brands, {
		fields: [products.brandId],
		references: [brands.id]
	}),
	collection: one(collections, {
		fields: [products.collectionId],
		references: [collections.id]
	}),
}));

export const inventoryReservationsRelations = relations(inventoryReservations, ({one}) => ({
	buyer: one(buyers, {
		fields: [inventoryReservations.buyerId],
		references: [buyers.id]
	}),
	listing: one(listings, {
		fields: [inventoryReservations.listingId],
		references: [listings.id]
	}),
	order: one(orders, {
		fields: [inventoryReservations.orderId],
		references: [orders.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	inventoryReservations: many(inventoryReservations),
	buyer: one(buyers, {
		fields: [orders.buyerId],
		references: [buyers.id]
	}),
	listing: one(listings, {
		fields: [orders.listingId],
		references: [listings.id]
	}),
	seller: one(sellers, {
		fields: [orders.sellerId],
		references: [sellers.id]
	}),
	notifications: many(notifications),
	paymentHolds: many(paymentHolds),
	orderStateTransitions: many(orderStateTransitions),
	financialLedgers: many(financialLedger),
	refunds: many(refunds),
	sales: many(sales),
	payments: many(payments),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	buyer: one(buyers, {
		fields: [notifications.buyerId],
		references: [buyers.id]
	}),
	order: one(orders, {
		fields: [notifications.orderId],
		references: [orders.id]
	}),
	seller: one(sellers, {
		fields: [notifications.sellerId],
		references: [sellers.id]
	}),
}));

export const paymentHoldsRelations = relations(paymentHolds, ({one}) => ({
	order: one(orders, {
		fields: [paymentHolds.orderId],
		references: [orders.id]
	}),
	payment: one(payments, {
		fields: [paymentHolds.paymentId],
		references: [payments.id]
	}),
	seller: one(sellers, {
		fields: [paymentHolds.sellerId],
		references: [sellers.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one, many}) => ({
	paymentHolds: many(paymentHolds),
	financialLedgers: many(financialLedger),
	refunds: many(refunds),
	buyer: one(buyers, {
		fields: [payments.buyerId],
		references: [buyers.id]
	}),
	listing: one(listings, {
		fields: [payments.listingId],
		references: [listings.id]
	}),
	order: one(orders, {
		fields: [payments.orderId],
		references: [orders.id]
	}),
}));

export const inventoryRelations = relations(inventory, ({one}) => ({
	product: one(products, {
		fields: [inventory.productId],
		references: [products.id]
	}),
	productVariant: one(productVariants, {
		fields: [inventory.variantId],
		references: [productVariants.id]
	}),
}));

export const productVariantsRelations = relations(productVariants, ({one, many}) => ({
	inventories: many(inventory),
	product: one(products, {
		fields: [productVariants.productId],
		references: [products.id]
	}),
}));

export const orderStateTransitionsRelations = relations(orderStateTransitions, ({one}) => ({
	order: one(orders, {
		fields: [orderStateTransitions.orderId],
		references: [orders.id]
	}),
}));

export const financialLedgerRelations = relations(financialLedger, ({one}) => ({
	order: one(orders, {
		fields: [financialLedger.orderId],
		references: [orders.id]
	}),
	payment: one(payments, {
		fields: [financialLedger.paymentId],
		references: [payments.id]
	}),
	seller: one(sellers, {
		fields: [financialLedger.sellerId],
		references: [sellers.id]
	}),
}));

export const refundsRelations = relations(refunds, ({one}) => ({
	buyer: one(buyers, {
		fields: [refunds.buyerId],
		references: [buyers.id]
	}),
	order: one(orders, {
		fields: [refunds.orderId],
		references: [orders.id]
	}),
	payment: one(payments, {
		fields: [refunds.paymentId],
		references: [payments.id]
	}),
	seller: one(sellers, {
		fields: [refunds.sellerId],
		references: [sellers.id]
	}),
}));

export const reviewRelations = relations(review, ({one}) => ({
	buyer: one(buyers, {
		fields: [review.buyerId],
		references: [buyers.id]
	}),
	listing: one(listings, {
		fields: [review.listingId],
		references: [listings.id]
	}),
}));

export const salesRelations = relations(sales, ({one}) => ({
	buyer: one(buyers, {
		fields: [sales.buyerId],
		references: [buyers.id]
	}),
	listing: one(listings, {
		fields: [sales.listingId],
		references: [listings.id]
	}),
	order: one(orders, {
		fields: [sales.orderId],
		references: [orders.id]
	}),
	seller: one(sellers, {
		fields: [sales.sellerId],
		references: [sellers.id]
	}),
}));

export const sellerAdditionalRelations = relations(sellerAdditional, ({one}) => ({
	seller: one(sellers, {
		fields: [sellerAdditional.sellerId],
		references: [sellers.id]
	}),
}));

export const productImagesRelations = relations(productImages, ({one}) => ({
	product: one(products, {
		fields: [productImages.productId],
		references: [products.id]
	}),
}));

export const buyerBillingAddressRelations = relations(buyerBillingAddress, ({one}) => ({
	buyer: one(buyers, {
		fields: [buyerBillingAddress.buyerId],
		references: [buyers.id]
	}),
}));

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id]
	}),
	listing: one(listings, {
		fields: [cartItems.listingId],
		references: [listings.id]
	}),
}));

export const cartsRelations = relations(carts, ({one, many}) => ({
	cartItems: many(cartItems),
	buyer: one(buyers, {
		fields: [carts.buyerId],
		references: [buyers.id]
	}),
	discount: one(discounts, {
		fields: [carts.discountId],
		references: [discounts.id]
	}),
}));

export const discountsRelations = relations(discounts, ({many}) => ({
	carts: many(carts),
}));

export const sellerShippingRelations = relations(sellerShipping, ({one}) => ({
	seller: one(sellers, {
		fields: [sellerShipping.sellerId],
		references: [sellers.id]
	}),
}));

export const sellerBusinessRelations = relations(sellerBusiness, ({one}) => ({
	seller: one(sellers, {
		fields: [sellerBusiness.sellerId],
		references: [sellers.id]
	}),
}));

export const sellerPaymentRelations = relations(sellerPayment, ({one}) => ({
	seller: one(sellers, {
		fields: [sellerPayment.sellerId],
		references: [sellers.id]
	}),
}));

export const supportTicketsRelations = relations(supportTickets, ({one}) => ({
	seller: one(sellers, {
		fields: [supportTickets.sellerId],
		references: [sellers.id]
	}),
}));