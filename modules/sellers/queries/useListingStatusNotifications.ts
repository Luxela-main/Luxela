import { trpc } from "@/lib/trpc";

/**
 * Fetch listing review status notifications for seller
 * This includes approval, rejection, revision requests
 */
export const useListingStatusNotifications = () => {
  return (trpc.sellerListingNotifications as any)
    .getListingStatusNotifications.useQuery(
      {
        page: 1,
        limit: 100,
      },
      {
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 10,
        refetchInterval: 1000 * 10, // Poll every 10s for new statuses
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: (attemptIndex: number) =>
          Math.min(1000 * 2 ** attemptIndex, 30000),
      }
    );
};

/**
 * Get detailed feedback for a specific listing
 */
export const useListingReviewDetails = (listingId: string) => {
  return (trpc.sellerListingNotifications as any).getListingDetails.useQuery(
    { listingId },
    {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      retry: 3,
    }
  );
};