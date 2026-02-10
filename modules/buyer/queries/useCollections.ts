'use client';

import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/app/_trpc/client';

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
  totalPrice?: number; // Total price of all items in collection (from backend)
  totalPriceCents?: number; // Total price in cents
  avgPrice?: number; // Average price per item
  shippingOption?: string | null;
  refundPolicy?: string | null;
  quantityAvailable?: number | null;
  items?: any[]; // Collection items from backend
  itemsJson?: string | null; // Stringified items for backward compatibility
  colors?: string[]; // Unique colors from collection items
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
 * Collections hook using tRPC client
 * Fetches APPROVED collection listings with complete data
 */
export function useCollections({
  limit = 20,
  search,
  category,
}: UseCollectionsOptions = {}): UseCollectionsResult {
  // Use tRPC query to fetch approved collections
  const { data: tRPCData, isLoading, error: tRPCError } = trpc.collection.getApprovedCollections.useQuery(
    {
      limit: limit || 20,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  const [data, setData] = useState<Collection[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Process the tRPC data whenever it changes
  useEffect(() => {
    if (!tRPCData || !tRPCData.collections) {
      console.log('[useCollections] No tRPC data received', { tRPCData });
      setData([]);
      return;
    }

    console.log('[useCollections] tRPCData received with', tRPCData.collections.length, 'collections');

    try {

      // Transform backend data to match Collection interface
      let collections: Collection[] = (tRPCData.collections || []).map((item: any) => {
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

        // Extract unique colors from collection items
        const collectionColors = new Set<string>();
        if (item.items && Array.isArray(item.items)) {
          item.items.forEach((product: any) => {
            // Try multiple possible field names for colors
            const colorsSource = product.colorsAvailable || product.colors_available || product.colors;
            if (colorsSource) {
              try {
                let colors = colorsSource;
                if (typeof colorsSource === 'string') {
                  try {
                    colors = JSON.parse(colorsSource);
                  } catch (e) {
                    // If not JSON, treat as single color name
                    colors = [colorsSource];
                  }
                }
                if (Array.isArray(colors)) {
                  colors.forEach((c: any) => {
                    // Handle both string and object color formats
                    const colorName = typeof c === 'string' ? c : (c.colorName || c.name || c);
                    collectionColors.add(colorName);
                  });
                }
              } catch (e) {
                // Color parsing failed, continue
              }
            }
          });
        }

        const price = item.priceCents ? item.priceCents / 100 : null;
        const itemCount = item.itemCount || item.items?.length || 0;
        const totalPriceCents = item.totalPriceCents || item.totalPrice || 0;
        const totalPrice = totalPriceCents / 100;
        const avgPrice = item.avgPrice || (itemCount > 0 ? totalPriceCents / itemCount / 100 : 0);

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
          collectionItemCount: itemCount,
          collectionTotalPrice: totalPrice,
          totalPrice: totalPrice,
          totalPriceCents: totalPriceCents,
          avgPrice: avgPrice,
          shippingOption: item.shippingOption,
          refundPolicy: item.refundPolicy,
          quantityAvailable: item.quantityAvailable,
          items: item.items || [], // Pass collection items from backend
          itemsJson: item.itemsJson, // Pass stringified items if available
          colors: Array.from(collectionColors), // Extract unique colors from collection items
        };
      });

      // Sort by creation date - latest first
      collections.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (latest first)
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

      console.log('[useCollections] Transformed', collections.length, 'collections (sorted by latest first):', collections.map((c: any) => ({ id: c.id, title: c.title, createdAt: c.createdAt, itemsCount: c.items?.length || 0 })));
      setData(collections);
      setError(null);
    } catch (err: any) {
      const errorMessage =
        err?.message || 'Failed to process collections';
      setError(errorMessage);
      console.error('Error processing collections:', errorMessage);
    }
  }, [tRPCData, search]);

  // Handle tRPC errors
  useEffect(() => {
    if (tRPCError) {
      const errorMessage = tRPCError instanceof Error 
        ? tRPCError.message 
        : 'Failed to fetch collections';
      setError(errorMessage);
      console.error('tRPC Error fetching collections:', errorMessage);
    }
  }, [tRPCError]);

  return {
    data,
    isLoading,
    error,
    refetch: () => Promise.resolve(), // tRPC handles refetching internally
  };
}

/**
 * Fetch detailed collection information with approved items
 * collectionId here is actually the listing ID of the collection
 */
export function useCollectionDetails(collectionId: string) {
  const { data: tRPCData, isLoading, error: tRPCError } = trpc.collection.getBuyerCollectionWithProducts.useQuery(
    { collectionId },
    {
      enabled: !!collectionId,
    }
  );

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Process the tRPC data whenever it changes
  useEffect(() => {
    if (!tRPCData) {
      setData(null);
      return;
    }

    try {
      const result = tRPCData;

      setData({
        collection: {
          id: result?.id,
          title: result?.name,
          description: result?.description,
          collectionId: result?.id,
        },
        items: result?.items || [],
        itemCount: result?.items?.length || 0,
      });
      setError(null);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to process collection details';
      setError(errorMessage);
      console.error('Error processing collection details:', errorMessage);
    }
  }, [tRPCData]);

  // Handle tRPC errors
  useEffect(() => {
    if (tRPCError) {
      const errorMessage = tRPCError instanceof Error 
        ? tRPCError.message 
        : 'Failed to fetch collection details';
      setError(errorMessage);
      console.error('tRPC Error fetching collection details:', errorMessage);
    }
  }, [tRPCError]);

  return {
    data,
    isLoading,
    error,
    refetch: () => Promise.resolve(), // tRPC handles refetching internally
  };
}