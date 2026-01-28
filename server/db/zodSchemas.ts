import { z } from "zod";

// ========================== ENUMS ==========================

const rolesEnum = z.enum(['buyer', 'seller', 'admin']);
const businessTypeEnum = z.enum(['individual', 'sole_proprietorship', 'llc', 'corporation', 'partnership', 'cooperative', 'non_profit', 'trust', 'joint_venture']);
const idTypeEnum = z.enum(['national_id', 'passport', 'drivers_license', 'voters_card', 'business_license', 'tax_id', 'business_registration']);
const shippingTypeEnum = z.enum(['same_day', 'next_day', 'express', 'standard', 'domestic', 'international', 'both']);
const shippingEtaEnum = z.enum(['same_day', 'next_day', '48hrs', '72hrs', '5_working_days', '1_2_weeks', '2_3_weeks', 'custom']);
const refundPolicyEnum = z.enum(['no_refunds', '48hrs', '72hrs', '5_working_days', '1week', '14days', '30days', '60days', 'store_credit']);
const preferredPayoutMethodEnum = z.enum(['fiat_currency', 'cryptocurrency', 'both']);
const fiatPayoutMethodEnum = z.enum(['bank', 'paypal', 'stripe', 'flutterwave', 'tsara', 'mobile_money', 'other']);
const walletTypeEnum = z.enum(['phantom', 'solflare', 'backpack', 'wallet_connect', 'magic_eden', 'ledger_live']);
const payoutTokenEnum = z.enum(['USDT', 'USDC', 'solana']);
const productCategoryEnum = z.enum(['men_clothing', 'women_clothing', 'men_shoes', 'women_shoes', 'accessories', 'merch', 'others']);
const targetAudienceEnum = z.enum(['male', 'female', 'unisex']);
const localPricingEnum = z.enum(['fiat', 'cryptocurrency', 'both']);
const socialMediaPlatformEnum = z.enum(['x', 'instagram', 'facebook', 'whatsapp', 'tiktok']);
const listingTypeEnum = z.enum(['single', 'collection']);
const supplyCapacityEnum = z.enum(['no_max', 'limited']);
const limitedEditionBadgeEnum = z.enum(['show_badge', 'do_not_show']);
const shippingOptionEnum = z.enum(['local', 'international', 'both']);
const orderStatusEnum = z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'returned']);
const payoutStatusEnum = z.enum(['in_escrow', 'processing', 'paid']);
const ticketStatusEnum = z.enum(['open', 'in_progress', 'resolved', 'closed']);
const ticketPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
const ticketCategoryEnum = z.enum(['general_inquiry', 'technical_issue', 'payment_problem', 'order_issue', 'refund_request', 'account_issue', 'listing_help', 'other']);
const deliveryStatusEnum = z.enum(['not_shipped', 'in_transit', 'delivered']);
const paymentMethodEnum = z.enum(['card', 'bank_transfer', 'crypto', 'paypal', 'stripe', 'flutterwave', 'tsara']);
const notificationTypeEnum = z.enum(['purchase', 'review', 'comment', 'reminder', 'order_confirmed', 'payment_failed', 'refund_issued', 'delivery_confirmed']);
const paymentStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']);
const webhookEventStatusEnum = z.enum(['pending', 'processed', 'failed']);
const paymentProviderEnum = z.enum(['tsara', 'flutterwave', 'stripe', 'paypal']);
const refundStatusEnum = z.enum(['pending', 'return_requested', 'return_approved', 'return_rejected', 'refunded', 'canceled']);
const ledgerStatusEnum = z.enum(['pending', 'completed', 'failed', 'reversed']);
const transactionTypeEnum = z.enum(['sale', 'refund', 'return_request', 'return_approved', 'refund_initiated', 'refund_completed', 'commission', 'payout']);
const reservationStatusEnum = z.enum(['active', 'confirmed', 'released', 'expired']);
const transitionTypeEnum = z.enum(['automatic', 'manual', 'system']);
const refundTypeEnum = z.enum(['full', 'partial', 'store_credit']);
const holdStatusEnum = z.enum(['active', 'released', 'refunded', 'expired']);
const receivedConditionEnum = z.enum(['excellent', 'good', 'acceptable', 'poor']);
const nftTierEnum = z.enum(['bronze', 'silver', 'gold', 'platinum']);
const discountTypeEnum = z.enum(['percentage', 'fixed_amount', 'buy_one_get_one', 'free_shipping']);
const discountStatusEnum = z.enum(['active', 'inactive', 'expired']);
const payoutScheduleEnum = z.enum(['immediate', 'daily', 'weekly', 'bi_weekly', 'monthly']);

