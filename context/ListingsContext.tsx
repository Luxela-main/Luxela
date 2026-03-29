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
  getApprovedListingById: (id: string, fetchIfMissing?: boolean, skipCache?: boolean) => Promise<Listing | undefined>;
  getListingsByBrand: (brandName: string) => Listing[];
  isListingApproved: (id: string) => boolean;
  validateProductForCart: (id: string) => { valid: boolean; reason?: string; listing?: Listing };
  fetchListingDetailsById: (id: string) => Promise<Listing | undefined>;
  invalidateCatalogCache: () => void;
  invalidateCachedListing: (listingId: string) => void;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

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

  const {
    data: catalogData,
    isLoading: isCatalogLoading,
    isFetching,
    isError: isCatalogError,
    error: catalogError,
    refetch: refetchCatalog,
  } = trpc.buyerListingsCatalog.getApprovedListingsCatalog.useQuery(
    {
      page: currentPage,
      limit: 100,
      sortBy: "newest",
    },
    {
      enabled: true,
      staleTime: 1000 * 60 * 5,
      retry: 2,
    }
  );

  const transformCatalogItemToListing = (item: any): Listing => {
    const createdAtDate = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
    const defaultImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop";

    let primaryImage = item.image;
    if (!primaryImage && item.imagesJson) {
      try {
        const images = JSON.parse(item.imagesJson);
        if (Array.isArray(images) && images.length > 0) {
          primaryImage = images[0]?.imageUrl || images[0]?.url || images[0];
        }
      } catch {
        primaryImage = primaryImage || defaultImage;
      }
    }

    let parsedSizes: unknown = null;
    if (item.sizes) {
      try {
        parsedSizes = Array.isArray(item.sizes) ? item.sizes : JSON.parse(item.sizes);
      } catch {
        parsedSizes = item.sizes;
      }
    }

    let parsedColors: string | string[] | null = null;
    if (item.colors) {
      try {
        const rawColors = Array.isArray(item.colors) ? item.colors : JSON.parse(item.colors);
        if (typeof rawColors === "string" || Array.isArray(rawColors)) {
          parsedColors = rawColors;
        } else {
          parsedColors = null;
        }
      } catch {
        if (typeof item.colors === "string" || Array.isArray(item.colors)) {
          parsedColors = item.colors as string | string[];
        } else {
          parsedColors = null;
        }
      }
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description || null,
      image: primaryImage || defaultImage,
      imagesJson: item.imagesJson || null,
      price_cents: item.price_cents ?? Math.round((item.price ?? 0) * 100),
      currency: item.currency || "NGN",
      category: item.category || null,
      colors_available: parsedColors ? (Array.isArray(parsedColors) ? JSON.stringify(parsedColors) : parsedColors) : null,
      colors: parsedColors,
      type: item.type || "single",
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
      seller_id: item.seller?.id || "",
      product_id: null,
      sku: item.sku || null,
      barcode: item.barcode || null,
      slug: item.slug || null,
      meta_description: item.metaDescription || null,
      video_url: item.videoUrl || null,
      care_instructions: item.careInstructions || null,
      status: item.status || "approved",
      sellers: {
        id: item.seller?.id || "",
        seller_business: item.seller?.brandName
          ? [
              {
                brand_name: item.seller.brandName,
                slug: item.seller.brandSlug,
                business_type: "retail",
                store_description: null,
                store_logo: "",
                store_banner: "",
                bio: null,
              },
            ]
          : [],
      },
    };
  };

  const fetchListingDetailsById = async (id: string, skipCache = false): Promise<Listing | undefined> => {
    if (!skipCache && cachedListings[id]) {
      return cachedListings[id];
    }

    try {
      const response = await vanillaTrpc.buyerListingsCatalog.getListingById.query({ listingId: id, skipCache });
      if (!response) return undefined;

      const transformed = transformCatalogItemToListing(response);
      setCachedListings(prev => ({ ...prev, [id]: transformed }));
      return transformed;
    } catch {
      return undefined;
    }
  };

  const fetchListingsFromCatalogData = async (data: typeof catalogData) => {
    if (!data?.listings) {
      setListings([]);
      setApprovedListings([]);
      return;
    }

    const transformedListings = data.listings
      .map((item: any) => {
        try {
          return transformCatalogItemToListing(item);
        } catch {
          return undefined;
        }
      })
      .filter((item): item is Listing => item !== undefined);

    setListings(transformedListings);
    setApprovedListings(transformedListings);
    setError(null);
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      if (!catalogData?.listings) {
        setListings([]);
        setApprovedListings([]);
      } else {
        await fetchListingsFromCatalogData(catalogData);
      }
      setLastFetchTime(Date.now());
      setFetchAttempts(0);
    } catch (err: any) {
      const errorMessage = err?.message || (err instanceof Error ? err.message : "Failed to fetch listings");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (catalogData) {
      fetchListings();
    }
  }, [catalogData]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (listings.length === 0 && !loading && !isCatalogLoading) {
        refetchCatalog();
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [listings.length, loading, isCatalogLoading, refetchCatalog]);

  useEffect(() => {
    const newCache: Record<string, Listing> = {};
    approvedListings.forEach(listing => {
      newCache[listing.id] = listing;
    });
    setCachedListings(newCache);
  }, [approvedListings]);

  const getListingById = (id: string): Listing | undefined => listings.find((listing) => listing.id === id);

  const getApprovedListingById = async (id: string, fetchIfMissing = true, skipCache = false): Promise<Listing | undefined> => {
    if (!skipCache) {
      const cachedListing = cachedListings[id];
      if (cachedListing) return cachedListing;

      const listed = approvedListings.find((listing) => listing.id === id);
      if (listed) return listed;
    }

    if (!fetchIfMissing) return undefined;

    return fetchListingDetailsById(id, skipCache);
  };

  const getListingsByBrand = (brandName: string): Listing[] =>
    listings.filter((listing) => listing.sellers?.seller_business?.[0]?.brand_name === brandName);

  const isListingApproved = (id: string): boolean => approvedListings.some((listing) => listing.id === id);

  const validateProductForCart = (id: string): { valid: boolean; reason?: string; listing?: Listing } => {
    let listing = approvedListings.find((l) => l.id === id) || cachedListings[id];

    if (!listing) {
      return { valid: false, reason: "Product is not available or has been removed from the catalog" };
    }

    if ((listing.quantity_available || 0) <= 0) {
      return { valid: false, reason: "This product is currently out of stock", listing };
    }

    return { valid: true, listing };
  };

  const invalidateCatalogCache = () => {
    refetchCatalog();
  };

  const invalidateCachedListing = (listingId: string) => {
    setCachedListings((prev) => {
      const next = { ...prev };
      delete next[listingId];
      return next;
    });
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
        invalidateCachedListing,
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
