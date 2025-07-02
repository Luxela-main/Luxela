"use client";

import { Button } from "@/components/ui/button"
  ;
import Header from "../../user-onboarding/components/header";
import { CheckCircle } from "lucide-react";

export default function ConfirmationPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white p-6">
        <div className="flex justify-center mb-8">
          <div className="flex gap-8 text-sm text-gray-400 font-semibold">
            <span className="text-purple-500 flex items-center gap-1">
              <CheckCircle size={16} /> Cart review
            </span>
            <span className="text-purple-500 flex items-center gap-1">
              <CheckCircle size={16} /> Billing address
            </span>
            <span className="text-purple-500 flex items-center gap-1">
              <CheckCircle size={16} /> Payment
            </span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-zinc-900 p-8 rounded-xl shadow-lg text-left">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center">
                <CheckCircle size={24} className="text-white" />
              </div>
            </div>
            <h2 className="text-lg font-semibold">Thank you for your order!</h2>
            <p className="text-gray-400 text-sm">
              The order confirmation has been sent to your email.
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h4 className="text-gray-500">Transaction date</h4>
              <p className="font-semibold">Date of transaction</p>
            </div>

            <div>
              <h4 className="text-gray-500">Payment method</h4>
              <p className="font-semibold">Card ending in 1234</p>
            </div>

            <div>
              <h4 className="text-gray-500">Shipping Address</h4>
              <p className="text-sm text-white">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>

            <div>
              <h4 className="text-gray-500">Delivery date</h4>
              <p className="font-semibold">
                Delivery between 23 Sep and 25 Sep (7-10 days from now)
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">
              Continue Shopping
            </Button>
            <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-zinc-800">
              Track Order
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
