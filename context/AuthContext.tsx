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
      const [resource, config = {}] = args;
      // Create a shallow copy to avoid mutating the original config
      const newConfig = { ...config };
      
      // Only inject token for TRPC API requests
      if (token && typeof resource === 'string' && resource.includes('/api/trpc')) {
        newConfig.headers = {
          ...newConfig.headers,
          'Authorization': `Bearer ${token}`
        };
        // Ensure credentials are sent with cross-site requests if needed
        // Do NOT override or delete method - preserve POST for mutations
        // Do NOT override or delete body - preserve TRPC batch request body
        newConfig.credentials = 'include';
      }
      
      return originalFetch.call(this, resource, newConfig);
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  useEffect(() => {
    let mounted = true;

    /**
     * Attempts to recover session from localStorage backup
     * Used when cookies are cleared but we have a valid backup
     */
    const recoverFromLocalStorage = async () => {
      try {
        const storedSession = localStorage.getItem("sb-auth-session");
        if (storedSession) {
          const session = JSON.parse(storedSession);
          const isValid = session.created_at && 
            (Date.now() - session.created_at < 24 * 60 * 60 * 1000); // 24 hours
          
          if (isValid && session.access_token && session.user) {
            // Try to refresh the token with Supabase
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshData?.session && !refreshError) {
                return refreshData.session;
              }
            } catch (e) {
              // Return cached session even if refresh fails
              return session;
            }
          }
        }
      } catch (e) {
        // Error recovering from localStorage ignored
      }
      return null;
    };

    const initAuth = async (retryCount = 0) => {
      try {
        
        // Check if we're in OAuth callback (has fragment tokens)
        const fragment = typeof window !== 'undefined' ? window.location.hash : '';
        const hasOAuthToken = fragment.includes('access_token') || fragment.includes('code');
        
        // Check if we're in email verification callback (token_hash in query params or in auth/callback path)
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        const isEmailVerificationCallback = searchParams?.get('token_hash') !== null && searchParams?.get('type') === 'signup';
        const isAuthCallbackPage = pathname === '/auth/callback';
        
        // If OAuth callback or email verification callback, give Supabase time to process and set cookies
        if ((hasOAuthToken || isEmailVerificationCallback) && retryCount === 0) {
          const callbackType = isEmailVerificationCallback ? 'email verification' : 'OAuth';
          // Wait for cookies to be set (email verification happens server-side, so shorter wait is fine)
          const waitTime = isEmailVerificationCallback ? 500 : 1500;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (isAuthCallbackPage && retryCount === 0) {
          // If we're on /auth/callback page but without token_hash (means we were redirected from the API route)
          // Give a brief moment for cookies to sync
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          // Try to recover from localStorage before retrying
          if (retryCount === 0) {
            const recoveredSession = await recoverFromLocalStorage();
            if (recoveredSession?.user && mounted) {
              setUser(recoveredSession.user);
              if (recoveredSession.access_token) {
                setToken(recoveredSession.access_token);
              }
              setLoading(false);
              return;
            }
          }
          
          // Retry up to 5 times on error with backoff (OAuth callbacks need multiple retries)
          if (retryCount < 5) {
            const delay = 600 * (retryCount + 1);
            setTimeout(() => {
              if (mounted) initAuth(retryCount + 1);
            }, delay);
            return;
          }
        }

        // If session found from cookies, use it (primary source)
        if (data?.session?.user) {
          if (mounted) {
            setUser(data.session.user);
            // Store the access token for request injection
            if (data.session.access_token) {
              setToken(data.session.access_token);
            }
            // Store session in localStorage as backup
            try {
              localStorage.setItem("sb-auth-session", JSON.stringify({
                user: data.session.user,
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
                created_at: Date.now()
              }));
            } catch (e) {
              // Failed to store session in localStorage
            }
          }
        } else if (isAuthCallbackPage && retryCount < 2) {
          // On auth callback page with no session yet, retry a few times
          // This handles the case where cookies haven't been set yet
          const delay = 800 * (retryCount + 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          if (mounted) {
            initAuth(retryCount + 1);
            return;
          }
        } else {
          // Secondary fallback: Check localStorage for persisted session
          const recoveredSession = await recoverFromLocalStorage();
          
          if (recoveredSession?.user && mounted) {
            setUser(recoveredSession.user);
            if (recoveredSession.access_token) {
              setToken(recoveredSession.access_token);
            }
          } else {
            if (mounted) setUser(null);
          }
        }
      } catch (e) {
        // Retry on exception with backoff (up to 2 retries)
        if (mounted && retryCount < 2) {
          const delay = 600 * (retryCount + 1);
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
        setUser(session?.user ?? null);
        
        // Update token whenever auth state changes
        if (session?.access_token) {
          setToken(session.access_token);
          // Also backup to localStorage when token updates
          try {
            localStorage.setItem("sb-auth-session", JSON.stringify({
              user: session.user,
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at,
              created_at: Date.now()
            }));
          } catch (e) {
            // Failed to backup session to localStorage
          }
        } else {
          setToken(null);
          // Clear localStorage on logout
          try {
            localStorage.removeItem("sb-auth-session");
            localStorage.removeItem("sb-auth-user");
          } catch (e) {
            // Failed to clear localStorage
          }
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
      router.push("/");
    } catch (e) {
      // Even if logout fails, redirect to home to ensure user can log back in
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