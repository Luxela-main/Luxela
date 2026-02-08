'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

/**
 * Product variant with size and color information
 */
export interface ProductVariant {
  id: string;
  size: string;
  colorName: string;
  colorHex: string;
}

/**
 * Product image with position for ordering
 */
export interface ProductImage {
  id: string;
  imageUrl: string;
  position: number;
}

/**
 * Inventory information for a product variant
 */
export interface InventoryInfo {
  id: string;
  quantity: number;
  reservedQuantity: number;
  variantId: string;
}

/**
 * Parsed items JSON structure
 */
export interface ItemsJSON {
  [key: string]: any;
}

/**
 * Complete product with all related data
 */
export interface CollectionProduct {
  id: string;
  brandId: string;
  collectionId: string | null;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  type: string | null;
  sku: string;
  inStock: boolean;
  shipsIn: string | null;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  variants: ProductVariant[];
  inventory: InventoryInfo[];
  itemsJson: ItemsJSON | null;
}

/**
 * Listing data with pricing
 */
export interface CollectionListing {
  id: string;
  productId: string;
  product: CollectionProduct;
  listingTitle: string;
  listingDescription: string | null;
  category: string | null;
  image: string | null;
  priceCents: number;
  currency: string;
  sizesJson: any;
  itemsJson: any;
  shippingOption: string | null;
  refundPolicy: string | null;
  localPricing: string | null;
  etaDomestic: string | null;
  etaInternational: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Collection display data with products
 */
export interface CollectionDisplayData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brandId: string;
  brandName: string | null;
  brandLogo: string | null;
  brandHero: string | null;
  createdAt: string;
  updatedAt: string;
  products: CollectionProduct[];
  listings: CollectionListing[];
  productCount: number;
  listingCount: number;
}

export interface UseCollectionProductsOptions {
  collectionId?: string;
  brandId?: string;
  limit?: number;
  offset?: number;
}

