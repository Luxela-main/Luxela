import axios from "axios";
import { env } from "@/env";
import crypto from "crypto";

const TSARA_BASE_URL = "https://api.tsara.ng/v1";

// DIAGNOSTIC: Log environment state at module load time
const rawTsaraSecretKey =
  env.TSARA_SECRET_KEY ||
  process.env.TSARA_SECRET_KEY ||
  process.env.TSARA_KEY ||
  process.env.TSARA_API_KEY ||
  process.env.TSARA_SECRET ||
  '';

console.log('[Tsara Config] Module loading...', {
  nodeEnv: process.env.NODE_ENV,
  hasTsaraSecretKey: !!rawTsaraSecretKey,
  tsaraSecretKeyLength: rawTsaraSecretKey.length,
  envObjectHasKey: !!env.TSARA_SECRET_KEY,
  envObjectKeyLength: env.TSARA_SECRET_KEY?.length,
});

/**
 * Validates the Tsara API key format
 * Returns validation result with details
 */
export function validateApiKey(key: string | undefined): { valid: boolean; error?: string; details?: string } {
  if (!key || key.trim() === '') {
    return { valid: false, error: 'API key is missing', details: 'TSARA_SECRET_KEY environment variable is not set' };
  }
  
  const trimmedKey = key.trim();
  
  // Check minimum length
  if (trimmedKey.length < 20) {
    return { valid: false, error: 'API key is too short', details: `Expected at least 20 characters, got ${trimmedKey.length}` };
  }
  
  // Check for common placeholder values - be more specific to avoid flagging real keys
  const exactPlaceholders = ['your_api_key', 'xxx', 'placeholder', 'test_key', 'example_key', 'api_key_here'];
  const lowerKey = trimmedKey.toLowerCase();
  
  // Check for exact placeholder matches
  if (exactPlaceholders.includes(lowerKey)) {
    return { valid: false, error: 'API key appears to be a placeholder', details: 'The key matches a known placeholder value' };
  }
  
  // Check for very short keys that are likely placeholders (under 25 chars and contain placeholder words)
  if (trimmedKey.length < 25) {
    const placeholderWords = ['your', 'api', 'key', 'test', 'example', 'placeholder', 'xxx'];
    for (const word of placeholderWords) {
      if (lowerKey.includes(word)) {
        return { valid: false, error: 'API key appears to be a placeholder', details: 'Short key contains placeholder text' };
      }
    }
  }
  
  // Check for valid key characters. Tsara keys may include alphanumerics, hyphens, underscores, dots, slashes and padding symbols.
  const validPattern = /^[A-Za-z0-9._\-+=\/]+$/;
  if (!validPattern.test(trimmedKey)) {
    return { valid: false, error: 'API key contains invalid characters', details: 'Key should only contain alphanumeric characters, hyphens, underscores, dots, slashes, plus signs or equals padding' };
  }
  
  return { valid: true, details: `Key validated successfully (${trimmedKey.length} characters)` };
}

/**
 * Get API key status for diagnostics
 */
export function getApiKeyStatus(key?: string): { configured: boolean; valid: boolean; message: string } {
  const keyToValidate =
    key ||
    env.TSARA_SECRET_KEY ||
    process.env.TSARA_SECRET_KEY ||
    process.env.TSARA_KEY ||
    process.env.TSARA_API_KEY ||
    process.env.TSARA_SECRET ||
    '';
  const validation = validateApiKey(keyToValidate);
  return {
    configured: !!keyToValidate && keyToValidate.length > 0,
    valid: validation.valid,
    message: validation.valid ? (validation.details || 'Valid API key') : (validation.error || 'Invalid API key'),
  };
}

// Use TSARA_SECRET_KEY for server-side API authentication
// NEXT_PUBLIC_TSARA_PUBLIC_KEY is for client-side only
export const TSARA_SECRET_KEY = rawTsaraSecretKey.trim();
export const TSARA_PUBLIC_KEY = env.NEXT_PUBLIC_TSARA_PUBLIC_KEY || process.env.NEXT_PUBLIC_TSARA_PUBLIC_KEY || '';
export const TSARA_WEBHOOK_SECRET = env.TSARA_WEBHOOK_SECRET || process.env.TSARA_WEBHOOK_SECRET || '';

