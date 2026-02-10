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
  limit?: number;
  offset?: number;
}

export interface UseCollectionProductsResult {
  data: CollectionDisplayData | null;
  products: CollectionProduct[];
  listings?: CollectionListing[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch collection data including products, images, variants, and inventory
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

      console.log(`[useCollectionProducts] Starting fetch for collectionId=${collectionId}, using listings table (type='collection')`);

      // First, determine if the provided ID is a listing ID or collection ID
      // Try collection_id first (most common case from collection cards)
      let listingData = null;
      let resolvedCollectionId = collectionId;
      let actualListingId = null;
      
      // Attempt 1: Try as collection_id (most common - from collection cards)
      const { data: collectionListing, error: collectionError } = await supabase
        .from('listings')
        .select(
          `
          id,
          title,
          description,
          slug,
          image,
          images_json,
          price_cents,
          currency,
          items_json,
          collection_id,
          seller_id,
          shipping_option,
          refund_policy,
          created_at,
          updated_at
        `
        )
        .eq('collection_id', collectionId)
        .eq('type', 'collection')
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();
      
      if (collectionError) {
        console.warn(`[useCollectionProducts] Collection ID fetch error:`, collectionError);
      } else if (collectionListing) {
        console.log(`[useCollectionProducts] ✓ Found collection by collection ID: ${collectionListing.collection_id}`);
        listingData = collectionListing;
        resolvedCollectionId = collectionId;
        actualListingId = collectionListing.id;
      } else {
        // Attempt 2: Try as listing ID (direct match)
        const { data: directListing, error: directError } = await supabase
          .from('listings')
          .select(
            `
            id,
            title,
            description,
            slug,
            image,
            images_json,
            price_cents,
            currency,
            items_json,
            collection_id,
            seller_id,
            shipping_option,
            refund_policy,
            created_at,
            updated_at
          `
          )
          .eq('id', collectionId)
          .eq('type', 'collection')
          .eq('status', 'approved')
          .limit(1)
          .maybeSingle();
        
        if (directError) {
          console.warn(`[useCollectionProducts] Direct listing fetch error:`, directError);
        } else if (directListing) {
          console.log(`[useCollectionProducts] ✓ Found collection by listing ID: ${directListing.id}`);
          listingData = directListing;
          resolvedCollectionId = directListing.collection_id || collectionId;
          actualListingId = directListing.id;
        }
      }

      // If no listing found, try to fetch collection directly from collections table
      // This handles collections that don't have a corresponding listings record
      if (!listingData) {
        console.log(`[useCollectionProducts] No listing found for collectionId=${collectionId}, checking collections table...`);
        
        const { data: collectionFromTable, error: collectionTableError } = await supabase
          .from('collections')
          .select('id, name, slug, description, brand_id, created_at, updated_at')
          .eq('id', collectionId)
          .limit(1)
          .maybeSingle();
        
        if (collectionTableError) {
          console.warn(`[useCollectionProducts] Collection table fetch error:`, collectionTableError);
        } else if (collectionFromTable) {
          console.log(`[useCollectionProducts] ✓ Found collection in collections table: ${collectionFromTable.name}`);
          listingData = {
            id: collectionFromTable.id,
            title: collectionFromTable.name,
            description: collectionFromTable.description,
            slug: collectionFromTable.slug,
            image: null,
            images_json: null,
            price_cents: 0,
            currency: 'NGN',
            items_json: null,
            collection_id: collectionFromTable.id,
            seller_id: collectionFromTable.brand_id,
            shipping_option: null,
            refund_policy: null,
            created_at: collectionFromTable.created_at,
            updated_at: collectionFromTable.updated_at,
          };
          resolvedCollectionId = collectionFromTable.id;
        } else {
          console.warn(`[useCollectionProducts] Collection not found in either listings or collections table`);
          setError('Collection not found');
          setIsLoading(false);
          return;
        }
      }

      console.log(`[useCollectionProducts] ✓ Found collection listing: "${listingData.title}"`);

      // Get collection metadata from collections table for additional info
      const { data: collectionData, error: collectionMetadataError } = await supabase
        .from('collections')
        .select(
          `
          id,
          name,
          slug,
          description,
          brand_id,
          created_at,
          updated_at
        `
        )
        .eq('id', resolvedCollectionId)
        .limit(1)
        .maybeSingle();

      if (collectionMetadataError) {
        console.warn(`[useCollectionProducts] Collection metadata fetch warning:`, collectionMetadataError);
      }

      // Fetch seller business info
      let sellerInfo = { id: '', business_name: 'Unknown', logo: null, hero_image: null };
      if (listingData && listingData.seller_id) {
        const { data: sellerData } = await supabase
          .from('seller_business')
          .select('seller_id, brand_name, store_logo, store_banner')
          .eq('seller_id', listingData.seller_id)
          .limit(1)
          .maybeSingle();
        
        if (sellerData) {
          sellerInfo = {
            id: sellerData.seller_id,
            business_name: sellerData.brand_name || 'Unknown',
            logo: sellerData.store_logo || null,
            hero_image: sellerData.store_banner || null,
          };
        }
      }

      // Fetch collection items from junction table
      const { data: collectionItemsData, error: collectionItemsError } = await supabase
        .from('collection_items')
        .select('id, position, product_id')
        .eq('collection_id', resolvedCollectionId)
        .order('position', { ascending: true });

      if (collectionItemsError) {
        console.warn(`[useCollectionProducts] Collection items fetch error:`, collectionItemsError);
      }

      const productIds: string[] = (collectionItemsData || [])
        .map((item: any) => item.product_id)
        .filter(Boolean);
      
      console.log(`[useCollectionProducts] Found ${productIds.length} products in collection_items`);

      console.log(`[useCollectionProducts] Total product IDs to fetch: ${productIds.length}`);
      
      let productsDataMap: Record<string, any> = {};
      
      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(
            `id, brand_id, collection_id, name, slug, description, category, sku, in_stock, ships_in, created_at, updated_at`
          )
          .in('id', productIds);
        
        if (productsError) {
          console.error(`[useCollectionProducts] Products fetch error:`, productsError);
        } else if (productsData) {
          productsData.forEach((product: any) => {
            productsDataMap[product.id] = product;
          });
        }
      }

