"use client";

import { useState, useCallback, memo } from "react";
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
import { getErrorMessage } from "@/lib/errorHandler";

interface TsaraPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  orderId: string;
  buyerId: string;
  paymentMethod: "card" | "bank_transfer" | "crypto";
  checkoutData?: any;
}

function TsaraPaymentModalComponent({
  isOpen,
  onClose,
  totalAmount,
  orderId,
  buyerId,
  paymentMethod,
  checkoutData,
}: TsaraPaymentModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const createPayment = trpc.payment.createPayment.useMutation({
    onSuccess: (data) => {
      if (data.paymentUrl) {
        // Store payment reference in session storage for verification after return
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pendingPaymentRef', data.payment.id); // Use internal payment ID
          sessionStorage.setItem('pendingTransactionRef', data.paymentId); // Store Tsara payment ID as transaction ref
          sessionStorage.setItem('checkoutOrderId', orderId);
        }
        // Redirect to Tsara payment page
        window.location.href = data.paymentUrl;
      } else {
        toastSvc.error('Payment URL not received from gateway');
      }
    },
    onError: (err: any) => {
      // Extract error message - tRPC errors have message directly or in err.message
      let displayMessage = 'Failed to create payment. Please try again.';

      // For tRPC errors - check multiple possible locations
      if (err?.message) {
        displayMessage = err.message;
      } else if (err?.data?.message) {
        displayMessage = err.data.message;
      } else if (err?.shape?.message) {
        displayMessage = err.shape.message;
      } else {
        const fallbackMessage = getErrorMessage(err);
        if (fallbackMessage && fallbackMessage !== 'An unexpected error occurred') {
          displayMessage = fallbackMessage;
        }
      }

      toastSvc.error(displayMessage);
    },
  });

  const nairaAmount = totalAmount / 100;

  const handleConfirm = useCallback(() => {
    // For crypto, wallet selection is required
    if (paymentMethod === "crypto" && !selectedWallet) {
      toastSvc.error("Please select a wallet");
      return;
    }

    // Validate checkout data
    if (!checkoutData || !checkoutData.orders || checkoutData.orders.length === 0) {
      toastSvc.error("Invalid checkout data. Please go back and try again.");
      return;
    }

    // Validate listing ID exists and is valid UUID format
    const firstOrder = checkoutData.orders[0];
    if (!firstOrder?.listingId) {
      toastSvc.error("Invalid order data. Please go back and try again.");
      console.error('[TsaraModal] Missing listing ID:', { firstOrder, orders: checkoutData.orders });
      return;
    }

    // Validate amount is valid
    if (!nairaAmount || nairaAmount <= 0) {
      toastSvc.error("Invalid payment amount. Please try again.");
      console.error('[TsaraModal] Invalid amount:', { nairaAmount, totalAmount });
      return;
    }

    const paymentData: any = {
      buyerId,
      // For multiple orders, use the first one's listing ID
      listingId: firstOrder.listingId,
      orderId: orderId, // Use cart ID as reference
      amount: nairaAmount,
      currency: paymentMethod === "crypto" ? "USDC" : "NGN",
      description: `Luxela Order Payment - ${checkoutData.orders.length} item(s)`,
      paymentMethod: paymentMethod,
      paymentType: paymentMethod === "crypto" ? "stablecoin" : "fiat",
      success_url: `${window.location.origin}/cart/success`,
      cancel_url: `${window.location.origin}/cart/checkout`,
      metadata: {
        cartId: orderId,
        itemCount: checkoutData.orders.length,
        subtotal: checkoutData.subtotal,
        discount: checkoutData.discountCents,
      },
    };

    // Add wallet ID for crypto payments
    if (paymentMethod === "crypto") {
      paymentData.wallet_id = selectedWallet;
    }

    console.log('[TsaraModal] Sending payment data:', {
      buyerId,
      listingId: firstOrder.listingId,
      amount: nairaAmount,
      currency: paymentData.currency,
      paymentMethod,
      itemCount: checkoutData.orders.length,
    });

    createPayment.mutate(paymentData);
  }, [paymentMethod, selectedWallet, checkoutData, orderId, buyerId, nairaAmount, createPayment]);

  // Don't render if modal is closed
  if (!isOpen) {
    return null;
  }

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

          {/* Order Summary */}
          {checkoutData && checkoutData.orders && (
            <div className="w-full mb-6 p-4 bg-gray-900/50 rounded-lg border border-neutral-800">
              <div className="text-left space-y-2">
                <p className="text-sm font-medium text-white">Order Summary</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Items: {checkoutData.orders.length}</p>
                  <p>Subtotal: ₦{(checkoutData.subtotal / 100).toLocaleString('en-NG')}</p>
                  {checkoutData.discountCents > 0 && (
                    <p className="text-green-500">
                      Discount: -₦{(checkoutData.discountCents / 100).toLocaleString('en-NG')}
                    </p>
                  )}
                </div>
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

          {/* Debug Info in Development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-gray-500 bg-gray-900 p-2 rounded w-full max-h-20 overflow-y-auto">
              <p>Debug: {paymentMethod} | Amount: {nairaAmount} NGN | Cart ID: {orderId?.substring(0, 8)}...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const TsaraPaymentModal = memo(TsaraPaymentModalComponent);