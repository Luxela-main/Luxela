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
  X as XIcon,
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

interface Reply {
  id: string;
  ticketId: string;
  message: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const STATUS_CONFIG = {
  open: { color: "bg-blue-500", icon: AlertCircle },
  in_progress: { color: "bg-yellow-500", icon: Clock },
  resolved: { color: "bg-green-500", icon: CheckCircle },
  closed: { color: "bg-gray-500", icon: CheckCircle },
};

const PRIORITY_COLORS = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  urgent: "text-red-400",
};

export default function TicketDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState("");

  // Fetch ticket details
  const ticketQuery = trpc.support.getTicket.useQuery(
    { ticketId },
    {
      enabled: !!user?.id && !!ticketId,
    }
  );

  // Fetch ticket replies
  const repliesQuery = trpc.support.getTicketReplies.useQuery(
    { ticketId },
    {
      enabled: !!user?.id && !!ticketId,
      refetchInterval: 15000, // Refetch every 15 seconds
    }
  );

  useEffect(() => {
    if (ticketQuery.data) {
      const convertedTicket = {
        ...ticketQuery.data,
        priority: ticketQuery.data.priority as
          | "low"
          | "medium"
          | "high"
          | "urgent",
        status: ticketQuery.data.status as
          | "open"
          | "in_progress"
          | "resolved"
          | "closed",
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

  useEffect(() => {
    if (repliesQuery.data) {
      const convertedReplies = (repliesQuery.data as any[]).map((reply) => ({
        ...reply,
        createdAt: new Date(reply.createdAt),
        updatedAt: new Date(reply.updatedAt),
      })) as Reply[];
      setReplies(convertedReplies);
    }
  }, [repliesQuery.data]);

  useEffect(() => {
    if (ticketQuery.error || repliesQuery.error) {
      toast.error("Failed to load ticket details");
    }
  }, [ticketQuery.error, repliesQuery.error, toast]);

  // Handle reply submission
  const replyMutation = trpc.support.replyToTicket.useMutation();

  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      await replyMutation.mutateAsync({
        ticketId,
        message: replyMessage,
      });

      setReplyMessage("");
      toast.success("Reply sent successfully");
      // Refetch replies
      repliesQuery.refetch();
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  // Handle close ticket
  const closeTicketMutation = trpc.support.closeTicket.useMutation();

  const handleCloseTicket = async () => {
    try {
      await closeTicketMutation.mutateAsync({ ticketId });
      toast.success("Ticket closed successfully");
      setCloseDialogOpen(false);
      // Refetch ticket
      ticketQuery.refetch();
    } catch (error) {
      toast.error("Failed to close ticket");
    }
  };

  // Handle delete reply
  const deleteReplyMutation = trpc.support.deleteReply.useMutation();

  const handleDeleteReply = async (replyId: string) => {
    try {
      await deleteReplyMutation.mutateAsync({ replyId });
      toast.success("Reply deleted successfully");
      // Refetch replies
      repliesQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete reply");
    }
  };

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

  const StatusIcon = STATUS_CONFIG[ticket.status].icon;
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-xs px-2 py-1 rounded whitespace-nowrap text-blue-400 bg-blue-500/10';
      case 'in_progress':
        return 'text-xs px-2 py-1 rounded whitespace-nowrap text-yellow-400 bg-yellow-500/10';
      case 'resolved':
        return 'text-xs px-2 py-1 rounded whitespace-nowrap text-green-400 bg-green-500/10';
      case 'closed':
        return 'text-xs px-2 py-1 rounded whitespace-nowrap text-gray-400 bg-gray-500/10';
      default:
        return 'text-xs px-2 py-1 rounded whitespace-nowrap text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-[#808080] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {ticket.subject}
            </h1>
            <p className="text-[#808080]">Ticket ID: {ticket.id}</p>
          </div>
        </div>

        {/* Ticket Info Card */}
        <div className="bg-[#141414] border border-[#2B2B2B] rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-[#808080] text-sm mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className={getStatusClasses(ticket.status)}>
                  {ticket.status.toUpperCase().replace("_", " ")}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[#808080] text-sm mb-1">Priority</p>
              <p
                className={`text-sm font-medium ${PRIORITY_COLORS[ticket.priority]}`}
              >
                {ticket.priority.toUpperCase()}
              </p>
            </div>

            <div>
              <p className="text-[#808080] text-sm mb-1">Category</p>
              <p className="text-white text-sm">
                {ticket.category.replace(/_/g, " ")}
              </p>
            </div>

            <div>
              <p className="text-[#808080] text-sm mb-1">Created</p>
              <p className="text-white text-sm">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="border-t border-[#2B2B2B] pt-6">
            <h3 className="text-white font-semibold mb-3">Description</h3>
            <p className="text-[#DCDCDC] whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {ticket.status !== "closed" && (
            <div className="border-t border-[#2B2B2B] mt-6 pt-6 flex gap-3 justify-end">
              <Button
                onClick={() => setCloseDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <XIcon className="w-4 h-4 mr-2" />
                Close Ticket
              </Button>
            </div>
          )}
        </div>

        {/* Replies Section */}
        <div className="bg-[#141414] border border-[#2B2B2B] rounded-lg p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">
            Replies ({replies.length})
          </h3>

          {/* Replies List */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {replies.length === 0 ? (
              <p className="text-[#808080] text-sm">
                No replies yet. Be the first to reply!
              </p>
            ) : (
              replies.map((reply) => (
                <div
                  key={reply.id}
                  className="bg-[#0E0E0E] rounded p-4 border border-[#2B2B2B]"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="text-[#DCDCDC] font-medium">
                        {reply.createdBy}
                      </p>
                      <p className="text-[#808080] text-xs">
                        {new Date(reply.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {reply.createdBy === user?.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReply(reply.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-white whitespace-pre-wrap">
                    {reply.message}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Reply Input */}
          {ticket.status !== "closed" && (
            <div className="border-t border-[#2B2B2B] pt-6">
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="bg-[#0E0E0E] border-[#2B2B2B] text-white min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleReplySubmit}
                    disabled={!replyMessage.trim() || replyMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {replyMutation.isPending ? "Sending..." : "Send Reply"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Ticket Confirmation Dialog */}
        <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
          <AlertDialogContent className="bg-[#141414] border-[#2B2B2B]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Close Support Ticket
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[#808080]">
                Are you sure you want to close this ticket? Closed tickets
                cannot be reopened.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="border-[#2B2B2B] text-white hover:bg-[#1a1a1a]">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCloseTicket}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Close Ticket
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}