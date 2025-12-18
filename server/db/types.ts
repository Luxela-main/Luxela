import { z } from "zod";
import {
  // Schemas
  userSchema,
  buyerSchema,
  buyerAccountDetailsSchema,
  buyerBillingAddressSchema,
  buyerShippingSchema,
  buyerFavoritesSchema,
  cartsSchema,
  cartItemsSchema,
  sellerSchema,
  sellerBusinessSchema,
  sellerAdditionalSchema,
  sellerPaymentSchema,
  sellerShippingSchema,
  collectionsSchema,
  productsSchema,
  productImagesSchema,
  productVariantsSchema,
  inventorySchema,
  listingsSchema,
  ordersSchema,
  paymentsSchema,
  reviewsSchema,
  notificationsSchema,
  emailOtpsSchema,
  discountSchema,
} from "./zodSchemas";

// --------------------------- TYPES ---------------------------

// USERS
export type User = z.infer<typeof userSchema>;

// BUYERS
export type Buyer = z.infer<typeof buyerSchema>;
export type BuyerAccountDetails = z.infer<typeof buyerAccountDetailsSchema>;
export type BuyerBillingAddress = z.infer<typeof buyerBillingAddressSchema>;
export type BuyerShipping = z.infer<typeof buyerShippingSchema>;
export type Favorite = z.infer<typeof buyerFavoritesSchema>;
export type Cart = z.infer<typeof cartsSchema>;
export type CartItem = z.infer<typeof cartItemsSchema>;

// SELLERS
export type Seller = z.infer<typeof sellerSchema>;
export type SellerBusiness = z.infer<typeof sellerBusinessSchema>;
export type SellerAdditional = z.infer<typeof sellerAdditionalSchema>;
export type SellerPayment = z.infer<typeof sellerPaymentSchema>;
export type SellerShipping = z.infer<typeof sellerShippingSchema>;

// COLLECTIONS & PRODUCTS
export type Collection = z.infer<typeof collectionsSchema>;
export type Product = z.infer<typeof productsSchema>;
export type ProductImage = z.infer<typeof productImagesSchema>;
export type ProductVariant = z.infer<typeof productVariantsSchema>;
export type Inventory = z.infer<typeof inventorySchema>;

// LISTINGS
export type Listing = z.infer<typeof listingsSchema>;

// ORDERS & PAYMENTS
export type Order = z.infer<typeof ordersSchema>;
export type Payment = z.infer<typeof paymentsSchema>;

// DISCOUNTS
export type Discount = z.infer<typeof discountSchema>;

// REVIEWS
export type Review = z.infer<typeof reviewsSchema>;

// NOTIFICATIONS
export type Notification = z.infer<typeof notificationsSchema>;

// EMAIL OTPS
export type EmailOtp = z.infer<typeof emailOtpsSchema>;

// Re-export zod schemas if consumers need runtime validation
export {
  userSchema,
  buyerSchema,
  buyerAccountDetailsSchema,
  buyerBillingAddressSchema,
  buyerShippingSchema,
  buyerFavoritesSchema,
  cartsSchema,
  cartItemsSchema,
  sellerSchema,
  sellerBusinessSchema,
  sellerAdditionalSchema,
  sellerPaymentSchema,
  sellerShippingSchema,
  collectionsSchema,
  productsSchema,
  productImagesSchema,
  productVariantsSchema,
  inventorySchema,
  listingsSchema,
  ordersSchema,
  paymentsSchema,
  reviewsSchema,
  notificationsSchema,
  emailOtpsSchema,
  discountSchema,
};