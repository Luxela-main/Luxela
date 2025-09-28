"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Define a minimal user type for Supabase
interface SupabaseUser {
  id: string;
  email: string;
  [key: string]: any;
}

type AuthContextType = {
  user: SupabaseUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data, error } = await createClient().auth.getSession();
      if (data?.session?.user) {
        setUser(data.session.user as SupabaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    getSession();

    // Listen for auth state changes
    const { data: listener } = createClient().auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user as SupabaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
