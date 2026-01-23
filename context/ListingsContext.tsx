// contexts/ListingsContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/utils/supabase/client";

interface SellerBusiness {
  brand_name: string;
  business_type: string;
  store_description: string | null;
  store_logo: string;
  store_banner: string;
  bio: string | null;
}

export interface Listing {
  id: string;
  title: string;
  description: string | null;
  image: string;
  price_cents: number;
  currency: string;
  category: string;
  colors_available: string | null;
  type: string;
  quantity_available: number;
  sizes_json: string | null;
  material_composition: string | null;
  limited_edition_badge: string | null;
  shipping_option: string | null;
  eta_domestic: string | null;
  eta_international: string | null;
  additional_target_audience: string | null;
  supply_capacity: string | null;
  release_duration: string | null;
  items_json: string | null;
  created_at: string;
  updated_at: string;
  seller_id: string;
  product_id: string | null;
  sellers: {
    id: string;
    seller_business: SellerBusiness[];
  };
}

interface ListingsContextType {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  refetchListings: () => Promise<void>;
  getListingById: (id: string) => Listing | undefined;
  getListingsByBrand: (brandName: string) => Listing[];
}

const ListingsContext = createContext<ListingsContextType | undefined>(
  undefined
);

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.from("listings")
        .select(`
          *,
          sellers!inner (
            id,
            seller_business (
              brand_name,
              business_type,
              store_description,
              store_logo,
              store_banner,
              bio
            )
          )
        `);

      if (fetchError) {
        const errorMessage = fetchError.message || JSON.stringify(fetchError) || "Unknown error";
        console.error("Supabase fetch error:", fetchError);
        throw new Error(errorMessage);
      }

      setListings(data || []);
    } catch (err: any) {
      const errorMessage = err?.message || (err instanceof Error ? err.message : JSON.stringify(err) || "Failed to fetch listings");
      setError(errorMessage);
      console.error("Error fetching listings:", {
        error: err,
        message: errorMessage,
        stack: err?.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const getListingById = (id: string) => {
    return listings.find((listing) => listing.id === id);
  };

  const getListingsByBrand = (brandName: string) => {
    return listings.filter(
      (listing) =>
        listing.sellers?.seller_business?.[0]?.brand_name === brandName
    );
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        loading,
        error,
        refetchListings: fetchListings,
        getListingById,
        getListingsByBrand,
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