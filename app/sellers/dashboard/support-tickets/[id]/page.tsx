"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Send,
  Trash2,
  Edit2,
} from "lucide-react";
import { trpc } from "@/lib/_trpc/client";

interface Ticket {
  id: string;
  buyerId: string;
  sellerId: string | null;
  subject: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

export default function SellerTicketDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const ticketQuery = trpc.support.getTicket.useQuery(
    { ticketId },
    {
      enabled: !!user?.id && !!ticketId,
    }
  );

  const replyMutation = trpc.support.replyToTicket.useMutation();
  const closeMutation = trpc.support.closeTicket.useMutation();
  const deleteMutation = trpc.support.deleteTicket.useMutation();

  useEffect(() => {
    if (ticketQuery.data) {
      const convertedTicket = {
        ...ticketQuery.data,
        createdAt: new Date(ticketQuery.data.createdAt),
        updatedAt: new Date(ticketQuery.data.updatedAt),
        resolvedAt: ticketQuery.data.resolvedAt
          ? new Date(ticketQuery.data.resolvedAt)
          : null,
      } as Ticket;
      setTicket(convertedTicket);
      setLoading(false);
    }
  }, [ticketQuery.data]);

  if (loading || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0E0E0E]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-[#DCDCDC] mt-4">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      setIsReplying(true);
      await replyMutation.mutateAsync({
        ticketId,
        message: replyText,
      });
      setReplyText("");
      toast.success("Reply sent successfully");
      ticketQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync({ ticketId });
      toast.success("Ticket closed successfully");
      ticketQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to close ticket");
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteMutation.mutateAsync({ ticketId });
      toast.success("Ticket deleted successfully");
      router.push("/sellers/dashboard/support-tickets");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete ticket");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const canEdit = ticket.status === "open" || ticket.status === "in_progress";
  const canClose = ticket.status !== "closed";
  const canDelete = ticket.status === "open" || ticket.status === "in_progress";

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-400 bg-red-900/20";
      case "high":
        return "text-orange-400 bg-orange-900/20";
      case "medium":
        return "text-yellow-400 bg-yellow-900/20";
      default:
        return "text-blue-400 bg-blue-900/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-blue-400 bg-blue-900/20";
      case "in_progress":
        return "text-yellow-400 bg-yellow-900/20";
      case "resolved":
        return "text-green-400 bg-green-900/20";
      case "closed":
        return "text-gray-400 bg-gray-900/20";
      default:
        return "text-white";
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-[#E5E7EB]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-[#808080] hover:text-[#6B7280] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Support Ticket</h1>
        </div>

        {/* Ticket Details */}
        <div className="bg-[#141414] border border-[#2B2B2B] rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{ticket.subject}</h2>
              <div className="flex gap-3 flex-wrap">
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(
                    ticket.status
                  )}`}
                >
                  {ticket.status}
                </span>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${getPriorityColor(
                    ticket.priority
                  )}`}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Button
                  onClick={() =>
                    router.push(
                      `/sellers/dashboard/support-tickets/${ticketId}/edit`
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              )}
              {canClose && (
                <Button
                  onClick={handleClose}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Close
                </Button>
              )}
              {canDelete && (
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#2B2B2B]">
            <div>
              <p className="text-xs text-[#808080] mb-1">Category</p>
              <p className="text-white capitalize">
                {ticket.category.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#808080] mb-1">Created</p>
              <p className="text-white text-sm">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#808080] mb-1">Last Updated</p>
              <p className="text-white text-sm">
                {new Date(ticket.updatedAt).toLocaleDateString()}
              </p>
            </div>
            {ticket.resolvedAt && (
              <div>
                <p className="text-xs text-[#808080] mb-1">Resolved</p>
                <p className="text-white text-sm">
                  {new Date(ticket.resolvedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mt-6 pt-6 border-t border-[#2B2B2B]">
            <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
            <p className="text-[#DCDCDC] whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>

        {/* Reply Section */}
        {ticket.status !== "closed" && (
          <div className="bg-[#141414] border border-[#2B2B2B] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Reply</h3>
            <div className="space-y-4">
              <Textarea
                placeholder="Type your reply here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="bg-[#0E0E0E] border-[#2B2B2B] text-white min-h-[100px]"
              />
              <Button
                onClick={handleReply}
                disabled={isReplying || !replyText.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                <Send className="w-4 h-4" />
                {isReplying ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </div>
        )}

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-[#141414] border-[#2B2B2B]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Ticket</AlertDialogTitle>
              <AlertDialogDescription className="text-[#808080]">
                Are you sure you want to delete this ticket? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="border-[#2B2B2B] text-white hover:bg-[#0E0E0E]">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}