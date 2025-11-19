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
  status: "In stock" | "Low stock" | "Sold out";
}

export interface DashboardData {
  stats: DashboardStats;
  revenueReport: RevenueReport[];
  visitorTraffic: VisitorTraffic[];
  topSellingProducts: TopSellingProduct[];
}

// Helper function to calculate stats from sales data
const calculateStats = (sales: any[], listings: any[]) => {
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.amountCents || 0), 0);
  const totalOrders = sales.length;
  const refundedOrders = sales.filter(sale => sale.orderStatus === 'returned').length;
  
  // Calculate revenue change (mock data for now)
  const revenueChange = 8.4; // This would come from comparing with previous period
  
  return {
    totalRevenue: {
      value: `₦${(totalRevenue / 100).toLocaleString()}`,
      change: `${revenueChange}%`,
      changeType: revenueChange > 0 ? 'positive' as const : 'negative' as const,
      subtext: `₦${(totalRevenue / 100 * 0.2).toLocaleString()} today`,
    },
    totalSales: {
      value: `₦${(totalRevenue / 100).toLocaleString()}`,
      change: '13.4%',
      changeType: 'positive' as const,
      subtext: `₦${(totalRevenue / 100 * 0.1).toLocaleString()} today`,
    },
    totalOrders: {
      value: totalOrders.toString(),
      change: '3%',
      changeType: 'positive' as const,
      subtext: `${Math.floor(totalOrders * 0.2)} today`,
    },
    refunded: {
      value: refundedOrders.toString(),
      change: '1%',
      changeType: 'negative' as const,
      subtext: `${refundedOrders} today`,
    },
  };
};

// Helper function to generate revenue report from sales data
const generateRevenueReport = (sales: any[]) => {
  const monthlyData: { [key: string]: number } = {};
  
  sales.forEach(sale => {
    const month = new Date(sale.orderDate).toLocaleDateString('en-US', { month: 'short' });
    monthlyData[month] = (monthlyData[month] || 0) + (sale.amountCents || 0) / 100;
  });
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    month,
    income: monthlyData[month] || 0,
  }));
};

// Helper function to generate top selling products from listings and sales
const generateTopSellingProducts = (listings: any[], sales: any[]) => {
  const productSales: { [key: string]: { sales: number; listing: any } } = {};
  
  sales.forEach(sale => {
    const listingId = sale.listingId;
    if (!productSales[listingId]) {
      const listing = listings.find(l => l.id === listingId);
      if (listing) {
        productSales[listingId] = { sales: 0, listing };
      }
    }
    if (productSales[listingId]) {
      productSales[listingId].sales += 1;
    }
  });
  
  return Object.values(productSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
    .map(({ sales, listing }) => ({
      id: listing.id,
      name: listing.title,
      category: listing.category || 'Unknown',
      price: `₦${((listing.priceCents || 0) / 100).toLocaleString()}`,
      quantitySold: sales,
      status: (listing.quantityAvailable || 0) > 10 ? 'In stock' as const : 
              (listing.quantityAvailable || 0) > 0 ? 'Low stock' as const : 'Sold out' as const,
    }));
};

export const useDashboardData = () => {
  return useQuery<DashboardData>({
    queryKey: sellersKeys.dashboard(),
    queryFn: async () => {
      // Fetch all required data in parallel
      const [salesResponse, listingsResponse] = await Promise.all([
        api.get('/sales'),
        api.get('/listings/me'),
      ]);
      
      const sales = salesResponse.data || [];
      const listings = listingsResponse.data || [];
      
      // Calculate dashboard data
      const stats = calculateStats(sales, listings);
      const revenueReport = generateRevenueReport(sales);
      const topSellingProducts = generateTopSellingProducts(listings, sales);
      
      // Mock visitor traffic data (this would come from analytics API)
      const visitorTraffic = [
        { source: 'Homepage Results', percentage: 30 },
        { source: 'Category Browsing', percentage: 40 },
        { source: 'Search Results', percentage: 20 },
        { source: 'Shares', percentage: 10 },
      ];
      
      return {
        stats,
        revenueReport,
        visitorTraffic,
        topSellingProducts,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
