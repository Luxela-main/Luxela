"use client";

import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import { AdInput } from "@/components/input/TextInput";
import helper from "@/helper";

interface CartSummaryFormProps {
  subtotal: number;
  discount?: number;
  total?: number;
  buttonLabel?: string;
  onNextStep?: () => void;
  onApplyDiscount?: (code: string) => void;
  showDiscountInput?: boolean;
  className?: string;
}

export default function CartSummaryForm({
  subtotal,
  discount = 0,
  total,
  buttonLabel = "Proceed to checkout",
  onNextStep,
  onApplyDiscount,
  showDiscountInput = true,
  className = "",
}: CartSummaryFormProps) {
  return (
    <div
      className={`bg-[#121212] p-6 rounded-xl border border-[#2a2a2a] w-full max-w-sm mx-auto space-y-6 ${className}`}>
      <Formik
        initialValues={{ discountCode: "" }}
        onSubmit={(values) => {
          if (onApplyDiscount) onApplyDiscount(values.discountCode);
        }}>
        {({ handleSubmit, values }) => (
          <Form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Summary</h2>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Subtotal</span>
                <span className="font-medium text-gray-200">
                  {helper.toCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Discount</span>
                <span className="font-medium text-gray-200">
                  {helper.toCurrency(discount)}
                </span>
              </div>
            </div>

            {showDiscountInput && (
              <div>
                <span className="block text-sm font-semibold text-white mb-2">
                  Discount code
                </span>
                <div className="flex gap-2">
                  <AdInput
                    label=""
                    name="discountCode"
                    placeholder="Enter discount code"
                    className="flex-1 bg-[#1f1f1f] border border-[#2e2e2e] text-gray-200 rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-purple-600"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="border border-[#444] text-gray-200 hover:bg-[#2e2e2e] rounded-lg px-4 !py-4">
                    Apply
                  </Button>
                </div>
              </div>
            )}

            <hr className="border-[#2a2a2a]" />

            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Total amount</span>
              <span className="font-semibold text-white text-lg">
                {helper.toCurrency(total ?? subtotal - discount)}
              </span>
            </div>

            {onNextStep && (
              <Button
                type="button"
                onClick={onNextStep}
                className="w-full bg-[#9b4dff] hover:bg-primary text-white font-medium rounded-lg py-3 transition-all">
                {buttonLabel}
              </Button>
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
}
