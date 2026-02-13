"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { Loader2 } from "lucide-react";

interface TsaraPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  orderId: string;
  buyerId: string;
  listingId: string;
  paymentMethod: "card" | "bank_transfer" | "crypto";
}

export function TsaraPaymentModal({
  isOpen,
  onClose,
  totalAmount,
  orderId,
  buyerId,
  listingId,
  paymentMethod,
}: TsaraPaymentModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const createPayment = trpc.payment.createPayment.useMutation({
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (err) => {
      toastSvc.error(err.message || "Tsara connection failed");
    },
  });

  const nairaAmount = totalAmount / 100;

  const handleConfirm = () => {
    // For crypto, wallet selection is required
    if (paymentMethod === "crypto" && !selectedWallet) {
      toastSvc.error("Please select a wallet");
      return;
    }

    const paymentData: any = {
      buyerId,
      listingId,
      orderId,
      amount: nairaAmount,
      currency: "NGN",
      description: `Luxela Order Payment`,
      paymentMethod: paymentMethod,
      paymentType: paymentMethod === "crypto" ? "stablecoin" : "fiat",
      success_url: `${window.location.origin}/cart/success`,
      cancel_url: `${window.location.origin}/cart/checkout`,
    };

    // Add wallet ID for crypto payments
    if (paymentMethod === "crypto") {
      paymentData.wallet_id = selectedWallet;
    }

    createPayment.mutate(paymentData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#111111] border-neutral-800 max-w-[700px] p-0 overflow-hidden rounded-[24px]">
        <div className="p-8 flex flex-col items-center text-center">
          {/* Tsara Branding Box */}

          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-white mb-2">
              <div className="flex justify-center gap-4 items-center">
                <img
                  src="/tsara.svg"
                  alt="Tsara Logo"
                  className="w-10 mx-auto mb-2"
                />
                <p> Pay with Tsara</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-400 text-sm mb-10 px-6 leading-relaxed">
            {paymentMethod === "crypto"
              ? "Select a wallet and pay with stablecoin (USDC on Solana)"
              : paymentMethod === "bank_transfer"
              ? "Complete your bank transfer through Tsara"
              : "Pay securely with your credit or debit card"}
          </p>

          {/* Wallet Selection for Crypto */}
          {paymentMethod === "crypto" && (
            <div className="w-full mb-8 space-y-3">
              <label className="text-gray-400 text-sm">Select Wallet</label>
              <div className="grid grid-cols-2 gap-2">
                {["Phantom", "Solflare", "Backpack", "WalletConnect"].map(
                  (wallet) => (
                    <button
                      key={wallet}
                      onClick={() => setSelectedWallet(wallet)}
                      className={`p-3 rounded-lg border transition-all text-xs font-medium ${
                        selectedWallet === wallet
                          ? "border-blue-500 bg-blue-500/10 text-white"
                          : "border-neutral-700 bg-neutral-900 text-gray-400 hover:border-neutral-600"
                      }`}
                    >
                      {wallet}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="w-full flex justify-between items-center py-4 border-t border-neutral-800/60 mb-8">
            <span className="text-gray-400 text-sm">Total amount</span>
            <span className="text-white font-medium text-lg">
              NGN{" "}
              {nairaAmount.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={
              createPayment.isPending ||
              (paymentMethod === "crypto" && !selectedWallet)
            }
            className="w-full text-white py-6 rounded-2xl text-md font-medium"
          >
            {createPayment.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Continue to payment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}