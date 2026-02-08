/**
 * Buyer Module Types
 */

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'canceled'
  | 'returned';

export type DeliveryStatus = 
  | 'not_shipped'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'returned';

export type PayoutStatus = 
  | 'in_escrow'
  | 'released'
  | 'refunded'
  | 'disputed';

export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay'
  | 'bank_transfer';

export type ProductCategory = 
  | 'mens'
  | 'womens'
  | 'kids'
  | 'accessories'
  | 'footwear'
  | 'outerwear'
  | 'sportswear'
  | 'formal'
  | 'casual'
  | 'streetwear';

/**
 * Order Line Item - represents a single product in an order
 */
export interface OrderLineItem {
  productId?: string;
  listingId: string;
  productTitle: string;
  productImage?: string;
  productCategory: ProductCategory;
  quantity: number;
  priceCents: number;
  currency: string;
}

/**
 * Order - Main order data structure
 */
export interface Order {
  orderId: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  
  // Product Information
  productTitle: string;
  productImage?: string;
  productCategory: ProductCategory;
  
  // Customer Information
  customerName: string;
  customerEmail: string;
  recipientEmail?: string;
  
  // Payment Information
  paymentMethod: PaymentMethod;
  amountCents: number;
  currency: string;
  payoutStatus: PayoutStatus;
  
  // Status Information
  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;
  
  // Shipping Information
  shippingAddress?: string;
  trackingNumber?: string;
  estimatedArrival?: Date;
  deliveredDate?: Date;
  
  // Timestamps
  orderDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order Details - Extended order information with all details
 */
export interface OrderDetails extends Order {
  // Additional tracking information
  processingDate?: Date;
  shippingDate?: Date;
  transitDate?: Date;
  
  // Seller information
  sellerName?: string;
  sellerEmail?: string;
  sellerRating?: number;
  
  // Return/Refund information
  returnEligible?: boolean;
  returnDeadline?: Date;
}

/**
 * Purchase History Response - Paginated list of orders
 */
export interface PurchaseHistoryResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Order Filter Options
 */
export type OrderFilterType = 'all' | 'ongoing' | 'delivered' | 'canceled';

/**
 * Order Summary Stats
 */
export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  canceled: number;
  totalSpent: number;
}

/**
 * Tracking Step
 */
export interface TrackingStep {
  label: string;
  completed: boolean;
  date?: Date;
  description?: string;
}

/**
 * Order Confirmation Payload
 */
export interface ConfirmDeliveryPayload {
  orderId: string;
  confirmedAt?: Date;
}

/**
 * Error Response
 */
export interface OrderError {
  code: string;
  message: string;
  orderId?: string;
}