// Validate that required credentials are configured
if (!TSARA_SECRET_KEY || TSARA_SECRET_KEY.trim() === '') {
  console.error('[Tsara Config] CRITICAL: TSARA_SECRET_KEY is not configured. Payment functionality will fail.');
  console.error('[Tsara Config] Available env keys:', Object.keys(process.env).filter(k => /TSARA|SECRET/i.test(k)));
} else {
  console.log('[Tsara Config] TSARA_SECRET_KEY is configured (length:', TSARA_SECRET_KEY.length, ')');
  // Validate key format - should be a long string
  if (TSARA_SECRET_KEY.length < 20) {
    console.error('[Tsara Config] WARNING: TSARA_SECRET_KEY seems too short. Expected 40+ characters, got', TSARA_SECRET_KEY.length);
  }
  // Check if it looks like a secret key (starts with certain patterns)
  const firstChars = TSARA_SECRET_KEY.substring(0, 10);
  console.log('[Tsara Config] Key prefix:', firstChars + '...');
}

const BASE_URL = env.TSARA_BASE_URL || env.TSARA_API_URL || TSARA_BASE_URL;

export const tsaraApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

tsaraApi.interceptors.request.use((config) => {
  const key = TSARA_SECRET_KEY.trim();
  if (!key) return config;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const method = (config.method || "GET").toUpperCase();
  const path = config.url || "";
  const body = config.data ? JSON.stringify(config.data) : "";

  // HMAC signature: timestamp + method + path + body
  const payload = timestamp + method + path + body;
  const signature = crypto.createHmac("sha256", key).update(payload).digest("hex");

  config.headers["x-tsara-timestamp"] = timestamp;
  config.headers["x-tsara-signature"] = signature;
  config.headers["Authorization"] = `Bearer ${key}`;

  return config;
});

// Add auth header dynamically via interceptor to ensure fresh value
tsaraApi.interceptors.request.use((config) => {
  const key = TSARA_SECRET_KEY.trim();
  if (key) {
    config.headers["Authorization"] = `Bearer ${key}`;
  }
  return config;
});

// Add request interceptor to log auth attempts and validate API key
tsaraApi.interceptors.request.use((config) => {
  // Ensure fresh auth header with trimmed key
  const key = TSARA_SECRET_KEY.trim();
  if (key) {
    config.headers["Authorization"] = `Bearer ${key}`;
  }
  
  // Validate API key before sending request
  const keyValidation = validateApiKey(key);
  
  // Log that we're sending the request
  console.log('[Tsara API] Request to:', config.url);
  console.log('[Tsara API] Base URL:', config.baseURL);
  console.log('[Tsara API] Full URL:', (config.baseURL || '') + (config.url || ''));
  
  // Check auth header
  const authHeader = config.headers["Authorization"] as string | undefined;
  const hasAuth = !!authHeader && authHeader !== 'Bearer ' && authHeader.length > 10;
  console.log('[Tsara API] Authorization header present:', hasAuth ? 'Yes' : 'NO API KEY - API CALL WILL FAIL');
  
  if (hasAuth && authHeader) {
    const tokenPreview = authHeader.substring(0, 25) + '...';
    console.log('[Tsara API] Authorization header preview:', tokenPreview);
    console.log('[Tsara API] Token length:', key?.length || 0);
  }
  
  // Warn if secret key is missing or invalid (used for server-side API calls)
  if (!keyValidation.valid) {
    console.error('[Tsara API] CRITICAL: TSARA_SECRET_KEY validation failed:', keyValidation.error);
    console.error('[Tsara API] Details:', keyValidation.details);
    console.error('[Tsara API] This request will fail with 401 Unauthorized.');
  }
  
  return config;
});

