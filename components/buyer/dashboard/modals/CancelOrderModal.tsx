'use client';

import { useState, useCallback } from 'react';
import { X, AlertTriangle, Send, Loader, Info } from 'lucide-react';

interface CancelOrderModalProps {
  isOpen: boolean;
  orderId: string;
  productTitle: string;
  orderTotal: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

const CANCEL_REASONS = [
  'Found a better price elsewhere',
  'Changed my mind',
  'No longer need the product',
  'Shipping time is too long',
  'Found the item in store',
  'Other reason',
];

export function CancelOrderModal({
  isOpen,
  orderId,
  productTitle,
  orderTotal,
  onClose,
  onSubmit,
  isLoading = false,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!selectedReason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const reason = additionalDetails.trim()
        ? `${selectedReason}: ${additionalDetails}`
        : selectedReason;
      await onSubmit(reason);
      setSelectedReason('');
      setAdditionalDetails('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedReason, additionalDetails, onSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-xl sm:max-w-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border border-[#8451E1]/30 rounded-lg sm:rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#8451E1]/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-white">Cancel Order</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-[#8451E1]/20 rounded-lg transition flex-shrink-0"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order Info */}
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-[#0a0a0a]/50 rounded-lg border border-[#8451E1]/10">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Order #{orderId.slice(0, 8)}</p>
              <p className="text-white font-semibold mb-1 text-sm sm:text-base line-clamp-2">{productTitle}</p>
              <p className="text-xs sm:text-sm text-[#8451E1]">Total: {orderTotal}</p>
            </div>
          </div>

          {/* Warning Alert */}
          <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-red-300 font-semibold mb-1">Are you sure?</p>
              <p className="text-xs sm:text-sm text-red-200/80">
                Cancelling this order cannot be undone. If the order is already shipped, you may need to request a return instead.
              </p>
            </div>
          </div>

          {/* Refund Info */}
          <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-2 sm:gap-3">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-blue-300 font-semibold mb-1">Refund Policy</p>
              <p className="text-xs sm:text-sm text-blue-200/80">
                If refunded, the amount will be credited back to your original payment method within 3-5 business days.
              </p>
            </div>
          </div>

          {/* Cancel Reason */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-white font-semibold text-xs sm:text-sm">
              Why do you want to cancel?
            </label>
            <div className="space-y-1.5 sm:space-y-2">
              {CANCEL_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  disabled={isSubmitting}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition ${
                    selectedReason === reason
                      ? 'bg-red-500/20 border-red-500/60'
                      : 'bg-[#0a0a0a]/50 border-[#8451E1]/20 hover:border-red-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex-shrink-0 ${
                        selectedReason === reason
                          ? 'bg-red-500 border-red-500'
                          : 'border-[#8451E1]/30'
                      }`}
                    />
                    <span className="text-white text-xs sm:text-sm">{reason}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          {selectedReason && (
            <div className="space-y-2 sm:space-y-3 animate-in fade-in duration-300">
              <label className="text-white font-semibold text-xs sm:text-sm">
                Additional details (optional)
              </label>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Tell us more..."
                className="w-full min-h-16 sm:min-h-20 px-3 sm:px-4 py-2 sm:py-3 bg-[#0a0a0a]/50 border border-[#8451E1]/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#8451E1]/60 focus:ring-1 focus:ring-[#8451E1]/20 resize-none"
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 border-t border-[#8451E1]/20 bg-[#0a0a0a]/30">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#8451E1]/10 hover:bg-[#8451E1]/20 border border-[#8451E1]/30 text-[#8451E1] font-semibold text-sm rounded-lg transition disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-lg hover:shadow-red-500/30 text-white font-semibold text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                <span className="hidden sm:inline">Cancelling...</span>
                <span className="sm:hidden">Cancel...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Confirm Cancellation</span>
                <span className="sm:hidden">Confirm</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}