import axios from "axios";
import { env } from "@/env";

const TSARA_BASE_URL = env.TSARA_BASE_URL;
const TSARA_SANDBOX_URL = "https://sandbox.tsara.ng/v1";
const TSARA_SECRET_KEY = process.env.TSARA_SECRET_KEY!;
export const TSARA_PUBLIC_KEY = process.env.TSARA_PUBLIC_KEY!;

const BASE_URL = process.env.NODE_ENV === "production" ? TSARA_BASE_URL : TSARA_SANDBOX_URL;

export const tsaraApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Authorization": `Bearer ${TSARA_SECRET_KEY}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Add request interceptor to log auth attempts
tsaraApi.interceptors.request.use((config) => {
  // Log that we're sending the request
  console.log('[Tsara API] Request to:', config.url);
  console.log('[Tsara API] Auth header:', config.headers.Authorization ? 'Bearer token present' : 'NO AUTH');
  return config;
});

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
    const paymentLinkData = {
      amount: data.amount,
      currency: data.currency,
      description: `Payment for order ${data.reference}`,
      customer_id: data.customer_id,
      metadata: {
        ...data.metadata,
        reference: data.reference,
        success_url: data.success_url,
        cancel_url: data.cancel_url,
      },
      redirect_url: data.success_url || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
    };

    const response = await tsaraApi.post("/payment-links", paymentLinkData);
    
    if (!response || !response.data || typeof response.data !== 'object') {
      console.error("No response or invalid API response structure:", response?.data);
      throw new Error("Invalid response structure from payment provider");
    }

    if (response.data.success === false) {
      let errorMsg = "";  
      if (response.data.error?.message) {
        errorMsg = response.data.error.message
          .toString()
          .trim()
          .replace(/[^\x20-\x7E\n\r]/g, "")
          .substring(0, 500);
      }
      
      if (!errorMsg) {
        errorMsg = "Payment provider returned an error";
      }
      
      const errorCode = (response.data.error?.code || "UNKNOWN_ERROR").toString().trim();
      const errorStatus = response.data.error?.status || response.status || 500;
      
      console.error("Tsara API error:", {
        message: errorMsg,
        code: errorCode,
        status: errorStatus,
        error: response.data.error,
        request_id: response.data.request_id,
        fullErrorResponse: JSON.stringify(response.data.error),
        rawApiResponse: JSON.stringify(response.data),
        requestData: {
          amount: data.amount,
          currency: data.currency,
          customer_id: data.customer_id,
        },
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      });
      
      let userFriendlyMessage = errorMsg;
      try {
        if (errorCode === "INVALID_AMOUNT") {
          userFriendlyMessage = `Invalid payment amount: ${data.amount}. Please check the amount and try again.`;
        } else if (errorCode === "INVALID_CURRENCY") {
          userFriendlyMessage = `Currency ${data.currency} is not supported. Please use a supported currency.`;
        } else if (errorCode === "CUSTOMER_NOT_FOUND") {
          userFriendlyMessage = "Customer information is missing. Please log in again.";
        } else if (errorCode === "RATE_LIMIT_EXCEEDED") {
          userFriendlyMessage = "Too many payment attempts. Please wait a moment and try again.";
        } else if (errorCode === "INVALID_REQUEST") {
          userFriendlyMessage = "Payment request is invalid. Please check your details and try again.";
        } else if (errorCode === "AUTHENTICATION_FAILED" || errorCode === "AUTH_ERROR") {
          userFriendlyMessage = "Payment service authentication failed. Please contact support.";
          console.error("CRITICAL: Tsara authentication issue. Check API credentials and keys.");
        } else if (errorCode === "SERVICE_UNAVAILABLE") {
          userFriendlyMessage = "Payment service is temporarily unavailable. Please try again in a few moments.";
        } else if (errorCode === "INSUFFICIENT_FUNDS") {
          userFriendlyMessage = "Insufficient funds for this payment. Please check your account balance.";
        } else if (errorCode === "CARD_DECLINED") {
          userFriendlyMessage = "Your card was declined. Please try another payment method.";
        } else if (errorCode === "NETWORK_ERROR" || errorCode === "TIMEOUT") {
          userFriendlyMessage = "Network error occurred. Please check your connection and try again.";
        } else {
          userFriendlyMessage = (errorMsg && errorMsg.length > 0) ? errorMsg : "Payment processing failed. Please try again or contact support.";
        }
      } catch (msgErr) {
        console.error("Error constructing user-friendly message:", msgErr);
        userFriendlyMessage = "Payment processing failed. Please try again.";
      }
      
      if (!userFriendlyMessage || userFriendlyMessage.trim().length === 0) {
        userFriendlyMessage = "Payment service encountered an error. Please try again or contact support.";
      }
      
      const error = new Error(userFriendlyMessage);
      (error as any).code = errorCode;
      (error as any).status = errorStatus;
      (error as any).tsaraError = response.data.error;
      throw error;
    }

    const paymentLink = response.data.data;
    if (!paymentLink || typeof paymentLink !== 'object') {
      const errorDetails = response.data.error?.message || "Payment link data is missing in API response";
      console.error("Payment link data is missing or invalid:", {
        success: response.data.success,
        error: response.data.error,
        request_id: response.data.request_id,
        fullResponse: response.data,
        errorMessage: errorDetails,
      });
      throw new Error(errorDetails);
    }

    if (!paymentLink.id || !paymentLink.url) {
      console.error("Required fields missing in payment link:", paymentLink);
      throw new Error("Payment link missing required fields (id or url)");
    }

    return {
      success: response.data.success,
      data: {
        id: paymentLink.id,
        status: (paymentLink.status === "active" ? "open" : paymentLink.status) as any,
        checkout_url: paymentLink.url,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        reference: data.reference,
        expires_at: paymentLink.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      request_id: response.data.request_id,
    } as any;
  } catch (error: any) {
    console.error("Create checkout session failed:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      requestUrl: error.config?.url,
    });
    throw new Error(error.response?.data?.error?.message || error.message || "Failed to create checkout session");
  }
}

