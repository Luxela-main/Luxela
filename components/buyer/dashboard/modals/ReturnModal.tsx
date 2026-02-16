'use client';

import { useState, useCallback } from 'react';
import { X, AlertCircle, Send, Loader, CheckCircle } from 'lucide-react';

type ReturnReason =
  | 'defective'
  | 'damaged'
  | 'not_as_described'
  | 'unwanted'
  | 'too_small'
  | 'too_large'
  | 'color_mismatch'
  | 'wrong_item'
  | 'other';

interface ReturnModalProps {
  isOpen: boolean;
  orderId: string;
  productTitle: string;
  onClose: () => void;
  onSubmit: (reason: ReturnReason, description: string) => Promise<void>;
  isLoading?: boolean;
}

const RETURN_REASONS: { value: ReturnReason; label: string; description: string }[] = [
  {
    value: 'defective',
    label: 'Product Defective',
    description: 'The product has a defect or malfunction',
  },
  {
    value: 'damaged',
    label: 'Damaged on Delivery',
    description: 'The product arrived damaged',
  },
  {
    value: 'not_as_described',
    label: 'Not as Described',
    description: 'The product does not match the listing description',
  },
  {
    value: 'unwanted',
    label: 'Changed Mind',
    description: 'I no longer want this product',
  },
  {
    value: 'too_small',
    label: 'Too Small',
    description: 'The size is smaller than expected',
  },
  {
    value: 'too_large',
    label: 'Too Large',
    description: 'The size is larger than expected',
  },
  {
    value: 'color_mismatch',
    label: 'Color Mismatch',
    description: 'The color does not match the listing',
  },
  {
    value: 'wrong_item',
    label: 'Wrong Item',
    description: 'I received a different item',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason (please explain below)',
  },
];

export function ReturnModal({
  isOpen,
  orderId,
  productTitle,
  onClose,
  onSubmit,
  isLoading = false,
}: ReturnModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReturnReason>('other');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedReason, description);
      setDescription('');
      setSelectedReason('other');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedReason, description, onSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl mx-4 my-8 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border border-[#8451E1]/30 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#8451E1]/20">
          <h2 className="text-xl font-bold text-white">Request Return</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#8451E1]/20 rounded-lg transition"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Product Info */}
          <div className="flex items-start gap-4 p-4 bg-[#0a0a0a]/50 rounded-lg border border-[#8451E1]/10">
            <div>
              <p className="text-sm text-gray-500">Order #{orderId.slice(0, 8)}</p>
              <p className="text-white font-semibold">{productTitle}</p>
            </div>
          </div>

          {/* Info Alert */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-300 font-semibold mb-1">Return Policy</p>
              <p className="text-sm text-amber-200/80">
                Items must be returned within 30 days of delivery. The seller has 3-5 business days to review your request.
              </p>
            </div>
          </div>

          {/* Return Reason */}
          <div className="space-y-3">
            <label className="text-white font-semibold text-sm">
              Why do you want to return this item?
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {RETURN_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  disabled={isSubmitting}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedReason === reason.value
                      ? 'bg-[#8451E1]/30 border-[#8451E1]/60'
                      : 'bg-[#0a0a0a]/50 border-[#8451E1]/20 hover:border-[#8451E1]/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${
                      selectedReason === reason.value
                        ? 'bg-[#8451E1] border-[#8451E1]'
                        : 'border-[#8451E1]/30'
                    }`}>
                      {selectedReason === reason.value && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{reason.label}</p>
                      <p className="text-gray-400 text-xs">{reason.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="text-white font-semibold text-sm">
              Provide more details (required)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please explain your reason for return in detail. This helps the seller process your request faster..."
              className="w-full min-h-24 px-4 py-3 bg-[#0a0a0a]/50 border border-[#8451E1]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#8451E1]/60 focus:ring-1 focus:ring-[#8451E1]/20 resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              {description.length} characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[#8451E1]/20 bg-[#0a0a0a]/30">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-[#8451E1]/10 hover:bg-[#8451E1]/20 border border-[#8451E1]/30 text-[#8451E1] font-semibold rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/30 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Return Request</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}