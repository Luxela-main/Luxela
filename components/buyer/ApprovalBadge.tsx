'use client';

import { Check, AlertCircle, Clock } from 'lucide-react';

interface ApprovalBadgeProps {
  isApproved: boolean;
  isLoading?: boolean;
  className?: string;
  showText?: boolean;
}

/**
 * ApprovalBadge - Displays the approval status of a product
 * Only admin-approved products should be visible to buyers
 */
export function ApprovalBadge({
  isApproved,
  isLoading = false,
  className = '',
  showText = true,
}: ApprovalBadgeProps) {
  if (isLoading) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Clock className="w-4 h-4 text-[#8451E1] animate-spin" />
        {showText && <span className="text-xs text-[#8451E1] font-medium">Pending</span>}
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-500" />
        {showText && <span className="text-xs text-red-400 font-medium">Not Available</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Check className="w-4 h-4 text-green-500" />
      {showText && <span className="text-xs text-green-400 font-medium">Verified</span>}
    </div>
  );
}

/**
 * ApprovalStatusIndicator - Detailed approval status display
 */
export function ApprovalStatusIndicator({
  isApproved,
  quantity = 0,
  className = '',
}: {
  isApproved: boolean;
  quantity?: number;
  className?: string;
}) {
  if (!isApproved) {
    return (
      <div
        className={`px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 flex items-center gap-2 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        <span className="text-xs font-medium text-red-400">Not Currently Available</span>
      </div>
    );
  }

  if (quantity <= 0) {
    return (
      <div
        className={`px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
        <span className="text-xs font-medium text-yellow-400">Out of Stock</span>
      </div>
    );
  }

  return (
    <div
      className={`px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center gap-2 ${className}`}
    >
      <Check className="w-3.5 h-3.5 text-green-500" />
      <span className="text-xs font-medium text-green-400">Verified Available</span>
    </div>
  );
}