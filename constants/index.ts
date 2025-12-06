export const DEFAULT_CURRENCY = "NGN";

export const getStatusFromTab = (tab: string): string | undefined => {
  const mapping: Record<string, string> = {
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
