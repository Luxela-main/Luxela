'use client';

import { trpc } from '@/lib/trpc';

export const useCollections = () => {
  return (trpc.listing as any).getAllCollections.useQuery(undefined, {
    staleTime: 60000,
    gcTime: 120000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
};