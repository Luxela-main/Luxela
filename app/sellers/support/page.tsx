'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, MessageCircle, FileText, AlertCircle, Search, Ticket } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { useOptimizedPolling } from '@/lib/hooks/useOptimizedPolling';
import { toastSvc } from '@/services/toast';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  userRole: 'buyer' | 'seller' | 'admin';
  order: number;
  active: boolean;
  views: number;
  helpful: number;
  notHelpful: number;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function SellerSupportPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch FAQs for seller role with polling
  const faqQuery = trpc.faqs.getFAQsByRole.useQuery(
    {
      userRole: 'seller',
      search: searchQuery || undefined,
    },
    {
      staleTime: 5000,
      gcTime: 10000,
      refetchOnWindowFocus: false,
    }
  );

  // Use optimized polling for FAQ updates
  useOptimizedPolling(faqQuery, {
    initialInterval: 30000, // 30 seconds for FAQ updates
    maxInterval: 120000, // Max 2 minutes
    minInterval: 15000, // Min 15 seconds
    enableBackoff: true,
    pauseWhenUnfocused: true,
    maxFailedAttempts: 3,
  });

  const { data: fetchedFaqs = [], isLoading, refetch } = faqQuery;

  // Setup mutation for tracking FAQ views
  const trackViewMutation = trpc.faqs.trackView.useMutation();

  // Memoize converted FAQs to avoid infinite loops
  const convertedFaqs = useMemo(() => 
    fetchedFaqs.map(faq => ({
      ...faq,
      createdAt: typeof faq.createdAt === 'string' ? new Date(faq.createdAt) : faq.createdAt,
      updatedAt: typeof faq.updatedAt === 'string' ? new Date(faq.updatedAt) : faq.updatedAt,
    })),
    [fetchedFaqs]
  );

  const handleTrackView = (faqId: string) => {
    try {
      trackViewMutation.mutate({ faqId });
    } catch (error) {
      toastSvc.error('Failed to track FAQ view');
    }
  };

  const filteredFAQs = convertedFaqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFAQClick = (faqId: string) => {
    handleTrackView(faqId);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8" style={{borderLeft: '4px solid #E5E7EB', paddingLeft: '12px'}}>
          <h1 className="text-3xl font-bold text-white mb-2">Seller Support Center</h1>
          <p className="text-gray-400">Find answers to common questions and get support</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => toastSvc.info('Coming Soon')}
            className="bg-[#1a1a1a] border-2 rounded-lg p-4 hover:bg-[#252525] transition-colors text-left cursor-pointer group" style={{borderColor: '#E5E7EB'}}>
            <MessageCircle className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-white font-semibold">Live Chat</p>
            <p className="text-gray-400 text-sm">Chat with our support team</p>
          </button>
          <button 
            onClick={() => toastSvc.info('Coming Soon')}
            className="bg-[#1a1a1a] border-2 rounded-lg p-4 hover:bg-[#252525] transition-colors text-left cursor-pointer group" style={{borderColor: '#E5E7EB'}}>
            <FileText className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-white font-semibold">Seller Guide</p>
            <p className="text-gray-400 text-sm">Browse our documentation</p>
          </button>
          <Link href="/sellers/dashboard/support-tickets">
            <button className="bg-[#1a1a1a] border-2 rounded-lg p-4 hover:bg-[#252525] transition-colors text-left cursor-pointer group w-full" style={{borderColor: '#E5E7EB'}}>
              <Ticket className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-semibold">Support Tickets</p>
              <p className="text-gray-400 text-sm">View & create tickets</p>
            </button>
          </Link>
          <Link href="/sellers/dashboard/support-tickets">
            <button className="bg-[#1a1a1a] border-2 rounded-lg p-4 hover:bg-[#252525] transition-colors text-left cursor-pointer group w-full" style={{borderColor: '#E5E7EB'}}>
              <AlertCircle className="w-6 h-6 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-semibold">Report Issue</p>
              <p className="text-gray-400 text-sm">Submit a support ticket</p>
            </button>
          </Link>
        </div>

        {/* Search FAQs */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4" style={{color: '#D1D5DB'}}>Frequently Asked Questions</h2>
          {isLoading ? (
            <div className="bg-[#1a1a1a] rounded-lg p-8 text-center text-gray-400">
              Loading FAQs...
            </div>
          ) : filteredFAQs.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-lg p-8 text-center text-gray-400">
              <p>No FAQs found</p>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-[#1a1a1a] border border-[#333333] rounded-lg overflow-hidden hover:border-[#444444] transition-colors"
              >
                <button
                  onClick={() => {
                    handleFAQClick(faq.id);
                    setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id);
                  }}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <span className="text-white font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedFAQ === faq.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-[#333333] bg-[#0f0f0f]">
                    <p className="text-gray-400">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 rounded-lg p-6" style={{borderColor: '#E5E7EB'}}>
          <h3 className="text-xl font-semibold text-white mb-2 text-center">Didn't find what you need?</h3>
          <p className="text-gray-400 mb-6 text-center">Create a support ticket and our team will assist you</p>
          <div className="flex justify-center">
            <Link href="/sellers/dashboard/support-tickets">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors font-medium cursor-pointer flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Create Ticket
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}