import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Accepts ClassValue[] or string[] safely
export function cn(...inputs: (ClassValue | string)[]) {
  return twMerge(clsx(...inputs));
}

