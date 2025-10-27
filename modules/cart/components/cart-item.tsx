"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import { Minus, Plus, Trash2, Pencil } from "lucide-react";

export interface CartItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartItemProps {
  item: CartItemData;
  increment?: (id: string) => void;
  decrement?: (id: string) => void;
  removeItem?: (id: string) => void;
  onEdit?: (id: string) => void;
  editable?: boolean;
  showQuantityControls?: boolean;
  currency?: string;
  className?: string;
}

export function CartItem({
  item,
  increment,
  decrement,
  removeItem,
  onEdit,
  editable = true,
  showQuantityControls = true,
  currency = "NGN",
  className = "",
}: CartItemProps) {
  return (
    <Card className={`bg-[#1a1a1a] text-white ${className}`}>
      <CardContent className="flex justify-between items-center p-4">
        <div className="flex items-center gap-4">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-16 h-16 rounded object-cover bg-gray-700"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-700 rounded" />
          )}
          <div>
            <h4 className="text-lg font-semibold">{item.name}</h4>
            <p className="text-sm text-gray-400">
              {currency} {item.price.toLocaleString()}
            </p>
          </div>
        </div>

        {showQuantityControls && (
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => decrement && decrement(item.id)}>
              <Minus size={16} />
            </Button>
            <span className="w-8 text-center">{item.quantity}</span>
            <Button
              size="icon"
              variant="default"
              onClick={() => increment && increment(item.id)}>
              <Plus size={16} />
            </Button>
          </div>
        )}

        {editable && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(item.id)}>
                <Pencil size={16} className="mr-1" /> Edit
              </Button>
            )}
            {removeItem && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeItem(item.id)}>
                <Trash2 size={16} className="mr-1" /> Remove
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
