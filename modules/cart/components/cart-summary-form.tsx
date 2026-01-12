// "use client";

// import { Formik, Form } from "formik";
// import { Button } from "@/components/ui/button";
// import { AdInput } from "@/components/input/TextInput";
// import helper from "@/helper";

// interface CartSummaryFormProps {
//   subtotal: number;
//   discount?: number;
//   total?: number;
//   buttonLabel?: string;
//   onNextStep?: () => void;
//   onApplyDiscount?: (code: string) => void;
//   showDiscountInput?: boolean;
//   className?: string;
//   disabled?: boolean;
// }

// export default function CartSummaryForm({
//   subtotal,
//   discount = 0,
//   total,
//   buttonLabel = "Proceed to checkout",
//   onNextStep,
//   onApplyDiscount,
//   showDiscountInput = true,
//   className = "",
//   disabled = false,
// }: CartSummaryFormProps) {
//   return (
//     <div
//       className={`bg-[#121212] p-6 rounded-xl border border-[#2a2a2a] w-full max-w-sm mx-auto space-y-6 ${className}`}>
//       <Formik
//         initialValues={{ discountCode: "" }}
//         onSubmit={(values) => {
//           if (onApplyDiscount && values.discountCode.trim()) {
//             onApplyDiscount(values.discountCode.trim());
//           }
//         }}>
//         {({ handleSubmit, values, isSubmitting }) => (
//           <Form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <h2 className="text-lg font-semibold text-white mb-2">Summary</h2>
//               <div className="flex justify-between text-sm text-gray-400 mb-1">
//                 <span>Subtotal</span>
//                 <span className="font-medium text-gray-200">
//                   {helper.toCurrency(subtotal)}
//                 </span>
//               </div>
//               <div className="flex justify-between text-sm text-gray-400">
//                 <span>Discount</span>
//                 <span className="font-medium text-gray-200">
//                   -{helper.toCurrency(discount)}
//                 </span>
//               </div>
//             </div>

//             {showDiscountInput && (
//               <div>
//                 <span className="block text-sm font-semibold text-white mb-2">
//                   Discount code
//                 </span>
//                 <div className="flex gap-2">
//                   <AdInput
//                     label=""
//                     name="discountCode"
//                     placeholder="Enter discount code"
//                     className="flex-1 bg-[#1f1f1f] border border-[#2e2e2e] text-gray-200 rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-purple-600"
//                   />
//                   <Button
//                     type="submit"
//                     variant="outline"
//                     disabled={!values.discountCode.trim() || isSubmitting}
//                     className="border border-[#444] text-gray-200 hover:bg-[#2e2e2e] rounded-lg px-4 !py-4">
//                     {isSubmitting ? "Applying..." : "Apply"}
//                   </Button>
//                 </div>
//               </div>
//             )}

//             <hr className="border-[#2a2a2a]" />

//             <div className="flex justify-between items-center">
//               <span className="text-gray-400 font-medium">Total amount</span>
//               <span className="font-semibold text-white text-lg">
//                 {helper.toCurrency(total ?? subtotal - discount)}
//               </span>
//             </div>

//             {onNextStep && (
//               <Button
//                 type="button"
//                 onClick={onNextStep}
//                 disabled={disabled}
//                 className="w-full bg-[#9b4dff] hover:bg-primary text-white font-medium rounded-lg py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
//                 {buttonLabel}
//               </Button>
//             )}
//           </Form>
//         )}
//       </Formik>
//     </div>
//   );
// }



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
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to checkout
        </Button>
      </div>
    </div>
  );
}