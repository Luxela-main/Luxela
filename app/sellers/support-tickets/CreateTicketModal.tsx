'use client';

import { useState, useRef } from 'react';
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { trpc } from '@/app/_trpc/client';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general_inquiry',
    priority: 'medium',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  
  // Use ref for retry count to avoid race conditions with state updates
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  const createTicketMutation = trpc.support.createTicket.useMutation({
    onSuccess: () => {
      setSubmitStatus('success');
      setFormData({ subject: '', description: '', category: 'general_inquiry', priority: 'medium' });
      setTimeout(() => {
        onClose();
        onSuccess?.();
        setSubmitStatus('idle');
      }, 1500);
    },
    onError: (error) => {
      // Retry on auth timeout errors or transient failures
      const isTimeoutError = error.message.includes('AUTH_TIMEOUT') || error.message.includes('aborted') || error.message.includes('timeout');
      const isUnauthorized = error.message.includes('unauthorized') || error.message.includes('not logged in');
      const shouldRetry = isTimeoutError && retryCountRef.current < MAX_RETRIES;
      
      if (shouldRetry) {
        retryCountRef.current += 1;
        setSubmitStatus('loading');
        // Retry after a delay (timeout errors need recovery time)
        setTimeout(() => {
          createTicketMutation.mutateAsync({
            subject: formData.subject,
            description: formData.description,
            category: formData.category as 'general_inquiry' | 'technical_issue' | 'payment_problem' | 'order_issue' | 'refund_request' | 'account_issue' | 'listing_help' | 'other',
            priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
          }).catch(() => {
            // Retry failed, will be handled by onError again
          });
        }, 1500);
      } else {
        setSubmitStatus('error');
        let userFriendlyError = error.message || 'Failed to create ticket';
        
        // Provide better error messages
        if (isTimeoutError) {
          userFriendlyError = 'Connection timeout. Please check your internet and try again.';
        } else if (isUnauthorized) {
          userFriendlyError = 'Your session has expired. Please log in again.';
        }
        
        setSubmitError(userFriendlyError);
        retryCountRef.current = 0;
      }
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (formData.subject.length > 200) {
      newErrors.subject = 'Subject must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    if (formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitStatus('loading');
    setSubmitError('');
    retryCountRef.current = 0;

    await createTicketMutation.mutateAsync({
      subject: formData.subject,
      description: formData.description,
      category: formData.category as 'general_inquiry' | 'technical_issue' | 'payment_problem' | 'order_issue' | 'refund_request' | 'account_issue' | 'listing_help' | 'other',
      priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#333]">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1a1a1a] to-[#252525] p-6 border-b border-[#333] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Create Support Ticket</h2>
            <p className="text-gray-400 text-sm">Describe your issue and we'll help you resolve it</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitStatus === 'loading'}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-gap-3 gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
              <div>
                <p className="text-green-400 font-medium">Ticket Created Successfully</p>
                <p className="text-green-300 text-sm">We'll respond to your ticket shortly</p>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-gap-3 gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
              <div>
                <p className="text-red-400 font-medium">Error Creating Ticket</p>
                <p className="text-red-300 text-sm">{submitError}</p>
                {submitError.includes('unauthorized') && (
                  <p className="text-red-300 text-xs mt-2">💡 This might be a temporary issue. Please try again.</p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject Field */}
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-white mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Brief description of your issue"
                maxLength={200}
                disabled={submitStatus === 'loading'}
                className={`w-full px-4 py-2.5 bg-[#0f0f0f] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#8451E1] transition-colors disabled:opacity-50 ${
                  errors.subject ? 'border-red-500' : 'border-[#333]'
                }`}
              />
              {errors.subject && <p className="text-red-400 text-sm mt-1">{errors.subject}</p>}
              <p className="text-gray-500 text-xs mt-1">{formData.subject.length}/200 characters</p>
            </div>

            {/* Category and Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Category Select */}
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-white mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={submitStatus === 'loading'}
                  className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#8451E1] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <option value="general_inquiry">General Inquiry</option>
                  <option value="technical_issue">Technical Issue</option>
                  <option value="payment_problem">Payment Problem</option>
                  <option value="order_issue">Order Issue</option>
                  <option value="refund_request">Refund Request</option>
                  <option value="account_issue">Account Issue</option>
                  <option value="listing_help">Listing Help</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Priority Select */}
              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-white mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  disabled={submitStatus === 'loading'}
                  className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#8451E1] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-white mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Please provide detailed information about your issue or request..."
                minLength={10}
                maxLength={5000}
                disabled={submitStatus === 'loading'}
                rows={8}
                className={`w-full px-4 py-2.5 bg-[#0f0f0f] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#8451E1] transition-colors resize-none disabled:opacity-50 ${
                  errors.description ? 'border-red-500' : 'border-[#333]'
                }`}
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
              <p className="text-gray-500 text-xs mt-1">{formData.description.length}/5000 characters</p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                <span className="font-semibold">💡 Tip:</span> The more detail you provide, the faster we can help resolve your issue.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[#333]">
              <button
                type="button"
                onClick={onClose}
                disabled={submitStatus === 'loading'}
                className="flex-1 px-4 py-2.5 bg-[#2a2a2a] hover:bg-[#333] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitStatus === 'loading' || submitStatus === 'success'}
                className="flex-1 px-4 py-2.5 bg-[#8451E1] hover:bg-[#7040d1] text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitStatus === 'loading' ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : submitStatus === 'success' ? (
                  <>
                    <CheckCircle size={18} />
                    Created!
                  </>
                ) : (
                  'Create Ticket'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}