// Add response interceptor to catch common errors
tsaraApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    // Enhanced error logging with full context
    const errorContext = {
      status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method,
      hasAuthHeader: !!error.config?.headers?.['Authorization'],
      authHeaderPreview: error.config?.headers?.['Authorization']?.substring(0, 30) + '...',
      keyLength: TSARA_SECRET_KEY?.length || 0,
      keyIsEmpty: !TSARA_SECRET_KEY || TSARA_SECRET_KEY.trim() === '',
      responseData: errorData,
      timestamp: new Date().toISOString(),
    };
    
    if (status === 401) {
      const keyValidation = validateApiKey(TSARA_SECRET_KEY);
      console.error('[Tsara API] 401 Unauthorized - API Key validation:', {
        ...errorContext,
        keyValidation,
        recommendation: keyValidation.valid 
          ? 'Key format is valid but may be incorrect or revoked. Verify TSARA_SECRET_KEY in environment.'
          : 'TSARA_SECRET_KEY is invalid or missing. Check your environment variables.',
      });
    } else if (status === 403) {
      console.error('[Tsara API] 403 Forbidden - Your API key may not have permission for this operation', errorContext);
    } else if (status === 404) {
      console.error('[Tsara API] 404 Not Found - Endpoint may be incorrect or resource does not exist', errorContext);
    } else if (status === 429) {
      console.error('[Tsara API] 429 Too Many Requests - Rate limit exceeded', errorContext);
    } else if (status >= 500) {
      console.error('[Tsara API] Server error - Tsara API may be experiencing issues', errorContext);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('[Tsara API] Connection refused - Cannot reach Tsara API', errorContext);
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error('[Tsara API] Connection timeout - API not responding', errorContext);
    } else if (status) {
      console.error(`[Tsara API] HTTP ${status} error:`, errorContext);
    }
    
    return Promise.reject(error);
  }
);

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
  metadata?: Record<string, any>;
  redirect_url?: string;
}): Promise<TsaraResponse<PaymentLink>> {
  try {
    // Build request payload - ensure all fields are properly formatted
    const payload: any = {
      amount: Math.round(data.amount), // Ensure integer
      currency: data.currency.toUpperCase(), // Ensure uppercase
    };
    
    // Only add optional fields if they have values
    if (data.description && data.description.trim()) {
      payload.description = data.description.trim();
    }
    if (data.redirect_url && data.redirect_url.trim()) {
      payload.redirect_url = data.redirect_url.trim();
    }
    if (data.metadata && Object.keys(data.metadata).length > 0) {
      // Ensure metadata values are strings (API requirement)
      payload.metadata = Object.entries(data.metadata).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
        return acc;
      }, {} as Record<string, string>);
    }

    console.log('[Tsara API] Creating fiat payment link:', JSON.stringify(payload, null, 2));
    
    // Note: Do not pass customer_id - Tsara creates customers automatically
    const response = await tsaraApi.post("/payment-links", payload);
    
    if (!response || !response.data || typeof response.data !== 'object') {
      console.error("No response or invalid API response structure:", response?.data);
      throw new Error("Invalid response structure from payment provider");
    }

    if (response.data.success === false) {
      const errorMsg = response.data.error?.message || "Payment provider returned an error";
      console.error("Tsara fiat API error:", response.data.error);
      throw new Error(errorMsg);
    }

    // Return properly structured TsaraResponse
    const paymentLink = response.data.data || response.data;
    return {
      success: response.data.success ?? true,
      data: {
        id: paymentLink.id,
        url: paymentLink.url,
        status: paymentLink.status || 'active',
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        description: paymentLink.description,
        customer_id: paymentLink.customer_id,
        metadata: paymentLink.metadata,
        created_at: paymentLink.created_at,
        expires_at: paymentLink.expires_at,
      },
      request_id: response.data.request_id || response.data.requestId || '',
    };
  } catch (error: any) {
    console.error('[Tsara API] Full error response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      requestPayload: error.config?.data,
      headers: error.response?.headers,
    });
    const errMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || "Failed to create fiat payment link";
    console.error("Create fiat payment link failed:", errMsg);
    throw new Error(errMsg);
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
    
    if (!response || !response.data || typeof response.data !== 'object') {
      console.error("No response or invalid API response structure:", response?.data);
      throw new Error("Invalid response structure from payment provider");
    }

    if (response.data.success === false) {
      const errorMsg = response.data.error?.message || "Payment provider returned an error";
      console.error("Tsara stablecoin API error:", response.data.error);
      throw new Error(errorMsg);
    }

    // Return properly structured TsaraResponse
    const paymentLink = response.data.data || response.data;
    return {
      success: response.data.success ?? true,
      data: {
        id: paymentLink.id,
        url: paymentLink.url,
        status: paymentLink.status || 'active',
        amount: paymentLink.amount,
        asset: paymentLink.asset,
        network: paymentLink.network,
        wallet_id: paymentLink.wallet_id,
        description: paymentLink.description,
        metadata: paymentLink.metadata,
      },
      request_id: response.data.request_id || response.data.requestId || '',
    };
  } catch (error: any) {
    const errMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || "Failed to create stablecoin payment link";
    console.error("Create stablecoin payment link failed:", errMsg);
    throw new Error(errMsg);
  }
}

