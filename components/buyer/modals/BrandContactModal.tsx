'use client';

import { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { toastSvc } from '@/services/toast';

interface BrandContactModalProps {
  brand: {
    id: string;
    name: string;
    sellerId: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function BrandContactModal({
  brand,
  isOpen,
  onClose,
}: BrandContactModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toastSvc.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/buyer/contact-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brand.id,
          sellerId: brand.sellerId,
          subject,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toastSvc.success('Message sent successfully!');
      setSubject('');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Contact error:', error);
      toastSvc.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f0f] border border-[#2B2B2B] rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2B2B2B]">
          <h2 className="text-xl font-semibold text-white">
            Contact {brand.name}
          </h2>
          <button
            onClick={onClose}
            className="text-[#acacac] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-[#acacac] mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this about?"
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2B2B2B] text-white placeholder:text-[#666] rounded-lg focus:border-[#8451E1] focus:outline-none transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[#acacac] mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              rows={5}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2B2B2B] text-white placeholder:text-[#666] rounded-lg focus:border-[#8451E1] focus:outline-none transition-colors resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-[#2B2B2B] text-white rounded-lg hover:border-[#8451E1] hover:bg-[#8451E1]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#8451E1] to-[#5C2EAF] text-white rounded-lg hover:shadow-lg hover:shadow-[#8451E1]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}