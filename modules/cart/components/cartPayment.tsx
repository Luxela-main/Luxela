"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Wallet, Building, Info } from "lucide-react";
import { useCartState } from "../context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toastSvc } from "@/services/toast";
import { useProfile } from "@/context/ProfileContext";
import { trpc } from "@/lib/trpc";
import { TsaraPaymentModal } from "./tsaraModal";

type PaymentMethod = "card" | "bank_transfer" | "crypto";

export default function CartPaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const { items, subtotal, discountAmount, total } = useCartState();
  const [showTsaraModal, setShowTsaraModal] = useState(false);
  const { profile } = useProfile();
  const router = useRouter();

  // 1. Fetch Billing Addresses (Real Step 2 data)
  const { data: billingData, isLoading: billingLoading } =
    trpc.buyer.getBillingAddresses.useQuery({
      page: 1,
      limit: 10,
    });

  const activeAddress =
    billingData?.data.find((a: any) => a.isDefault) || billingData?.data[0];
  // 2. Tsara Payment Mutation
  const createPaymentMutation = trpc.payment.createPayment.useMutation({
    onSuccess: (data) => {
      if (data.paymentUrl) {
        // Redirect to Tsara's secure hosted page
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error) => {
      toastSvc.error(error.message || "Failed to initiate payment");
    },
  });

  const isProcessing = createPaymentMutation.isPending;
  const shippingFees = 160000;
  const finalTotal = total + shippingFees;


  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT SIDE: Payment Selection */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-base font-medium text-white">
              Select payment method
            </h2>
            {activeAddress && (
              <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-1 rounded">
                Shipping to: {activeAddress.city}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Card Option */}
            <div
              onClick={() => setPaymentMethod("card")}
              className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                paymentMethod === "card"
                  ? "border-purple-500 bg-purple-500/5"
                  : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-4 mb-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "card"
                      ? "border-purple-500"
                      : "border-gray-600"
                  }`}
                >
                  {paymentMethod === "card" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  )}
                </div>
                <CreditCard className="w-5 h-5 text-gray-300" />
                <span className="font-medium text-sm text-white">
                  Credit / Debit Card
                </span>
              </div>
              <div className="flex items-center gap-3 ml-9">
                <Image
                  src="/visa.svg"
                  alt="Visa"
                  width={32}
                  height={20}
                  className="opacity-80"
                />
                <Image
                  src="/mastercard.svg"
                  alt="Mastercard"
                  width={32}
                  height={20}
                  className="opacity-80"
                />
                <Image
                  src="/opay.svg"
                  alt="Opay"
                  width={45}
                  height={20}
                  className="opacity-80"
                />
              </div>
            </div>

            {/* Crypto / Wallet Option */}
            <div
              onClick={() => setPaymentMethod("crypto")}
              className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                paymentMethod === "crypto"
                  ? "border-purple-500 bg-purple-500/5"
                  : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "crypto"
                      ? "border-purple-500"
                      : "border-gray-600"
                  }`}
                >
                  {paymentMethod === "crypto" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  )}
                </div>
                <Wallet className="w-5 h-5 text-gray-300" />
                <span className="font-medium text-sm text-white">
                  Pay with Crypto Wallet
                </span>
              </div>
              <div className="flex flex-wrap gap-2 ml-9">
                {["Phantom", "Solflare", "Backpack", "WalletConnect"].map(
                  (w) => (
                    <div
                      key={w}
                      className="bg-gray-800 px-3 py-1.5 rounded-md text-[10px] text-gray-300 flex items-center gap-2 border border-gray-700"
                    >
                      <Image
                        src={`/${w.toLowerCase()}.svg`}
                        alt={w}
                        width={12}
                        height={12}
                      />
                      {w}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Bank Transfer */}
            <div
              onClick={() => setPaymentMethod("bank_transfer")}
              className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                paymentMethod === "bank_transfer"
                  ? "border-purple-500 bg-purple-500/5"
                  : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "bank_transfer"
                      ? "border-purple-500"
                      : "border-gray-600"
                  }`}
                >
                  {paymentMethod === "bank_transfer" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  )}
                </div>
                <Building className="w-5 h-5 text-gray-300" />
                <div>
                  <span className="font-medium text-white block text-sm">
                    Bank Transfer
                  </span>
                  <span className="text-xs text-gray-500">
                    Secure Tsara Bank Transfer
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Summary & Final Button */}
        <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-neutral-800 h-fit space-y-6">
          <h3 className="text-base font-bold">Order Summary</h3>
          <div className="space-y-3 text-sm border-b border-neutral-800 pb-6">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span>₦{(subtotal / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-green-500">
              <span>Discount</span>
              <span>-₦{(discountAmount / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Shipping</span>
              <span>₦{(shippingFees / 100).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-purple-500">
              ₦{(finalTotal / 100).toLocaleString()}
            </span>
          </div>

          <Button
            onClick={() => setShowTsaraModal(true)}
            disabled={isProcessing || billingLoading}
            className="w-full text-white py-7 rounded-xl text-base"
          >
            {isProcessing ? "Opening Tsara..." : "Complete Payment"}
          </Button>

          <div className="p-4 bg-white/5 rounded-lg border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
              Delivery Address
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">
              {billingLoading
                ? "Fetching address..."
                : activeAddress
                ? `${activeAddress.houseAddress}, ${activeAddress.city}`
                : "No address found."}
            </p>
          </div>
        </div>
      </div>

      {/* We only render the modal if we have an activeAddress 
        to ensure the backend mutation doesn't fail on missing data.
      */}
      {activeAddress && (
        <TsaraPaymentModal
          isOpen={showTsaraModal}
          onClose={() => setShowTsaraModal(false)}
          totalAmount={finalTotal / 100}
          // Using logic to generate/fetch an Order ID or pass a temp one if creation happens in mutation
          orderId={`ORDER-${Date.now()}`}
          buyerId={profile?.id || ""}
          listingId={items[0]?.listingId || ""}
        />
      )}
    </div>
  );
}
