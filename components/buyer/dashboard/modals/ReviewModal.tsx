'use client';

import { useState, useCallback } from 'react';
import { X, Star, Send, Loader } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  orderId: string;
  productTitle: string;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => Promise<void>;
  isLoading?: boolean;
}

export function ReviewModal({
  isOpen,
  orderId,
  productTitle,
  onClose,
  onSubmit,
  isLoading = false,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!review.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, review);
      setReview('');
      setRating(5);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, review, onSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border border-[#8451E1]/30 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#8451E1]/20">
          <h2 className="text-xl font-bold text-white">Leave a Review</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#8451E1]/20 rounded-lg transition"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="flex items-start gap-4 p-4 bg-[#0a0a0a]/50 rounded-lg border border-[#8451E1]/10">
            <div>
              <p className="text-sm text-gray-500">Order #{orderId.slice(0, 8)}</p>
              <p className="text-white font-semibold">{productTitle}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <label className="text-white font-semibold text-sm">
              How would you rate this product?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition transform hover:scale-110"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`w-8 h-8 transition ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-500'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-400">
              {rating === 1 && 'Poor - Not satisfied'}
              {rating === 2 && 'Fair - Acceptable'}
              {rating === 3 && 'Good - Satisfied'}
              {rating === 4 && 'Very Good - Very Satisfied'}
              {rating === 5 && 'Excellent - Highly Recommended'}
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-3">
            <label className="text-white font-semibold text-sm">
              Share your experience
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell other buyers about your experience with this product. What did you like? Any suggestions? (150+ characters recommended)"
              className="w-full min-h-32 px-4 py-3 bg-[#0a0a0a]/50 border border-[#8451E1]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#8451E1]/60 focus:ring-1 focus:ring-[#8451E1]/20 resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              {review.length} characters
            </p>
          </div>

          {/* Info Alert */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              Your review helps other buyers make informed decisions. Please be honest and helpful.
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
            disabled={isSubmitting || !review.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Review</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}