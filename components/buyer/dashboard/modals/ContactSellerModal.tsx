'use client';

import { useState, useCallback } from 'react';
import { X, Send, Loader, Info } from 'lucide-react';

interface ContactSellerModalProps {
  isOpen: boolean;
  orderId: string;
  productTitle: string;
  sellerName?: string;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  isLoading?: boolean;
}

const QUICK_MESSAGES = [
  'When will this be shipped?',
  'Do you have tracking information?',
  'Can I change the delivery address?',
  'Is this item still in stock?',
  'Can I get a refund?',
  'Custom question',
];

export function ContactSellerModal({
  isOpen,
  orderId,
  productTitle,
  sellerName,
  onClose,
  onSubmit,
  isLoading = false,
}: ContactSellerModalProps) {
  const [message, setMessage] = useState('');
  const [selectedQuick, setSelectedQuick] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickMessage = useCallback((msg: string) => {
    if (msg === 'Custom question') {
      setSelectedQuick(msg);
      setMessage('');
    } else {
      setSelectedQuick(msg);
      setMessage(msg);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!message.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(message);
      setMessage('');
      setSelectedQuick('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [message, onSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-xl bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border border-[#8451E1]/30 rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#8451E1]/20 gap-3">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white flex-1 truncate">Contact Seller</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#8451E1]/20 rounded-lg transition"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order Info */}
          <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-[#0a0a0a]/50 rounded-lg border border-[#8451E1]/10">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-500">Order #{orderId.slice(0, 8)}</p>
              <p className="text-sm sm:text-base text-white font-semibold truncate">{productTitle}</p>
              {sellerName && (
                <p className="text-xs text-gray-400 mt-1 truncate">Seller: {sellerName}</p>
              )}
            </div>
          </div>

          {/* Info Alert */}
          <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-2 sm:gap-3">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-blue-300 font-semibold mb-1">Direct Communication</p>
              <p className="text-xs sm:text-sm text-blue-200/80">
                Your message will be sent directly to the seller. They typically respond within 24 hours.
              </p>
            </div>
          </div>

          {/* Quick Messages */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-white font-semibold text-xs sm:text-sm">Quick Questions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  onClick={() => handleQuickMessage(msg)}
                  disabled={isSubmitting}
                  className={`text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition text-xs sm:text-sm ${
                    selectedQuick === msg
                      ? 'bg-[#8451E1]/30 border-[#8451E1]/60 text-white'
                      : 'bg-[#0a0a0a]/50 border-[#8451E1]/20 text-gray-300 hover:border-[#8451E1]/40'
                  }`}
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-white font-semibold text-xs sm:text-sm">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              className="w-full min-h-16 sm:min-h-24 px-3 sm:px-4 py-2 sm:py-3 bg-[#0a0a0a]/50 border border-[#8451E1]/20 rounded-lg text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-[#8451E1]/60 focus:ring-1 focus:ring-[#8451E1]/20 resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              {message.length} / 1000
            </p>
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
            disabled={isSubmitting || !message.trim()}
            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 text-white font-semibold text-sm sm:text-base rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}