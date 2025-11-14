import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { sellersKeys } from './queryKeys';

export interface DashboardStats {
  totalRevenue: {
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    subtext: string;
  };
  totalSales: {
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    subtext: string;
  };
  totalOrders: {
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    subtext: string;
  };
  refunded: {
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
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
  status: 'In stock' | 'Low stock' | 'Sold out';
}

export interface DashboardData {
  stats: DashboardStats;
  revenueReport: RevenueReport[];
  visitorTraffic: VisitorTraffic[];
  topSellingProducts: TopSellingProduct[];
}

export const useDashboard = () => {
  return useQuery<DashboardData>({
    queryKey: sellersKeys.dashboard(),
    queryFn: async () => {
      const response = await api.get('/sellers/dashboard');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
