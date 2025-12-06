import { useQuery } from "@tanstack/react-query";
import { vanillaTrpc } from "@/lib/trpc";
import { sellersKeys } from "./queryKeys";
import { DashboardData } from "../model/dashboard";
import { generateRevenueReport } from "../function/generateRevenue";
import { generateTopSellingProducts } from "../function/generateTSP";
import { calculateStats } from "../function/generateRevStat";

export const useDashboardData = () => {
  return useQuery<DashboardData>({
    queryKey: sellersKeys.dashboard(),
    queryFn: async () => {
      const client = vanillaTrpc;

      const [sales, listings] = await Promise.all([
        (client.sales as any).getAllSales.query(),
        (client.listing as any).getMyListings.query(),
      ]);

      const stats = calculateStats(sales || [], listings || []);
      const revenueReport = generateRevenueReport(sales);
      const topSellingProducts = generateTopSellingProducts(listings, sales);

      const visitorTraffic = [
        { source: "Homepage Results", percentage: 30 },
        { source: "Category Browsing", percentage: 40 },
        { source: "Search Results", percentage: 20 },
        { source: "Shares", percentage: 10 },
      ];

      return {
        stats,
        revenueReport,
        visitorTraffic,
        topSellingProducts,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};
