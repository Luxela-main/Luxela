"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Eye,
  SquarePen,
  Trash2,
  TrendingUp,
  Package,
  Clock,
  AlertCircle,
} from "lucide-react";

interface EnhancedListingCardProps {
  id: string;
  title: string;
  category: string;
  image?: string;
  price?: number;
  quantity: number;
  views?: number;
  conversions?: number;
  createdAt: Date;
  type: "single" | "collection";
  itemCount?: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const EnhancedListingCard: React.FC<EnhancedListingCardProps> = ({
  id,
  title,
  category,
  image,
  price,
  quantity,
  views = 0,
  conversions = 0,
  createdAt,
  type,
  itemCount,
  onView,
  onEdit,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine stock status
  const getStockStatus = () => {
    if (quantity === 0) return { status: "out-of-stock", color: "from-red-500 to-red-600", label: "Sold Out", textColor: "text-red-300" };
    if (quantity < 10) return { status: "low-stock", color: "from-amber-500 to-amber-600", label: "Low Stock", textColor: "text-amber-300" };
    return { status: "in-stock", color: "from-emerald-500 to-emerald-600", label: "In Stock", textColor: "text-emerald-300" };
  };

  const stockStatus = getStockStatus();
  const createdAtDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const isNew = new Date().getTime() - createdAtDate.getTime() < 7 * 24 * 60 * 60 * 1000;
  const conversionRate = views > 0 ? ((conversions / views) * 100).toFixed(1) : "0";

  return (
    <div
      className="group relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card Container */}
      <div className="h-full bg-gradient-to-b from-[#1a1a1a] via-[#141414] to-[#0f0f0f] rounded-2xl overflow-hidden border border-gray-800/60 hover:border-gray-700/80 transition-all duration-500 backdrop-blur-md shadow-xl hover:shadow-2xl hover:shadow-[#8451E1]/20">
        
        {/* Image Section */}
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-900 to-black">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className={`object-cover transition-transform duration-700 ${
                isHovered ? "scale-110" : "scale-100"
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <Package className="w-12 h-12 text-gray-700" />
            </div>
          )}

          {/* Gradient Overlay on Hover */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity duration-500 ${
              isHovered ? "opacity-70" : "opacity-40"
            }`}
          />

          {/* Badge Section - Top Right */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            {isNew && (
              <div className="backdrop-blur-md bg-[#8451E1]/20 border border-[#8451E1]/40 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#8451E1] uppercase tracking-widest">
                New
              </div>
            )}
            <div
              className={`backdrop-blur-md bg-gradient-to-r ${stockStatus.color} rounded-lg px-3 py-1.5 text-xs font-semibold text-white uppercase tracking-widest border border-white/10`}
            >
              {stockStatus.label}
            </div>
          </div>

          {/* Views & Conversions - Top Left */}
          {views > 0 && (
            <div className="absolute top-4 left-4 backdrop-blur-md bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 z-20">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-semibold">{views}</span>
              </div>
              {conversions > 0 && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">{conversions} sales</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center gap-3 transition-opacity duration-500 ${
              isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <button
              onClick={onView}
              className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all duration-300 hover:scale-110 active:scale-95"
              title="View details"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={onEdit}
              className="p-3 rounded-full bg-[#8451E1]/30 backdrop-blur-md border border-[#8451E1]/40 text-[#8451E1] hover:bg-[#8451E1]/50 transition-all duration-300 hover:scale-110 active:scale-95"
              title="Edit listing"
            >
              <SquarePen className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-3 rounded-full bg-red-600/30 backdrop-blur-md border border-red-400/30 text-red-300 hover:bg-red-600/50 transition-all duration-300 hover:scale-110 active:scale-95"
              title="Delete listing"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Stock Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className={`h-full bg-gradient-to-r ${stockStatus.color} transition-all duration-700`}
              style={{
                width: `${Math.min((quantity / 100) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-4 flex flex-col h-full">
          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#8451E1] to-[#6D3FCF]" />
            <span className="text-xs uppercase font-semibold text-gray-400 tracking-widest">
              {category ? category.replace(/_/g, " ") : "Uncategorized"}
            </span>
          </div>

          {/* Title */}
          <div className="flex-grow">
            <h3 className="text-base font-semibold text-white line-clamp-2 leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#8451E1] group-hover:to-[#6D3FCF] group-hover:bg-clip-text transition-all duration-300">
              {title}
            </h3>
          </div>

          {/* Price & Metrics */}
          <div className="space-y-3 border-t border-gray-800/50 pt-3">
            {/* Price Row */}
            {price && type === "single" && (
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-white">
                  ₦{(price / 100).toLocaleString()}
                </span>
                {conversions > 0 && (
                  <span className="text-xs text-emerald-400 font-semibold">
                    {conversionRate}% CR
                  </span>
                )}
              </div>
            )}

            {type === "collection" && (
              <div className="text-sm text-gray-400">
                <span className="font-semibold text-white">{itemCount || 0}</span> items
              </div>
            )}

            {/* Stock Level & Info */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <span className="block font-semibold text-white">{quantity}</span>
                <span>{type === "collection" ? "items" : "in stock"}</span>
              </div>
              <div className="text-right text-xs text-gray-500">
                <span className="block font-semibold text-white">
                  {new Date(createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span>created</span>
              </div>
            </div>

            {/* Performance Indicator */}
            {views > 0 && (
              <div className="pt-2 border-t border-gray-800/50">
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Engagement</span>
                    <span className="font-semibold text-gray-300">{views} views</span>
                  </div>
                  {conversions > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Performance</span>
                      <span className="font-semibold text-emerald-400">
                        {conversions} {conversions === 1 ? "sale" : "sales"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedListingCard;