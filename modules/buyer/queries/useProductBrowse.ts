"use client";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

const productQueryKeys = {
  all: ["products"] as const,
  listings: () => [...productQueryKeys.all, "listings"] as const,
  listingById: (id: string) => [...productQueryKeys.listings(), id] as const,
  brands: () => [...productQueryKeys.all, "brands"] as const,
  brandById: (id: string) => [...productQueryKeys.brands(), id] as const,
  collections: () => [...productQueryKeys.all, "collections"] as const,
  collectionById: (id: string) => [...productQueryKeys.collections(), id] as const,
  search: (query: string) => [...productQueryKeys.all, "search", query] as const,
  reviews: (listingId: string) => [...productQueryKeys.listingById(listingId), "reviews"] as const,
};

export function useSearchListings(query: string, filters?: { category?: string; minPrice?: number; maxPrice?: number }) {
  return useQuery({
    queryKey: productQueryKeys.search(query),
    queryFn: async () => {
      try {
        const result = await ((trpc.listing as any).searchListings as any).query({
          query,
          ...filters,
        });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!query,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useListingById(listingId: string) {
  return useQuery({
    queryKey: productQueryKeys.listingById(listingId),
    queryFn: async () => {
      try {
        const result = await ((trpc.listing as any).getListingById as any).query({ listingId });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!listingId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: productQueryKeys.brands(),
    queryFn: async () => {
      try {
        const result = await ((trpc.product as any).getAllBrands as any).query();
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBrandById(brandId: string) {
  return useQuery({
    queryKey: productQueryKeys.brandById(brandId),
    queryFn: async () => {
      try {
        const result = await ((trpc.product as any).getBrandById as any).query({ brandId });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBrandListings(brandId: string) {
  return useQuery({
    queryKey: [...productQueryKeys.brandById(brandId), "listings"],
    queryFn: async () => {
      try {
        const result = await ((trpc.product as any).getBrandListings as any).query({ brandId });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!brandId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCollectionById(collectionId: string) {
  return useQuery({
    queryKey: productQueryKeys.collectionById(collectionId),
    queryFn: async () => {
      try {
        const result = await ((trpc.product as any).getCollectionById as any).query({ collectionId });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCollectionListings(collectionId: string) {
  return useQuery({
    queryKey: [...productQueryKeys.collectionById(collectionId), "listings"],
    queryFn: async () => {
      try {
        const result = await ((trpc.product as any).getCollectionListings as any).query({ collectionId });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!collectionId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useListingReviews(listingId: string) {
  return useQuery({
    queryKey: productQueryKeys.reviews(listingId),
    queryFn: async () => {
      try {
        const result = await ((trpc.review as any).getListingReviews as any).query({ listingId });
        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!listingId,
    staleTime: 60 * 1000, // 1 minute
  });
}