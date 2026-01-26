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

export interface DashboardData {
  stats: DashboardStats;
  revenueReport: RevenueReport[];
  visitorTraffic: VisitorTraffic[];
  topSellingProducts: TopSellingProduct[];
  lastUpdated?: string;
}