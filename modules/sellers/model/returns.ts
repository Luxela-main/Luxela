/**
 * Return & Refund Management Models
 * Handles customer returns and refund processing for sellers
 */

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'in_transit'
  | 'received'
  | 'inspected'
  | 'completed'
  | 'canceled';

export type RefundStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'partial'
  | 'canceled';

export type ReturnReason =
  | 'defective'
  | 'damaged'
  | 'not_as_described'
  | 'unwanted'
  | 'too_small'
  | 'too_large'
  | 'color_mismatch'
  | 'wrong_item'
  | 'other';

/**
 * Return Request - submitted by buyer
 */
export interface ReturnRequest {
  id: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  
  // Return details
  reason: ReturnReason;
  reasonDescription: string;
  quantity: number;
  
  // Status tracking
  status: ReturnStatus;
  refundStatus: RefundStatus;
  
  // Shipping information
  returnLabel?: string;
  returnTrackingNumber?: string;
  returnCarrier?: string;
  shippingAddress?: string;
  
  // Timeline
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  shippedAt?: Date;
  receivedAt?: Date;
  inspectedAt?: Date;
  completedAt?: Date;
  
  // Refund information
  originalAmount: number;
  refundAmount: number;
  refundMethod: 'original_payment' | 'store_credit';
  refundId?: string;
  refundProcessedAt?: Date;
  
  // Notes
  sellerNotes?: string;
  buyerNotes?: string;
  inspectionNotes?: string;
  
  // Metadata
  imageUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Return Policy - defined by seller
 */
export interface ReturnPolicy {
  id: string;
  sellerId: string;
  
  // Return window
  returnWindowDays: number; // days after delivery
  
  // Refund percentage
  refundPercentage: number; // 0-100
  
  // Conditions
  conditionRequired: 'unused' | 'used' | 'any';
  originalPackagingRequired: boolean;
  
  // Return shipping
  returnShippingPaid: boolean; // seller paid vs buyer paid
  
  // Settings
  enableReturns: boolean;
  autoApproveReturns: boolean;
  requireImageProof: boolean;
  requireInspection: boolean;
  inspectionDays?: number; // days to complete inspection
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Return Statistics
 */
export interface ReturnStats {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  canceled: number;
  totalRefunded: number;
  averageRefundAmount: number;
  approvalRate: number; // percentage
  completionRate: number; // percentage
}

/**
 * Summary of return for quick view
 */
export interface ReturnSummary {
  id: string;
  orderId: string;
  buyerName: string;
  productName: string;
  reason: ReturnReason;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  amount: number;
  quantity: number;
  requestedAt: Date;
  approvedAt?: Date;
  receivedAt?: Date;
}