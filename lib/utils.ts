import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Accepts ClassValue[] or string[] safely
export function cn(...inputs: (ClassValue | string)[]) {
  return twMerge(clsx(...inputs));
}

export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function formatCurrency(
  amount: number,
  options?: {
    currency?: string;
    truncate?: boolean;
  }
): string {
  const { currency = "NGN", truncate = false } = options || {};
  const currencySymbol = currency === "NGN" ? "₦" : "$";

  if (truncate) {
    // Always use abbreviated format for truncate mode
    const absAmount = Math.abs(amount);
    let abbreviatedAmount: string;

    if (absAmount >= 1_000_000_000_000) {
      abbreviatedAmount = (amount / 1_000_000_000_000).toFixed(1) + "T";
    } else if (absAmount >= 1_000_000_000) {
      abbreviatedAmount = (amount / 1_000_000_000).toFixed(1) + "B";
    } else if (absAmount >= 1_000_000) {
      abbreviatedAmount = (amount / 1_000_000).toFixed(1) + "M";
    } else if (absAmount >= 1_000) {
      abbreviatedAmount = (amount / 1_000).toFixed(1) + "K";
    } else {
      abbreviatedAmount = amount.toFixed(0);
    }

    abbreviatedAmount = abbreviatedAmount.replace(/\.0([A-Z])$/, "$1");
    return currencySymbol + abbreviatedAmount;
  }

  // For very large numbers, use abbreviated format
  const absAmount = Math.abs(amount);
  let abbreviatedAmount: string;

  if (absAmount >= 1_000_000_000_000) {
    // Trillions
    abbreviatedAmount = (amount / 1_000_000_000_000).toFixed(1) + "T";
  } else if (absAmount >= 1_000_000_000) {
    // Billions
    abbreviatedAmount = (amount / 1_000_000_000).toFixed(1) + "B";
  } else if (absAmount >= 1_000_000) {
    // Millions
    abbreviatedAmount = (amount / 1_000_000).toFixed(1) + "M";
  } else if (absAmount >= 1_000) {
    // Thousands
    abbreviatedAmount = (amount / 1_000).toFixed(1) + "K";
  } else {
    // Use standard formatting for smaller amounts
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }

  // Remove trailing .0 if present
  abbreviatedAmount = abbreviatedAmount.replace(/\.0([A-Z])$/, "$1");

  return currencySymbol + abbreviatedAmount;
}