import { useMemo } from "react";
import { useNotifications } from "./useNotifications";
import { useListingStatusNotifications } from "./useListingStatusNotifications";

export interface UnifiedNotification {
  id: string;
  type: "general" | "listing_review";
  title?: string;
  message: string;
  status?: string; // For listing review notifications
  reviewStatus?: "pending" | "approved" | "rejected" | "revision_requested";
  isRead: boolean;
  isStarred?: boolean;
  createdAt: Date;
  listingId?: string;
  comments?: string;
  rejectionReason?: string;
  revisionRequests?: Record<string, any>;
}

/**
 * Unified notifications hook that combines both general notifications and listing review notifications
 */
export const useUnifiedNotifications = () => {
  // Fetch general notifications (purchases, reviews, etc)
  const generalNotifications = useNotifications();

  // Fetch listing review status notifications
  const listingNotifications = useListingStatusNotifications();

  // Combine and sort by date
  const unifiedNotifications = useMemo(() => {
    const notifications: UnifiedNotification[] = [];

    // Add general notifications
    if (generalNotifications.data) {
      notifications.push(
        ...generalNotifications.data.map((notif: any) => ({
          id: notif.id,
          type: "general" as const,
          message: notif.message,
          isRead: notif.isRead,
          isStarred: notif.isStarred,
          createdAt: notif.createdAt,
        }))
      );
    }

    // Add listing review notifications
    if (listingNotifications.data?.notifications) {
      notifications.push(
        ...listingNotifications.data.notifications.map((notif: any) => ({
          id: notif.id,
          type: "listing_review" as const,
          title: notif.title,
          message: `Your listing "${notif.title}" is ${notif.status.replace(/_/g, " ")}`,
          status: notif.status,
          reviewStatus: notif.status,
          isRead: false, // Listing notifications don't have read status yet
          isStarred: false,
          createdAt: notif.createdAt,
          listingId: notif.listingId,
          comments: notif.comments,
          rejectionReason: notif.rejectionReason,
          revisionRequests: notif.revisionRequests,
        }))
      );
    }

    // Sort by date descending (newest first)
    return notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [generalNotifications.data, listingNotifications.data]);

  return {
    data: unifiedNotifications,
    isLoading: generalNotifications.isLoading || listingNotifications.isLoading,
    error: generalNotifications.error || listingNotifications.error,
    refetch: async () => {
      await generalNotifications.refetch?.();
      await listingNotifications.refetch?.();
    },
  };
};