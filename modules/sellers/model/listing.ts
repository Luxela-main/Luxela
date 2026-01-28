export interface Listing {
  id: string;
  sellerId: string;
  type: "single" | "collection";
  title: string;
  description: string | null;
  category: string | null;
  image: string | null;
  priceCents: number | null;
  currency: string | null;
  sizesJson: string | null;
  supplyCapacity: string | null;
  quantityAvailable: number | null;
  limitedEditionBadge: string | null;
  releaseDuration: string | null;
  materialComposition: string | null;
  colorsAvailable: string | null;
  additionalTargetAudience: string | null;
  shippingOption: string | null;
  etaDomestic: string | null;
  etaInternational: string | null;
  refundPolicy: string | null;
  localPricing: string | null;
  itemsJson: string | null;
  createdAt: Date;
  updatedAt: Date;
}