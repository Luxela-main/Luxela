"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CartSummaryFormProps {
  subtotal: number;
  discount: number;
  total: number;
  onNextStep: () => void;
  onApplyDiscount: (code: string) => void;
  disabled?: boolean;
}

export default function CartSummaryForm({
  subtotal,
  discount,
  total,
  onNextStep,
  onApplyDiscount,
  disabled = false,
}: CartSummaryFormProps) {
  const [discountCode, setDiscountCode] = useState("");

  const handleApplyDiscount = () => {
    if (discountCode.trim()) {
      onApplyDiscount(discountCode.trim());
    }
  };

  return (
    <div className="">
      <div className="bg-[#141414] border border-[#212121] rounded-lg p-6 sticky top-4">
        <h2 className="text-base text-white mb-6">Summary</h2>

        {/* Subtotal */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Subtotal</span>
            <span className="text-white text-sm">
              NGN {subtotal.toLocaleString()}.00
            </span>
          </div>

          {/* Discount */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Discount</span>
            <span className="text-purple-500">
              ${discount.toFixed(2)} {discount > 0 ? discount.toFixed(2) : "0.00"}
            </span>
          </div>
        </div>

        {/* Discount Code Input */}
        <div className="mb-6">
          <label className="text-white text-sm font-medium mb-2 block">
            Discount code
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApplyDiscount();
                }
              }}
            />
            <Button
              onClick={handleApplyDiscount}
              className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 px-6"
            >
              Apply Code
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-6"></div>

        {/* Total */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-400 text-sm">Total amount</span>
          <span className="text-white text-sm">
            NGN {total.toLocaleString()}.00
          </span>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={onNextStep}
          disabled={disabled}
          className="w-full text-white font-medium py-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to checkout
        </Button>
      </div>
    </div>
  );
}