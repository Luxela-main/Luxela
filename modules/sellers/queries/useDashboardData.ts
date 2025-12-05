import { useQuery } from "@tanstack/react-query";
import { getTRPCClient } from "@/lib/trpc";
import { sellersKeys } from "./queryKeys";
import { DashboardData } from "../model/dashboard";
import { generateRevenueReport } from "../function/generateRevenue";
import { generateTopSellingProducts } from "../function/generateTSP";
import { calculateStats } from "../function/generateRevStat";

export const useDashboardData = () => {
  return useQuery<DashboardData>({
    queryKey: sellersKeys.dashboard(),
    queryFn: async () => {
      const client = getTRPCClient();

      const [sales, listings] = await Promise.all([
        (client as any).sales.getAllSales.query(),
        (client as any).listing.getMyListings.query(),
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