// ========================== USERS ==========================
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  oauthId: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  email: z.string().email(),
  password: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().nullable().optional(),
  role: rolesEnum.default('buyer'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== BUYERS ==========================
export const buyerSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== PROFILES ==========================
export const profileSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  displayName: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== BUYER ACCOUNT DETAILS ==========================
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
  orderUpdates: z.boolean().default(true),
  promotionalEmails: z.boolean().default(true),
  securityAlerts: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== BUYER BILLING ADDRESS ==========================
export const buyerBillingAddressSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  houseAddress: z.string(),
  city: z.string(),
  postalCode: z.string(),
  isDefault: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== BUYER SHIPPING ==========================
export const buyerShippingSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  state: z.string(),
  city: z.string(),
  address: z.string(),
  postalCode: z.string(),
  isDefault: z.boolean().default(true),
});

// ========================== BUYER FAVORITES ==========================
export const buyerFavoritesSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  listingId: z.string().uuid(),
  createdAt: z.date().optional(),
});

// ========================== SELLERS ==========================
export const sellerSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  brandId: z.string().uuid().nullable().optional(),
  payoutMethods: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== SELLER BUSINESS ==========================
export const sellerBusinessSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  brandName: z.string(),
  businessType: businessTypeEnum,
  businessAddress: z.string(),
  officialEmail: z.string(),
  phoneNumber: z.string(),
  countryCode: z.string().nullable().optional(),
  country: z.string(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  socialMediaPlatform: socialMediaPlatformEnum.nullable().optional(),
  socialMedia: z.string().nullable().optional(),
  fullName: z.string(),
  idType: idTypeEnum,
  idNumber: z.string().nullable().optional(),
  idVerified: z.boolean().optional(),
  bio: z.string().nullable().optional(),
  storeDescription: z.string().nullable().optional(),
  storeLogo: z.string().nullable().optional(),
  storeBanner: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== SELLER SHIPPING ==========================
export const sellerShippingSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  shippingZone: z.string(),
  city: z.string(),
  shippingAddress: z.string(),
  returnAddress: z.string(),
  shippingType: shippingTypeEnum,
  estimatedShippingTime: shippingEtaEnum,
  refundPolicy: refundPolicyEnum,
  refundPeriod: shippingEtaEnum.nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== SELLER PAYMENT ==========================
export const sellerPaymentSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  preferredPayoutMethod: preferredPayoutMethodEnum,
  fiatPayoutMethod: fiatPayoutMethodEnum.nullable().optional(),
  bankCountry: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  accountName: z.string().nullable().optional(),
  accountHolderName: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  walletType: walletTypeEnum.nullable().optional(),
  walletAddress: z.string().nullable().optional(),
  preferredPayoutToken: payoutTokenEnum.nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== SELLER ADDITIONAL ==========================
export const sellerAdditionalSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  productCategory: productCategoryEnum.nullable().optional(),
  targetAudience: targetAudienceEnum.nullable().optional(),
  localPricing: localPricingEnum.nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== BRANDS ==========================
export const brandsSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  heroImage: z.string().nullable().optional(),
  logoImage: z.string().nullable().optional(),
  rating: z.string().nullable().optional(),
  totalProducts: z.number().int().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== COLLECTIONS ==========================
export const collectionsSchema = z.object({
  id: z.string().uuid().optional(),
  brandId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== COLLECTION ITEMS ==========================
export const collectionItemsSchema = z.object({
  id: z.string().uuid().optional(),
  collectionId: z.string().uuid(),
  productId: z.string().uuid(),
  position: z.number().int().default(0),
  createdAt: z.date().optional(),
});

// ========================== PRODUCTS ==========================
export const productsSchema = z.object({
  id: z.string().uuid().optional(),
  brandId: z.string().uuid(),
  collectionId: z.string().uuid().nullable().optional(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  category: productCategoryEnum.nullable().optional(),
  price: z.string(),
  currency: z.string().default('SOL'),
  type: z.string().nullable().optional(),
  sku: z.string(),
  inStock: z.boolean().optional(),
  shipsIn: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== PRODUCT IMAGES ==========================
export const productImagesSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  imageUrl: z.string(),
  position: z.number().int(),
});

// ========================== PRODUCT VARIANTS ==========================
export const productVariantsSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  size: z.string(),
  colorName: z.string(),
  colorHex: z.string(),
});

// ========================== INVENTORY ==========================
export const inventorySchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().default(0),
  reservedQuantity: z.number().int().default(0),
});

