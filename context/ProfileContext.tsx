"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { trpc } from "@/lib/trpc";

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
    error,
  } = trpc.buyer.getAccountDetails.useQuery(undefined, {
    enabled: !!user,
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors (auth issues)
      if (error?.data?.httpStatus === 401 || error?.data?.httpStatus === 403) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: 1000,
  });

  const refreshProfile = useCallback(() => {
    if (user) {
      refetch();
    }
  }, [refetch, user]);



  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ProfileContextType>(
    () => ({
      profile: data ?? null,
      loading: isLoading,
      isInitialized: isFetched || !user,
      refreshProfile,
    }),
    [data, isLoading, isFetched, user, refreshProfile]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
