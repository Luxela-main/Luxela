'use client';

import { useState, useCallback } from 'react';
import { X, Send, Loader, AlertCircle } from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  orderId: string;
  productTitle: string;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  isLoading?: boolean;
}

const SUPPORT_CATEGORIES = [
  { value: 'payment', label: 'Payment Issue', icon: '💳' },
  { value: 'shipping', label: 'Shipping Problem', icon: '📦' },
  { value: 'product', label: 'Product Issue', icon: '⚠️' },
  { value: 'refund', label: 'Refund Request', icon: '💰' },
  { value: 'account', label: 'Account Problem', icon: '👤' },
  { value: 'other', label: 'Other', icon: '❓' },
];

export function ContactSupportModal({
  isOpen,
  orderId,
  productTitle,
  onClose,
  onSubmit,
  isLoading = false,
}: ContactSupportModalProps) {
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!message.trim() || !category) {
      return;
    }

    setIsSubmitting(true);
    try {
      const fullMessage = `[${category.toUpperCase()}] ${message}`;
      await onSubmit(fullMessage);
      setMessage('');
      setCategory('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [message, category, onSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-lg sm:max-w-xl lg:max-w-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border border-[#8451E1]/30 rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#8451E1]/20 gap-2">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">Contact Support</h2>
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
          <div className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4 bg-[#0a0a0a]/50 rounded-lg border border-[#8451E1]/10">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-500">Order #{orderId.slice(0, 8)}</p>
              <p className="text-sm sm:text-base text-white font-semibold truncate">{productTitle}</p>
            </div>
          </div>

          {/* Info Alert */}
          <div className="p-3 sm:p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-green-300 font-semibold mb-1">Support Available</p>
              <p className="text-xs sm:text-sm text-green-200/80">
                Response: 2-4 hours (Business Hours)
              </p>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-white font-semibold text-xs sm:text-sm">
              Issue Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2">
              {SUPPORT_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  disabled={isSubmitting}
                  className={`p-2 sm:p-3 rounded-lg border transition text-center ${
                    category === cat.value
                      ? 'bg-[#8451E1]/30 border-[#8451E1]/60'
                      : 'bg-[#0a0a0a]/50 border-[#8451E1]/20 hover:border-[#8451E1]/40'
                  }`}
                >
                  <div className="text-base sm:text-lg mb-1">{cat.icon}</div>
                  <div className="text-xs font-medium text-white line-clamp-2">
                    {cat.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-white font-semibold text-xs sm:text-sm">
              Describe your issue
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe your issue. Include order numbers, error messages, or steps you've taken..."
              className="w-full min-h-16 sm:min-h-24 px-3 sm:px-4 py-2 sm:py-3 bg-[#0a0a0a]/50 border border-[#8451E1]/20 rounded-lg text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-[#8451E1]/60 focus:ring-1 focus:ring-[#8451E1]/20 resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              {message.length} / 1000
            </p>
          </div>

          {/* Tips */}
          <div className="p-3 sm:p-4 bg-[#0a0a0a]/50 border border-[#8451E1]/10 rounded-lg space-y-2">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Tips for faster resolution:</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>✓ Be specific about the issue</li>
              <li>✓ Include relevant order numbers</li>
              <li>✓ Describe reproduction steps</li>
              <li>✓ Mention error messages</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 border-t border-[#8451E1]/20 bg-[#0a0a0a]/30">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#8451E1]/10 hover:bg-[#8451E1]/20 border border-[#8451E1]/30 text-[#8451E1] font-semibold text-sm sm:text-base rounded-lg transition disabled:opacity-50"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim() || !category}
            className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 text-white font-semibold text-sm sm:text-base rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                <span className="hidden sm:inline">Submitting...</span>
                <span className="sm:hidden">Submit...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:inline" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}