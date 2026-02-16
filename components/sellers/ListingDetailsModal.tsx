"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  User,
  Palette,
  Ruler,
  AlertCircle,
  Badge,
  Clock,
  Film,
  FileText,
  BarChart3,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";

interface ListingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any;
  onRefresh?: () => void;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  isOpen,
  onClose,
  listing,
  onRefresh,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForReviewMutation = (trpc.listing as any).submitForReview.useMutation({
    onSuccess: () => {
      toastSvc.success("Listing submitted for review successfully!");
      if (onRefresh) onRefresh();
      onClose();
    },
    onError: (error: any) => {
      toastSvc.error(error.message || "Failed to submit listing for review");
    },
  });

  const handleSubmitForReview = async () => {
    if (!listing?.id) return;
    setIsSubmitting(true);
    try {
      await submitForReviewMutation.mutateAsync({
        listingId: listing.id,
      });
    } catch (error) {
      console.error('Error submitting listing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmitForReview = listing?.status === "draft" || listing?.status === "revision_requested";

  if (!listing) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl bg-[#0a0a0a] border border-[#222] text-white">
          <DialogHeader>
            <DialogTitle>Listing Details</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400">Loading listing details...</p>
        </DialogContent>
      </Dialog>
    );
  }

  const images = (() => {
    try {
      if (listing.imagesJson && typeof listing.imagesJson === "string") {
        const parsed = JSON.parse(listing.imagesJson);
        return Array.isArray(parsed) ? parsed.map((img: any) => {
          if (typeof img === 'string') return img;
          return img?.url || img;
        }) : [];
      } else if (listing.imagesJson && Array.isArray(listing.imagesJson)) {
        return listing.imagesJson.map((img: any) => {
          if (typeof img === 'string') return img;
          return img?.url || img;
        });
      } else if (listing.images) {
        return typeof listing.images === "string"
          ? JSON.parse(listing.images)
          : Array.isArray(listing.images)
          ? listing.images
          : [listing.image];
      }
      return listing.image ? [listing.image] : [];
    } catch {
      return listing.image ? [listing.image] : [];
    }
  })();

  const filteredImages = images.filter((img: any) => {
    if (typeof img === "string") return img && img.trim();
    return img && (img.url || img);
  });

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? filteredImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === filteredImages.length - 1 ? 0 : prev + 1
    );
  };

  const colors = (() => {
    try {
      if (listing.colorPalette && typeof listing.colorPalette === "string") {
        return JSON.parse(listing.colorPalette);
      } else if (listing.colors) {
        return typeof listing.colors === "string"
          ? JSON.parse(listing.colors)
          : listing.colors;
      }
      return [];
    } catch {
      return [];
    }
  })();

  const sizes = (() => {
    try {
      if (listing.sizesJson && typeof listing.sizesJson === "string") {
        return JSON.parse(listing.sizesJson);
      } else if (listing.sizeOptions && typeof listing.sizeOptions === "string") {
        return JSON.parse(listing.sizeOptions);
      } else if (listing.sizes) {
        return typeof listing.sizes === "string"
          ? JSON.parse(listing.sizes)
          : listing.sizes;
      }
      return [];
    } catch {
      return [];
    }
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#0a0a0a] border border-[#222] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {listing.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Carousel */}
          {filteredImages.length > 0 && (
            <div className="relative">
              <div className="relative aspect-square bg-[#1a1a1a] rounded-lg overflow-hidden">
                <Image
                  src={filteredImages[currentImageIndex]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />

                {filteredImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition z-10"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition z-10"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 px-4 py-2 rounded-full">
                      {filteredImages.map((_: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition ${
                            index === currentImageIndex
                              ? "bg-white"
                              : "bg-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Preview */}
              {filteredImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {filteredImages.map((img: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                        index === currentImageIndex
                          ? "border-purple-500"
                          : "border-[#333]"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${listing.title} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Info */}
          <div className="space-y-4">
            {/* Pricing */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Price</p>
                  <p className="text-4xl font-bold text-purple-500">
                    NGN {((listing.priceCents || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm mb-1">Stock Available</p>
                  <p className="text-3xl font-bold text-green-500">
                    {listing.quantityAvailable || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category & Material */}
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Product Details
                </h4>
                <div className="space-y-2 text-sm">
                  {listing.category && (
                    <div>
                      <p className="text-gray-500">Category</p>
                      <p className="text-white">{listing.category}</p>
                    </div>
                  )}
                  {listing.material && (
                    <div>
                      <p className="text-gray-500">Material</p>
                      <p className="text-white">{listing.material}</p>
                    </div>
                  )}
                  {listing.targetAudience && (
                    <div>
                      <p className="text-gray-500">Target Audience</p>
                      <p className="text-white">{listing.targetAudience}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Shipping Information
                </h4>
                <div className="space-y-2 text-sm">
                  {listing.shippingPrice !== undefined && (
                    <div>
                      <p className="text-gray-500">Shipping Cost</p>
                      <p className="text-white">
                        NGN {((listing.shippingPrice || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  {listing.shippingEta && (
                    <div>
                      <p className="text-gray-500">Estimated Delivery</p>
                      <p className="text-white">{listing.shippingEta}</p>
                    </div>
                  )}
                  {listing.supplyCapacity && (
                    <div>
                      <p className="text-gray-500">Supply Capacity</p>
                      <p className="text-white">
                        {listing.supplyCapacity === "no_max"
                          ? "Unlimited"
                          : "Limited"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Colors */}
            {colors.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Available Colors
                </h4>
                <div className="flex gap-3 flex-wrap">
                  {colors.map((color: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2"
                      title={color}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-[#333]"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-gray-400">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Available Sizes
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((size: string, index: number) => (
                    <span
                      key={index}
                      className="bg-purple-600/20 border border-purple-600 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  Description
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Meta Description */}
            {listing.metaDescription && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  Meta Description
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {listing.metaDescription}
                </p>
              </div>
            )}

            {/* SKU & Barcode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listing.sku && (
                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    SKU
                  </h4>
                  <p className="text-sm font-mono text-purple-400 bg-black/50 px-3 py-2 rounded break-all">
                    {listing.sku}
                  </p>
                </div>
              )}
              {listing.barcode && (
                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Barcode
                  </h4>
                  <p className="text-sm font-mono text-green-400 bg-black/50 px-3 py-2 rounded break-all">
                    {listing.barcode}
                  </p>
                </div>
              )}
            </div>

            {/* Video URL */}
            {listing.videoUrl && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  Video URL
                </h4>
                <a
                  href={listing.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 hover:underline break-all"
                >
                  {listing.videoUrl}
                </a>
              </div>
            )}

            {/* Care Instructions */}
            {listing.careInstructions && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Care Instructions
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {listing.careInstructions}
                </p>
              </div>
            )}

            {/* Material Composition */}
            {listing.materialComposition && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  Material Composition
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {listing.materialComposition}
                </p>
              </div>
            )}

            {/* Limited Edition & Release Duration */}
            {(listing.limitedEditionBadge || listing.releaseDuration) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listing.limitedEditionBadge && (
                  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                      <Badge className="w-4 h-4" />
                      Limited Edition
                    </h4>
                    <p className="text-sm text-amber-400">
                      {listing.limitedEditionBadge === "show_badge"
                        ? "✓ Badge will be shown"
                        : "✗ Badge hidden"}
                    </p>
                  </div>
                )}
                {listing.releaseDuration && (
                  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Release Duration
                    </h4>
                    <p className="text-sm text-white">{listing.releaseDuration}</p>
                  </div>
                )}
              </div>
            )}

            {/* Shipping & Supply Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listing.supplyCapacity && (
                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Supply Capacity
                  </h4>
                  <p className="text-sm text-white">
                    {listing.supplyCapacity === "no_max" ? "Unlimited" : "Limited"}
                  </p>
                </div>
              )}
              {listing.shippingOption && (
                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Shipping Options
                  </h4>
                  <p className="text-sm text-white capitalize">
                    {listing.shippingOption.replace(/_/g, " ")}
                  </p>
                </div>
              )}
            </div>

            {/* Shipping ETA */}
            {(listing.etaDomestic || listing.etaInternational) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listing.etaDomestic && (
                  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Domestic Shipping ETA
                    </h4>
                    <p className="text-sm text-white capitalize">
                      {listing.etaDomestic.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
                {listing.etaInternational && (
                  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      International Shipping ETA
                    </h4>
                    <p className="text-sm text-white capitalize">
                      {listing.etaInternational.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Refund Policy */}
            {listing.refundPolicy && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  Refund Policy
                </h4>
                <p className="text-sm text-white capitalize">
                  {listing.refundPolicy === "no_refunds"
                    ? "No Refunds"
                    : listing.refundPolicy === "1week"
                    ? "1 Week"
                    : listing.refundPolicy === "14days"
                    ? "14 Days"
                    : listing.refundPolicy === "30days"
                    ? "30 Days"
                    : listing.refundPolicy === "60days"
                    ? "60 Days"
                    : listing.refundPolicy === "1_2_weeks"
                    ? "1-2 Weeks"
                    : listing.refundPolicy === "2_3_weeks"
                    ? "2-3 Weeks"
                    : listing.refundPolicy === "48hrs"
                    ? "48 Hours"
                    : listing.refundPolicy === "72hrs"
                    ? "72 Hours"
                    : listing.refundPolicy === "5_working_days"
                    ? "5 Working Days"
                    : listing.refundPolicy.replace(/_/g, " ")}
                </p>
              </div>
            )}

            {/* Local Pricing */}
            {listing.localPricing && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  Pricing Type
                </h4>
                <p className="text-sm text-white capitalize">
                  {listing.localPricing === "fiat"
                    ? "Fiat Currency"
                    : listing.localPricing === "cryptocurrency"
                    ? "Cryptocurrency"
                    : "Fiat & Cryptocurrency"}
                </p>
              </div>
            )}

            {/* Listing Status */}
            {listing.status && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
                <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                  {listing.status === "approved" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : listing.status === "rejected" ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  Listing Status
                </h4>
                <p
                  className={`text-sm font-semibold ${
                    listing.status === "approved"
                      ? "text-green-400"
                      : listing.status === "rejected"
                      ? "text-red-400"
                      : listing.status === "draft"
                      ? "text-gray-400"
                      : "text-yellow-400"
                  }`}
                >
                  {listing.status === "pending_review"
                    ? "Pending Review"
                    : listing.status === "revision_requested"
                    ? "Revision Requested"
                    : listing.status.replace(/_/g, " ")}
                </p>
              </div>
            )}

            {/* Submit for Review Button */}
            {canSubmitForReview && (
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/30">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Ready to Submit?</h4>
                <p className="text-xs text-gray-300 mb-4">
                  Submit this listing to our admin team for review and approval. Once approved, it will be visible to all buyers.
                </p>
                <Button
                  onClick={handleSubmitForReview}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">
                Listing Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-white">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="text-white">
                    {new Date(listing.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingDetailsModal;