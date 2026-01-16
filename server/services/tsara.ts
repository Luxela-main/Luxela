import axios from "axios";

const TSARA_BASE_URL = process.env.TSARA_BASE_URL || "https://api.tsara.ng/v1";
const TSARA_SANDBOX_URL = "https://sandbox.tsara.ng/v1";
const TSARA_SECRET_KEY = process.env.TSARA_SECRET_KEY!;
export const TSARA_PUBLIC_KEY = process.env.TSARA_PUBLIC_KEY!;

// Use sandbox in development, production in production
const BASE_URL = process.env.NODE_ENV === "production" ? TSARA_BASE_URL : TSARA_SANDBOX_URL;

export const tsaraApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${TSARA_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

// Types
export interface TsaraResponse<T> {
  success: boolean;
  data: T;
  request_id: string;
}

export interface TsaraError {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
  };
  request_id: string;
}

export interface PaymentLink {
  id: string;
  url: string;
  status: "active" | "disabled";
  amount: number;
  currency: string;
  description?: string;
  customer_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export interface StablecoinPaymentLink {
  id: string;
  url: string;
  status: "active" | "disabled";
  amount: string;
  asset: "USDC";
  network: "solana";
  wallet_id: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CheckoutSession {
  id: string;
  status: "open" | "completed" | "expired";
  checkout_url: string;
  amount: number;
  currency: string;
  reference: string;
  expires_at: string;
}

export interface Payment {
  id: string;
  reference: string;
  status: "pending" | "processing" | "success" | "failed";
  amount: number;
  currency: string;
  customer_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ---- CREATE FIAT PAYMENT LINK ----
export async function createFiatPaymentLink(data: {
  amount: number;
  currency: string;
  description?: string;
  customer_id?: string;
  metadata?: Record<string, any>;
  redirect_url?: string;
}): Promise<TsaraResponse<PaymentLink>> {
  try {
    const response = await tsaraApi.post("/payment-links", data);
    return response.data;
  } catch (error: any) {
    console.error("Create fiat payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to create fiat payment link");
  }
}

// ---- CREATE STABLECOIN PAYMENT LINK ----
export async function createStablecoinPaymentLink(data: {
  amount: string;
  asset: "USDC";
  network: "solana";
  wallet_id: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<TsaraResponse<StablecoinPaymentLink>> {
  try {
    const response = await tsaraApi.post("/stablecoin/payment-links", data);
    return response.data;
  } catch (error: any) {
    console.error("Create stablecoin payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to create stablecoin payment link");
  }
}

// ---- CREATE CHECKOUT SESSION ----
export async function createCheckoutSession(data: {
  amount: number;
  currency: string;
  reference: string;
  customer_id?: string;
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, any>;
}): Promise<TsaraResponse<CheckoutSession>> {
  try {
    const response = await tsaraApi.post("/checkout/sessions", data);
    return response.data;
  } catch (error: any) {
    console.error("Create checkout session failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to create checkout session");
  }
}

// ---- RETRIEVE PAYMENT LINK ----
export async function retrievePaymentLink(plinkId: string): Promise<TsaraResponse<PaymentLink>> {
  try {
    const response = await tsaraApi.get(`/payment-links/${plinkId}`);
    return response.data;
  } catch (error: any) {
    console.error("Retrieve payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to retrieve payment link");
  }
}

// ---- RETRIEVE STABLECOIN PAYMENT LINK ----
export async function retrieveStablecoinPaymentLink(splinkId: string): Promise<TsaraResponse<StablecoinPaymentLink>> {
  try {
    const response = await tsaraApi.get(`/stablecoin/payment-links/${splinkId}`);
    return response.data;
  } catch (error: any) {
    console.error("Retrieve stablecoin payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to retrieve stablecoin payment link");
  }
}

// ---- VERIFY PAYMENT ----
export async function verifyPayment(reference: string): Promise<TsaraResponse<Payment>> {
  try {
    const response = await tsaraApi.get(`/payments/${reference}`);
    return response.data;
  } catch (error: any) {
    console.error("Verify payment failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to verify payment");
  }
}

// ---- LIST PAYMENT LINKS ----
export async function listPaymentLinks(page = 1, limit = 20): Promise<TsaraResponse<PaymentLink[] & { pagination: any }>> {
  try {
    const response = await tsaraApi.get(`/payment-links?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error: any) {
    console.error("List payment links failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to list payment links");
  }
}

// ---- DISABLE PAYMENT LINK ----
export async function disablePaymentLink(id: string): Promise<TsaraResponse<{ id: string; status: string }>> {
  try {
    const response = await tsaraApi.post(`/payment-links/${id}/disable`);
    return response.data;
  } catch (error: any) {
    console.error("Disable payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to disable payment link");
  }
}

// ---- LEGACY ALIASES (for backward compatibility) ----
export async function createPaymentLink(data: any) {
  return createFiatPaymentLink(data);
}

export async function getPaymentLink(id: string) {
  return retrievePaymentLink(id);
}

// ---- WEBHOOK VERIFICATION (Node + Edge compatible) ----
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = TSARA_SECRET_KEY
): Promise<boolean> {
  if (typeof crypto?.subtle !== "undefined") {
    // Edge Runtime (Web Crypto API)
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const sigBuffer = Uint8Array.from(Buffer.from(signature, "hex"));
      const dataBuffer = encoder.encode(payload);

      const isValid = await crypto.subtle.verify("HMAC", cryptoKey, sigBuffer, dataBuffer);
      return isValid;
    } catch (err) {
      console.error("Edge signature verification failed:", err);
      return false;
    }
  } else {
    // Node.js Runtime (use native crypto)
    try {
      const crypto = await import("crypto");
      const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      return hash === signature;
    } catch (err) {
      console.error("Node signature verification failed:", err);
      return false;
    }
  }
}