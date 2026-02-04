// types.ts
export interface FormData {
  collectionTitle?: string;
  collectionDescription?: string;
  collectionSku?: string;
  collectionSlug?: string;
  collectionMetaDescription?: string;
  collectionBarcode?: string;
  collectionVideoUrl?: string;
  collectionCareInstructions?: string;
  collectionRefundPolicy?: string;
  collectionImages?: (File | string)[];
  collectionItems?: {
    title: string;
    priceCents: number;
    currency: string;
    productId?: string; 
    images?: (File | string)[]; 
    image?: string;
    sku?: string;
    slug?: string;
    metaDescription?: string;
    barcode?: string;
  }[];

  // Basic Information
  name: string;
  price: string;
  category: string;
  description: string;
  sizes: string[];
  releaseDate: string;

  // Supply Information
  supplyCapacity: "no-max" | "limited";
  quantity: string;
  showBadge: "show_badge" | "do_not_show";
  releaseDuration: string;
  releaseDurationDays: string;
  releaseDurationMinutes: string;

  // Additional Information
  material: string;
  colors: string;
  targetAudience: "male" | "female" | "unisex" | "";
  shippingOption: "local" | "international" | "both" | "";
  domesticDays: string;
  domesticMinutes: string;
  internationalDays: string;
  internationalMinutes: string;

  // Enterprise Fields
  sku: string;
  slug: string;
  metaDescription: string;
  barcode: string;
  videoUrl: string;
  careInstructions: string;
  refundPolicy: string;

  // Images
  images: (File | string)[];

  // Videos
  videos?: File[];

  // Listing Type
  type?: "single" | "collection";
}

export type ViewType = "empty" | "single" | "collection";
export type TabType = "product-info" | "additional-info" | "preview";
export type ListingType = "single" | "collection";