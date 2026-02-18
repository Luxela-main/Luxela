"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: any | null;
  setUser: (u: any | null) => void;
  supabase: ReturnType<typeof createClient>;
  loading: boolean;
  logout: () => Promise<void>;
  token: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  // Setup fetch interceptor to inject token into all requests
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
      const [resource, config] = args;
      const newConfig = { ...config };
      
      // Only inject token for same-origin requests
      if (token && typeof resource === 'string' && (resource.startsWith('/') || resource.startsWith(window.location.origin))) {
        newConfig.headers = {
          ...newConfig.headers,
          'Authorization': `Bearer ${token}`
        };
        // Ensure credentials are sent with cross-site requests if needed
        newConfig.credentials = 'include';
      }
      
      return originalFetch.apply(this, [resource, newConfig]);
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async (retryCount = 0) => {
      try {
        console.log("[AUTH] Initializing session from server cookies...");
        
        // Check if we're in OAuth callback (has fragment tokens)
        const fragment = typeof window !== 'undefined' ? window.location.hash : '';
        const hasOAuthToken = fragment.includes('access_token') || fragment.includes('code');
        
        // If OAuth callback, give Supabase time to process and set cookies
        if (hasOAuthToken && retryCount === 0) {
          console.log("[AUTH] OAuth callback detected, waiting for session sync...");
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.warn("[AUTH] Session error:", error.message);
          // Retry up to 3 times on error with backoff (OAuth callbacks need multiple retries)
          if (retryCount < 5) {
            const delay = 600 * (retryCount + 1);
            console.log(`[AUTH] Retrying session initialization (attempt ${retryCount + 2}/6) after ${delay}ms...`);
            setTimeout(() => {
              if (mounted) initAuth(retryCount + 1);
            }, delay);
            return;
          }
        }

        // If session found from cookies, use it
        if (data?.session?.user) {
          if (mounted) {
            setUser(data.session.user);
            // Store the access token for request injection
            if (data.session.access_token) {
              setToken(data.session.access_token);
              console.log("[AUTH] Token stored for request injection");
            }
            console.log(
              "[AUTH] Session initialized from cookies, user:",
              data.session.user.id
            );
            // Store session in localStorage as backup
            try {
              localStorage.setItem("sb-auth-session", JSON.stringify({
                ...data.session,
                created_at: Date.now()
              }));
            } catch (e) {
              console.warn("[AUTH] Failed to store session in localStorage:", e);
            }
          }
        } else {
          // Fallback: Check localStorage for persisted session
          try {
            const storedSession = localStorage.getItem("sb-auth-session");
            if (storedSession) {
              const session = JSON.parse(storedSession);
              const isSessionValid = session.created_at && 
                (Date.now() - session.created_at < 24 * 60 * 60 * 1000); // 24 hours
              
              if (isSessionValid && session.user) {
                console.log(
                  "[AUTH] Session restored from localStorage, user:",
                  session.user.id
                );
                if (mounted) {
                  setUser(session.user);
                  // Restore token from localStorage session
                  if (session.access_token) {
                    setToken(session.access_token);
                    console.log("[AUTH] Token restored from localStorage");
                  }
                }
                return;
              }
            }
          } catch (e) {
            console.warn("[AUTH] Error reading localStorage:", e);
          }
          
          if (mounted) setUser(null);
        }
      } catch (e) {
        console.error("[AUTH] Init error:", e);
        // Retry on exception with backoff (up to 2 retries)
        if (mounted && retryCount < 2) {
          const delay = 600 * (retryCount + 1);
          console.log(`[AUTH] Retrying after error (attempt ${retryCount + 2}/3) after ${delay}ms...`);
          setTimeout(() => {
            if (mounted) initAuth(retryCount + 1);
          }, delay);
          return;
        }
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (!mounted) return;
        console.log("[AUTH] State changed:", event);
        setUser(session?.user ?? null);
        
        // Update token whenever auth state changes
        if (session?.access_token) {
          setToken(session.access_token);
          console.log("[AUTH] Token updated from auth state change:", event);
        } else {
          setToken(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const logout = async () => {
    try {
      setUser(null);
      // Sign out from Supabase first, then redirect to home
      await supabase.auth.signOut();
      console.log("[AUTH] Successfully signed out from Supabase");
      router.push("/");
    } catch (e) {
      console.error("[AUTH] Logout error:", e);
      // Even if logout fails, redirect to home to ensure user can log back in
      console.log("[AUTH] Redirecting to home despite logout error");
      router.push("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, supabase, loading, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// Helper hook to get just the token for use in API calls
export const useAuthToken = () => {
  const { token } = useAuth();
  return token;
};