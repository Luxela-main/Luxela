"use client";

import { AlertTriangle, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeletePayoutMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  method: any;
  isLoading?: boolean;
}

export function DeletePayoutMethodModal({
  isOpen,
  onClose,
  onConfirm,
  method,
  isLoading = false,
}: DeletePayoutMethodModalProps) {
  if (!isOpen || !method) return null;

  const getMethodTypeLabel = (type: string) => {
    switch (type) {
      case "bank_transfer":
        return "Bank Transfer";
      case "paypal":
        return "PayPal";
      case "crypto":
        return "Cryptocurrency";
      case "wise":
        return "Wise";
      default:
        return type;
    }
  };

  const getMethodDisplayName = () => {
    if (method.accountDetails?.accountName) {
      return method.accountDetails.accountName;
    }
    if (method.accountDetails?.email) {
      return method.accountDetails.email;
    }
    if (method.accountDetails?.bankName) {
      return method.accountDetails.bankName;
    }
    return getMethodTypeLabel(method.type);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-md w-full border border-red-600/30 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600/10 to-red-500/10 p-6 border-b border-red-600/30">
          <div className="flex items-start gap-4">
            <div className="bg-red-600/20 p-3 rounded-lg">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Delete Payment Method
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a]">
            <p className="text-sm text-gray-300 mb-2">
              <strong>Method:</strong> {getMethodDisplayName()}
            </p>
            <p className="text-sm text-gray-400">
              <strong>Type:</strong> {getMethodTypeLabel(method.type)}
            </p>
          </div>

          {method.is_default && (
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-yellow-300">
                This is your default payment method. Deleting it will remove your
                default payout method setting.
              </p>
            </div>
          )}

          {!method.is_verified && (
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3 flex gap-2">
              <XCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-blue-300">
                This method is still pending verification. Any verification
                requests will be cancelled.
              </p>
            </div>
          )}

          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3">
            <p className="text-sm text-red-300">
              Once deleted, you won't be able to recover this payment method.
            </p>
          </div>

          <p className="text-sm text-gray-400 text-center pt-2">
            Are you sure you want to proceed?
          </p>
        </div>

        <div className="flex gap-3 p-6 border-t border-[#2a2a2a] bg-[#0a0a0a]">
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="outline"
            className="flex-1 border-[#2a2a2a]"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            {isLoading ? "Deleting..." : "Delete Method"}
          </Button>
        </div>
      </div>
    </div>
  );
}