"use client";

import { Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrderSuccessPage() {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const savedAddress = localStorage.getItem("billingAddress");
    if (savedAddress) {
      setOrderDetails(JSON.parse(savedAddress));
    }
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const deliveryStartDate = new Date();
  deliveryStartDate.setDate(deliveryStartDate.getDate() + 7);
  const deliveryEndDate = new Date();
  deliveryEndDate.setDate(deliveryEndDate.getDate() + 10);

  const formatDeliveryDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F2F2F2] p-4 md:p-8">
   

      {}
      <div className="max-w-2xl mx-auto bg-[#141414] border border-[#212121] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 md:p-12">
          
          {}
          <div className="flex justify-center mb-6">
            <div className="relative">
               <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20"></div>
               <div className="relative w-16 h-16 border-2 border-purple-500 rounded-2xl rotate-45 flex items-center justify-center bg-[#141414]">
                 <Check className="w-4 h-4 text-purple-500 -rotate-45" strokeWidth={3} />
               </div>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-xl font-semibold mb-3">Thank you for your order!</h1>
            <p className="text-[#ACACAC] text-sm">
              The order confirmation has been sent to your email.
            </p>
          </div>

          {}
          <div className="space-y-0 border-t border-[#212121]">
            <div className="py-5 border-b border-[#212121]">
              <p className="text-[#ACACAC] text-xs uppercase tracking-wider mb-2">Transaction date</p>
              <p className="text-base font-medium">{currentDate}</p>
            </div>

            <div className="py-5 border-b border-[#212121]">
              <p className="text-[#ACACAC] text-xs uppercase tracking-wider mb-2">Payment method</p>
              <p className="text-base font-medium">Card Payment</p>
            </div>

            <div className="py-5 border-b border-[#212121]">
              <p className="text-[#ACACAC] text-xs uppercase tracking-wider mb-2">Shipping Address</p>
              <p className="text-sm text-[#F2F2F2] leading-relaxed max-w-md">
                {orderDetails ? (
                  `${orderDetails.address}, ${orderDetails.city}, ${orderDetails.state} ${orderDetails.postalCode}`
                ) : (
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                )}
              </p>
            </div>

            <div className="py-5">
              <p className="text-[#ACACAC] text-xs uppercase tracking-wider mb-2">Delivery date</p>
              <p className="text-sm">
                Delivery between <span className="font-bold">{formatDeliveryDate(deliveryStartDate)}</span> and{" "}
                <span className="font-medium">{formatDeliveryDate(deliveryEndDate)}</span> (7-10 days from now)
              </p>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
            <Button
              onClick={() => router.push("/buyer")}
              className="w-full bg-gradient-to-r from-[#8451E1] to-[#8451E1] hover:opacity-90 text-white font-medium h-10 rounded-xl shadow-lg shadow-purple-500/20"
            >
              Continue Shopping
            </Button>
            <Button
              onClick={() => router.push("/buyer/dashboard/orders")}
              className="w-full bg-[#212121] hover:bg-[#2a2a2a] text-white border border-[#333] font-medium h-10 rounded-xl"
            >
              Track Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}