// ========================== LISTINGS ==========================
export const listingsSchema = z.object({
  id: z.string().uuid().optional(),
  collectionId: z.string().uuid().nullable().optional(),
  productId: z.string().uuid(),
  sellerId: z.string().uuid(),
  type: listingTypeEnum,
  title: z.string(),
  description: z.string().nullable().optional(),
  category: productCategoryEnum.nullable().optional(),
  image: z.string().nullable().optional(),
  imagesJson: z.string().nullable().optional(),
  priceCents: z.number().int().nullable().optional(),
  currency: z.string().nullable().optional(),
  sizesJson: z.string().nullable().optional(),
  supplyCapacity: supplyCapacityEnum.nullable().optional(),
  quantityAvailable: z.number().int().nullable().optional(),
  limitedEditionBadge: limitedEditionBadgeEnum.nullable().optional(),
  releaseDuration: z.string().nullable().optional(),
  materialComposition: z.string().nullable().optional(),
  colorsAvailable: z.string().nullable().optional(),
  additionalTargetAudience: targetAudienceEnum.nullable().optional(),
  shippingOption: shippingOptionEnum.nullable().optional(),
  etaDomestic: shippingEtaEnum.nullable().optional(),
  etaInternational: shippingEtaEnum.nullable().optional(),
  refundPolicy: refundPolicyEnum.nullable().optional(),
  localPricing: localPricingEnum.nullable().optional(),
  itemsJson: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== ORDERS ==========================
export const ordersSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  listingId: z.string().uuid(),
  productTitle: z.string(),
  productImage: z.string().nullable().optional(),
  productCategory: productCategoryEnum,
  customerName: z.string(),
  customerEmail: z.string(),
  orderDate: z.date(),
  paymentMethod: paymentMethodEnum,
  amountCents: z.number().int(),
  currency: z.string(),
  payoutStatus: payoutStatusEnum.default('in_escrow'),
  deliveryStatus: deliveryStatusEnum.default('not_shipped'),
  orderStatus: orderStatusEnum.default('processing'),
  shippingAddress: z.string().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  estimatedArrival: z.date().nullable().optional(),
  deliveredDate: z.date().nullable().optional(),
  recipientEmail: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== PAYMENTS ==========================
export const paymentsSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  listingId: z.string().uuid(),
  orderId: z.string().uuid().nullable().optional(),
  amountCents: z.number().int(),
  currency: z.string(),
  paymentMethod: paymentMethodEnum,
  provider: paymentProviderEnum,
  status: paymentStatusEnum.default('pending'),
  transactionRef: z.string(),
  gatewayResponse: z.string().nullable().optional(),
  isRefunded: z.boolean().default(false),
  refundedAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== REFUNDS ==========================
export const refundsSchema = z.object({
  id: z.string().uuid().optional(),
  orderId: z.string().uuid(),
  paymentId: z.string().uuid().nullable().optional(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  amountCents: z.number().int(),
  currency: z.string(),
  refundType: z.string(),
  reason: z.string(),
  refundStatus: refundStatusEnum.default('pending'),
  description: z.string().nullable().optional(),
  rmaNumber: z.string().nullable().optional(),
  images: z.string().nullable().optional(),
  sellerNote: z.string().nullable().optional(),
  restockPercentage: z.number().int().nullable().optional(),
  receivedCondition: receivedConditionEnum.nullable().optional(),
  notes: z.string().nullable().optional(),
  requestedAt: z.date().nullable().optional(),
  processedAt: z.date().nullable().optional(),
  refundedAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
});

// ========================== PAYMENT HOLDS ==========================
export const paymentHoldsSchema = z.object({
  id: z.string().uuid().optional(),
  orderId: z.string().uuid(),
  paymentId: z.string().uuid(),
  amountCents: z.number().int(),
  currency: z.string(),
  holdStatus: holdStatusEnum.default('active'),
  reason: z.string().nullable().optional(),
  refundedAt: z.date().nullable().optional(),
  releasedAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== SCHEDULED PAYOUTS ==========================
export const scheduledPayoutsSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  amountCents: z.number().int(),
  currency: z.string().default('NGN'),
  payoutMethodId: z.string(),
  schedule: payoutScheduleEnum,
  scheduledDate: z.date().nullable().optional(),
  frequency: z.string().nullable().optional(),
  status: z.string().default('pending'),
  lastProcessedAt: z.date().nullable().optional(),
  nextScheduledAt: z.date().nullable().optional(),
  note: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== FINANCIAL LEDGER ==========================
export const financialLedgerSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  orderId: z.string().uuid().nullable().optional(),
  paymentId: z.string().uuid().nullable().optional(),
  transactionType: transactionTypeEnum,
  amountCents: z.number().int(),
  currency: z.string(),
  status: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.date().optional(),
});

// ========================== WEBHOOK EVENTS ==========================
export const webhookEventsSchema = z.object({
  id: z.string().uuid().optional(),
  eventId: z.string(),
  eventType: z.string(),
  status: webhookEventStatusEnum.default('pending'),
  receivedAt: z.date(),
  processedAt: z.date().nullable().optional(),
});

// ========================== WEBHOOK LOGS ==========================
const paymentProviderEnumZod = z.enum(['tsara', 'stripe', 'paypal', 'flutterwave']);
export const webhookLogsSchema = z.object({
  id: z.string().uuid().optional(),
  provider: paymentProviderEnumZod,
  eventType: z.string(),
  externalEventId: z.string().nullable().optional(),
  paymentId: z.string().uuid().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
  status: webhookEventStatusEnum.default('pending'),
  errorMessage: z.string().nullable().optional(),
  retryCount: z.number().int().default(0),
  lastRetryAt: z.date().nullable().optional(),
  nextRetryAt: z.date().nullable().optional(),
  receivedAt: z.date(),
  processedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ========================== SALES ==========================
export const salesSchema = z.object({
  id: z.string().uuid().optional(),
  orderId: z.string().uuid(),
  sellerId: z.string().uuid(),
  buyerId: z.string().uuid(),
  listingId: z.string().uuid(),
  quantity: z.number().int().default(1),
  totalCents: z.number().int(),
  currency: z.string(),
  isRefunded: z.boolean().default(false),
  refundedAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== CARTS ==========================
export const cartsSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  discountId: z.string().uuid().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== CART ITEMS ==========================
export const cartItemsSchema = z.object({
  id: z.string().uuid().optional(),
  cartId: z.string().uuid(),
  listingId: z.string().uuid(),
  quantity: z.number().int(),
  unitPriceCents: z.number().int(),
  currency: z.string(),
});

// ========================== NOTIFICATIONS ==========================
export const notificationsSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  buyerId: z.string().uuid().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
  type: notificationTypeEnum,
  message: z.string(),
  isRead: z.boolean().default(false),
  isStarred: z.boolean().default(false),
  createdAt: z.date().optional(),
});

// ========================== REVIEWS ==========================
export const reviewsSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  listingId: z.string().uuid(),
  rating: z.number().int(),
  comment: z.string().nullable().optional(),
  createdAt: z.date().optional(),
});

// ========================== DISCOUNTS ==========================
export const discountSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string(),
  percentOff: z.number().int().nullable().optional(),
  amountOffCents: z.number().int().nullable().optional(),
  active: z.boolean().default(true),
  expiresAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
});

// ========================== FAQs ==========================
export const faqsSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string(),
  answer: z.string(),
  category: z.string(),
  userRole: rolesEnum.default('buyer'),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
  views: z.number().int().default(0),
  helpful: z.number().int().default(0),
  notHelpful: z.number().int().default(0),
  tags: z.string().nullable().optional(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== LOYALTY NFTs ==========================
export const loyaltyNFTsSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  tier: nftTierEnum,
  title: z.string(),
  description: z.string().nullable().optional(),
  image: z.string(),
  loyaltyPoints: z.number().int(),
  earnedDate: z.date(),
  rarity: z.string(),
  property: z.string(),
  createdAt: z.date().optional(),
});

