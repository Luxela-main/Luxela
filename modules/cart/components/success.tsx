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
      {/* 1. Progress Stepper Header */}
      <div className="max-w-3xl mx-auto mb-12 relative flex justify-between items-center px-4">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-purple-500 -translate-y-1/2 z-0" />
        
        {[
          { label: "Cart review", active: true },
          { label: "Billing address", active: true },
          { label: "Payment", active: true },
        ].map((step, i) => (
          <div key={i} className="relative z-10 flex items-center gap-2 bg-[#0E0E0E] px-3">
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            <span className="text-sm font-medium text-purple-500">{step.label}</span>
          </div>
        ))}
      </div>

      {/* 2. Main Confirmation Card */}
      <div className="max-w-2xl mx-auto bg-[#141414] border border-[#212121] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 md:p-12">
          
          {/* Success Icon (Shield/Badge Style) */}
          <div className="flex justify-center mb-6">
            <div className="relative">
               <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20"></div>
               <div className="relative w-16 h-16 border-2 border-purple-500 rounded-2xl rotate-45 flex items-center justify-center bg-[#141414]">
                 <Check className="w-8 h-8 text-purple-500 -rotate-45" strokeWidth={3} />
               </div>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold mb-3">Thank you for your order!</h1>
            <p className="text-[#ACACAC] text-sm">
              The order confirmation has been sent to your email.
            </p>
          </div>

          {/* Data Grid with thin separators (matching the image) */}
          <div className="space-y-0 border-t border-[#212121]">
            <div className="py-5 border-b border-[#212121]">
              <p className="text-[#ACACAC] text-xs uppercase tracking-wider mb-2">Transaction date</p>
              <p className="text-lg font-medium">{currentDate}</p>
            </div>

            <div className="py-5 border-b border-[#212121]">
              <p className="text-[#ACACAC] text-xs uppercase tracking-wider mb-2">Payment method</p>
              <p className="text-lg font-medium">Card Payment</p>
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
                <span className="font-bold">{formatDeliveryDate(deliveryEndDate)}</span> (7-10 days from now)
              </p>
            </div>
          </div>

          {/* Buttons Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
            <Button
              onClick={() => router.push("/buyer")}
              className="w-full bg-gradient-to-r from-[#8451E1] to-[#9872DD] hover:opacity-90 text-white font-bold h-14 rounded-xl shadow-lg shadow-purple-500/20"
            >
              Continue Shopping
            </Button>
            <Button
              onClick={() => router.push("/buyer/dashboard/orders")}
              className="w-full bg-[#212121] hover:bg-[#2a2a2a] text-white border border-[#333] font-bold h-14 rounded-xl"
            >
              Track Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}