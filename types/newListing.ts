// types.ts
export interface FormData {
    collectionTitle?: any;
    collectionItems?: never[];
    collectionDescription?: any;
  // Basic Information
  name: string;
  price: string;
  category: string;
  description: string;
  sizes: string[];
  releaseDate: string;
  
  // Supply Information
  supplyCapacity: 'no-max' | 'limited';
  quantity: string;
  showBadge: 'show_badge' | 'do_not_show';
  releaseDuration: string;
  releaseDurationDays: string;
  releaseDurationMinutes: string;
  
  // Additional Information
  material: string;
  colors: string;
  targetAudience: 'male' | 'female' | 'unisex' | '';
  shippingOption: 'local' | 'international' | 'both' | '';
  domesticDays: string;
  domesticMinutes: string;
  internationalDays: string;
  internationalMinutes: string;
  
  // Images
  images: File[];

  //Listing Type
    type?: "single" | "collection";

  
}

export type ViewType = 'empty' | 'single' | 'collection';
export type TabType = 'product-info' | 'additional-info' | 'preview';
export type ListingType = 'single' | 'collection';