import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY;

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
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
            const sameSite = options?.sameSite || "Lax";
            const secure =
              options?.secure || window.location.protocol === "https:";
            const maxAge = options?.maxAge || 3600;

            try {
              const cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(
                value
              )}; Max-Age=${maxAge}; Path=/; SameSite=${sameSite}${
                secure ? "; Secure" : ""
              }`;
              document.cookie = cookieStr;
            } catch (e) {
              console.warn("[Supabase] Error setting cookie:", e);
            }
          });
        },
      },
    });

    try {
      cachedClient.auth.onAuthStateChange(async (event: any, session: any) => {
        try {
          if (session?.user) {
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
          } else if (event === "SIGNED_OUT") {
            localStorage.removeItem("sb-auth-user");
            localStorage.removeItem("sb-auth-session");
            localStorage.removeItem("sb-auth-token-backup");
          }
        } catch (e) {
          console.warn("[Supabase] Error persisting session:", e);
        }
      });
    } catch (e) {
      console.warn("[Supabase] Could not set up session listener:", e);
    }

    return cachedClient;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    throw error;
  }
};