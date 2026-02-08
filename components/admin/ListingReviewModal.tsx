"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ListingReviewModalProps {
  action: "approve" | "reject" | "revise";
  isOpen: boolean;
  isProcessing: boolean;
  comments: string;
  rejectionReason: string;
  onCommentsChange: (value: string) => void;
  onRejectionReasonChange: (value: string) => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onRevise: () => Promise<void>;
  onClose: () => void;
}

export default function ListingReviewModal({
  action,
  isOpen,
  isProcessing,
  comments,
  rejectionReason,
  onCommentsChange,
  onRejectionReasonChange,
  onApprove,
  onReject,
  onRevise,
  onClose,
}: ListingReviewModalProps) {
  const getIcon = () => {
    switch (action) {
      case "approve":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "reject":
        return <XCircle className="w-6 h-6 text-red-600" />;
      case "revise":
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
    }
  };

  const getTitle = () => {
    switch (action) {
      case "approve":
        return "Approve Listing";
      case "reject":
        return "Reject Listing";
      case "revise":
        return "Request Revision";
    }
  };

  const getDescription = () => {
    switch (action) {
      case "approve":
        return "This listing will be approved and made available for buyers to purchase.";
      case "reject":
        return "This listing will be rejected and the seller will be notified of the rejection reason.";
      case "revise":
        return "The seller will be asked to make revisions to the listing before it can be approved.";
    }
  };

  const getButtonText = () => {
    switch (action) {
      case "approve":
        return "Approve Listing";
      case "reject":
        return "Confirm Rejection";
      case "revise":
        return "Send Revision Request";
    }
  };

  const getAlertText = () => {
    switch (action) {
      case "approve":
        return {
          title: "Approval Required",
          description:
            "Once approved, this listing will be visible to all buyers. Make sure it meets all quality standards.",
        };
      case "reject":
        return {
          title: "Permanent Action",
          description:
            "Rejecting a listing cannot be easily undone. The seller will need to resubmit if they wish to proceed.",
        };
      case "revise":
        return {
          title: "Feedback Provided",
          description:
            "The seller will receive your feedback and have a chance to improve the listing before resubmission.",
        };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-[#1f2937] border-[#2B2B2B]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Alert */}
          <Alert variant={action === "reject" ? "destructive" : "default"}>
            <AlertDescription>{getAlertText().description}</AlertDescription>
          </Alert>

          {/* Approval Comments */}
          {action === "approve" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Approval Comments (Optional)
              </label>
              <Textarea
                placeholder="Add any comments or notes about the approval..."
                value={comments}
                onChange={(e) => onCommentsChange(e.target.value)}
                className="resize-none"
                rows={4}
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">
                These comments will be visible to the seller.
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {action === "reject" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Rejection Reason *
              </label>
              <Textarea
                placeholder="Provide a detailed reason for rejecting this listing. Be constructive and specific..."
                value={rejectionReason}
                onChange={(e) => onRejectionReasonChange(e.target.value)}
                className="resize-none border-red-200"
                rows={4}
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Required. The seller will see this reason.
              </p>
            </div>
          )}

          {/* Revision Feedback */}
          {action === "revise" && (
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Revision Feedback *
              </label>
              <Textarea
                placeholder="Describe what changes you'd like the seller to make..."
                value={comments}
                onChange={(e) => onCommentsChange(e.target.value)}
                className="resize-none border-orange-200"
                rows={4}
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Required. Be specific about what needs to be improved.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              switch (action) {
                case "approve":
                  await onApprove();
                  break;
                case "reject":
                  await onReject();
                  break;
                case "revise":
                  await onRevise();
                  break;
              }
            }}
            disabled={
              isProcessing ||
              (action === "reject" && !rejectionReason.trim()) ||
              (action === "revise" && !comments.trim())
            }
            className={
              action === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : action === "reject"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-orange-600 hover:bg-orange-700"
            }
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}