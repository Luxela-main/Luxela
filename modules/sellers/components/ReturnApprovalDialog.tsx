'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader, FileText, Eye } from 'lucide-react';
import { useApproveReturn, useRejectReturn } from '../queries/useReturns';
import { toastSvc } from '@/services/toast';

interface ReturnApprovalDialogProps {
  isOpen: boolean;
  returnId: string;
  orderId: string;
  customerName: string;
  productName: string;
  reason: string;
  reasonDescription: string;
  quantity: number;
  imageUrls?: string[];
  requestedAmount: number;
  currency: string;
  onClose: () => void;
}

type DialogMode = 'approve' | 'reject' | 'confirm_approve' | 'confirm_reject';

export default function ReturnApprovalDialog({
  isOpen,
  returnId,
  orderId,
  customerName,
  productName,
  reason,
  reasonDescription,
  quantity,
  imageUrls = [],
  requestedAmount,
  currency,
  onClose,
}: ReturnApprovalDialogProps) {
  const [mode, setMode] = useState<DialogMode>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [returnLabel, setReturnLabel] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const approveMutation = useApproveReturn();
  const rejectMutation = useRejectReturn();

  const handleApproveClick = () => {
    setMode('confirm_approve');
  };

  const handleRejectClick = () => {
    setMode('confirm_reject');
  };

  const handleConfirmApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        returnId,
        returnShippingLabel: returnLabel || undefined,
      });
      toastSvc.success(`Return request approved. Buyer notified.`);
      onClose();
    } catch (error: any) {
      toastSvc.error(error.message || 'Failed to approve return');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toastSvc.error('Please provide a reason for rejection');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        returnId,
        reason: rejectionReason,
      });
      toastSvc.success(`Return request rejected. Buyer notified.`);
      onClose();
    } catch (error: any) {
      toastSvc.error(error.message || 'Failed to reject return');
    }
  };

  const handleClose = () => {
    setMode('approve');
    setRejectionReason('');
    setReturnLabel('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-2xl max-h-[90vh] overflow-y-auto">
        {mode === 'approve' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Return Request Details</DialogTitle>
              <DialogDescription className="text-gray-400">
                Order: {orderId.slice(0, 12)}...
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2 font-medium">Customer</p>
                  <p className="text-sm font-semibold text-gray-200">{customerName}</p>
                </div>
                <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2 font-medium">Product</p>
                  <p className="text-sm font-semibold text-gray-200">{productName}</p>
                </div>
              </div>

              <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-2 font-medium">Reason</p>
                <p className="text-sm font-semibold text-gray-200 capitalize mb-2">{reason.replace('_', ' ')}</p>
                <p className="text-sm text-gray-400">{reasonDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2 font-medium">Quantity</p>
                  <p className="text-lg font-bold text-gray-200">{quantity}</p>
                </div>
                <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2 font-medium">Refund Amount</p>
                  <p className="text-lg font-bold text-green-400">
                    {currency} {requestedAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {imageUrls.length > 0 && (
                <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <p className="text-xs text-gray-500 uppercase font-medium">Proof Images</p>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-black rounded flex items-center justify-center h-48">
                      <img
                        src={imageUrls[selectedImageIndex]}
                        alt={`Proof ${selectedImageIndex + 1}`}
                        className="max-h-48 max-w-full"
                      />
                    </div>
                    {imageUrls.length > 1 && (
                      <div className="flex gap-2">
                        {imageUrls.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`h-12 w-12 border rounded ${
                              selectedImageIndex === idx
                                ? 'border-blue-500 bg-blue-900/20'
                                : 'border-[#333] bg-[#1a1a1a]'
                            }`}
                          >
                            <img
                              src={imageUrls[idx]}
                              alt={`Proof ${idx + 1}`}
                              className="h-full w-full object-cover rounded"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                  onClick={handleApproveClick}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Return
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-400 hover:bg-red-900/20 cursor-pointer"
                  onClick={handleRejectClick}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Reject Return
                </Button>
              </div>
            </div>
          </>
        )}

        {mode === 'confirm_approve' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Approve Return</DialogTitle>
              <DialogDescription className="text-gray-400">
                Confirm approval and provide return shipping details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-200 block mb-2">Return Shipping Label (Optional)</label>
                <textarea
                  value={returnLabel}
                  onChange={(e) => setReturnLabel(e.target.value)}
                  placeholder="Paste return shipping label URL or details here..."
                  className="w-full bg-[#242424] border border-[#333] rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600 min-h-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide a return label or shipping details for the buyer
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">After approval:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Buyer will receive return shipping information</li>
                    <li>Refund will be processed upon item receipt</li>
                    <li>You'll receive a notification when returned item arrives</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setMode('approve')} className="cursor-pointer">
                Back
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer disabled:cursor-not-allowed"
                onClick={handleConfirmApprove}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Approval
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === 'confirm_reject' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Reject Return</DialogTitle>
              <DialogDescription className="text-gray-400">
                Provide a reason for rejecting this return request
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-200 block mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why you're rejecting this return request..."
                  className="w-full bg-[#242424] border border-[#333] rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600 min-h-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rejectionReason.length}/500 characters
                </p>
              </div>

              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-200">
                  <p className="font-semibold mb-1">After rejection:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Buyer will be notified of the rejection</li>
                    <li>Your reason will be shared with the buyer</li>
                    <li>Return window may allow buyer to resubmit</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setMode('approve')} className="cursor-pointer">
                Back
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:cursor-not-allowed"
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Reject Return
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}