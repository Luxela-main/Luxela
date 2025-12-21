'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from "@/context/AuthContext";

interface ProfileData {
  id: string;
  username: string;
  fullName: string;
  email: string;
  profilePicture: string | null;
}

interface ProfileContextType {
  profile: ProfileData | null;
  loading: boolean;
  isInitialized: boolean; // NEW: Track if initial fetch is done
  refreshProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false); // NEW

  const { data, isLoading, refetch, error } = trpc.buyer.getAccountDetails.useQuery(undefined, {
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    useErrorBoundary: false,
  });

  // Update profile when data changes
  useEffect(() => {
    if (data) {
      setProfile(data);
      setIsInitialized(true); // Mark as initialized
    } else if (error) {
      // Profile doesn't exist - silent fail
      setProfile(null);
      setIsInitialized(true); // Still mark as initialized
    }
  }, [data, error]);

  // Reset when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsInitialized(false);
    }
  }, [user]);

  const refreshProfile = async () => {
    if (user) {
      try {
        const result = await refetch();
        if (result.data) {
          setProfile(result.data);
        }
      } catch {
        // Silent failure
        setProfile(null);
      }
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, loading: isLoading, isInitialized, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}