"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface SellerListingNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SellerListingNotificationPanel: React.FC<
  SellerListingNotificationPanelProps
> = ({ isOpen, onClose }) => {
  const [expandedNotificationId, setExpandedNotificationId] = useState<
    string | null
  >(null);

  const { data: notificationsData, isLoading } =
    trpc.sellerListingNotifications.getListingStatusNotifications.useQuery(
      {
        page: 1,
        limit: 50,
      },
      { enabled: isOpen }
    );

  const resubmitMutation =
    trpc.sellerListingNotifications.resubmitListing.useMutation({
      onSuccess: () => {
        toastSvc.success("Listing resubmitted for review!");
      },
      onError: (error) => {
        toastSvc.error(error.message || "Failed to resubmit listing");
      },
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "revision_requested":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 border-green-200";
      case "rejected":
        return "bg-red-50 border-red-200";
      case "revision_requested":
        return "bg-orange-50 border-orange-200";
      case "pending":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Listing Status Notifications</DialogTitle>
          <DialogDescription>
            Track the review status of your listings
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : notificationsData && notificationsData.notifications.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {notificationsData.total} notification
              {notificationsData.total !== 1 ? "s" : ""}
            </div>

            {notificationsData.notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border cursor-pointer transition-all ${getStatusColor(notification.status)}`}
                onClick={() =>
                  setExpandedNotificationId(
                    expandedNotificationId === notification.id
                      ? null
                      : notification.id
                  )
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getStatusIcon(notification.status)}</div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <Badge variant="outline" className="capitalize">
                          {notification.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      {notification.rejectionReason && (
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>Reason:</strong> {notification.rejectionReason}
                        </p>
                      )}
                      {notification.comments && (
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>Feedback:</strong> {notification.comments}
                        </p>
                      )}

                      <div className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>

                      {expandedNotificationId === notification.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-3">
                            {notification.status === "approved" && (
                              <div className="bg-green-100 border border-green-200 rounded p-3 text-sm text-green-800">
                                Your listing is now live and visible to buyers!
                              </div>
                            )}

                            {notification.status === "rejected" && (
                              <div className="space-y-2">
                                <div className="bg-red-100 border border-red-200 rounded p-3 text-sm text-red-800">
                                  Your listing was rejected. Please review the
                                  feedback and make necessary changes before
                                  resubmitting.
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/sellers/listings/${notification.listingId}/edit`;
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Listing Details
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    resubmitMutation.mutate({
                                      listingId: notification.listingId,
                                    });
                                  }}
                                  size="sm"
                                  className="w-full"
                                  disabled={resubmitMutation.isPending}
                                >
                                  {resubmitMutation.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Resubmitting...
                                    </>
                                  ) : (
                                    "Resubmit Listing"
                                  )}
                                </Button>
                              </div>
                            )}

                            {notification.status === "revision_requested" && (
                              <div className="space-y-2">
                                <div className="bg-orange-100 border border-orange-200 rounded p-3 text-sm text-orange-800">
                                  Admin has requested changes to your listing.
                                  Please review the feedback and make the
                                  necessary revisions.
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/sellers/listings/${notification.listingId}/edit`;
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Listing Details
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    resubmitMutation.mutate({
                                      listingId: notification.listingId,
                                    });
                                  }}
                                  size="sm"
                                  className="w-full"
                                  disabled={resubmitMutation.isPending}
                                >
                                  {resubmitMutation.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Resubmitting...
                                    </>
                                  ) : (
                                    "Resubmit Changes"
                                  )}
                                </Button>
                              </div>
                            )}

                            {notification.status === "pending" && (
                              <div className="bg-yellow-100 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                                Your listing is currently being reviewed by our
                                admin team. Please check back soon.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No notifications yet</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};