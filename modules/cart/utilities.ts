/**
 * CART UTILITIES - Approval & Payment Validation
 * 
 * Utilities for validating cart items are approved, handling
 * inventory checks, and ensuring payment safety throughout
 * the checkout flow.
 */

export interface ValidatedCartItem {
  id: string;
  listingId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  status: 'approved' | 'pending_review' | 'rejected' | 'delisted';
  isAvailable: boolean;
  warningMessage?: string;
}

export interface CartValidationResult {
  isValid: boolean;
  approvedItems: ValidatedCartItem[];
  unapprovedItems: ValidatedCartItem[];
  warnings: string[];
  errors: string[];
  canCheckout: boolean;
}

/**
 * Validate cart items based on approval status
 * Separates approved from unapproved items with detailed feedback
 */
export function validateCartApproval(items: any[]): CartValidationResult {
  const result: CartValidationResult = {
    isValid: true,
    approvedItems: [],
    unapprovedItems: [],
    warnings: [],
    errors: [],
    canCheckout: false,
  };

  items.forEach((item) => {
    const validatedItem: ValidatedCartItem = {
      id: item.id,
      listingId: item.listingId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      status: item.status || 'approved',
      isAvailable: item.status === 'approved',
    };

    if (item.status === 'approved' || !item.status) {
      result.approvedItems.push(validatedItem);
    } else {
      result.unapprovedItems.push(validatedItem);
      result.isValid = false;

      if (item.status === 'pending_review') {
        validatedItem.warningMessage = `${item.name} is pending approval`;
        result.warnings.push(`"${item.name}" is still pending admin approval`);
      } else if (item.status === 'rejected') {
        validatedItem.warningMessage = `${item.name} was rejected`;
        result.errors.push(`"${item.name}" was rejected and cannot be purchased`);
      } else if (item.status === 'delisted') {
        validatedItem.warningMessage = `${item.name} is no longer available`;
        result.errors.push(`"${item.name}" is no longer available`);
      } else {
        validatedItem.warningMessage = `${item.name} is unavailable`;
        result.errors.push(`"${item.name}" is unavailable`);
      }
    }
  });

  // Can only checkout if all items are approved
  result.canCheckout = result.unapprovedItems.length === 0 && result.approvedItems.length > 0;

  return result;
}

/**
 * Check for inventory issues in cart
 */
export function validateInventory(
  items: any[]
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  items.forEach((item) => {
    if (item.stock && item.quantity > item.stock) {
      warnings.push(
        `Only ${item.stock} available for "${item.name}", but you have ${item.quantity} in cart`
      );
    }

    if (item.stock === 0) {
      warnings.push(`"${item.name}" is out of stock`);
    }
  });

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Format cart validation messages for UI display
 */
export function formatValidationMessage(result: CartValidationResult): string[] {
  const messages: string[] = [];

  if (result.unapprovedItems.length > 0) {
    const count = result.unapprovedItems.length;
    messages.push(
      `⚠️ ${count} item${count > 1 ? 's' : ''} ${count > 1 ? 'are' : 'is'} no longer available`
    );
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach((warning) => messages.push(`⚠️ ${warning}`));
  }

  if (result.errors.length > 0) {
    result.errors.forEach((error) => messages.push(`❌ ${error}`));
  }

  return messages;
}

/**
 * Check if user can proceed to checkout
 */
export function canProceedToCheckout(
  items: any[]
): { allowed: boolean; reason?: string } {
  if (!items || items.length === 0) {
    return { allowed: false, reason: 'Your cart is empty' };
  }

  const validation = validateCartApproval(items);
  const inventoryCheck = validateInventory(items);

  if (!validation.canCheckout) {
    return {
      allowed: false,
      reason: validation.errors[0] || 'Some items are not available',
    };
  }

  if (!inventoryCheck.valid) {
    return {
      allowed: false,
      reason: inventoryCheck.warnings[0] || 'Some items are out of stock',
    };
  }

  return { allowed: true };
}

/**
 * Prepare cart for payment - ensure all items are validated
 */
export function prepareCartForPayment(items: any[]) {
  const validation = validateCartApproval(items);
  const inventory = validateInventory(items);

  return {
    validation,
    inventory,
    ready: validation.isValid && inventory.valid,
    approvedTotal: validation.approvedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),
    rejectedTotal: validation.unapprovedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),
  };
}

/**
 * Filter cart to only approved items
 * Use this when preparing final order
 */
export function getApprovedCartItems(items: any[]) {
  const validation = validateCartApproval(items);
  return validation.approvedItems;
}

/**
 * Get cart summary with validation
 */
export function getCartSummary(items: any[]) {
  const validation = validateCartApproval(items);
  const inventory = validateInventory(items);

  const subtotal = validation.approvedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shipping = subtotal > 50000 ? 0 : 2000; // Free over ₦50,000
  const total = subtotal + shipping;

  return {
    subtotal,
    shipping,
    total,
    itemCount: validation.approvedItems.length,
    unapprovedCount: validation.unapprovedItems.length,
    hasWarnings: validation.warnings.length > 0 || !inventory.valid,
    canCheckout: validation.canCheckout && inventory.valid,
    messages: [
      ...formatValidationMessage(validation),
      ...(inventory.valid ? [] : inventory.warnings.map((w) => `⚠️ ${w}`)),
    ],
  };
}

/**
 * Validate customer data before payment
 */
export function validateCustomerData(customer: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!customer.name || customer.name.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters)');
  }

  if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    errors.push('Valid email address is required');
  }

  if (!customer.shippingCity) {
    errors.push('Shipping city is required');
  }

  if (!customer.shippingAddress) {
    errors.push('Shipping address is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Safe payment initialization check
 * Run all validations before sending to server
 */
export function validatePaymentReadiness(cart: any, customer: any): {
  ready: boolean;
  errors: string[];
  warnings: string[];
} {
  const cartCheck = getCartSummary(cart.items);
  const customerCheck = validateCustomerData(customer);

  const errors: string[] = [...customerCheck.errors];
  const warnings: string[] = [];

  if (!cartCheck.canCheckout) {
    errors.push('Please resolve cart issues before checkout');
  }

  if (cartCheck.hasWarnings && cartCheck.unapprovedCount > 0) {
    errors.push('Remove unavailable items from cart');
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings,
  };
}

export default {
  validateCartApproval,
  validateInventory,
  formatValidationMessage,
  canProceedToCheckout,
  prepareCartForPayment,
  getApprovedCartItems,
  getCartSummary,
  validateCustomerData,
  validatePaymentReadiness,
};