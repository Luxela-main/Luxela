"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Wallet, Building, Info, ShieldCheck, Clock, Zap } from "lucide-react";
import { useCartState } from "../context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toastSvc } from "@/services/toast";
import { useProfile } from "@/context/ProfileContext";
import { trpc } from "@/lib/trpc";
import { TsaraPaymentModal } from "./tsaraModal";

type PaymentMethod = "card" | "bank_transfer" | "crypto";

interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  processingTime: string;
  fees: string;
  escrowInfo: string;
}

export default function CartPaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const { items, subtotal, discountAmount, total } = useCartState();
  const [showTsaraModal, setShowTsaraModal] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const { profile } = useProfile();
  const router = useRouter();

  // Payment method options with enterprise details
  const paymentMethods: PaymentMethodOption[] = [
    {
      id: "card",
      label: "Credit / Debit Card",
      description: "Pay instantly with your card",
      icon: <CreditCard className="w-5 h-5" />,
      benefits: [
        "Instant payment confirmation",
        "Secure 3D verification",
        "Buyer protection included",
      ],
      processingTime: "Instant",
      fees: "2% payment fee",
      escrowInfo: "Payment held securely until delivery confirmation",
    },
    {
      id: "bank_transfer",
      label: "Bank Transfer",
      description: "Direct bank transfer via Tsara",
      icon: <Building className="w-5 h-5" />,
      benefits: [
        "Lower fees (0.5% + ₦100)",
        "Direct bank verification",
        "Recurring payment support",
      ],
      processingTime: "1-2 hours",
      fees: "0.5% + ₦100 flat",
      escrowInfo: "Funds held in escrow until seller ships",
    },
    {
      id: "crypto",
      label: "Crypto Wallet",
      description: "Pay with USDC or other stablecoins",
      icon: <Wallet className="w-5 h-5" />,
      benefits: [
        "Lowest fees (0.1%)",
        "Cross-border payments",
        "Instant settlement",
      ],
      processingTime: "5-10 seconds",
      fees: "0.1% payment fee",
      escrowInfo: "Stablecoin held in smart contract escrow",
    },
  ]

  const { data: billingData, isLoading: billingLoading } =
    trpc.buyer.getBillingAddresses.useQuery({
      page: 1,
      limit: 10,
    });

  const activeAddress =
    billingData?.data.find((a: any) => a.isDefault) || billingData?.data[0];
  const checkoutMutation = trpc.cart.checkout.useMutation({
    onSuccess: (checkoutData) => {
      if (checkoutData.orders.length > 0) {
        setCheckoutResult(checkoutData);
        setShowTsaraModal(true);
        toastSvc.success("Proceeding to payment...");
      }
    },
    onError: (error: any) => {
      const errorMessage = (error?.data as any)?.message || error?.message || "Checkout failed. Please try again.";
      
      // Log detailed error information for debugging
      console.error('[CartPayment] Checkout error:', {
        message: errorMessage,
        code: error?.code || error?.data?.code,
        itemCount: items.length,
        subtotal: subtotal,
        paymentMethod: paymentMethod,
        fullError: error,
      });
      
      toastSvc.error(errorMessage);
    },
  });

  const isProcessing = checkoutMutation.isPending;
  
  const shippingFees = subtotal > 5000000 
    ? 0 
    : 200000 + (items.length * 50000);
  
  const finalTotal = subtotal - discountAmount + shippingFees;


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
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === method.id
                    ? "border-purple-500 bg-purple-500/5"
                    : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                }`}
              >
                {/* Header: Radio, Icon, Label */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                        paymentMethod === method.id
                          ? "border-purple-500"
                          : "border-gray-600"
                      }`}
                    >
                      {paymentMethod === method.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      )}
                    </div>
                    <div className="text-gray-300">{method.icon}</div>
                    <div>
                      <div className="font-medium text-sm text-white">
                        {method.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {method.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-medium text-purple-400">
                      {method.fees}
                    </div>
                  </div>
                </div>

                {/* Details: Show only when selected */}
                {paymentMethod === method.id && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-gray-700/50">
                    {/* Payment Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                          Processing Time
                        </div>
                        <div className="text-sm font-medium text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-500" />
                          {method.processingTime}
                        </div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                          Security
                        </div>
                        <div className="text-sm font-medium text-white flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-500" />
                          Escrow Protected
                        </div>
                      </div>
                    </div>

                    {/* Escrow Information */}
                    <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
                      <div className="flex gap-2">
                        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-blue-400 uppercase tracking-widest font-medium mb-1">
                            Tsara Escrow Protection
                          </div>
                          <div className="text-xs text-blue-300 leading-relaxed">
                            {method.escrowInfo}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-2">
                        Benefits
                      </div>
                      <ul className="space-y-1.5">
                        {method.benefits.map((benefit, idx) => (
                          <li key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Card Logos - Only for card option */}
                {method.id === "card" && paymentMethod === "card" && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-700/50">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Accepted Cards:</span>
                    <Image
                      src="/visa.svg"
                      alt="Visa"
                      width={32}
                      height={20}
                      className="opacity-80 h-auto"
                    />
                    <Image
                      src="/mastercard.svg"
                      alt="Mastercard"
                      width={32}
                      height={20}
                      className="opacity-80 h-auto"
                    />
                    <Image
                      src="/opay.svg"
                      alt="Opay"
                      width={45}
                      height={20}
                      className="opacity-80 h-auto"
                    />
                  </div>
                )}

                {/* Crypto Wallets - Only for crypto option */}
                {method.id === "crypto" && paymentMethod === "crypto" && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700/50">
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
                )}
              </div>
            ))}
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
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-500">
                <span>Discount</span>
                <span>-₦{(discountAmount / 100).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Shipping</span>
              <span>{shippingFees === 0 ? 'FREE' : `₦${(shippingFees / 100).toLocaleString()}`}</span>
            </div>
          </div>
          <div className="space-y-2 bg-purple-500/10 p-3 rounded-lg">
            <div className="flex justify-between text-base font-bold">
              <span>Total Amount</span>
              <span className="text-purple-500">
                ₦{(finalTotal / 100).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              ({items.length} item{items.length !== 1 ? 's' : ''} • Shipping {shippingFees === 0 ? 'included' : 'calculated'})
            </p>
          </div>

          <Button
            onClick={async () => {
              if (!activeAddress) {
                toastSvc.error("Please add a billing address first");
                return;
              }

              // Validate cart still has items before checkout
              if (items.length === 0) {
                toastSvc.error("Your cart is empty. Please add items before checkout.");
                return;
              }

              // Atomic checkout creates orders AND payment records
              await checkoutMutation.mutateAsync({
                paymentMethod: paymentMethod,
              });
            }}
            disabled={isProcessing || billingLoading}
            className="w-full text-white py-7 rounded-xl text-base"
          >
            {isProcessing ? "Processing..." : "Complete Payment"}
          </Button>

          <div className="p-4 bg-white/5 rounded-lg border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
              Delivery Address
            </p>
            {billingLoading ? (
              <p className="text-xs text-gray-300">Fetching address...</p>
            ) : activeAddress ? (
              <p className="text-xs text-gray-300 leading-relaxed">
                {activeAddress.houseAddress}, {activeAddress.city}
              </p>
            ) : (
              <button
                onClick={() => router.push('/buyer/profile')}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Add delivery address
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal with actual checkout data - Always mounted for proper state management */}
      <TsaraPaymentModal
        isOpen={showTsaraModal}
        onClose={() => setShowTsaraModal(false)}
        totalAmount={checkoutResult?.total || 0}
        orderId={checkoutResult?.cartId || ""}
        buyerId={profile?.id || ""}
        checkoutData={checkoutResult}
        paymentMethod={paymentMethod}
      />
    </div>
  );
}