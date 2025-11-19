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
  itemsJson: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  orderId: string;
  product: string;
  customer: string;
  orderDate: Date;
  paymentMethod: string;
  amountCents: number;
  currency: string;
  payoutStatus: "in_escrow" | "processing" | "paid";
  deliveryStatus: "not_shipped" | "in_transit" | "delivered";
  orderStatus: "processing" | "shipped" | "delivered" | "canceled" | "returned";
}

export interface INotification {
  id: string;
  sellerId: string;
  type: "purchase" | "review" | "comment" | "reminder";
  message: string;
  isRead: boolean;
  isStarred: boolean;
  createdAt: Date;
}

export interface ISellerProfile {
  seller: {
    id: string;
    userId: string;
    status: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  business: any;
  shipping: any;
  payment: any;
  additional: any;
}
