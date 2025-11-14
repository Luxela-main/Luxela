import axios from "axios";
import { createClient } from "@/utils/supabase/client";

/**
 * Dynamically detect the correct base URL for API calls
 */
const getBaseURL = () => {
  const envURL = process.env.NEXT_PUBLIC_API_URL;

  if (envURL) return envURL;

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  const siteURL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.RENDER_URL ||
    "http://localhost:3000";

  return siteURL.startsWith("http")
    ? `${siteURL}/api`
    : `https://${siteURL}/api`;
};

/**
 * Axios instance for internal API routes (Next.js API)
 */
export const api = axios.create({
  baseURL: getBaseURL(),
});

/**
 * Request interceptor → attach Supabase auth token
 */
api.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

/**
 * Response interceptor → handle 401
 */
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const supabase = createClient();
      await supabase.auth.signOut();
      console.warn("User unauthorized — signed out automatically.");
    }
    return Promise.reject(err);
  }
);

/**
 * Helper for calling Supabase Edge Functions securely
 */
export const callFunction = async (
  name: string,
  body?: Record<string, any>
) => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}.functions.supabase.co/${name}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Function ${name} failed: ${text}`);
  }

  return response.json();
};