"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
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
  refreshProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    data,
    isLoading: profileLoading,
    refetch,
    error,
  } = trpc.buyer.getAccountDetails.useQuery(undefined, {
    enabled: !!user && !authLoading,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!authLoading && user && data) {
      setProfile(data);
      setIsInitialized(true);
    } else if (!authLoading && error) {
      setProfile(null);
      setIsInitialized(true);
    }
  }, [data, error, authLoading, user]);

  useEffect(() => {
    if (!user && !authLoading) {
      setProfile(null);
      setIsInitialized(true);
    }
  }, [user, authLoading]);

  const refreshProfile = async () => {
    if (!user) return;

    const result = await refetch();
    if (result.data) {
      setProfile(result.data);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading: profileLoading || authLoading,
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