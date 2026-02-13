import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getVanillaTRPCClient } from "@/lib/trpc";
const vanillaTrpc = getVanillaTRPCClient();
import { sellersKeys } from "./queryKeys";
import { DashboardData } from "../model/dashboard";
import { generateRevenueReport } from "../function/generateRevenue";
import { generateTopSellingProducts } from "../function/generateTSP";
import { calculateStats } from "../function/generateRevStat";

export const useDashboardData = () => {
  const queryClient = useQueryClient();

  const query = useQuery<DashboardData>({
    queryKey: sellersKeys.dashboard(),
    queryFn: async (): Promise<DashboardData> => {
      const client = vanillaTrpc;

      const [sales, listings] = await Promise.all([
        ((client.sales as any).getAllSales as any).query({}) || [],
        ((client.listing as any).getMyListings as any).query() || [],
      ]);

      const stats = calculateStats(sales, listings);
      const revenueReport = generateRevenueReport(sales) || [];
      const topSellingProducts = generateTopSellingProducts(listings, sales) || [];

      const visitorTraffic: any[] = [
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
      } as DashboardData;
    },
    staleTime: 60 * 1000, // 60 seconds - reasonable cache
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    refetchInterval: undefined, // Disabled - no automatic polling
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false, 
    refetchOnReconnect: true,
    refetchOnMount: false,
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Refetch only when page becomes visible (user focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        queryClient.invalidateQueries({
          queryKey: sellersKeys.dashboard(),
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);

  return {
    ...query,
    invalidate: () =>
      queryClient.invalidateQueries({
        queryKey: sellersKeys.dashboard(),
      }),
    refetch: query.refetch,
  };
};