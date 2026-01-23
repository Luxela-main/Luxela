'use client';

import { useState } from 'react';
import { ChevronDown, MessageCircle, FileText, AlertCircle, Search } from 'lucide-react';

export default function HelpCenterPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      id: 1,
      question: 'How do I place an order?',
      answer: 'Browse our products, add items to your cart, and proceed to checkout. Follow the payment instructions to complete your purchase.'
    },
    {
      id: 2,
      question: 'What is your return policy?',
      answer: 'We offer 30-day returns for most items in original condition. Visit the Returns & Refunds section for more details.'
    },
    {
      id: 3,
      question: 'How can I track my order?',
      answer: 'Once your order ships, you\'ll receive a tracking number via email. You can also check your order status in the Orders section.'
    },
    {
      id: 4,
      question: 'Do you offer international shipping?',
      answer: 'Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location.'
    },
    {
      id: 5,
      question: 'How do I update my profile information?',
      answer: 'Go to your Profile section and click Edit to update your personal details, address, and payment methods.'
    },
    {
      id: 6,
      question: 'What payment methods do you accept?',
      answer: 'We accept credit cards, debit cards, PayPal, and other digital payment methods depending on your location.'
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0e0e0e] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Help Center</h1>
          <p className="text-gray-400">Find answers to common questions and get support</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:bg-[#252525] transition-colors text-left">
            <MessageCircle className="w-6 h-6 text-purple-500 mb-2" />
            <p className="text-white font-semibold">Live Chat</p>
            <p className="text-gray-400 text-sm">Chat with our support team</p>
          </button>
          <button className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:bg-[#252525] transition-colors text-left">
            <FileText className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-white font-semibold">Documentation</p>
            <p className="text-gray-400 text-sm">Browse our knowledge base</p>
          </button>
          <button className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:bg-[#252525] transition-colors text-left">
            <AlertCircle className="w-6 h-6 text-orange-500 mb-2" />
            <p className="text-white font-semibold">Report Issue</p>
            <p className="text-gray-400 text-sm">Submit a support ticket</p>
          </button>
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
          <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
          {filteredFAQs.map((faq) => (
            <div
              key={faq.id}
              className="bg-[#1a1a1a] border border-[#333333] rounded-lg overflow-hidden hover:border-[#444444] transition-colors"
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#252525] transition-colors"
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
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Didn't find what you need?</h3>
          <p className="text-gray-400 mb-4">Our support team is here to help</p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors font-medium">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}