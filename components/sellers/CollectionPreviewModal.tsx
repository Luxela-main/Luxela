"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Package, DollarSign, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CollectionItem {
  title: string;
  price: number;
  currency: string;
  image?: string;
  quantity: number;
  sku?: string;
  description?: string;
}

interface CollectionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionTitle: string;
  collectionDescription?: string;
  items: CollectionItem[];
  totalPrice: number;
  currency: string;
  itemCount: number;
}

export const CollectionPreviewModal: React.FC<CollectionPreviewModalProps> = ({
  isOpen,
  onClose,
  collectionTitle,
  collectionDescription,
  items,
  totalPrice,
  currency,
  itemCount,
}) => {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Calculate total price from items if not provided
  const calculatedTotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const finalTotal = calculatedTotal > 0 ? calculatedTotal : totalPrice;
  
  const savings = Math.round(finalTotal * 0.1);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0a0a0a] border border-[#222] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {collectionTitle}
          </DialogTitle>
          {collectionDescription && (
            <DialogDescription className="text-gray-400 text-sm">
              {collectionDescription}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Collection Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-400">Items</span>
              </div>
              <p className="text-2xl font-bold text-white">{items.length > 0 ? items.length : itemCount}</p>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-400">Total Value</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {currency} {(finalTotal / 100).toFixed(2)}
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-gray-400">Potential Savings</span>
              </div>
              <p className="text-2xl font-bold text-yellow-500">
                {currency} {(savings / 100).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Items Grid */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">
              Bundled Items
            </h3>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#222] hover:border-purple-600 transition"
                  >
                    {/* Item Image */}
                    <div className="relative aspect-square bg-[#0a0a0a] overflow-hidden">
                      {item.image && !imageErrors.has(index) ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          onError={() => handleImageError(index)}
                          quality={75}
                          priority={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl">📦</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium text-white line-clamp-1">
                        {item.title}
                      </p>
                      {item.sku && (
                        <p className="text-xs text-gray-500">
                          SKU: {item.sku}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-purple-500 font-bold text-sm">
                          {item.currency || currency} {((item.price || 0) / 100).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400">
                          Stock: {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-400">
                  No items in this collection
                </div>
              )}
            </div>
          </div>

          {/* Collection Summary */}
          <div className="bg-gradient-to-r from-purple-600/20 to-purple-400/20 rounded-lg p-4 border border-purple-500/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Subtotal</span>
              <span className="text-white font-semibold">
                {currency} {(finalTotal / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-yellow-500">
              <span className="text-sm">Bundle Savings (10%)</span>
              <span className="font-semibold">
                -{currency} {(savings / 100).toFixed(2)}
              </span>
            </div>
            <div className="border-t border-purple-500/30 mt-2 pt-2 flex justify-between items-center">
              <span className="text-white font-bold">Final Price</span>
              <span className="text-2xl font-bold text-purple-400">
                {currency} {((finalTotal - savings) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionPreviewModal;