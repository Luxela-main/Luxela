"use client";

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
}

export function TsaraPaymentModal({
  isOpen,
  onClose,
  totalAmount,
  orderId,
  buyerId,
  listingId,
}: TsaraPaymentModalProps) {
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
    createPayment.mutate({
      buyerId,
      listingId,
      orderId,
      amount: nairaAmount,
      currency: "NGN",
      description: `Luxela Order Payment`,
      paymentMethod: "bank_transfer",
      paymentType: "fiat",
      success_url: `${window.location.origin}/cart/success`,
      cancel_url: `${window.location.origin}/cart/checkout`,
    });
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
            Pay securely with Tsara by with bank transfer or stable coin
          </p>

          <div className="w-full flex justify-between items-center py-4 border-t border-neutral-800/60 mb-8">
            <span className="text-gray-400 text-sm">Total amount</span>
            <span className="text-white font-medium text-lg">
              NGN {(nairaAmount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={createPayment.isPending}
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