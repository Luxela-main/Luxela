'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface ParsedListing {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  images: string[];
  price: number;
  priceCents: number;
  sku: string;
  rating: number;
  reviews: number;
  brand?: string;
  category?: string;
  type: 'collection' | 'product' | 'brand';
  stock?: number;
  discount?: number;
}

interface RawListing {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  images_json?: string;
  imagesJson?: string;
  price_cents?: number;
  price?: number;
  sku?: string;
  rating?: number;
  reviews?: number;
  brand?: string;
  category?: string;
  type?: string;
  stock?: number;
  discount?: number;
}

export const parseListingImages = (listing: RawListing): string[] => {
  try {
    // Try to parse imagesJson or images_json field
    const jsonField = listing.imagesJson || listing.images_json;
    
    if (!jsonField) {
      // Fallback to main image only
      return listing.image ? [listing.image] : [];
    }

    let parsedImages: any[] = [];
    
    if (typeof jsonField === 'string') {
      const parsed = JSON.parse(jsonField);
      if (Array.isArray(parsed)) {
        parsedImages = parsed;
      } else if (typeof parsed === 'object' && parsed.images && Array.isArray(parsed.images)) {
        parsedImages = parsed.images;
      }
    } else if (Array.isArray(jsonField)) {
      parsedImages = jsonField;
    }
    
    // Extract URLs from images, handling both string and object formats
    const imageUrls = parsedImages
      .map((img) => {
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && img?.imageUrl) return img.imageUrl;
        if (typeof img === 'object' && img?.url) return img.url;
        return '';
      })
      .filter((url): url is string => url.length > 0);
    
    return imageUrls.length > 0 ? imageUrls : (listing.image ? [listing.image] : []);
  } catch (error) {
    console.error('Error parsing listing images:', error);
    // Return main image as fallback
    return listing.image ? [listing.image] : [];
  }
};

export const transformRawListing = (item: RawListing, type: 'collection' | 'product' | 'brand' = 'product'): ParsedListing => {
  const images = parseListingImages(item);
  const priceCents = item.price_cents || item.price || 0;
  const price = priceCents / 100;

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description || '',
    image: item.image || images[0] || '',
    images: images,
    priceCents,
    price,
    sku: item.sku || '',
    rating: item.rating || 0,
    reviews: item.reviews || 0,
    brand: item.brand,
    category: item.category,
    type,
    stock: item.stock,
    discount: item.discount,
  };
};

export const useUnifiedListings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchListings = useCallback(
    async (
      filters?: {
        type?: 'collection' | 'product' | 'brand';
        brand?: string;
        category?: string;
        search?: string;
        limit?: number;
        offset?: number;
      }
    ): Promise<ParsedListing[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('listings')
          .select('id, slug, name, description, image, images_json, price_cents, sku, rating, reviews, brand, category, type, stock, discount');

        // Apply type filter
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }

        // Apply brand filter
        if (filters?.brand) {
          query = query.eq('brand', filters.brand);
        }

        // Apply category filter
        if (filters?.category) {
          query = query.eq('category', filters.category);
        }

        // Apply search filter
        if (filters?.search) {
          query = query.or(
            `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`
          );
        }

        // Apply limit
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        // Apply offset
        if (filters?.offset) {
          query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (!data) {
          return [];
        }

        // Transform all listings with consistent image parsing
        const type = filters?.type || 'product';
        return (data as RawListing[]).map((item: RawListing) => transformRawListing(item, type));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch listings';
        setError(errorMessage);
        console.error('Error fetching unified listings:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const fetchSingleListing = useCallback(
    async (slug: string): Promise<ParsedListing | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from('listings')
          .select('id, slug, name, description, image, images_json, price_cents, sku, rating, reviews, brand, category, type, stock, discount')
          .eq('slug', slug)
          .single();

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (!data) {
          return null;
        }

        return transformRawListing(data as RawListing);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch listing';
        setError(errorMessage);
        console.error('Error fetching single listing:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    fetchListings,
    fetchSingleListing,
    loading,
    error,
  };
};