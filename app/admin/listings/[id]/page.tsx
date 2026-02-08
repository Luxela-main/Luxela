"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { useListings } from "@/context/ListingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ListingReviewModal from "@/components/admin/ListingReviewModal";
import { formatNaira } from "@/lib/currency";

type ReviewAction = "approve" | "reject" | "revise" | null;

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [reviewAction, setReviewAction] = useState<ReviewAction>(null);
  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: listing, isLoading: listingLoading, refetch } = trpc.adminListingReview.getListingDetails.useQuery({
    listingId,
  });

  const { data: activityHistory, isLoading: activityLoading } = trpc.adminListingReview.getActivityHistory.useQuery({
    listingId,
  });

  const approveMutation = trpc.adminListingReview.approveListing.useMutation();
  const rejectMutation = trpc.adminListingReview.rejectListing.useMutation();
  const revisionMutation = trpc.adminListingReview.requestRevision.useMutation();

  const { invalidateCatalogCache } = useListings();

  const handleApprove = async () => {
    if (!listing) return;

    setIsProcessing(true);
    try {
      await approveMutation.mutateAsync({
        listingId,
        comments: comments || undefined,
      });
      
      // Invalidate buyer catalog cache to show newly approved listings immediately
      invalidateCatalogCache();
      
      toastSvc.success("Listing approved successfully!", {
        description: "The listing is now live for buyers.",
        autoClose: 2000,
      });
      setReviewAction(null);
      setComments("");
      refetch();
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
        return "bg-yellow-100 text-yellow-900 border-yellow-300";
      case "approved":
        return "bg-green-100 text-green-900 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-900 border-red-300";
      case "needs_revision":
        return "bg-orange-100 text-orange-900 border-orange-300";
      default:
        return "bg-gray-100 text-gray-900 border-gray-300";
    }
  };

  if (listingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0e0e0e] to-[#1a1a1a]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8451e1]" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] to-[#1a1a1a] p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-[#9CA3AF]">Listing not found</p>
          <Link href="/admin/listings">
            <Button className="mt-4 bg-[#8451e1] hover:bg-[#5b3fb8]">Back to Listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.imagesJson ? JSON.parse(listing.imagesJson) : [];
  const alreadyReviewed = listing.reviewStatus !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] to-[#1a1a1a] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-[#2B2B2B]">
          <Link href="/admin/listings">
            <Button variant="outline" size="icon" className="border-[#2B2B2B] text-[#9CA3AF] hover:bg-[#8451e1] hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{listing.title}</h1>
            <p className="text-[#9CA3AF] mt-1">
              By <span className="font-medium">{listing.seller?.brandName || "Unknown Seller"}</span>
            </p>
            <p className="text-[#6B7280] text-sm mt-1">
              Seller ID: <span className="font-mono text-[#9CA3AF]">{listing.seller?.id || "N/A"}</span>
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <Badge className={getStatusColor(listing.status)}>
            Status: {listing.status.replace(/_/g, " ")}
          </Badge>
          {listing.reviewStatus && (
            <Badge variant="outline" className="border-[#2B2B2B] text-[#9CA3AF]">
              Review: {listing.reviewStatus.replace(/_/g, " ")}
            </Badge>
          )}
          {listing.reviewedAt && (
            <Badge variant="secondary" className="bg-[#0e0e0e] text-[#9CA3AF] border-[#2B2B2B]">
              Reviewed: {new Date(listing.reviewedAt).toLocaleDateString()}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            {images.length > 0 && (
              <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image: string, idx: number) => (
                      <div key={idx} className="relative w-full aspect-square bg-[#0e0e0e] rounded-lg overflow-hidden border border-[#2B2B2B]">
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

            {/* Seller Information */}
            <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#9CA3AF]">Seller ID</p>
                    <p className="text-white font-mono text-sm">{listing.seller?.id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#9CA3AF]">Brand Name</p>
                    <p className="text-white">{listing.seller?.brandName || "Unknown Seller"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#9CA3AF]">Category</p>
                    <p className="text-white capitalize">
                      {listing.category?.replace(/_/g, " ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#9CA3AF]">Price</p>
                    <p className="text-white">
                      {listing.price ? formatNaira(listing.price, true) : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#9CA3AF]">Listing Type</p>
                    <p className="text-white capitalize">{listing.type || "Single"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#9CA3AF]">Status</p>
                    <p className="text-white capitalize">{listing.status?.replace(/_/g, " ") || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#9CA3AF]">Description</p>
                  <p className="text-white mt-2 whitespace-pre-wrap">
                    {listing.description || "No description provided"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Collection Products (if applicable) */}
            {listing.type === 'collection' && listing.collectionProducts && listing.collectionProducts.length > 0 && (
              <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Collection Products ({listing.collectionItemCount || listing.collectionProducts.length})</CardTitle>
                      <CardDescription>All products included in this collection</CardDescription>
                    </div>
                    {listing.collectionTotalPrice && (
                      <div className="text-right">
                        <p className="text-xs font-medium text-[#9CA3AF]">Total Collection Value</p>
                        <p className="text-lg font-semibold text-[#8451e1]">{formatNaira(listing.collectionTotalPrice, true)}</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {listing.collectionProducts.map((product, idx) => (
                    <div key={product.id} className="border border-[#2B2B2B] rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white mb-1">{idx + 1}. {product.title}</h4>
                          <p className="text-xs text-[#9CA3AF] font-mono">ID: {product.id}</p>
                        </div>
                        <Badge className="bg-[#8451e1] text-white">
                          {formatNaira(product.priceCents / 100, true)}
                        </Badge>
                      </div>
                      {product.images && product.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {product.images.map((image, idx) => (
                            <div key={idx} className="relative w-full aspect-square bg-[#0e0e0e] rounded overflow-hidden border border-[#2B2B2B]">
                              <Image src={image} alt={`Product image`} fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {product.sku && (<div><p className="text-xs font-medium text-[#9CA3AF]">SKU</p><p className="text-white font-mono text-xs">{product.sku}</p></div>)}
                        {product.category && (<div><p className="text-xs font-medium text-[#9CA3AF]">Category</p><p className="text-white capitalize">{product.category.replace(/_/g, " ")}</p></div>)}
                        {product.material && (<div><p className="text-xs font-medium text-[#9CA3AF]">Material</p><p className="text-white">{product.material}</p></div>)}
                        {product.weight && (<div><p className="text-xs font-medium text-[#9CA3AF]">Weight</p><p className="text-white">{product.weight}</p></div>)}
                        {product.dimensions && (<div><p className="text-xs font-medium text-[#9CA3AF]">Dimensions</p><p className="text-white">{product.dimensions}</p></div>)}
                        {product.origin && (<div><p className="text-xs font-medium text-[#9CA3AF]">Origin</p><p className="text-white">{product.origin}</p></div>)}
                      </div>
                      {product.description && (<div className="pt-2 border-t border-[#2B2B2B]"><p className="text-xs font-medium text-[#9CA3AF] mb-1">Description</p><p className="text-white text-xs whitespace-pre-wrap">{product.description}</p></div>)}
                      {product.careInstructions && (<div className="pt-2 border-t border-[#2B2B2B]"><p className="text-xs font-medium text-[#9CA3AF] mb-1">Care Instructions</p><p className="text-white text-xs whitespace-pre-wrap">{product.careInstructions}</p></div>)}
                      {product.tags && product.tags.length > 0 && (<div className="pt-2 border-t border-[#2B2B2B]"><p className="text-xs font-medium text-[#9CA3AF] mb-2">Tags</p><div className="flex gap-1 flex-wrap">{product.tags.map((tag) => (<Badge key={tag} variant="secondary" className="bg-[#8451e1]/30 text-[#8451e1] text-xs">{tag}</Badge>))}</div></div>)}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Product Specifications */}
            {(listing.sku || listing.materialComposition || listing.careInstructions) && (
              <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {listing.sku && (
                      <div>
                        <p className="text-sm font-medium text-[#9CA3AF]">SKU</p>
                        <p className="text-white font-mono text-sm">{listing.sku}</p>
                      </div>
                    )}
                    {listing.materialComposition && (
                      <div>
                        <p className="text-sm font-medium text-[#9CA3AF]">Material</p>
                        <p className="text-white">{listing.materialComposition}</p>
                      </div>
                    )}
                  </div>
                  {listing.careInstructions && (
                    <div className="pt-2 border-t border-[#2B2B2B]">
                      <p className="text-sm font-medium text-[#9CA3AF]">Care Instructions</p>
                      <p className="text-white mt-2 whitespace-pre-wrap text-sm">{listing.careInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#2B2B2B]">
                  <div>
                    <p className="text-xs font-medium text-[#6B7280]">Created</p>
                    <p className="text-sm text-white mt-1">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Activity History */}
            <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
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
                      <div key={activity.id} className="flex gap-4 pb-4 border-b border-[#2B2B2B] last:border-b-0">
                        <div className="flex-shrink-0">
                          {activity.action === "listing_approved" && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {activity.action === "listing_rejected" && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          {activity.action === "revision_requested" && (
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                          )}
                          {!["listing_approved", "listing_rejected", "revision_requested"].includes(activity.action) && (
                            <Clock className="w-5 h-5 text-[#6B7280]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="font-medium text-white capitalize">
                              {activity.action.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm text-[#6B7280]">
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {activity.details && (
                            <p className="text-sm text-[#9CA3AF] mt-1">
                              {(activity.details as any)?.rejectionReason ||
                                (activity.details as any)?.comments ||
                                JSON.stringify(activity.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#9CA3AF] text-sm">No review history yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Review Actions */}
          <div>
            <Card className="sticky top-6 bg-[#1a1a1a] border-[#2B2B2B]">
              <CardHeader>
                <CardTitle className="text-lg">Review Actions</CardTitle>
                <CardDescription>
                  {alreadyReviewed ? "Update review" : "Make a decision"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {listing.reviewStatus === "approved" ? (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-green-400">Already Approved</p>
                    <p className="text-sm text-green-300 mt-1">
                      Approved on {new Date(listing.reviewedAt!).toLocaleDateString()}
                    </p>
                    {listing.comments && (
                      <p className="text-sm text-green-300 mt-2 italic">
                        "{listing.comments}"
                      </p>
                    )}
                  </div>
                ) : listing.reviewStatus === "rejected" ? (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-center">
                    <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="font-medium text-red-400">Rejected</p>
                    {listing.rejectionReason && (
                      <p className="text-sm text-red-300 mt-2">
                        {listing.rejectionReason}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={() => setReviewAction("approve")}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
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
                      className="w-full border-[#2B2B2B] hover:bg-orange-500 hover:text-white"
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
                      className="w-full bg-red-600 hover:bg-red-700"
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