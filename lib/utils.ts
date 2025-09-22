import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Accepts ClassValue[] or string[] safely
export function cn(...inputs: (ClassValue | string)[]) {
  return twMerge(clsx(...inputs));
}

export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
