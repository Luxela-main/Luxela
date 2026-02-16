import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY;

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

// Cookie storage implementation for OAuth flow state
class CookieStorage {
  getItem(key: string): string | null {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (decodeURIComponent(name) === key) {
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
    return null;
  }

  setItem(key: string, value: string): void {
    if (typeof document === "undefined") return;

    const maxAge = 3600; // 1 hour for OAuth flow state
    const domain = window.location.hostname;

    try {
      document.cookie = `${encodeURIComponent(
        key
      )}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; Domain=${domain}; SameSite=Lax`;
    } catch (e) {
      console.warn("[CookieStorage] Error setting cookie:", e);
    }
  }

  removeItem(key: string): void {
    if (typeof document === "undefined") return;

    const domain = window.location.hostname;
    try {
      document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; Path=/; Domain=${domain}; SameSite=Lax`;
    } catch (e) {
      console.warn("[CookieStorage] Error removing cookie:", e);
    }
  }
}

export const createClient = () => {
  // Return cached client if already created in this session
  if (cachedClient) {
    return cachedClient;
  }

  if (!supabaseUrl) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Please configure Supabase environment variables."
    );
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Please configure Supabase environment variables."
    );
  }
  if (!supabaseKey) {
    console.error(
      "Supabase API key is not set. Please configure NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY."
    );
    throw new Error(
      "Supabase API key is not set. Please configure NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY."
    );
  }

  try {
    // Create browser client with cookie storage for OAuth flow state
    const cookieStorage = new CookieStorage();

    cachedClient = createBrowserClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          if (typeof document === "undefined") return [];

          return document.cookie.split(";").map((cookie) => {
            const [name, value] = cookie.trim().split("=");
            return {
              name: decodeURIComponent(name),
              value: decodeURIComponent(value),
            };
          });
        },
        setAll(cookies) {
          if (typeof document === "undefined") return;

          cookies.forEach(({ name, value, options }) => {
            const domain = window.location.hostname;
            const sameSite = options?.sameSite || "Lax";
            const secure = options?.secure || window.location.protocol === "https:";
            const maxAge = options?.maxAge || 3600;

            try {
              const cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(
                value
              )}; Max-Age=${maxAge}; Path=/; Domain=${domain}; SameSite=${sameSite}${
                secure ? "; Secure" : ""
              }`;
              document.cookie = cookieStr;
            } catch (e) {
              console.warn("[CookieStorage] Error setting cookie:", e);
            }
          });

          // Also store to localStorage as fallback for critical auth data
          try {
            const authCookie = cookies.find(
              (c) =>
                c.name.includes("auth-token") ||
                c.name.includes("access-token") ||
                c.name.includes("sb-auth")
            );
            if (authCookie?.value) {
              localStorage.setItem("sb-auth-token-backup", authCookie.value);
            }
          } catch (e) {
            console.warn("[CookieStorage] Error storing to localStorage:", e);
          }
        },
      },
    });

    // Set up listener to persist session data to localStorage as fallback
    try {
      cachedClient.auth.onAuthStateChange(async (event: any, session: any) => {
        try {
          if (session?.user) {
            // Store user and session to localStorage as fallback
            localStorage.setItem("sb-auth-user", JSON.stringify(session.user));
            localStorage.setItem(
              "sb-auth-session",
              JSON.stringify({
                user: session.user,
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                created_at: Date.now(),
              })
            );
            console.log("[Supabase] Session persisted to localStorage backup");
          } else if (event === "SIGNED_OUT") {
            // Clear localStorage on sign out
            localStorage.removeItem("sb-auth-user");
            localStorage.removeItem("sb-auth-session");
            localStorage.removeItem("sb-auth-token-backup");
            console.log("[Supabase] Cleared localStorage on sign out");
          }
        } catch (e) {
          console.warn("[Supabase] Error persisting to localStorage:", e);
        }
      });
    } catch (e) {
      // Session listener is not critical, don't fail if it can't be set up
      console.warn("[Supabase] Could not set up session listener:", e);
    }

    return cachedClient;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    throw error;
  }
};