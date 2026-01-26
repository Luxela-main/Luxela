import { z } from "zod";
import {
  // Schemas
  userSchema,
  buyerSchema,
  profileSchema,
  buyerAccountDetailsSchema,
  buyerBillingAddressSchema,
  buyerShippingSchema,
  buyerFavoritesSchema,
  sellerSchema,
  sellerBusinessSchema,
  sellerShippingSchema,
  sellerPaymentSchema,
  sellerAdditionalSchema,
  brandsSchema,
  collectionsSchema,
  collectionItemsSchema,
  productsSchema,
  productImagesSchema,
  productVariantsSchema,
  inventorySchema,
  listingsSchema,
  ordersSchema,
  paymentsSchema,
  refundsSchema,
  paymentHoldsSchema,
  financialLedgerSchema,
  webhookEventsSchema,
  webhookLogsSchema,
  salesSchema,
  cartsSchema,
  cartItemsSchema,
  notificationsSchema,
  reviewsSchema,
  discountSchema,
  supportTicketsSchema,
  supportTicketRepliesSchema,
  inventoryReservationsSchema,
  orderStateTransitionsSchema,
  shippingRatesSchema,
  categoriesSchema,
  subcategoriesSchema,
  followsSchema,
  conversationsSchema,
  messagesSchema,
  emailOtpsSchema,
  supportTeamMembersSchema,
  slaMetricsSchema,
  slaTrackingSchema,
  escalationRulesSchema,
  supportAuditLogsSchema,
  supportAnalyticsSchema,
} from "./zodSchemas";

// ===================== USER TYPES =====================
export type User = z.infer<typeof userSchema>;

// ===================== BUYER TYPES =====================
export type Buyer = z.infer<typeof buyerSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type BuyerAccountDetails = z.infer<typeof buyerAccountDetailsSchema>;
export type BuyerBillingAddress = z.infer<typeof buyerBillingAddressSchema>;
export type BuyerShipping = z.infer<typeof buyerShippingSchema>;
export type Favorite = z.infer<typeof buyerFavoritesSchema>;

// ===================== SELLER TYPES =====================
export type Seller = z.infer<typeof sellerSchema>;
export type SellerBusiness = z.infer<typeof sellerBusinessSchema>;
export type SellerShipping = z.infer<typeof sellerShippingSchema>;
export type SellerPayment = z.infer<typeof sellerPaymentSchema>;
export type SellerAdditional = z.infer<typeof sellerAdditionalSchema>;

// ===================== BRAND & COLLECTION TYPES =====================
export type Brand = z.infer<typeof brandsSchema>;
export type Collection = z.infer<typeof collectionsSchema>;
export type CollectionItem = z.infer<typeof collectionItemsSchema>;

// ===================== PRODUCT TYPES =====================
export type Product = z.infer<typeof productsSchema>;
export type ProductImage = z.infer<typeof productImagesSchema>;
export type ProductVariant = z.infer<typeof productVariantsSchema>;
export type Inventory = z.infer<typeof inventorySchema>;

// ===================== LISTING TYPES =====================
export type Listing = z.infer<typeof listingsSchema>;

// ===================== ORDER & PAYMENT TYPES =====================
export type Order = z.infer<typeof ordersSchema>;
export type Payment = z.infer<typeof paymentsSchema>;
export type Refund = z.infer<typeof refundsSchema>;
export type PaymentHold = z.infer<typeof paymentHoldsSchema>;
export type FinancialLedger = z.infer<typeof financialLedgerSchema>;
export type Sale = z.infer<typeof salesSchema>;

// ===================== CART TYPES =====================
export type Cart = z.infer<typeof cartsSchema>;
export type CartItem = z.infer<typeof cartItemsSchema>;

// ===================== NOTIFICATION & REVIEW TYPES =====================
export type Notification = z.infer<typeof notificationsSchema>;
export type Review = z.infer<typeof reviewsSchema>;

// ===================== DISCOUNT TYPES =====================
export type Discount = z.infer<typeof discountSchema>;

// ===================== SUPPORT TYPES =====================
export type SupportTicket = z.infer<typeof supportTicketsSchema>;
export type SupportTicketReply = z.infer<typeof supportTicketRepliesSchema>;

// ===================== INVENTORY TYPES =====================
export type InventoryReservation = z.infer<typeof inventoryReservationsSchema>;
export type OrderStateTransition = z.infer<typeof orderStateTransitionsSchema>;

// ===================== SHIPPING TYPES =====================
export type ShippingRate = z.infer<typeof shippingRatesSchema>;

// ===================== CATEGORY TYPES =====================
export type Category = z.infer<typeof categoriesSchema>;
export type Subcategory = z.infer<typeof subcategoriesSchema>;

// ===================== SOCIAL TYPES =====================
export type Follow = z.infer<typeof followsSchema>;
export type Conversation = z.infer<typeof conversationsSchema>;
export type Message = z.infer<typeof messagesSchema>;

// ===================== WEBHOOK TYPES =====================
export type WebhookEvent = z.infer<typeof webhookEventsSchema>;
export type WebhookLog = z.infer<typeof webhookLogsSchema>;

// ===================== AUTH TYPES =====================
export type EmailOtp = z.infer<typeof emailOtpsSchema>;

// ===================== ENTERPRISE SUPPORT TYPES =====================
export type SupportTeamMember = z.infer<typeof supportTeamMembersSchema>;
export type SLAMetrics = z.infer<typeof slaMetricsSchema>;
export type SLATracking = z.infer<typeof slaTrackingSchema>;
export type EscalationRules = z.infer<typeof escalationRulesSchema>;
export type SupportAuditLogs = z.infer<typeof supportAuditLogsSchema>;
export type SupportAnalytics = z.infer<typeof supportAnalyticsSchema>;

// ===================== RE-EXPORTS FOR RUNTIME VALIDATION =====================
export {
  userSchema,
  buyerSchema,
  profileSchema,
  buyerAccountDetailsSchema,
  buyerBillingAddressSchema,
  buyerShippingSchema,
  buyerFavoritesSchema,
  sellerSchema,
  sellerBusinessSchema,
  sellerShippingSchema,
  sellerPaymentSchema,
  sellerAdditionalSchema,
  brandsSchema,
  collectionsSchema,
  collectionItemsSchema,
  productsSchema,
  productImagesSchema,
  productVariantsSchema,
  inventorySchema,
  listingsSchema,
  ordersSchema,
  paymentsSchema,
  refundsSchema,
  paymentHoldsSchema,
  financialLedgerSchema,
  webhookEventsSchema,
  webhookLogsSchema,
  salesSchema,
  cartsSchema,
  cartItemsSchema,
  notificationsSchema,
  reviewsSchema,
  discountSchema,
  supportTicketsSchema,
  supportTicketRepliesSchema,
  inventoryReservationsSchema,
  orderStateTransitionsSchema,
  shippingRatesSchema,
  categoriesSchema,
  subcategoriesSchema,
  followsSchema,
  conversationsSchema,
  messagesSchema,
  emailOtpsSchema,
  supportTeamMembersSchema,
  slaMetricsSchema,
  slaTrackingSchema,
  escalationRulesSchema,
  supportAuditLogsSchema,
  supportAnalyticsSchema,
};