export async function retrievePaymentLink(plinkId: string): Promise<TsaraResponse<PaymentLink>> {
  try {
    const response = await tsaraApi.get(`/payment-links/${plinkId}`);
    return response.data;
  } catch (error: any) {
    console.error("Retrieve payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to retrieve payment link");
  }
}

export async function retrieveStablecoinPaymentLink(splinkId: string): Promise<TsaraResponse<StablecoinPaymentLink>> {
  try {
    const response = await tsaraApi.get(`/stablecoin/payment-links/${splinkId}`);
    return response.data;
  } catch (error: any) {
    console.error("Retrieve stablecoin payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to retrieve stablecoin payment link");
  }
}

export async function verifyPayment(reference: string): Promise<TsaraResponse<Payment>> {
  try {
    const response = await tsaraApi.get(`/payments/${reference}`);
    return response.data;
  } catch (error: any) {
    console.error("Verify payment failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to verify payment");
  }
}

export async function listPaymentLinks(page = 1, limit = 20): Promise<TsaraResponse<PaymentLink[] & { pagination: any }>> {
  try {
    const response = await tsaraApi.get(`/payment-links?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error: any) {
    console.error("List payment links failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to list payment links");
  }
}

export async function disablePaymentLink(id: string): Promise<TsaraResponse<{ id: string; status: string }>> {
  try {
    const response = await tsaraApi.post(`/payment-links/${id}/disable`);
    return response.data;
  } catch (error: any) {
    console.error("Disable payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to disable payment link");
  }
}

export function ngToKobo(ngn: number): number {
  return Math.round(ngn * 100);
}

export function koboToNg(kobo: number): number {
  return kobo / 100;
}

export function usdcToSmallestUnit(usdc: number): string {
  return (usdc * 1000000).toFixed(0);
}

export function smallestUnitToUsdc(units: string): number {
  return parseInt(units, 10) / 1000000;
}

export function formatNgn(kobo: number): string {
  const ngn = koboToNg(kobo);
  return `₦${ngn.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatUsdc(units: string): string {
  const usdc = smallestUnitToUsdc(units);
  return `${usdc.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getPaymentMethodName(
  method: 'card' | 'bank_transfer' | 'crypto'
): string {
  const names = {
    card: '💳 Credit/Debit Card',
    bank_transfer: '🏦 Bank Transfer',
    crypto: '₿ Cryptocurrency (USDC)',
  };
  return names[method];
}

export function getPaymentMethodDetails(
  paymentMethod: string
): { icon: string; name: string; description: string } {
  const methods: Record<
    string,
    { icon: string; name: string; description: string }
  > = {
    card: {
      icon: '💳',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, and other major cards',
    },
    bank_transfer: {
      icon: '🏦',
      name: 'Bank Transfer',
      description: 'Direct transfer from your bank account',
    },
    crypto: {
      icon: '₿',
      name: 'Cryptocurrency',
      description: 'Pay with USDC on Solana blockchain',
    },
  };

  return (
    methods[paymentMethod] || {
      icon: '💰',
      name: 'Payment',
      description: 'Secure payment method',
    }
  );
}

export async function createPaymentLink(data: any) {
  return createFiatPaymentLink(data);
}

export async function getPaymentLink(id: string) {
  return retrievePaymentLink(id);
}

export function formatErrorDetails(error: any): string {
  const details: string[] = [];
  
  if (error?.message) details.push(`Message: ${error.message}`);
  if (error?.code) details.push(`Code: ${error.code}`);
  if (error?.status) details.push(`Status: ${error.status}`);
  if (error?.response?.status) details.push(`HTTP: ${error.response.status}`);
  if (error?.response?.data?.error?.code) details.push(`Error Code: ${error.response.data.error.code}`);
  if (error?.response?.data?.error?.message) details.push(`Error Message: ${error.response.data.error.message}`);
  if (error?.config?.url) details.push(`Endpoint: ${error.config.url}`);
  
  return details.join(' | ');
}

export async function diagnoseTsaraConnection() {
  const timestamp = new Date().toISOString();
  const hasSecretKey = !!TSARA_SECRET_KEY && TSARA_SECRET_KEY.trim().length > 0;
  const hasPublicKey = !!TSARA_PUBLIC_KEY && TSARA_PUBLIC_KEY.trim().length > 0;
  const isConfigured = hasSecretKey && hasPublicKey;
  const environment = process.env.NODE_ENV || 'development';
  const baseUrl = BASE_URL;
  
  let canReachApi = false;
  let errorDetails: string | undefined;
  
  try {
    const response = await tsaraApi.get('/payment-links', {
      timeout: 5000,
      validateStatus: () => true,
    });
    canReachApi = response.status < 500;
  } catch (err: any) {
    canReachApi = false;
    if (err?.code === 'ECONNREFUSED') {
      errorDetails = 'Connection refused - API might be down';
    } else if (err?.code === 'ENOTFOUND') {
      errorDetails = 'API hostname not found - check internet connection';
    } else if (err?.code === 'ETIMEDOUT') {
      errorDetails = 'Connection timeout - API not responding';
    } else {
      errorDetails = err?.message || 'Unknown connection error';
    }
  }
  
  return {
    timestamp,
    environment,
    hasSecretKey,
    hasPublicKey,
    isConfigured,
    canReachApi,
    baseUrl,
    errorDetails,
  };
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = TSARA_SECRET_KEY
): Promise<boolean> {
  if (typeof crypto?.subtle !== "undefined") {
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