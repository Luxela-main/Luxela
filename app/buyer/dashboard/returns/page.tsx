'use client';

import { useState } from 'react';
import { Package, CheckCircle, Clock, AlertCircle, DollarSign, Download } from 'lucide-react';

export default function ReturnsAndRefundsPage() {
  const [activeTab, setActiveTab] = useState<'returns' | 'refunds'>('returns');

  const returns = [
    {
      id: 'RET001',
      orderNumber: 'ORD-2024-001',
      product: 'Premium Wireless Headphones',
      status: 'approved',
      requestDate: '2024-01-15',
      reason: 'Not as described'
    },
    {
      id: 'RET002',
      orderNumber: 'ORD-2024-002',
      product: 'Smart Watch Pro',
      status: 'pending',
      requestDate: '2024-01-20',
      reason: 'Defective unit'
    },
    {
      id: 'RET003',
      orderNumber: 'ORD-2024-003',
      product: 'USB-C Cable (5-pack)',
      status: 'completed',
      requestDate: '2024-01-10',
      reason: 'Changed mind'
    }
  ];

  const refunds = [
    {
      id: 'REF001',
      amount: '$129.99',
      status: 'completed',
      date: '2024-01-18',
      reason: 'Return approved'
    },
    {
      id: 'REF002',
      amount: '$49.99',
      status: 'processing',
      date: '2024-01-22',
      reason: 'Return in transit'
    },
    {
      id: 'REF003',
      amount: '$19.99',
      status: 'completed',
      date: '2024-01-12',
      reason: 'Return received'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Returns & Refunds</h1>
          <p className="text-gray-400">Manage your returns and track refunds</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Returns</p>
                <p className="text-2xl font-bold text-white">1</p>
              </div>
              <Package className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Refunded</p>
                <p className="text-2xl font-bold text-white">$199.97</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Processing Refunds</p>
                <p className="text-2xl font-bold text-white">$49.99</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[#333333]">
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'returns'
                ? 'text-purple-500 border-purple-500'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            Return Requests
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'refunds'
                ? 'text-purple-500 border-purple-500'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            Refund History
          </button>
        </div>

        {/* Content */}
        {activeTab === 'returns' && (
          <div className="space-y-4">
            {returns.map((returnItem) => (
              <div key={returnItem.id} className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:border-[#444444] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{returnItem.product}</h3>
                    <p className="text-gray-400 text-sm">Order: {returnItem.orderNumber}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(returnItem.status)}`}>
                    {getStatusIcon(returnItem.status)}
                    {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Reason</p>
                    <p className="text-gray-300">{returnItem.reason}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Request Date</p>
                    <p className="text-gray-300">{new Date(returnItem.requestDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="mt-3 text-purple-500 hover:text-purple-400 text-sm font-medium">
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'refunds' && (
          <div className="space-y-4">
            {refunds.map((refund) => (
              <div key={refund.id} className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:border-[#444444] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">Refund ID: {refund.id}</p>
                    <p className="text-2xl font-bold text-white">{refund.amount}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(refund.status)}`}>
                    {getStatusIcon(refund.status)}
                    {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Reason</p>
                    <p className="text-gray-300">{refund.reason}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="text-gray-300">{new Date(refund.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-purple-500 hover:text-purple-400 text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}