export interface UseCollectionProductsResult {
  data: CollectionDisplayData | null;
  products: CollectionProduct[];
  listings: CollectionListing[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch collection products with all images and items JSON
 * Fetches from the collection_items junction table to get actual collection members
 * Includes product images, variants, inventory, and listing details
 */
export function useCollectionProducts(
  options: UseCollectionProductsOptions = {}
): UseCollectionProductsResult {
  const { collectionId, limit = 50, offset = 0 } = options;

  const [data, setData] = useState<CollectionDisplayData | null>(null);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [listings, setListings] = useState<CollectionListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [supabase] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      return createClient();
    } catch (err: any) {
      console.error('Failed to initialize Supabase:', err.message);
      setError('Supabase client initialization failed. Please check environment variables.');
      setIsLoading(false);
      return null;
    }
  });

  const fetchCollectionProducts = useCallback(async () => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      setError('Database connection not available');
      setIsLoading(false);
      return;
    }
    if (!collectionId) {
      console.warn('useCollectionProducts called without collectionId');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`[useCollectionProducts] Starting fetch for collectionId=${collectionId}`);

      // First, get the collection listing to fetch its metadata
      const { data: collectionListing, error: collectionListingError } = await supabase
        .from('listings')
        .select(
          `
          id,
          title,
          description,
          image,
          images_json,
          collection_id,
          status,
          created_at,
          updated_at,
          sellers (
            id,
            user_id,
            business_name,
            logo,
            hero_image
          )
        `
        )
        .eq('collection_id', collectionId)
        .eq('status', 'approved')
        .eq('type', 'collection')
        .limit(1)
        .single();

      if (collectionListingError) {
        console.error(`[useCollectionProducts] Collection listing fetch error:`, collectionListingError);
        throw new Error(collectionListingError.message || 'Failed to fetch collection listing');
      }

      // Now fetch the collection items from the junction table with full product data
      const { data: collectionItemsData, error: collectionItemsError } = await supabase
        .from('collection_items')
        .select(
          `
          id,
          position,
          product_id,
          products (
            id,
            brand_id,
            collection_id,
            name,
            slug,
            description,
            category,
            price,
            currency,
            type,
            sku,
            in_stock,
            ships_in,
            created_at,
            updated_at,
            product_images (
              id,
              image_url,
              position
            ),
            product_variants (
              id,
              size,
              color_name,
              color_hex
            ),
            inventory (
              id,
              quantity,
              reserved_quantity,
              variant_id
            )
          )
        `
        )
        .eq('collection_id', collectionId)
        .order('position', { ascending: true });

      if (collectionItemsError) {
        console.error(`[useCollectionProducts] Collection items fetch error:`, collectionItemsError);
        throw new Error(collectionItemsError.message || 'Failed to fetch collection items');
      }

      console.log(`[useCollectionProducts] Fetched ${collectionItemsData?.length || 0} items in collection`);

      // Fetch listings for each product to get pricing and other listing details
      const productIds = (collectionItemsData || []).map((item: { product_id: string | null }) => item.product_id).filter(Boolean);
      let listingsDataMap: Record<string, any> = {};
      
      if (productIds.length > 0) {
        const { data: fetchedListings, error: listingsError } = await supabase
          .from('listings')
          .select(
            `
            id,
            product_id,
            title,
            description,
            category,
            image,
            images_json,
            price_cents,
            currency,
            sizes_json,
            items_json,
            shipping_option,
            refund_policy,
            local_pricing,
            eta_domestic,
            eta_international,
            created_at,
            updated_at,
            status
          `
          )
          .in('product_id', productIds)
          .eq('status', 'approved')
          .eq('type', 'single');

        if (!listingsError && fetchedListings) {
          fetchedListings.forEach((listing: any) => {
            listingsDataMap[listing.product_id] = listing;
          });
        }
      }

      // Build collection data from the listing
      let collectionData: CollectionDisplayData | null = null;
      if (collectionListing) {
        collectionData = {
          id: collectionId,
          name: collectionListing.title || 'Collection',
          slug: collectionId,
          description: collectionListing.description,
          brandId: collectionListing.sellers?.id || '',
          brandName: collectionListing.sellers?.business_name || 'Unknown',
          brandLogo: collectionListing.sellers?.logo || null,
          brandHero: collectionListing.sellers?.hero_image || null,
          createdAt: collectionListing.created_at,
          updatedAt: collectionListing.updated_at,
          products: [],
          listings: [],
          productCount: 0,
          listingCount: 0,
        };
      }

      // Transform products from collection_items with product data
      const transformedProducts: CollectionProduct[] = (collectionItemsData || [])
        .map((collectionItem: any) => {
          const product = collectionItem.products;
          if (!product) return null;
          
          return {
            id: product.id,
            brandId: product.brand_id,
            collectionId: product.collection_id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            category: product.category,
            price: product.price,
            currency: product.currency,
            type: product.type,
            sku: product.sku,
            inStock: product.in_stock,
            shipsIn: product.ships_in,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
            images: (product.product_images || [])
              .sort((a: any, b: any) => a.position - b.position)
              .map((img: any) => ({
                id: img.id,
                imageUrl: img.image_url,
                position: img.position,
              })),
            variants: (product.product_variants || []).map((variant: any) => ({
              id: variant.id,
              size: variant.size,
              colorName: variant.color_name,
              colorHex: variant.color_hex,
            })),
            inventory: (product.inventory || []).map((inv: any) => ({
              id: inv.id,
              quantity: inv.quantity,
              reservedQuantity: inv.reserved_quantity,
              variantId: inv.variant_id,
            })),
            itemsJson: null,
          };
        })
        .filter((p: any): p is CollectionProduct => p !== null);

      // Transform listings data by mapping collection items to listing data
      const transformedListings: CollectionListing[] = (collectionItemsData || [])
        .map((collectionItem: any) => {
          const product = transformedProducts.find((p) => p.id === collectionItem.product_id);
          const listing = listingsDataMap[collectionItem.product_id];
          
          return {
            id: listing?.id || collectionItem.id,
            productId: collectionItem.product_id,
            product: product || ({} as CollectionProduct),
            listingTitle: listing?.title || product?.name || 'Product',
            listingDescription: listing?.description || product?.description || null,
            category: listing?.category || product?.category || null,
            image: listing?.image || (product?.images[0]?.imageUrl || null),
            priceCents: listing?.price_cents || (product?.price ? product.price * 100 : 0),
            currency: listing?.currency || product?.currency || 'NGN',
            sizesJson: listing?.sizes_json ? JSON.parse(listing.sizes_json) : null,
            itemsJson: listing?.items_json ? JSON.parse(listing.items_json) : null,
            shippingOption: listing?.shipping_option || null,
            refundPolicy: listing?.refund_policy || null,
            localPricing: listing?.local_pricing || null,
            etaDomestic: listing?.eta_domestic || null,
            etaInternational: listing?.eta_international || null,
            createdAt: listing?.created_at || product?.createdAt || new Date().toISOString(),
            updatedAt: listing?.updated_at || product?.updatedAt || new Date().toISOString(),
          };
        });

      setListings(transformedListings);
      setProducts(transformedProducts);

      // Update collection display data with transformed data
      if (collectionData) {
        collectionData.products = transformedProducts;
        collectionData.listings = transformedListings;
        collectionData.productCount = transformedProducts.length;
        collectionData.listingCount = transformedListings.length;
        setData(collectionData);
      }
    } catch (err: any) {
      const errorMessage =
        err?.message || 'Failed to fetch collection products';
      setError(errorMessage);
      console.error('Error fetching collection products:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, collectionId, limit, offset]);

  // Initial fetch
  useEffect(() => {
    fetchCollectionProducts();
  }, [fetchCollectionProducts]);

  // Subscribe to real-time updates with debouncing to prevent race conditions
  useEffect(() => {
    if (!supabase) return;

    const subscriptions: any[] = [];
    let debounceTimer: NodeJS.Timeout | null = null;

    const debouncedFetch = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        fetchCollectionProducts();
      }, 500);
    };

    // Subscribe to collection items changes
    if (collectionId) {
      subscriptions.push(
        supabase
          .channel(`collection-items-${collectionId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'collection_items',
              filter: `collection_id=eq.${collectionId}`,
            },
            () => {
              debouncedFetch();
            }
          )
          .subscribe()
      );
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [supabase, collectionId, fetchCollectionProducts]);

  return {
    data,
    products,
    listings,
    isLoading,
    error,
    refetch: fetchCollectionProducts,
  };
}