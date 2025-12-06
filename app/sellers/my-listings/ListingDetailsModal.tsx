"use client";

import React from "react";
import { X } from "lucide-react";

interface ListingDetailsModalProps {
  listing: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  listing,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !listing) return null;

  const formatPrice = (cents: number, currency: string) => {
    return `${currency} ${(cents / 100).toLocaleString()}`;
  };

  const parseSizes = (sizesJson: string | null) => {
    if (!sizesJson) return [];
    try {
      return JSON.parse(sizesJson);
    } catch {
      return [];
    }
  };

  const parseColors = (colorsJson: string | null) => {
    if (!colorsJson) return [];
    try {
      return JSON.parse(colorsJson);
    } catch {
      return [];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-[#0a0a0a] border border-[#333] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#333] p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{listing.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {listing.image && (
            <div className="w-full h-64 bg-[#1a1a1a] rounded-lg overflow-hidden">
              <img
                src={listing.image}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1a1a] p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Price</p>
              <p className="text-white text-lg font-semibold">
                {formatPrice(listing.priceCents || 0, listing.currency || "NGN")}
              </p>
            </div>
            <div className="bg-[#1a1a1a] p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Category</p>
              <p className="text-white capitalize">
                {listing.category?.replace(/_/g, " ") || "N/A"}
              </p>
            </div>
          </div>

          {listing.description && (
            <div className="bg-[#1a1a1a] p-4 rounded-lg">
              <p className="text-purple-400 font-semibold mb-2">Description</p>
              <p className="text-gray-300">{listing.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {listing.sizesJson && parseSizes(listing.sizesJson).length > 0 && (
              <div className="bg-[#1a1a1a] p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">Sizes Available</p>
                <div className="flex flex-wrap gap-2">
                  {parseSizes(listing.sizesJson).map((size: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-[#0a0a0a] border border-[#333] px-3 py-1 rounded text-sm"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {listing.colorsAvailable && parseColors(listing.colorsAvailable).length > 0 && (
              <div className="bg-[#1a1a1a] p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">Colors Available</p>
                <div className="flex flex-wrap gap-2">
                  {parseColors(listing.colorsAvailable).map((color: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-[#0a0a0a] border border-[#333] px-3 py-1 rounded text-sm"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#1a1a1a] p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Supply Capacity</p>
              <p className="text-white capitalize">
                {listing.supplyCapacity?.replace(/_/g, " ") || "N/A"}
              </p>
            </div>
            {listing.quantityAvailable !== null && (
              <div className="bg-[#1a1a1a] p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Quantity Available</p>
                <p className="text-white">{listing.quantityAvailable}</p>
              </div>
            )}
            <div className="bg-[#1a1a1a] p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Limited Edition Badge</p>
              <p className="text-white capitalize">
                {listing.limitedEditionBadge?.replace(/_/g, " ") || "N/A"}
              </p>
            </div>
          </div>
          {listing.materialComposition && (
            <div className="bg-[#1a1a1a] p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Material Composition</p>
              <p className="text-white">{listing.materialComposition}</p>
            </div>
          )}

          {listing.additionalTargetAudience && (
            <div className="bg-[#1a1a1a] p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Target Audience</p>
              <p className="text-white capitalize">{listing.additionalTargetAudience}</p>
            </div>
          )}

          <div className="border-t border-[#333] pt-4">
            <h3 className="text-purple-400 font-semibold mb-3">Shipping Information</h3>
            <div className="grid grid-cols-3 gap-4">
              {listing.shippingOption && (
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Shipping Option</p>
                  <p className="text-white capitalize">{listing.shippingOption}</p>
                </div>
              )}
              {listing.etaDomestic && (
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Domestic ETA</p>
                  <p className="text-white">{listing.etaDomestic.replace(/_/g, " ")}</p>
                </div>
              )}
              {listing.etaInternational && (
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">International ETA</p>
                  <p className="text-white">{listing.etaInternational.replace(/_/g, " ")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <span>Created: </span>
              <span className="text-white">
                {new Date(listing.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span>Updated: </span>
              <span className="text-white">
                {new Date(listing.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-[#333] p-6">
          <button
            onClick={onClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
