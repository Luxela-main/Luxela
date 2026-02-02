"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { trpc } from "@/lib/trpc/client";

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
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  country?: string;
  state?: string;
  billingAddress?: BillingAddress | null;
  name?: string;
  city?: string;
  address?: string;
  postalCode?: string;
}

interface ProfileContextType {
  profile: ProfileData | null;
  loading: boolean;
  isInitialized: boolean;
  refreshProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // tRPC query hook — stable, no dynamic import needed
  const {
    data,
    isLoading,
    isFetched,
    refetch,
  } = trpc.buyer.getAccountDetails.useQuery(undefined, {
    enabled: !!user, 
    retry: false,
  });

  const refreshProfile = useCallback(() => {
    if (user) refetch();
  }, [refetch, user]);

  return (
    <ProfileContext.Provider
      value={{
        profile: data ?? null,
        loading: isLoading,
        isInitialized: isFetched || !user,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
