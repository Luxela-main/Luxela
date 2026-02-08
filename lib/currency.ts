/**
 * Format amount to Nigerian Naira (NGN) currency
 * @param amount - Amount in cents (divide by 100 for display)
 * @param amountInNaira - If true, amount is already in Naira. If false, convert from cents
 * @returns Formatted Naira string
 */
export function formatNaira(
  amount: number | null | undefined,
  amountInNaira = false
): string {
  if (amount === null || amount === undefined) {
    return '₦0.00';
  }

  const nairaAmount = amountInNaira ? amount : amount / 100;

  return `₦${nairaAmount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format amount for display in tables/cards (cents to naira)
 */
export function formatCentToNaira(centAmount: number | null | undefined): string {
  return formatNaira(centAmount, false);
}

/**
 * Parse string or number to Naira amount
 */
export function toNaira(amount: string | number): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(num) ? 0 : num;
}