"use client";

import { Minus, Plus, Trash2, Edit3 } from "lucide-react";
import Image from "next/image";

interface CartItemProps {
  item: {
    id: string;
    listingId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  };
  increment: (listingId: string, currentQty: number) => void;
  decrement: (listingId: string, currentQty: number) => void;
  removeItem: (listingId: string) => void;
}

export function CartItem({ item, increment, decrement, removeItem }: CartItemProps) {
  return (
    <div className="flex justify-between items-center gap-4 bg-[#141414] border-b border-[#212121] p-4 transition-colors">
      {/* Product Image */}
      <div className="w-20 h-20 bg-[#858585] rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={80}
            height={80}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-400 rounded"></div>
        )}
      </div>

      {/* Product Info */}
      <div className="lg:flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-white text-sm ">{item.name}</h3>
          {/* Added a check for NaN to prevent the UI from breaking if price is missing */}
          <p className="text-white text-sm font-medium">
            NGN {isNaN(item.price) ? "0" : item.price.toLocaleString()}.00
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 p-1">
            <button
              onClick={() => decrement(item.listingId, item.quantity)}
              className="w-8 h-8 flex items-center justify-center border border-[#212121] hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4 text-gray-400" />
            </button>

            <span className="text-center px-4 text-white rounded-lg border border-[#212121] font-medium">
              {item.quantity}
            </span>
            
            <button
              onClick={() => increment(item.listingId, item.quantity)}
              className="w-8 h-8 flex items-center justify-center bg-purple-600 hover:bg-purple-700 rounded-lg border border-[#212121] transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1">
            <button
              className="flex items-center gap-1 text-purple-500 hover:text-purple-400 text-xs transition-colors"
              aria-label="Edit order"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit order</span>
            </button>
            <button
              onClick={() => removeItem(item.listingId)}
              className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 p-1 rounded hover:text-red-400 text-xs transition-colors"
              aria-label="Remove item"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove item</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}