      // Fetch ALL product images separately for better reliability
      let allProductImages: any[] = [];
      let allProductVariants: any[] = [];
      let allInventory: any[] = [];
      
      if (productIds.length > 0) {
        // Fetch product images
        const { data: imagesData, error: imagesError } = await supabase
          .from('product_images')
          .select('id, product_id, image_url, position')
          .in('product_id', productIds);
        
        if (imagesError) {
          console.error(`[useCollectionProducts] Product images fetch error:`, imagesError);
        } else {
          allProductImages = imagesData || [];
        }

        // Fetch product variants
        const { data: variantsData, error: variantsError } = await supabase
          .from('product_variants')
          .select('id, product_id, size, color_name, color_hex')
          .in('product_id', productIds);
        
        if (variantsError) {
          console.error(`[useCollectionProducts] Product variants fetch error:`, variantsError);
        } else {
          allProductVariants = variantsData || [];
        }

        // Fetch inventory
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('id, product_id, quantity, reserved_quantity, variant_id')
          .in('product_id', productIds);
        
        if (inventoryError) {
          console.error(`[useCollectionProducts] Inventory fetch error:`, inventoryError);
        } else {
          allInventory = inventoryData || [];
        }
      }

      // Fetch product listings for pricing
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
            created_at,
            updated_at,
            status,
            type
          `
          )
          .in('product_id', productIds)
          .eq('status', 'approved');

        if (listingsError) {
          console.warn(`[useCollectionProducts] Product listings fetch warning:`, listingsError);
        } else if (fetchedListings) {
          fetchedListings.forEach((listing: any) => {
            if (!listingsDataMap[listing.product_id] || listing.type === 'single') {
              listingsDataMap[listing.product_id] = listing;
            }
          });
          console.log(`[useCollectionProducts] Found ${fetchedListings.length} product listings`);
        }
      }

      // Build collection display data from listing and collection metadata
      let collectionDisplayData: CollectionDisplayData | null = null;
      if (listingData) {
        collectionDisplayData = {
          id: resolvedCollectionId,
          name: collectionData?.name || listingData.title || 'Collection',
          slug: collectionData?.slug || listingData.slug || resolvedCollectionId,
          description: collectionData?.description || listingData.description,
          brandId: listingData.seller_id || sellerInfo.id || '',
          brandName: sellerInfo.business_name || 'Unknown',
          brandLogo: sellerInfo.logo || null,
          brandHero: listingData.image || sellerInfo.hero_image || null,
          createdAt: listingData.created_at,
          updatedAt: listingData.updated_at,
          products: [],
          listings: [],
          productCount: 0,
          listingCount: 0,
        };
      }

      // Transform products from collection_items with product data
      const transformedProducts: CollectionProduct[] = (collectionItemsData || [])
        .map((collectionItem: any) => {
          const product = productsDataMap[collectionItem.product_id];
          if (!product) return null;
          
          // Get all images for this product from the fetched allProductImages array
          const productImagesForItem = allProductImages.filter((img: any) => img.product_id === product.id)
            .sort((a: any, b: any) => a.position - b.position);
          
          // Get all variants for this product
          const productVariantsForItem = allProductVariants.filter((variant: any) => variant.product_id === product.id);
          
          // Get all inventory for this product
          const productInventoryForItem = allInventory.filter((inv: any) => inv.product_id === product.id);
          
          // Get the listing data to retrieve itemsJson and pricing
          const listing = listingsDataMap[product.id];
          
          return {
            id: product.id,
            brandId: product.brand_id,
            collectionId: product.collection_id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            category: product.category,
            price: listing?.price_cents ? listing.price_cents / 100 : 0,
            currency: listing?.currency || 'NGN',
            type: product.type,
            sku: product.sku,
            inStock: product.in_stock,
            shipsIn: product.ships_in,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
            images: productImagesForItem.map((img: any) => ({
              id: img.id,
              imageUrl: img.image_url,
              position: img.position,
            })),
            variants: productVariantsForItem.map((variant: any) => ({
              id: variant.id,
              size: variant.size,
              colorName: variant.color_name,
              colorHex: variant.color_hex,
            })),
            inventory: productInventoryForItem.map((inv: any) => ({
              id: inv.id,
              quantity: inv.quantity,
              reservedQuantity: inv.reserved_quantity,
              variantId: inv.variant_id,
            })),
            itemsJson: listing?.items_json ? JSON.parse(listing.items_json) : null,
          };
        })
        .filter((p: any): p is CollectionProduct => p !== null);

      // Transform listings data by mapping collection items to listing data
      const transformedListings: CollectionListing[] = (collectionItemsData || [])
        .map((collectionItem: any) => {
          const product = transformedProducts.find((p) => p.id === collectionItem.product_id);
          const listing = listingsDataMap[collectionItem.product_id];
          const productImgs = allProductImages.filter((img: any) => img.product_id === collectionItem.product_id);
          
          return {
            id: listing?.id || collectionItem.id,
            productId: collectionItem.product_id,
            product: product || ({} as CollectionProduct),
            listingTitle: listing?.title || product?.name || 'Product',
            listingDescription: listing?.description || product?.description || null,
            category: listing?.category || product?.category || null,
            image: listing?.image || (product?.images[0]?.imageUrl || productImgs[0]?.imageUrl || null),
            priceCents: listing?.price_cents || 0,
            currency: listing?.currency || product?.currency || 'NGN',
            sizesJson: listing?.sizes_json ? JSON.parse(listing.sizes_json) : null,
            itemsJson: listing?.items_json ? JSON.parse(listing.items_json) : null,
            shippingOption: listing?.shipping_option || null,
            refundPolicy: listing?.refund_policy || null,
            createdAt: listing?.created_at || product?.createdAt || new Date().toISOString(),
            updatedAt: listing?.updated_at || product?.updatedAt || new Date().toISOString(),
          };
        });

      console.log(`[useCollectionProducts] Final: ${transformedProducts.length} products, ${transformedListings.length} listings`);
      
      setListings(transformedListings);
      setProducts(transformedProducts);

      // Update collection display data with transformed data
      if (collectionDisplayData) {
        collectionDisplayData.products = transformedProducts;
        collectionDisplayData.listings = transformedListings;
        collectionDisplayData.productCount = transformedProducts.length;
        collectionDisplayData.listingCount = transformedListings.length;
        setData(collectionDisplayData);
        console.log(`[useCollectionProducts] ✓ Loaded collection: "${collectionDisplayData.name}" with ${collectionDisplayData.productCount} items and description: "${collectionDisplayData.description?.substring(0, 50) || 'N/A'}..."`);
      } else {
        console.error('[useCollectionProducts] Collection display data is null - check if collection listing is approved');
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
      const collectionItemsSubscription = supabase
        .channel(`collection_items:collection_id=eq.${collectionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'collection_items',
          filter: `collection_id=eq.${collectionId}`,
        }, () => {
          console.log('[useCollectionProducts] Collection items changed, refetching...');
          debouncedFetch();
        })
        .subscribe();

      subscriptions.push(collectionItemsSubscription);
    }

    // Subscribe to products table changes
    const productsSubscription = supabase
      .channel('products:changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
      }, () => {
        console.log('[useCollectionProducts] Products changed, refetching...');
        debouncedFetch();
      })
      .subscribe();

    subscriptions.push(productsSubscription);

    // Subscribe to listings table changes
    const listingsSubscription = supabase
      .channel('listings:changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'listings',
      }, () => {
        console.log('[useCollectionProducts] Listings changed, refetching...');
        debouncedFetch();
      })
      .subscribe();

    subscriptions.push(listingsSubscription);

    return () => {
      subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [supabase, collectionId, fetchCollectionProducts]);

  return {
    data,
    products,
    listings,
    isLoading,
    error,
  };
}