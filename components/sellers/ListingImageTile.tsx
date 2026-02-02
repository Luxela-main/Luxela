"use client";

import React from "react";
import Image from "next/image";
import { Eye, Edit, Trash2, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface ListingImageTileProps {
  id: string;
  title: string;
  image?: string;
  price: number;
  currency: string;
  quantityAvailable: number;
  supplyCapacity: "no_max" | "limited";
  createdAt: Date;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const getStockStatus = (quantity: number) => {
  if (quantity === 0) return { status: "out-of-stock", color: "bg-red-500", label: "Out of Stock" };
  if (quantity <= 10) return { status: "low-stock", color: "bg-yellow-500", label: "Low Stock" };
  return { status: "in-stock", color: "bg-green-500", label: "In Stock" };
};

export const ListingImageTile: React.FC<ListingImageTileProps> = ({
  id,
  title,
  image,
  price,
  currency,
  quantityAvailable,
  supplyCapacity,
  createdAt,
  onView,
  onEdit,
  onDelete,
}) => {
  const stockStatus = getStockStatus(quantityAvailable);
  const isNew = new Date().getTime() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="group relative bg-[#0a0a0a] rounded-lg overflow-hidden border border-[#222] hover:border-purple-600 transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-square bg-[#1a1a1a] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
            <div className="text-center">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-xs text-gray-600">No image</p>
            </div>
          </div>
        )}

        {/* Badge Overlay */}
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start">
          {isNew && (
            <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
              NEW
            </span>
          )}
          <div className={`${stockStatus.color} rounded-full p-2`}>
            {stockStatus.status === "out-of-stock" && (
              <AlertCircle className="w-4 h-4 text-white" />
            )}
            {stockStatus.status === "low-stock" && (
              <Clock className="w-4 h-4 text-white" />
            )}
            {stockStatus.status === "in-stock" && (
              <CheckCircle className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={onView}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full transition"
            title="View Details"
          >
            <Eye className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition"
            title="Edit"
          >
            <Edit className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition"
            title="Delete"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-white line-clamp-2 text-sm group-hover:text-purple-400 transition">
          {title}
        </h3>

        {/* Price & Stock Status */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-purple-500">
            {currency} {(price / 100).toFixed(2)}
          </span>
          <span className={`text-xs font-semibold ${stockStatus.color === "bg-red-500" ? "text-red-500" : stockStatus.color === "bg-yellow-500" ? "text-yellow-500" : "text-green-500"}`}>
            {stockStatus.label}
          </span>
        </div>

        {/* Stock Bar */}
        <div className="w-full bg-[#1a1a1a] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${stockStatus.color} transition-all duration-300`}
            style={{
              width: `${Math.min((quantityAvailable / 100) * 100, 100)}%`,
            }}
          />
        </div>

        {/* Stock Details */}
        <p className="text-xs text-gray-400">
          {supplyCapacity === "limited" ? (
            <>
              <strong>{quantityAvailable}</strong> items available
            </>
          ) : (
            <>
              <strong>{quantityAvailable}</strong> in stock
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default ListingImageTile;