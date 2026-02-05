"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ListingReviewModal from "@/components/admin/ListingReviewModal";

type ReviewAction = "approve" | "reject" | "revise" | null;

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [reviewAction, setReviewAction] = useState<ReviewAction>(null);
  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch listing details
  const { data: listing, isLoading: listingLoading, refetch } = trpc.adminListingReview.getListingDetails.useQuery({
    listingId,
  });

  // Fetch activity history
  const { data: activityHistory, isLoading: activityLoading } = trpc.adminListingReview.getActivityHistory.useQuery({
    listingId,
  });

  // Mutations
  const approveMutation = trpc.adminListingReview.approveListing.useMutation();
  const rejectMutation = trpc.adminListingReview.rejectListing.useMutation();
  const revisionMutation = trpc.adminListingReview.requestRevision.useMutation();

  const handleApprove = async () => {
    if (!listing) return;

    setIsProcessing(true);
    try {
      await approveMutation.mutateAsync({
        listingId,
        comments: comments || undefined,
      });
      toastSvc.success("Listing approved successfully!", {
        description: "The listing is now live for buyers.",
        autoClose: 2000,
      });
      setReviewAction(null);
      setComments("");
      refetch();
      // Optionally redirect
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      toastSvc.error("Failed to approve listing", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!listing || !rejectionReason.trim()) {
      toastSvc.error("Rejection reason required", {
        description: "Please provide a reason for rejecting this listing.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await rejectMutation.mutateAsync({
        listingId,
        reason: rejectionReason,
      });
      toastSvc.success("Listing rejected", {
        description: "Seller has been notified of the rejection.",
        autoClose: 2000,
      });
      setReviewAction(null);
      setRejectionReason("");
      refetch();
      // Optionally redirect
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      toastSvc.error("Failed to reject listing", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!listing || !comments.trim()) {
      toastSvc.error("Comments required", {
        description: "Please provide feedback for the revision request.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await revisionMutation.mutateAsync({
        listingId,
        comments,
        revisionRequests: {
          // This could be enhanced with specific field requirements
          general: {
            field: "general",
            issue: comments,
            suggestion: undefined,
          },
        },
      });
      toastSvc.success("Revision request sent", {
        description: "Seller will be notified to make the requested changes.",
        autoClose: 2000,
      });
      setReviewAction(null);
      setComments("");
      refetch();
    } catch (error: any) {
      toastSvc.error("Failed to request revision", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review":
        return "bg-yellow-50 text-yellow-900 border-yellow-200";
      case "approved":
        return "bg-green-50 text-green-900 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-900 border-red-200";
      case "needs_revision":
        return "bg-orange-50 text-orange-900 border-orange-200";
      default:
        return "bg-gray-50 text-gray-900 border-gray-200";
    }
  };

  if (listingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-gray-600">Listing not found</p>
          <Link href="/admin/listings">
            <Button className="mt-4">Back to Listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.imagesJson ? JSON.parse(listing.imagesJson) : [];
  const alreadyReviewed = listing.reviewStatus !== null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-[#ECBEE3]">
          <Link href="/admin/listings">
            <Button variant="outline" size="icon" className="border-[#2B2B2B] text-gray-700 hover:bg-[#ECBEE3] hover:text-black">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
            <p className="text-[#EA795B] mt-1">
              By <span className="font-medium">{listing.seller?.brandName || 'Unknown Seller'}</span>
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-3 mb-6">
          <Badge className={getStatusColor(listing.status)}>
            Status: {listing.status.replace(/_/g, " ")}
          </Badge>
          {listing.reviewStatus && (
            <Badge variant="outline">
              Review: {listing.reviewStatus.replace(/_/g, " ")}
            </Badge>
          )}
          {listing.reviewedAt && (
            <Badge variant="secondary">
              Reviewed: {new Date(listing.reviewedAt).toLocaleDateString()}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            {images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image: string, idx: number) => (
                      <div key={idx} className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        <Image
                          src={image}
                          alt={`Product image ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Category</p>
                    <p className="text-gray-900 capitalize">
                      {listing.category?.replace(/_/g, " ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Price</p>
                    <p className="text-gray-900">
                      {listing.price ? `$${(listing.price / 100).toFixed(2)}` : "Not set"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Description</p>
                  <p className="text-gray-900 mt-2 whitespace-pre-wrap">
                    {listing.description || "No description provided"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Activity History */}
            <Card>
              <CardHeader>
                <CardTitle>Review History</CardTitle>
                <CardDescription>Timeline of all review actions</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : activityHistory && activityHistory.length > 0 ? (
                  <div className="space-y-4">
                    {activityHistory.map((activity) => (
                      <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                        <div className="flex-shrink-0">
                          {activity.action === "approved" && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {activity.action === "rejected" && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          {activity.action === "revision_requested" && (
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                          )}
                          {!["approved", "rejected", "revision_requested"].includes(activity.action) && (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="font-medium text-gray-900 capitalize">
                              {activity.action.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {activity.details && (
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.details.rejectionReason ||
                                activity.details.comments ||
                                JSON.stringify(activity.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No review history yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Review Actions */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Review Actions</CardTitle>
                <CardDescription>
                  {alreadyReviewed ? "Update review" : "Make a decision"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {listing.reviewStatus === "approved" ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-green-900">Already Approved</p>
                    <p className="text-sm text-green-700 mt-1">
                      Approved on {new Date(listing.reviewedAt!).toLocaleDateString()}
                    </p>
                    {listing.comments && (
                      <p className="text-sm text-green-700 mt-2 italic">
                        "{listing.comments}"
                      </p>
                    )}
                  </div>
                ) : listing.reviewStatus === "rejected" ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="font-medium text-red-900">Rejected</p>
                    {listing.rejectionReason && (
                      <p className="text-sm text-red-700 mt-2">
                        {listing.rejectionReason}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={() => setReviewAction("approve")}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={isProcessing}
                    >
                      {isProcessing && reviewAction === "approve" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve Listing
                    </Button>

                    <Button
                      onClick={() => setReviewAction("revise")}
                      variant="outline"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing && reviewAction === "revise" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mr-2" />
                      )}
                      Request Revision
                    </Button>

                    <Button
                      onClick={() => setReviewAction("reject")}
                      variant="destructive"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing && reviewAction === "reject" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Reject Listing
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Review Modal */}
            {reviewAction && (
              <ListingReviewModal
                action={reviewAction}
                isOpen={!!reviewAction}
                isProcessing={isProcessing}
                comments={comments}
                rejectionReason={rejectionReason}
                onCommentsChange={setComments}
                onRejectionReasonChange={setRejectionReason}
                onApprove={handleApprove}
                onReject={handleReject}
                onRevise={handleRequestRevision}
                onClose={() => {
                  setReviewAction(null);
                  setComments("");
                  setRejectionReason("");
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}