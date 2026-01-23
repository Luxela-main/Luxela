'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { trpc } from '@/lib/trpc';

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
  refreshProfile: () => Promise<void>;
  setProfile: (profile: ProfileData | null) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Query profile data only when user is authenticated
  const { data: profileData, isLoading: queryLoading, refetch } = trpc.buyer.getAccountDetails.useQuery(undefined, {
    enabled: !!user && !authLoading,
    retry: (failureCount, error: any) => {
      // Don't retry on NOT_FOUND errors (user hasn't created profile yet)
      if (error?.data?.code === 'NOT_FOUND') {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });

  // Update profile state when query data changes
  useEffect(() => {
    if (profileData) {
      setProfile(profileData);
      setIsInitialized(true);
    }
  }, [profileData]);

  // Handle initialization based on auth and query states
  useEffect(() => {
    if (!user && !authLoading) {
      // No user - initialization is complete
      setProfile(null);
      setIsInitialized(true);
    } else if (user && !authLoading && !queryLoading) {
      // User exists and query has finished
      setIsInitialized(true);
    }
  }, [user, authLoading, queryLoading]);

  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log('[ProfileContext] Refreshing profile...');
      
      // Refetch the data from server
      const result = await refetch();
      
      if (result.data) {
        setProfile(result.data);
        console.log('[ProfileContext] Profile refreshed successfully:', result.data);
      }
    } catch (err: any) {
      console.error('[ProfileContext] Failed to refresh profile:', err);
      // Don't clear profile on error - keep existing data
    } finally {
      setIsLoading(false);
    }
  };

  const setProfileData = (newProfile: ProfileData | null) => {
    setProfile(newProfile);
    setIsInitialized(true);
  };

  return (
    <ProfileContext.Provider value={{ profile, loading: isLoading || queryLoading, isInitialized, refreshProfile, setProfile: setProfileData }}>
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