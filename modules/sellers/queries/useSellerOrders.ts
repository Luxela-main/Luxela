import { useQuery } from "@tanstack/react-query"
import { sellersKeys } from "./queryKeys"
import { Sale } from "../model/sales"
import { getTRPCClient } from "@/lib/trpc"

interface UseSellerOrdersParams {
  limit?: number
  offset?: number
  status?: string
  enablePolling?: boolean
  pollingInterval?: number // in milliseconds, default 30000 (30 seconds)
}

export const useSellerOrders = ({
  limit = 100,
  offset = 0,
  status,
  enablePolling = false,
  pollingInterval = 30000,
}: UseSellerOrdersParams = {}) => {
  return useQuery<Sale[]>({
    queryKey: sellersKeys.sales(status),
    queryFn: async () => {
      const client: any = getTRPCClient()
      const params: any = { limit, offset }
      if (status) {
        params.status = status
      }
      return await ((client.sales as any).getAllSales as any).query(params)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: enablePolling ? pollingInterval : undefined,
    refetchIntervalInBackground: enablePolling,
    refetchOnWindowFocus: false,
  })
}

// Re-export useSaleById from useSales for convenience
export { useSaleById } from "./useSales"