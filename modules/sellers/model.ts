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
    createdAt: Date;
    updatedAt: Date;
  } | null;
  business: any;
  shipping: any;
  payment: any;
  additional: any;
}

export interface RevenueReport {
  month: string;
  income: number;
}

export interface VisitorTraffic {
  source: string;
  percentage: number;
}

export interface TopSellingProduct {
  id: string;
  name: string;
  category: string;
  price: string;
  quantitySold: number;
  status: "In stock" | "Low stock" | "Sold out";
}

export interface DashboardStats {
  totalRevenue: {
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    subtext: string;
  };
  totalSales: {
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    subtext: string;
  };
  totalOrders: {
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    subtext: string;
  };
  refunded: {
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    subtext: string;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  revenueReport: RevenueReport[];
  visitorTraffic: VisitorTraffic[];
  topSellingProducts: TopSellingProduct[];
}