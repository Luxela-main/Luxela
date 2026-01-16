import { z } from "zod";

// --------------------------- USERS ---------------------------
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  oauthId: z.string().nullable().optional(),
  name: z.string(),
  displayName: z.string().nullable().optional(),
  email: z.string().email(),
  password: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().nullable().optional(),
  role: z.enum(["buyer", "seller", "admin"]).default("buyer"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- BUYERS --------------------------
export const buyerSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- BUYER ACCOUNT DETAILS ----------
export const buyerAccountDetailsSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  username: z.string(),
  fullName: z.string(),
  dateOfBirth: z.date().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  email: z.string().email(),
  country: z.string(),
  state: z.string(),
  profilePicture: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- BUYER BILLING -------------------
export const buyerBillingAddressSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  houseAddress: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string().nullable().optional(),
  isDefault: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- BUYER SHIPPING ------------------
export const buyerShippingSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  address: z.string(),
  postalCode: z.string().nullable().optional(),
  isDefault: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- FAVORITES ----------------------
export const buyerFavoritesSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  listingId: z.string().uuid(),
  createdAt: z.date().optional(),
});

// --------------------------- CART ---------------------------
export const cartsSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  discountId: z.string().uuid().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const cartItemsSchema = z.object({
  id: z.string().uuid().optional(),
  cartId: z.string().uuid(),
  listingId: z.string().uuid(),
  quantity: z.number().int(),
  unitPriceCents: z.number().int(),
  currency: z.string(),
});

// --------------------------- SELLERS ------------------------
export const sellerSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- SELLER BUSINESS ----------------
export const sellerBusinessSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  brandName: z.string(),
  businessType: z.enum(["individual", "business"]),
  businessAddress: z.string(),
  officialEmail: z.string(),
  phoneNumber: z.string(),
  taxId: z.string().nullable().optional(),
  country: z.string(),
  socialMedia: z.string().nullable().optional(),
  fullName: z.string(),
  idType: z.enum(["passport", "drivers_license", "voters_card", "national_id"]),
  idNumber: z.string().optional(),
  idVerified: z.boolean().optional(),
  bio: z.string().nullable().optional(),
  storeDescription: z.string().nullable().optional(),
  storeLogo: z.string().nullable().optional(),
  storeBanner: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- SELLER PAYMENT -----------------
export const sellerPaymentSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  preferredPayoutMethod: z.enum(["fiat_currency", "cryptocurrency", "both"]),
  fiatPayoutMethod: z.enum(["bank", "paypal", "stripe", "flutterwave"]).nullable().optional(),
  bankCountry: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  accountName: z.string().nullable().optional(),
  accountHolderName: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  walletType: z.enum(["phantom", "solflare", "backpack", "wallet_connect"]).nullable().optional(),
  walletAddress: z.string().nullable().optional(),
  preferredPayoutToken: z.enum(["USDT", "USDC", "solana"]).nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- SELLER SHIPPING ----------------
export const sellerShippingSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  shippingZone: z.string(),
  city: z.string(),
  shippingAddress: z.string(),
  returnAddress: z.string(),
  shippingMethod: z.string().nullable().optional(),
  estimatedShippingTime: z.string().nullable().optional(),
  refundPolicy: z.enum(["no_refunds", "accept_refunds"]).nullable().optional(),
  refundPeriod: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- SELLER ADDITIONAL ------------
export const sellerAdditionalSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  productCategory: z.string(),
  targetAudience: z.enum(["male", "female", "unisex"]),
  localPricing: z.enum(["fiat", "cryptocurrency"]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- BRANDS -------------------------
export const brandsSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- COLLECTIONS -------------------
export const collectionsSchema = z.object({
  id: z.string().uuid().optional(),
  brandId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- PRODUCTS ----------------------
export const productsSchema = z.object({
  id: z.string().uuid().optional(),
  brandId: z.string().uuid(),
  collectionId: z.string().uuid().nullable().optional(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  price: z.number(),
  currency: z.string(),
  sku: z.string(),
  inStock: z.boolean().optional(),
  shipsIn: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- PRODUCT IMAGES -----------------
export const productImagesSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  imageUrl: z.string(),
  position: z.number().int(),
});

// --------------------------- PRODUCT VARIANTS --------------
export const productVariantsSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  size: z.string(),
  colorName: z.string(),
  colorHex: z.string(),
});

// --------------------------- INVENTORY ---------------------
export const inventorySchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int(),
  reservedQuantity: z.number().int(),
});

