import type { OrderStatus } from '@/modules/sellers/queries/useSales';

export const DEFAULT_CURRENCY = "NGN";

export const getStatusFromTab = (tab: string): OrderStatus | undefined => {
  const mapping: Record<string, OrderStatus> = {
    "All": "all",
    "Processing": "processing",
    "Shipped": "shipped",
    "In transit": "shipped",
    "Delivered": "delivered",
    "Canceled": "canceled",
    "Returned": "returned",
  };
  return mapping[tab];
};