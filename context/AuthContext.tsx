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
  const [supabase] = useState(() => {
    if (typeof window === 'undefined') {
      return null as any;
    }
    return createClient();
  }); 
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) setUser(data?.session?.user ?? null);
      } catch (e) {
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [supabase]); 
  

  const logout = async () => {
    if (!supabase) return;
    try {
      setUser(null);
      await supabase.auth.signOut();
      // Redirect to home page after successful logout
      router.push('/');
    } catch (e) {
      console.error("Logout error", e);
      // Still redirect even if there's an error
      router.push('/');
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