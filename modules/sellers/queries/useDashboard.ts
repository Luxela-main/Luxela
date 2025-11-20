import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DashboardStats,
  RevenueReport,
  TopSellingProduct,
  VisitorTraffic,
} from "../model";
import { sellersKeys } from "./queryKeys";

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
      const response = await api.get("/sellers/dashboard");
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};
