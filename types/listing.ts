interface SellerBusiness {
  brand_name: string
  slug?: string | null
  business_type: string
  store_description: string | null
  store_logo: string
  store_banner: string
  bio: string | null
}

export interface Listing {
  id: string
  title: string
  description: string | null
  image: string
  imagesJson?: string | null
  price_cents: number
  currency: string
  category: string
  colors_available: string | null
  type: string
  quantity_available: number
  colors: string | string[] | null
  sizes_json: string | null
  material_composition: string | null
  limited_edition_badge: string | null
  shipping_option: string | null
  eta_domestic: string | null
  eta_international: string | null
  additional_target_audience: string | null
  supply_capacity: string | null
  release_duration: string | null
  refund_policy: string | null
  local_pricing: string | null
  items_json: string | null
  created_at: string
  updated_at: string
  seller_id: string
  product_id: string | null
  sku?: string | null
  barcode?: string | null
  slug?: string | null
  meta_description?: string | null
  video_url?: string | null
  care_instructions?: string | null
  rating?: number
  review_count?: number
  sales_count?: number
  return_rate?: number
  seller_response_time?: number
  is_verified?: boolean
  status?: string
  views?: number
  favorites_count?: number
  sellers: {
    id: string
    seller_business: SellerBusiness[]
  }
}

interface ListingsContextType {
  listings: Listing[]
  loading: boolean
  error: string | null
  refetchListings: () => Promise<void>
  getListingById: (id: string) => Listing | undefined
  getListingsByBrand: (brandName: string) => Listing[]
}