// ========================== SUPPORT TICKETS ==========================
export const supportTicketsSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
  subject: z.string(),
  description: z.string(),
  category: ticketCategoryEnum,
  priority: ticketPriorityEnum.default('medium'),
  status: ticketStatusEnum.default('open'),
  assignedTo: z.string().uuid().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  resolvedAt: z.date().nullable().optional(),
});

// ========================== SUPPORT TICKET REPLIES ==========================
export const supportTicketRepliesSchema = z.object({
  id: z.string().uuid().optional(),
  ticketId: z.string().uuid(),
  senderId: z.string().uuid(),
  senderRole: rolesEnum,
  message: z.string(),
  attachmentUrl: z.string().nullable().optional(),
  createdAt: z.date().optional(),
});

// ========================== INVENTORY RESERVATIONS ==========================
export const inventoryReservationsSchema = z.object({
  id: z.string().uuid().optional(),
  inventoryId: z.string().uuid(),
  orderId: z.string().uuid(),
  quantity: z.number().int(),
  status: z.string().default('reserved'),
  reservedAt: z.date(),
  releasedAt: z.date().nullable().optional(),
  confirmedAt: z.date().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ========================== ORDER STATE TRANSITIONS ==========================
export const orderStateTransitionsSchema = z.object({
  id: z.string().uuid().optional(),
  orderId: z.string().uuid(),
  fromStatus: orderStatusEnum,
  toStatus: orderStatusEnum,
  reason: z.string().nullable().optional(),
  triggeredBy: z.string().uuid(),
  triggeredByRole: rolesEnum,
  metadata: z.string().nullable().optional(),
  createdAt: z.date().optional(),
});

// ========================== SHIPPING RATES ==========================
export const shippingRatesSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  shippingZone: z.string(),
  minWeight: z.string(),
  maxWeight: z.string(),
  rateCents: z.number().int(),
  currency: z.string(),
  estimatedDays: z.number().int(),
  shippingType: shippingTypeEnum,
  active: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== CATEGORIES ==========================
export const categoriesSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== SUBCATEGORIES ==========================
export const subcategoriesSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== FOLLOWS ==========================
export const followsSchema = z.object({
  id: z.string().uuid().optional(),
  followerId: z.string().uuid(),
  followingId: z.string().uuid(),
  createdAt: z.date().optional(),
});

// ========================== CONVERSATIONS ==========================
export const conversationsSchema = z.object({
  id: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  lastMessageAt: z.date(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================== MESSAGES ==========================
export const messagesSchema = z.object({
  id: z.string().uuid().optional(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  senderRole: rolesEnum,
  content: z.string(),
  isRead: z.boolean().default(false),
  createdAt: z.date().optional(),
});

// ========================== EMAIL OTPS ==========================
export const emailOtpsSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  otp: z.string().nullable().optional(),
  codeHash: z.string().nullable().optional(),
  expiresAt: z.date(),
  consumed: z.boolean().default(false),
  createdAt: z.date().optional(),
});

// ========================== ENTERPRISE SUPPORT ==========================
const slaPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
const escalationStatusEnum = z.enum(['pending', 'triggered', 'resolved', 'cancelled']);

export const supportTeamMembersSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  department: z.string().nullable().optional(),
  status: z.string().default('active'),
  maxCapacity: z.number().default(10),
  currentLoadCount: z.number().default(0),
  responseTimeAverage: z.number().nullable().optional(),
  resolutionRate: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const slaMetricsSchema = z.object({
  id: z.string().uuid().optional(),
  policyName: z.string(),
  priority: slaPriorityEnum,
  responseTimeMinutes: z.number(),
  resolutionTimeMinutes: z.number(),
  workingHoursOnly: z.boolean().default(false),
  active: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const slaTrackingSchema = z.object({
  id: z.string().uuid().optional(),
  ticketId: z.string().uuid(),
  slaMetricId: z.string().uuid(),
  responseDeadline: z.date(),
  resolutionDeadline: z.date(),
  responseBreached: z.boolean().default(false),
  resolutionBreached: z.boolean().default(false),
  breachNotificationSentAt: z.date().nullable().optional(),
  actualResponseTime: z.number().nullable().optional(),
  actualResolutionTime: z.number().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const escalationRulesSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  trigger: z.string(),
  triggerValue: z.string().nullable().optional(),
  action: z.string(),
  active: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const supportAuditLogsSchema = z.object({
  id: z.string().uuid().optional(),
  ticketId: z.string().uuid().nullable().optional(),
  actionType: z.string(),
  performedBy: z.string().uuid(),
  performedByRole: z.string(),
  oldValue: z.string().nullable().optional(),
  newValue: z.string().nullable().optional(),
  metadata: z.string().nullable().optional(),
  createdAt: z.date().optional(),
});

export const supportAnalyticsSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.date(),
  totalTicketsCreated: z.number().default(0),
  totalTicketsResolved: z.number().default(0),
  totalTicketsOpen: z.number().default(0),
  averageResponseTime: z.number().nullable().optional(),
  averageResolutionTime: z.number().nullable().optional(),
  slaBreachCount: z.number().default(0),
  customerSatisfactionScore: z.string().nullable().optional(),
  agentUtilization: z.string().nullable().optional(),
  createdAt: z.date().optional(),
});