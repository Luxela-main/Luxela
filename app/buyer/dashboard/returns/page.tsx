'use client';

import { useState, useEffect } from 'react';
import { Package, CheckCircle, Clock, AlertCircle, DollarSign, Download, X, Send } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb } from '@/components/buyer/dashboard/breadcrumb';

interface ReturnRequest {
  id: string;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  date: string;
}

interface Refund {
  id: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed';
  date: string;
  receiptUrl?: string;
}

export default function ReturnsPage() {
  const [tab, setTab] = useState<'returns' | 'refunds'>('returns');
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [formData, setFormData] = useState<{
    reason: 'damaged' | 'defective' | 'not_as_described' | 'wrong_item' | 'changed_mind' | 'no_longer_needed' | '';
    description: string;
    orderId: string;
  }>({
    reason: '',
    description: '',
    orderId: '',
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: refundsData } = trpc.refund.getMyReturns.useQuery({ limit: 50, offset: 0 }, {
    retry: 1,
  });

  const createReturnMutation = trpc.refund.requestReturn.useMutation();
  const utils = trpc.useUtils();

  const { toast } = useToast();

  useEffect(() => {
    if (refundsData) {
      const refundItems = refundsData.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        amount: r.amountCents / 100,
        status: (r.refundStatus === 'return_requested'
          ? 'pending'
          : r.refundStatus === 'return_approved'
            ? 'approved'
            : r.refundStatus === 'refunded'
              ? 'completed'
              : 'pending') as 'pending' | 'processing' | 'completed',
        date: r.requestedAt?.toString() || new Date().toISOString(),
        receiptUrl: undefined,
      }));
      setRefunds(refundItems);
      setIsLoading(false);
    }
  }, [refundsData]);

  const handleInitiateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason || !formData.description || !formData.orderId) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Call real API to create return request
      await createReturnMutation.mutateAsync({
        orderId: formData.orderId,
        reason: formData.reason as 'damaged' | 'defective' | 'not_as_described' | 'wrong_item' | 'changed_mind' | 'no_longer_needed',
        description: formData.description,
      });

      // Reset and refresh
      setFormData({ reason: '', description: '', orderId: '' });
      setShowInitiateModal(false);
      await utils.refund.getMyReturns.invalidate();

      toast({
        title: 'Return initiated',
        description: 'Your return request has been submitted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to initiate return',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadReceipt = (refundId: string) => {
    try {
      toast({
        title: 'Downloading',
        description: 'Receipt download started',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive',
      });
    }
  };

  const activeReturns = returns.filter(r => ['pending', 'approved'].includes(r.status)).length;
  const totalRefunded = refunds.reduce((sum, r) => sum + (r.status === 'completed' ? r.amount : 0), 0);
  const processingRefunds = refunds.filter(r => ['pending', 'processing'].includes(r.status));
  const totalProcessing = processingRefunds.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/buyer/dashboard' },
          { label: 'Returns & Refunds' },
        ]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Returns & Refunds</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <p className="text-gray-400 text-sm">Active Returns</p>
              <p className="text-2xl font-bold text-white mt-2">{activeReturns}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Refunded</p>
              <p className="text-2xl font-bold text-[#8451e1] mt-2">${totalRefunded.toFixed(2)}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <p className="text-gray-400 text-sm">Processing Refunds</p>
              <p className="text-2xl font-bold text-yellow-400 mt-2">${totalProcessing.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('returns')}
            className={`px-4 py-2 rounded cursor-pointer transition font-medium ${
              tab === 'returns'
                ? 'bg-[#8451e1] text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
            }`}
          >
            Returns
          </button>
          <button
            onClick={() => setTab('refunds')}
            className={`px-4 py-2 rounded cursor-pointer transition font-medium ${
              tab === 'refunds'
                ? 'bg-[#8451e1] text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
            }`}
          >
            Refunds
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin">
              <Package className="text-[#8451e1]" size={32} />
            </div>
          </div>
        ) : tab === 'returns' ? (
          <>
            <div className="mb-6">
              <button
                onClick={() => setShowInitiateModal(true)}
                className="bg-[#8451e1] hover:bg-[#7043d8] text-white px-6 py-3 rounded cursor-pointer transition font-medium"
              >
                Initiate Return
              </button>
            </div>

            {returns.length === 0 ? (
              <div className="bg-[#1a1a1a] rounded-lg p-12 text-center">
                <Package className="mx-auto mb-4 text-gray-600" size={48} />
                <p className="text-gray-400 text-lg">No returns yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {returns.map(ret => (
                  <div key={ret.id} className="bg-[#1a1a1a] rounded-lg p-6 hover:bg-[#252525] transition">
                    <div className="flex items-start justify-between mb-4 cursor-pointer" onClick={() => setExpandedId(expandedId === ret.id ? null : ret.id)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {ret.status === 'completed' && <CheckCircle className="text-green-500" size={20} />}
                          {ret.status === 'approved' && <Clock className="text-blue-500" size={20} />}
                          {ret.status === 'pending' && <AlertCircle className="text-yellow-500" size={20} />}
                          {ret.status === 'rejected' && <X className="text-red-500" size={20} />}
                          <h3 className="text-white font-semibold">{ret.reason}</h3>
                          <span className="text-gray-400 text-sm ml-auto">{new Date(ret.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {expandedId === ret.id && (
                      <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                        <p className="text-gray-300 text-sm mb-4">{ret.description}</p>
                        <span className={`inline-block px-3 py-1 rounded text-sm font-medium mb-4 ${
                          ret.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          ret.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                          ret.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                        </span>
                        <div className="flex gap-2 mt-4">
                          <button className="text-[#8451e1] hover:text-[#7043d8] text-sm cursor-pointer transition flex items-center gap-1">
                            <Download size={14} /> Print Label
                          </button>
                          <button className="text-gray-400 hover:text-white text-sm cursor-pointer transition">
                            Contact Support
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {refunds.length === 0 ? (
              <div className="bg-[#1a1a1a] rounded-lg p-12 text-center">
                <DollarSign className="mx-auto mb-4 text-gray-600" size={48} />
                <p className="text-gray-400 text-lg">No refunds yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {refunds.map(refund => (
                  <div key={refund.id} className="bg-[#1a1a1a] rounded-lg p-6 hover:bg-[#252525] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {refund.status === 'completed' && <CheckCircle className="text-green-500" size={20} />}
                        {refund.status === 'processing' && <Clock className="text-blue-500" size={20} />}
                        {refund.status === 'pending' && <AlertCircle className="text-yellow-500" size={20} />}
                        <div>
                          <h3 className="text-white font-semibold">Refund #{refund.id.slice(0, 8)}</h3>
                          <p className="text-gray-400 text-sm">{new Date(refund.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#8451e1] font-bold text-lg">${refund.amount.toFixed(2)}</p>
                        <span className={`text-xs font-medium ${
                          refund.status === 'completed' ? 'text-green-400' :
                          refund.status === 'processing' ? 'text-blue-400' :
                          'text-yellow-400'
                        }`}>
                          {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <button
                        onClick={() => handleDownloadReceipt(refund.id)}
                        className="text-[#8451e1] hover:text-[#7043d8] text-sm cursor-pointer transition flex items-center gap-2"
                      >
                        <Download size={14} /> Download Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {showInitiateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Initiate Return</h2>
                <button
                  onClick={() => setShowInitiateModal(false)}
                  className="text-gray-400 hover:text-white cursor-pointer transition"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleInitiateReturn} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Return Reason</label>
                  <select
                    value={formData.reason}
                    onChange={(e) => {
                      const value = e.target.value as typeof formData.reason;
                      setFormData({ ...formData, reason: value });
                    }}
                    className="w-full bg-[#0e0e0e] border border-[#2a2a2a] rounded px-3 py-2 text-white cursor-pointer hover:border-[#8451e1] transition"
                  >
                    <option value="">Select a reason</option>
                    <option value="defective">Defective Product</option>
                    <option value="wrong_item">Wrong Item</option>
                    <option value="not_as_described">Not As Described</option>
                    <option value="damaged">Damaged in Transit</option>
                    <option value="changed_mind">Changed Mind</option>
                    <option value="no_longer_needed">No Longer Needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the issue in detail..."
                    className="w-full bg-[#0e0e0e] border border-[#2a2a2a] rounded px-3 py-2 text-white placeholder-gray-500 hover:border-[#8451e1] focus:border-[#8451e1] transition resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-[#8451e1] hover:bg-[#7043d8] text-white py-2 rounded cursor-pointer transition font-medium flex items-center justify-center gap-2"
                  >
                    <Send size={16} /> Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInitiateModal(false)}
                    className="flex-1 bg-[#252525] hover:bg-[#353535] text-white py-2 rounded cursor-pointer transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}