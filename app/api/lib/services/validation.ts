/**
 * Enterprise-Grade Validation Service
 * Enforces business rules, data integrity, and operational constraints
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

class ValidationService {
  /**
   * Validate order status transition
   */
  static validateOrderStatusTransition(
    currentStatus: string,
    newStatus: string,
    userRole: string
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Define valid state transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: ['cancelled'],
      cancelled: [],
      returned: [],
    };

    // Check if transition is valid
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      errors.push({
        field: 'newStatus',
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }

    // Role-based restrictions
    if (userRole === 'buyer' && !['cancelled'].includes(newStatus)) {
      errors.push({
        field: 'userRole',
        message: 'Buyers can only cancel orders',
        code: 'INSUFFICIENT_PERMISSION',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate order data integrity
   */
  static validateOrderData(order: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields
    if (!order.orderId) {
      errors.push({
        field: 'orderId',
        message: 'Order ID is required',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!order.buyerId) {
      errors.push({
        field: 'buyerId',
        message: 'Buyer ID is required',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!order.sellerId) {
      errors.push({
        field: 'sellerId',
        message: 'Seller ID is required',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    // Amount validation
    if (order.amountCents && order.amountCents <= 0) {
      errors.push({
        field: 'amountCents',
        message: 'Amount must be greater than zero',
        code: 'INVALID_AMOUNT',
      });
    }

    // Status validation
    const validStatuses = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'returned',
    ];
    if (order.status && !validStatuses.includes(order.status)) {
      errors.push({
        field: 'status',
        message: 'Invalid order status',
        code: 'INVALID_STATUS',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate payment data
   */
  static validatePaymentData(payment: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields
    if (!payment.buyerId) {
      errors.push({
        field: 'buyerId',
        message: 'Buyer ID is required',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!payment.orderId) {
      errors.push({
        field: 'orderId',
        message: 'Order ID is required',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    // Amount validation
    if (!payment.amountCents || payment.amountCents <= 0) {
      errors.push({
        field: 'amountCents',
        message: 'Amount must be greater than zero',
        code: 'INVALID_AMOUNT',
      });
    }

    // Max amount check (fraud prevention)
    const MAX_AMOUNT_CENTS = 100000000; // 1,000,000
    if (payment.amountCents > MAX_AMOUNT_CENTS) {
      errors.push({
        field: 'amountCents',
        message: 'Amount exceeds maximum allowed',
        code: 'AMOUNT_EXCEEDS_LIMIT',
      });
    }

    // Currency validation
    const validCurrencies = ['NGN', 'USD', 'EUR', 'GBP', 'USDC'];
    if (payment.currency && !validCurrencies.includes(payment.currency)) {
      errors.push({
        field: 'currency',
        message: 'Invalid currency',
        code: 'INVALID_CURRENCY',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate refund request
   */
  static validateRefundRequest(refund: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    // Order must exist and be in valid status for refund
    const refundableStatuses = ['delivered', 'shipped'];
    if (
      refund.orderStatus &&
      !refundableStatuses.includes(refund.orderStatus)
    ) {
      errors.push({
        field: 'orderStatus',
        message: `Cannot refund order in ${refund.orderStatus} status`,
        code: 'INVALID_REFUND_STATUS',
      });
    }

    // Refund amount must not exceed order amount
    if (
      refund.refundAmountCents &&
      refund.orderAmountCents &&
      refund.refundAmountCents > refund.orderAmountCents
    ) {
      errors.push({
        field: 'refundAmountCents',
        message: 'Refund amount cannot exceed order amount',
        code: 'REFUND_EXCEEDS_ORDER',
      });
    }

    // Reason required
    if (!refund.reason || refund.reason.trim().length < 10) {
      errors.push({
        field: 'reason',
        message: 'Refund reason must be at least 10 characters',
        code: 'INVALID_REASON',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate inventory operation
   */
  static validateInventoryOperation(
    operation: Record<string, any>
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (!operation.inventoryId) {
      errors.push({
        field: 'inventoryId',
        message: 'Inventory ID is required',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!operation.quantity || operation.quantity <= 0) {
      errors.push({
        field: 'quantity',
        message: 'Quantity must be greater than zero',
        code: 'INVALID_QUANTITY',
      });
    }

    // Check if sufficient inventory available
    if (operation.currentQuantity !== undefined) {
      if (operation.quantity > operation.currentQuantity) {
        errors.push({
          field: 'quantity',
          message: `Only ${operation.currentQuantity} items available`,
          code: 'INSUFFICIENT_INVENTORY',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate tracking information
   */
  static validateTrackingInfo(tracking: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    if (tracking.trackingNumber) {
      // Validate tracking number format (basic)
      if (tracking.trackingNumber.length < 5) {
        errors.push({
          field: 'trackingNumber',
          message: 'Tracking number is too short',
          code: 'INVALID_TRACKING_FORMAT',
        });
      }
    }

    if (tracking.estimatedDelivery) {
      const deliveryDate = new Date(tracking.estimatedDelivery);
      const now = new Date();

      // Estimated delivery must be in the future
      if (deliveryDate < now) {
        errors.push({
          field: 'estimatedDelivery',
          message: 'Estimated delivery must be in the future',
          code: 'INVALID_DELIVERY_DATE',
        });
      }

      // Sanity check: not more than 365 days in future
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 365);
      if (deliveryDate > maxDate) {
        errors.push({
          field: 'estimatedDelivery',
          message: 'Estimated delivery is too far in the future',
          code: 'UNREASONABLE_DELIVERY_DATE',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check business rule violations
   */
  static checkBusinessRuleViolations(
    operation: string,
    context: Record<string, any>
  ): ValidationError[] {
    const violations: ValidationError[] = [];

    switch (operation) {
      case 'duplicate_order_check':
        // Check if user is trying to place duplicate order too quickly
        if (
          context.lastOrderTime &&
          Date.now() - context.lastOrderTime < 5000
        ) {
          violations.push({
            field: 'operation',
            message: 'Please wait before placing another order',
            code: 'DUPLICATE_ORDER_PROTECTION',
          });
        }
        break;

      case 'rate_limit_check':
        // Check rate limits
        if (
          context.requestCount &&
          context.requestCount > context.rateLimit
        ) {
          violations.push({
            field: 'operation',
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
          });
        }
        break;

      case 'seller_availability':
        // Check if seller is active
        if (context.sellerStatus !== 'active') {
          violations.push({
            field: 'seller',
            message: 'Seller is not available',
            code: 'SELLER_UNAVAILABLE',
          });
        }
        break;
    }

    return violations;
  }
}

export default ValidationService;