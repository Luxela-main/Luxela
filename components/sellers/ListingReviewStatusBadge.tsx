import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface ListingReviewStatusBadgeProps {
  status: "draft" | "pending_review" | "approved" | "rejected" | "archived";
  reviewStatus?: "pending" | "approved" | "rejected" | "revision_requested" | null;
  className?: string;
}

export const ListingReviewStatusBadge: React.FC<
  ListingReviewStatusBadgeProps
> = ({ status, reviewStatus, className = "" }) => {
  if (status === "approved" && reviewStatus === "approved") {
    return (
      <Badge className={`bg-green-100 text-green-800 border-green-300 ${className}`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        Live
      </Badge>
    );
  }

  if (status === "pending_review" || reviewStatus === "pending") {
    return (
      <Badge className={`bg-yellow-100 text-yellow-800 border-yellow-300 ${className}`}>
        <Clock className="w-3 h-3 mr-1" />
        Under Review
      </Badge>
    );
  }

  if (reviewStatus === "revision_requested") {
    return (
      <Badge className={`bg-orange-100 text-orange-800 border-orange-300 ${className}`}>
        <AlertCircle className="w-3 h-3 mr-1" />
        Needs Revision
      </Badge>
    );
  }

  if (status === "rejected" || reviewStatus === "rejected") {
    return (
      <Badge className={`bg-red-100 text-red-800 border-red-300 ${className}`}>
        <XCircle className="w-3 h-3 mr-1" />
        Rejected
      </Badge>
    );
  }

  if (status === "draft") {
    return (
      <Badge className={`bg-gray-100 text-gray-800 border-gray-300 ${className}`}>
        <RefreshCw className="w-3 h-3 mr-1" />
        Draft
      </Badge>
    );
  }

  return null;
};