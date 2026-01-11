"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { trpc } from "@/app/_trpc/client";
import { useAuth } from "@/context/AuthContext";

interface BillingAddress {
  id: string;
  houseAddress: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

interface ProfileData {
  id: string;
  username: string;
  fullName: string;
  email: string;
  profilePicture: string | null;
  dateOfBirth?: Date | string | null;
  phoneNumber?: string | null;
  country?: string | null;
  state?: string | null;
  billingAddress?: BillingAddress | null;
}

interface ProfileContextType {
  profile: ProfileData | null;
  loading: boolean;
  isInitialized: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, supabase, setUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const sessionChecked = useRef(false);

  useEffect(() => {
    if (!authLoading && !user && !sessionChecked.current) {
      sessionChecked.current = true;

      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          setUser(data.session.user);
        }
      });
    }
  }, [authLoading, user, supabase, setUser]);

  const {
    data,
    isLoading: profileLoading,
    refetch,
    error: queryError,
  } = trpc.buyer.getAccountDetails.useQuery(undefined, {
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (data) {
      setProfile(data);
      setIsInitialized(true);
    } else if (queryError) {
      setProfile(null);
      setIsInitialized(true);
    } else if (!authLoading && !profileLoading) {
      setProfile(null);
      setIsInitialized(true);
    }
  }, [data, queryError, authLoading, profileLoading]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      const result = await refetch();
      if (result.data) {
        setProfile(result.data);
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  }, [user, refetch]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading: profileLoading,
        isInitialized,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
}