export async function createCheckoutSession(data: {
  amount: number;
  currency: string;
  reference: string;
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, any>;
}): Promise<TsaraResponse<CheckoutSession>> {
  try {
    // Build metadata with string values only (API requirement)
    const metadata: Record<string, string> = {};
    if (data.metadata) {
      Object.entries(data.metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          metadata[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
      });
    }
    metadata.reference = data.reference;
    if (data.success_url) metadata.success_url = data.success_url;
    if (data.cancel_url) metadata.cancel_url = data.cancel_url;

    // Note: Do not pass customer_id - Tsara creates customers automatically
    const paymentLinkData = {
      amount: Math.round(data.amount), // Ensure integer
      currency: data.currency.toUpperCase(), // Ensure uppercase
      description: `Payment for order ${data.reference}`,
      metadata,
      redirect_url: data.success_url || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
    };
    
    console.log('[Tsara API] Creating checkout session:', JSON.stringify(paymentLinkData, null, 2));

    const response = await tsaraApi.post("/payment-links", paymentLinkData);
    
    if (!response || !response.data || typeof response.data !== 'object') {
      console.error("No response or invalid API response structure:", response?.data);
      throw new Error("Invalid response structure from payment provider");
    }

    if (response.data.success === false) {
      let errorMsg = "";  
      // Check for error message in multiple possible locations in the response
      if (response.data.error?.message) {
        errorMsg = response.data.error.message
          .toString()
          .trim()
          .replace(/[^\x20-\x7E\n\r]/g, "")
          .substring(0, 500);
      } else if (response.data.message) {
        // Tsara API sometimes returns message directly in response.data.message
        errorMsg = response.data.message
          .toString()
          .trim()
          .replace(/[^\x20-\x7E\n\r]/g, "")
          .substring(0, 500);
      }
      
      if (!errorMsg) {
        errorMsg = "Payment provider returned an error";
      }
      
      // Check for error code in multiple possible locations
      let errorCode = "UNKNOWN_ERROR";
      if (response.data.error?.code) {
        errorCode = response.data.error.code.toString().trim();
      } else if (response.data.status_code) {
        // Use HTTP status code to determine error type
        const statusCode = parseInt(response.data.status_code, 10);
        if (statusCode === 401) {
          errorCode = "AUTHENTICATION_FAILED";
        } else if (statusCode === 403) {
          errorCode = "FORBIDDEN";
        } else if (statusCode === 404) {
          errorCode = "NOT_FOUND";
        } else if (statusCode >= 500) {
          errorCode = "SERVICE_UNAVAILABLE";
        }
      }
      
      const errorStatus = response.data.error?.status || response.data.status_code || response.status || 500;
      
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
          userFriendlyMessage = "Payment service authentication failed. Please check your API credentials or contact support.";
          console.error("[Tsara] CRITICAL: Tsara API authentication failed (401). Check that TSARA_SECRET_KEY is correctly configured in your environment variables (server-side secret key, not the public key).");
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

    const paymentLink = response.data.data || response.data;
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
  const environment = process.env.NODE_ENV || 'development';
  const baseUrl = BASE_URL;
  
  // Use new validation function
  const keyValidation = validateApiKey(TSARA_SECRET_KEY);
  const hasSecretKey = keyValidation.valid;
  const hasPublicKey = !!TSARA_PUBLIC_KEY && TSARA_PUBLIC_KEY.trim().length > 0;
  const isConfigured = keyValidation.valid;
  
  let canReachApi = false;
  let errorDetails: string | undefined;
  let apiTestStatus: number | undefined;
  
  // Only attempt API connection if key is valid
  if (isConfigured) {
    try {
      const response = await tsaraApi.get('/payment-links', {
        timeout: 10000,
        validateStatus: () => true,
      });
      apiTestStatus = response.status;
      canReachApi = response.status < 500;
      
      if (response.status === 401) {
        errorDetails = 'API key rejected - verify TSARA_SECRET_KEY is correct';
      } else if (response.status === 403) {
        errorDetails = 'API key lacks permission for this operation';
      }
    } catch (err: any) {
      canReachApi = false;
      if (err?.code === 'ECONNREFUSED') {
        errorDetails = 'Connection refused - API might be down or blocked by firewall';
      } else if (err?.code === 'ENOTFOUND') {
        errorDetails = 'API hostname not found - check DNS/internet connection';
      } else if (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNABORTED') {
        errorDetails = 'Connection timeout - API not responding (10s timeout)';
      } else {
        errorDetails = err?.message || 'Unknown connection error';
      }
    }
  } else {
    errorDetails = keyValidation.error || 'API key not configured';
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
    apiTestStatus,
    keyValidation: {
      valid: keyValidation.valid,
      message: keyValidation.valid ? keyValidation.details : keyValidation.error,
    },
  };
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = TSARA_WEBHOOK_SECRET
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