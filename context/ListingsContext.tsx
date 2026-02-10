"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { trpc, vanillaTrpc } from "@/lib/trpc";
import type { Listing } from "@/types/listing";

interface ListingsContextType {
  listings: Listing[];
  approvedListings: Listing[];
  loading: boolean;
  error: string | null;
  refetchListings: () => Promise<void>;
  getListingById: (id: string) => Listing | undefined;
  getApprovedListingById: (id: string, fetchIfMissing?: boolean) => Promise<Listing | undefined>;
  getListingsByBrand: (brandName: string) => Listing[];
  isListingApproved: (id: string) => boolean;
  validateProductForCart: (id: string) => { valid: boolean; reason?: string };
  fetchListingDetailsById: (id: string) => Promise<Listing | undefined>;
  invalidateCatalogCache: () => void;
}

const ListingsContext = createContext<ListingsContextType | undefined>(
  undefined
);

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [approvedListings, setApprovedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const [cachedListings, setCachedListings] = useState<Record<string, Listing>>({});

  // Use tRPC to fetch approved listings with seller/brand data
  const { 
    data: catalogData, 
    isLoading: isCatalogLoading, 
    isFetching,
    isError: isCatalogError, 
    error: catalogError,
    refetch: refetchCatalog
  } = trpc.buyerListingsCatalog.getApprovedListingsCatalog.useQuery(
    {
      page: currentPage,
      limit: 100,
      sortBy: 'newest',
    },
    {
      enabled: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    }
  );

  // Log catalog data availability
  useEffect(() => {
    console.log('[ListingsContext] Catalog data updated:', {
      hasCatalogData: !!catalogData,
      listingsCount: catalogData?.listings?.length ?? 0,
      isLoading: isCatalogLoading,
      isFetching,
      isError: isCatalogError,
      errorMessage: catalogError?.message || 'none',
    });
  }, [catalogData, isCatalogLoading, isFetching, isCatalogError, catalogError]);

  const transformCatalogItemToListing = (item: any): Listing => {
    const createdAtDate = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
    
    const defaultImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';
    let primaryImage = item.image;
    if (!primaryImage && item.imagesJson) {
      try {
        const images = JSON.parse(item.imagesJson);
        if (Array.isArray(images) && images.length > 0) {
          primaryImage = images[0]?.imageUrl || images[0]?.url || images[0];
        }
      } catch (e) {
        console.warn('[ListingsContext] Failed to parse imagesJson');
      }
    }
    
    let parsedSizes = null;
    if (item.sizes) {
      try {
        parsedSizes = Array.isArray(item.sizes) ? item.sizes : JSON.parse(item.sizes);
      } catch (e) {
        parsedSizes = item.sizes;
      }
    }

    let parsedColors = null;
    if (item.colors) {
      try {
        parsedColors = Array.isArray(item.colors) ? item.colors : JSON.parse(item.colors);
      } catch (e) {
        parsedColors = item.colors;
      }
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description || null,
      image: primaryImage || defaultImage,
      imagesJson: item.imagesJson || null,
      price_cents: item.price_cents ?? Math.round((item.price ?? 0) * 100),
      currency: item.currency || 'NGN',
      category: item.category || null,
      colors_available: parsedColors ? JSON.stringify(parsedColors) : null,
      colors: parsedColors || null,
      type: item.type || 'single',
      quantity_available: item.quantity_available ?? 0,
      sizes_json: parsedSizes ? JSON.stringify(parsedSizes) : null,
      material_composition: item.materialComposition || null,
      limited_edition_badge: item.limitedEditionBadge || null,
      shipping_option: item.shippingOption || null,
      eta_domestic: item.etaDomestic || null,
      eta_international: item.etaInternational || null,
      additional_target_audience: item.additionalTargetAudience || null,
      supply_capacity: item.supplyCapacity || null,
      release_duration: item.releaseDuration || null,
      refund_policy: item.refundPolicy || null,
      local_pricing: item.localPricing || null,
      items_json: null,
      created_at: createdAtDate.toISOString(),
      updated_at: createdAtDate.toISOString(),
      seller_id: item.seller.id,
      product_id: null,
      sku: item.sku || null,
      barcode: item.barcode || null,
      slug: item.slug || null,
      meta_description: item.metaDescription || null,
      video_url: item.videoUrl || null,
      care_instructions: item.careInstructions || null,
      status: item.status || 'approved',
      sellers: {
        id: item.seller.id,
        seller_business: item.seller.brandName
          ? [
              {
                brand_name: item.seller.brandName,
                slug: item.seller.brandSlug,
                business_type: 'retail',
                store_description: null,
                store_logo: '',
                store_banner: '',
                bio: null,
              },
            ]
          : [],
      },
    };
  };

  const fetchListingDetailsById = async (id: string): Promise<Listing | undefined> => {
    // Check cache first
    if (cachedListings[id]) {
      console.log('[ListingsContext.fetchListingDetailsById] Returning cached listing:', id);
      return cachedListings[id];
    }

    try {
      console.log('[ListingsContext.fetchListingDetailsById] Fetching from server:', id);
      const response = await vanillaTrpc.buyerListingsCatalog.getListingById.query({
        listingId: id,
      });

      if (!response) {
        console.warn('[ListingsContext.fetchListingDetailsById] No response for listing:', id);
        return undefined;
      }

      // Transform response to Listing format
      const transformed = transformCatalogItemToListing(response);
      
      // Cache the listing
      setCachedListings(prev => ({
        ...prev,
        [id]: transformed,
      }));

      console.log('[ListingsContext.fetchListingDetailsById] Successfully fetched and cached:', {
        id,
        title: transformed.title,
        hasMaterialComposition: !!transformed.material_composition,
        hasCareInstructions: !!transformed.care_instructions,
        hasVideoUrl: !!transformed.video_url,
      });

      return transformed;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch listing details';
      console.error('[ListingsContext.fetchListingDetailsById] Error:', {
        id,
        message: errorMessage,
      });
      return undefined;
    }
  };

  const fetchListingsFromCatalogData = async (data: typeof catalogData) => {
    if (!data?.listings) {
      console.warn('[ListingsContext.fetchListingsFromCatalogData] No listings in catalog data');
      setListings([]);
      setApprovedListings([]);
      return;
    }

    const startTime = performance.now();
    console.log('[ListingsContext.fetchListingsFromCatalogData] Processing', data.listings.length, 'approved listings');
    
    // Log category distribution to diagnose category carousel issues
    const categoryDistribution: Record<string, number> = {};
    data.listings.forEach((item: any) => {
      const cat = item.category || 'uncategorized';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });
    console.log('[ListingsContext.fetchListingsFromCatalogData] Category distribution:', categoryDistribution);
    console.log('[ListingsContext.fetchListingsFromCatalogData] Pagination info - Total pages:', data.totalPages, 'Current page:', data.page, 'Total available:', data.total);

    const approvedItems = data.listings;
    const transformedListings: Listing[] = approvedItems.map((item: any, index: number) => {
      const createdAtDate = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
      const defaultImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';
      let primaryImage = item.image;
      if (!primaryImage && item.imagesJson) {
        try {
          const images = JSON.parse(item.imagesJson);
          if (Array.isArray(images) && images.length > 0) {
            primaryImage = images[0]?.imageUrl || images[0]?.url || images[0];
          }
        } catch (e) {
          console.warn('[ListingsContext] Failed to parse imagesJson for item:', item.id);
        }
      }

      let parsedSizes = null;
      if (item.sizes) {
        try {
          parsedSizes = Array.isArray(item.sizes) ? item.sizes : JSON.parse(item.sizes);
        } catch (e) {
          parsedSizes = item.sizes;
        }
      }

      let parsedColors = null;
      if (item.colors) {
        try {
          parsedColors = Array.isArray(item.colors) ? item.colors : JSON.parse(item.colors);
        } catch (e) {
          parsedColors = item.colors;
        }
      }

      const transformed: Listing = {
        id: item.id,
        title: item.title,
        description: item.description || null,
        image: primaryImage || defaultImage,
        imagesJson: item.imagesJson || null,
        price_cents: item.price_cents ?? Math.round((item.price ?? 0) * 100),
        currency: item.currency || 'NGN',
        category: item.category || null,
        colors_available: parsedColors ? JSON.stringify(parsedColors) : null,
        colors: parsedColors || null,
        type: item.type || 'single',
        quantity_available: item.quantity_available ?? 0,
        sizes_json: parsedSizes ? JSON.stringify(parsedSizes) : null,
        material_composition: item.materialComposition || null,
        limited_edition_badge: item.limitedEditionBadge || null,
        shipping_option: item.shippingOption || null,
        eta_domestic: item.etaDomestic || null,
        eta_international: item.etaInternational || null,
        additional_target_audience: item.additionalTargetAudience || null,
        supply_capacity: item.supplyCapacity || null,
        release_duration: item.releaseDuration || null,
        refund_policy: item.refundPolicy || null,
        local_pricing: item.localPricing || null,
        items_json: null,
        created_at: createdAtDate.toISOString(),
        updated_at: createdAtDate.toISOString(),
        seller_id: item.seller.id,
        product_id: null,
        sku: item.sku || null,
        barcode: item.barcode || null,
        slug: item.slug || null,
        meta_description: item.metaDescription || null,
        video_url: item.videoUrl || null,
        care_instructions: item.careInstructions || null,
        sellers: {
          id: item.seller.id,
          seller_business: item.seller.brandName
            ? [
                {
                  brand_name: item.seller.brandName,
                  business_type: 'retail',
                  store_description: null,
                  store_logo: '',
                  store_banner: '',
                  bio: null,
                },
              ]
            : [],
        },
      };

      if (index === 0) {
        console.log('[ListingsContext] First listing transformed:', {
          id: transformed.id,
          title: transformed.title,
          category: transformed.category,
          seller_id: transformed.seller_id,
        });
      }

      return transformed;
    });

    const perfTime = performance.now() - startTime;
    console.log('[ListingsContext] Transformation complete:', {
      count: transformedListings.length,
      withBrandData: transformedListings.filter(l => l.sellers?.seller_business?.length).length,
      processingTime: `${perfTime.toFixed(2)}ms`,
    });

    setListings(transformedListings);
    setApprovedListings(transformedListings);
    setError(null);
    
    // Log category breakdown
    const transformedCategoryDistribution: Record<string, number> = {};
    transformedListings.forEach((listing: any) => {
      const cat = listing.category || 'uncategorized';
      transformedCategoryDistribution[cat] = (transformedCategoryDistribution[cat] || 0) + 1;
    });
    console.log('[ListingsContext] Transformed listings category breakdown:', transformedCategoryDistribution);
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      console.log('[ListingsContext.fetchListings] Started - catalogData available:', !!catalogData);

      if (!catalogData?.listings) {
        console.warn('[ListingsContext.fetchListings] No catalog data available');
        setListings([]);
        setApprovedListings([]);
        setLoading(false);
        return;
      }

      await fetchListingsFromCatalogData(catalogData);
      setLastFetchTime(Date.now());
      setFetchAttempts(0);
    } catch (err: any) {
      const errorMessage = err?.message || (err instanceof Error ? err.message : JSON.stringify(err) || "Failed to fetch listings");
      setError(errorMessage);
      console.error('[ListingsContext.fetchListings] Error:', {
        message: errorMessage,
        catalogDataAvailable: !!catalogData,
        errorType: err?.constructor?.name,
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and update when catalogData changes
  useEffect(() => {
    console.log('[ListingsContext] useEffect triggered - catalogData changed');
    if (catalogData) {
      fetchListings();
    }
  }, [catalogData]);

  // Retry mechanism: If no listings after 3 seconds, force refetch
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (listings.length === 0 && !loading && !isCatalogLoading) {
        console.warn('[ListingsContext] No listings loaded after 3 seconds, attempting refetch...');
        refetchCatalog();
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [listings.length, loading, isCatalogLoading, refetchCatalog]);

  // Cache approved listing in memory when it's loaded from context
  useEffect(() => {
    const newCache: Record<string, Listing> = {};
    approvedListings.forEach(listing => {
      newCache[listing.id] = listing;
    });
    setCachedListings(newCache);
  }, [approvedListings]);

  const getListingById = (id: string) => {
    return listings.find((listing) => listing.id === id);
  };

  const getApprovedListingById = async (id: string, fetchIfMissing: boolean = true): Promise<Listing | undefined> => {
    // First check in-memory cache
    let listing = approvedListings.find((listing) => listing.id === id);
    if (listing) {
      console.log('[ListingsContext.getApprovedListingById] Found in memory:', id);
      return listing;
    }

    // Check if we should fetch from server
    if (!fetchIfMissing) {
      console.warn(
        `[ListingsContext] Attempted to access non-approved or non-existent listing: ${id}`
      );
      return undefined;
    }

    // Fetch complete details from server
    console.log('[ListingsContext.getApprovedListingById] Not in memory, fetching from server:', id);
    return await fetchListingDetailsById(id);
  };

  const getListingsByBrand = (brandName: string) => {
    return listings.filter(
      (listing) =>
        listing.sellers?.seller_business?.[0]?.brand_name === brandName
    );
  };

  const isListingApproved = (id: string): boolean => {
    return approvedListings.some((listing) => listing.id === id);
  };

  const validateProductForCart = (
    id: string
  ): { valid: boolean; reason?: string } => {
    const listing = approvedListings.find((l) => l.id === id);

    if (!listing) {
      return {
        valid: false,
        reason: 'Product is not available or has been removed from the catalog',
      };
    }

    if ((listing.quantity_available || 0) <= 0) {
      return {
        valid: false,
        reason: 'This product is currently out of stock',
      };
    }

    return { valid: true };
  };

  const invalidateCatalogCache = () => {
    console.log('[ListingsContext.invalidateCatalogCache] Refetching approved listings catalog after approval');
    refetchCatalog();
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        approvedListings,
        loading: loading || isCatalogLoading || isFetching,
        error,
        refetchListings: fetchListings,
        getListingById,
        getApprovedListingById,
        getListingsByBrand,
        isListingApproved,
        validateProductForCart,
        fetchListingDetailsById,
        invalidateCatalogCache,
      }}
    >
      {children}
    </ListingsContext.Provider>
  );
}

export function useListings() {
  const context = useContext(ListingsContext);
  if (context === undefined) {
    throw new Error("useListings must be used within a ListingsProvider");
  }
  return context;
}