// --------------------------- LISTINGS ----------------------
export const listingsSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  type: z.enum(["single", "collection"]),
  title: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  priceCents: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  sizesJson: z.string().nullable().optional(),
  colorsAvailable: z.array(
    z.object({
      colorName: z.string(),
      colorHex: z.string()
    })
  ).nullable().optional(),
  supplyCapacity: z.enum(["no_max", "limited"]).nullable().optional(),
  quantityAvailable: z.number().int().nullable().optional(),
  limitedEditionBadge: z.enum(["show_badge", "do_not_show"]).nullable().optional(),
  releaseDuration: z.enum(["24hrs", "48hrs", "72hrs", "1week", "2weeks", "1month"]).nullable().optional(),
  materialComposition: z.string().nullable().optional(),
  additionalTargetAudience: z.enum(["male", "female", "unisex"]).nullable().optional(),
  shippingOption: z.enum(["local", "international", "both"]).nullable().optional(),
  etaDomestic: z.enum(["48hrs", "72hrs", "5_working_days", "1week"]).nullable().optional(),
  etaInternational: z.enum(["custom", "days_7_to_14", "days_14_to_30"]).nullable().optional(),
  itemsJson: z.array(
    z.object({
      title: z.string(),
      priceCents: z.number(),
      image: z.string().nullable(),
      sizes: z.array(z.string()).nullable()
    })
  ).nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- ORDERS ------------------------
export const ordersSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  listingId: z.string().uuid(),
  productTitle: z.string(),
  productImage: z.string().nullable().optional(),
  productCategory: z.string().nullable().optional(),
  customerName: z.string(),
  customerEmail: z.string(),
  orderDate: z.date(),
  paymentMethod: z.string(),
  amountCents: z.number().int(),
  currency: z.string(),
  payoutStatus: z.enum(["in_escrow", "processing", "paid"]),
  deliveryStatus: z.enum(["not_shipped", "in_transit", "delivered"]),
  orderStatus: z.enum(["processing", "shipped", "delivered", "canceled", "returned"]),
  shippingAddress: z.string().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  estimatedArrival: z.date().nullable().optional(),
  deliveredDate: z.date().nullable().optional(),
  recipientEmail: z.string().nullable().optional(),
});

// --------------------------- PAYMENTS ----------------------
export const paymentsSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  listingId: z.string().uuid(),
  orderId: z.string().uuid().nullable().optional(),
  amountCents: z.number().int(),
  currency: z.string(),
  paymentMethod: z.string(),
  provider: z.string(),
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  transactionRef: z.string(),
  transactionId: z.string().nullable().optional(),
  gatewayResponse: z.string().nullable().optional(),
  isRefunded: z.boolean().default(false),
  refundedAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// --------------------------- WEBHOOK EVENTS -----------------
export const webhookEventsSchema = z.object({
  id: z.string().uuid().optional(),
  eventId: z.string(),
  eventType: z.string(),
  status: z.enum(["pending", "processed", "failed"]).default("pending"),
  receivedAt: z.date(),
  processedAt: z.date().nullable().optional(),
});

// --------------------------- DISCOUNTS ---------------------
export const discountSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string(),
  percentage: z.number().int(),
  expiresAt: z.date(),
  createdAt: z.date().optional(),
});

// --------------------------- REVIEWS -----------------------
export const reviewsSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid().nullable().optional(),
  listingId: z.string().uuid(),
  rating: z.number().int(),
  comment: z.string().nullable().optional(),
  createdAt: z.date().optional(),
});

// --------------------------- NOTIFICATIONS -----------------
export const notificationsSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().nullable().optional(),
  title: z.string().nullable().optional(),
  type: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  isStarred: z.boolean().default(false),
  createdAt: z.date().optional(),
});

// --------------------------- EMAIL OTPS --------------------
export const emailOtpsSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  otp: z.string().nullable().optional(),
  codeHash: z.string().nullable().optional(),
  expiresAt: z.date(),
  consumed: z.boolean().default(false),
  createdAt: z.date().optional(),
});