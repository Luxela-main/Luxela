/**
 * Shared types for seller notifications
 * Used across server and client to ensure type consistency
 */

export enum SellerNotificationCategory {
  NEW_ORDER = 'new_order',
  ORDER_CONFIRMED = 'order_confirmed',
  PAYMENT_RECEIVED = 'payment_received',
  RETURN_REQUEST = 'return_request',
  RETURN_APPROVED = 'return_approved',
  RETURN_REJECTED = 'return_rejected',
  REFUND_ISSUED = 'refund_issued',
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',
  LISTING_PENDING_REVIEW = 'listing_pending_review',
  LISTING_APPROVED = 'listing_approved',
  LISTING_REJECTED = 'listing_rejected',
  REVISION_REQUESTED = 'revision_requested',
  LOW_INVENTORY = 'low_inventory',
  OUT_OF_STOCK = 'out_of_stock',
  REVIEW_RECEIVED = 'review_received',
  RATING_ALERT = 'rating_alert',
  PAYOUT_PROCESSED = 'payout_processed',
  PAYOUT_FAILED = 'payout_failed',
  SYSTEM_ALERT = 'system_alert',
}

export enum SellerNotificationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface SellerNotification {
  id: string;
  category: SellerNotificationCategory;
  severity: SellerNotificationSeverity;
  title: string;
  message: string;
  relatedEntityId: string | null;
  relatedEntityType: 'order' | 'listing' | 'return' | 'dispute' | 'review' | 'system' | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}