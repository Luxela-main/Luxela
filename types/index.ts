export type ProductData = {
  price: string;
  name: string;
  type: string;
  description: string;
  sizes: string;
  releaseDate: string;
  supplyText: string;
  supplyCount: string;
  badge: string;
  durationText: string;
  durationTime: string;
  material: string;
  colors: string;
  audience: string;
  shipping: string;
  shippingEstimate: string;
  // Additional fields for the second form
  materialComposition?: string;
  colorsAvailable?: string;
  targetAudience?: "male" | "female" | "unisex";
  shippingOption?: "local" | "international" | "both";
  domesticDays?: string;
  domesticMinutes?: string;
  internationalDays?: string;
  internationalMinutes?: string;
};

export type CollectionItem = {
  title: string;
  priceCents: number;
  currency: string;
};

export type ListingForm = {
  listingType: "single" | "collection";
  images: File[];
  product: ProductData;
  // Collection-specific fields
  collectionTitle?: string;
  collectionDescription?: string;
  collectionItems?: CollectionItem[];
};

export type Tab = "Product Information" | "Additional Information" | "Preview";

