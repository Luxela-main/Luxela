import { z } from "zod";

// USERS
export const userSchema = z.object({
  id: z.string().uuid(),
  oauthId: z.string().nullable().optional(),
  name: z.string(),
  displayName: z.string().nullable().optional(),
  email: z.string().email(),
  password: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  role: z.enum(["buyer", "seller", "ADMIN"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// BUYERS
export const buyerSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// BUYER ACCOUNT DETAILS
export const buyerAccountDetailsSchema = z.object({
  id: z.string().uuid(),
  buyerId: z.string().uuid(),
  phone: z.string(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  country: z.string().optional(),
  nationality: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// BUYER BILLING
export const buyerBillingAddressSchema = z.object({
  id: z.string().uuid(),
  buyerId: z.string().uuid(),
  houseAddress: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// BUYER SHIPPING
export const buyerShippingSchema = z.object({
  id: z.string().uuid(),
  buyerId: z.string().uuid(),
  houseAddress: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string().optional(),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// FAVORITES
export const favoritesSchema = z.object({
  id: z.string().uuid(),
  buyerId: z.string().uuid(),
  listingId: z.string().uuid(),
  createdAt: z.date(),
});

// CART
export const cartSchema = z.object({
  id: z.string().uuid(),
  buyerId: z.string().uuid(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// CART ITEMS
export const cartItemSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  listingId: z.string().uuid(),
  quantity: z.number(),
  priceCents: z.number(),
  createdAt: z.date(),
});

// SELLERS
export const sellerSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// SELLER BUSINESS
export const sellerBusinessSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  businessName: z.string(),
  businessEmail: z.string().optional(),
  businessPhone: z.string().optional(),
  taxId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// SELLER ADDITIONAL
export const sellerAdditionalSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  bio: z.string().optional(),
  website: z.string().optional(),
  socialLinks: z.any().optional(),
  createdAt: z.date(),
});

// SELLER PAYMENT
export const sellerPaymentSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  createdAt: z.date(),
});

// SELLER SHIPPING
export const sellerShippingSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  shippingOrigin: z.string().optional(),
  shippingMethod: z.string().optional(),
  createdAt: z.date(),
});

// LISTINGS
export const listingSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  type: z.enum(["single", "collection"]),
  title: z.string(),
  description: z.string().optional(),
  category: z.enum([
    "men_clothing",
    "women_clothing",
    "men_shoes",
    "women_shoes",
    "accessories",
    "merch",
    "others",
  ]).optional(),
  images: z.any().optional(),
  priceCents: z.number().optional(),
  currency: z.string(),
  stock: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ORDERS
export const orderSchema = z.object({
  id: z.string().uuid(),
  buyerId: z.string().uuid().nullable(),
  sellerId: z.string().uuid(),
  listingId: z.string().uuid(),
  quantity: z.number(),
  priceCents: z.number(),
  status: z.string(),
  shippingAddress: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// PAYMENTS
export const paymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  amountCents: z.number(),
  currency: z.string(),
  provider: z.string().optional(),
  status: z.string().optional(),
  transactionId: z.string().optional(),
  createdAt: z.date(),
});

// REVIEW
export const reviewSchema = z.object({
  id: z.string().uuid(),
  buyerId: z.string().uuid().nullable(),
  listingId: z.string().uuid(),
  rating: z.number(),
  comment: z.string().optional(),
  createdAt: z.date(),
});

// NOTIFICATIONS
export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  title: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.date(),
});

// DISCOUNTS
export const discountSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  percentage: z.number(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

// EMAIL OTPS
export const emailOtpSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  otp: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
});