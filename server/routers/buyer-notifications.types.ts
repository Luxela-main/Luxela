/**
 * Shared types for buyer notifications
 * Used across server and client to ensure type consistency
 */

export enum BuyerNotificationCategory {
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PROCESSING = 'order_processing',
  SHIPMENT_READY = 'shipment_ready',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  DELIVERY_FAILED = 'delivery_failed',
  RETURN_REQUEST = 'return_request',
  REFUND_PROCESSED = 'refund_processed',
  REVIEW_REQUEST = 'review_request',
  PRODUCT_BACK_IN_STOCK = 'product_back_in_stock',
  PRICE_DROP = 'price_drop',
  DISPUTE = 'dispute',
  PAYMENT_FAILED = 'payment_failed',
  SYSTEM_ALERT = 'system_alert',
}

export enum BuyerNotificationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface BuyerNotification {
  id: string;
  category: BuyerNotificationCategory;
  severity: BuyerNotificationSeverity;
  title: string;
  message: string;
  relatedEntityId: string | null;
  relatedEntityType: 'order' | 'listing' | 'system' | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}