'use client';

import { useEffect, useState, useCallback } from 'react';

export interface Collection {
  id: string;
  listingId: string;
  title: string;
  name?: string;
  description: string | null;
  slug: string | null;
  image: string | null;
  images: string[];
  imagesJson?: string | null;
  priceCents: number | null;
  price: number | null;
  category: string | null;
  brandId: string;
  brandName?: string;
  createdAt: string;
  updatedAt: string;
  sku?: string | null;
  metaDescription?: string | null;
  barcode?: string | null;
  videoUrl?: string | null;
  careInstructions?: string | null;
  brandLogo?: string | null;
  brandHeroImage?: string | null;
  sellerName?: string;
  sellerId?: string;
  status: string;
  type: 'collection' | 'single';
  collectionId?: string | null;
  collectionItemCount?: number;
  collectionTotalPrice?: number;
  shippingOption?: string | null;
  refundPolicy?: string | null;
  quantityAvailable?: number | null;
}

export interface UseCollectionsOptions {
  limit?: number;
  search?: string;
  category?: string;
}

export interface UseCollectionsResult {
  data: Collection[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Collections hook using backend REST API
 * Fetches APPROVED collection listings with complete data
 */
export function useCollections({
  limit,
  search,
  category,
}: UseCollectionsOptions = {}): UseCollectionsResult {
  const [data, setData] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call tRPC endpoint via HTTP with proper input format
      const input = {
        limit: limit || 20,
        offset: 0,
      };
      const inputStr = encodeURIComponent(JSON.stringify(input));
      const response = await fetch(`/api/trpc/collection.getApprovedCollections?input=${inputStr}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Collection API Error:', errorText);
        throw new Error(`Failed to fetch collections: ${response.status}`);
      }

      const json = await response.json();
      if (json.error) {
        console.error('tRPC Error:', json.error);
        throw new Error(json.error.message || 'Failed to fetch collections');
      }
      const result = json.result?.data;

      // Transform backend data to match Collection interface
      let collections: Collection[] = (result?.collections || []).map((item: any) => {
        let images: string[] = [];
        if (item.imagesJson) {
          try {
            const parsed = JSON.parse(item.imagesJson);
            images = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            images = [];
          }
        }
        if (item.image && !images.includes(item.image)) {
          images.unshift(item.image);
        }

        const price = item.priceCents ? item.priceCents / 100 : null;

        return {
          id: item.id,
          listingId: item.id,
          title: item.title,
          name: item.title,
          slug: item.slug,
          description: item.description,
          image: item.image,
          images: images,
          imagesJson: item.imagesJson,
          priceCents: item.priceCents,
          price: price,
          category: item.category,
          brandId: item.sellerId || '',
          brandName: item.sellerName,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          sku: undefined,
          metaDescription: undefined,
          barcode: undefined,
          videoUrl: undefined,
          careInstructions: undefined,
          brandLogo: undefined,
          brandHeroImage: undefined,
          sellerName: item.sellerName || 'Unknown Seller',
          sellerId: item.sellerId,
          status: 'approved',
          type: 'collection',
          collectionId: item.collectionId,
          collectionItemCount: item.itemCount,
          collectionTotalPrice: undefined,
          shippingOption: item.shippingOption,
          refundPolicy: item.refundPolicy,
          quantityAvailable: item.quantityAvailable,
        };
      });

      // Apply search filter
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        collections = collections.filter(
          (c) =>
            c.title.toLowerCase().includes(searchLower) ||
            c.description?.toLowerCase().includes(searchLower) ||
            c.brandName?.toLowerCase().includes(searchLower)
        );
      }

      setData(collections);
    } catch (err: any) {
      const errorMessage =
        err?.message || 'Failed to fetch collections';
      setError(errorMessage);
      console.error('Error fetching collections:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [limit, search]);

  // Initial fetch
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCollections,
  };
}

/**
 * Fetch detailed collection information with approved items
 * collectionId here is actually the listing ID of the collection
 */
export function useCollectionDetails(collectionId: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollectionDetails = useCallback(async () => {
    if (!collectionId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch collection details via REST API
      const response = await fetch(
        `/api/trpc/collection.getBuyerCollectionWithProducts?input=${JSON.stringify({ collectionId })}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch collection details: ${response.status}`);
      }

      const json = await response.json();
      const result = json.result?.data;

      setData({
        collection: {
          id: result?.id,
          title: result?.title,
          description: result?.description,
          collectionId: result?.id,
        },
        items: result?.items || [],
        itemCount: result?.items?.length || 0,
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch collection details';
      setError(errorMessage);
      console.error('Error fetching collection details:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    fetchCollectionDetails();
  }, [fetchCollectionDetails]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCollectionDetails,
  };
}