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
} from "lucide-react";

interface ListingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  isOpen,
  onClose,
  listing,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
      if (listing.sizeOptions && typeof listing.sizeOptions === "string") {
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
                    {listing.currency || "NGN"}{" "}
                    {((listing.priceCents || 0) / 100).toFixed(2)}
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
                        {listing.currency || "NGN"}{" "}
                        {((listing.shippingPrice || 0) / 100).toFixed(2)}
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