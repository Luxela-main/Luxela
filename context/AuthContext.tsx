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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [supabase] = useState(() => createClient()); 
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        console.log('[AUTH] Initializing session from server cookies...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('[AUTH] Session error:', error.message);
        }
        
        if (mounted) {
          setUser(data?.session?.user ?? null);
          console.log('[AUTH] Session initialized, user:', data?.session?.user?.id || 'none');
        }
      } catch (e) {
        console.error('[AUTH] Init error:', e);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (!mounted) return;
      console.log('[AUTH] State changed:', event);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []); 
  

  const logout = async () => {
    try {
      setUser(null);
      await supabase.auth.signOut();
      router.push('/');
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, supabase, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};