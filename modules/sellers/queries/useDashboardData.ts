import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { sellersKeys } from "./queryKeys";
import { generateRevenueReport } from "./functions/generateRevenue";
import { generateTopSellingProducts } from "./functions/generateTSP";
import { DashboardData } from "../model";
import { calculateStats } from "./functions/calculatestat";

export const useDashboardData = () => {
  return useQuery<DashboardData>({
    queryKey: sellersKeys.dashboard(),
    queryFn: async () => {
      const [salesResponse, listingsResponse] = await Promise.all([
        api.get("/sales"),
        api.get("/listings/me"),
      ]);

      const sales = salesResponse.data || [];
      const listings = listingsResponse.data || [];

      const stats = calculateStats(sales, listings);
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
