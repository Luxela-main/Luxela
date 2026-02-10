'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/_trpc/client';
import { useToast } from '@/components/hooks/useToast';
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  X,
} from 'lucide-react';

interface TicketReply {
  id: string;
  message: string;
  senderRole: 'buyer' | 'seller' | 'admin';
  createdAt: Date;
  ticketId: string;
  senderId: string;
  attachmentUrl: string | null;
}

interface TicketDetails {
  id: string;
  buyerId: string | null;
  sellerId: string | null;
  orderId: string | null;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500' },
  resolved: { label: 'Resolved', color: 'bg-green-500' },
  closed: { label: 'Closed', color: 'bg-gray-500' },
};

const PRIORITY_CONFIG = {
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10' },
  urgent: { color: 'text-red-400', bg: 'bg-red-500/10' },
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'low':
      return 'text-xs font-bold px-2 py-1 rounded whitespace-nowrap bg-blue-500/10 text-blue-400';
    case 'medium':
      return 'text-xs font-bold px-2 py-1 rounded whitespace-nowrap bg-yellow-500/10 text-yellow-400';
    case 'high':
      return 'text-xs font-bold px-2 py-1 rounded whitespace-nowrap bg-orange-500/10 text-orange-400';
    case 'urgent':
      return 'text-xs font-bold px-2 py-1 rounded whitespace-nowrap bg-red-500/10 text-red-400';
    default:
      return 'text-xs font-bold px-2 py-1 rounded whitespace-nowrap bg-gray-500/10 text-gray-400';
  }
};

export default function AdminTicketDetailPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch ticket details
  const ticketDetailsQuery = trpc.supportAdmin.getTicketDetails.useQuery(
    { ticketId },
    { enabled: !!ticketId, refetchInterval: 15000 }
  );

  // Fetch replies
  const repliesQuery = trpc.support.getTicketReplies.useQuery(
    { ticketId },
    { enabled: !!ticketId, refetchInterval: 15000 }
  );

  // Update ticket status mutation
  const updateTicketMutation = trpc.supportAdmin.updateTicketStatus.useMutation();

  // Reply to ticket mutation
  const replyMutation = trpc.support.replyToTicket.useMutation();

  // Load ticket details
  useEffect(() => {
    if (ticketDetailsQuery.data) {
      const convertedTicket: TicketDetails = {
        ...ticketDetailsQuery.data,
        status: (ticketDetailsQuery.data.status || 'open') as 'open' | 'in_progress' | 'resolved' | 'closed',
        priority: (ticketDetailsQuery.data.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        createdAt: typeof ticketDetailsQuery.data.createdAt === 'string'
          ? new Date(ticketDetailsQuery.data.createdAt)
          : ticketDetailsQuery.data.createdAt,
        updatedAt: typeof ticketDetailsQuery.data.updatedAt === 'string'
          ? new Date(ticketDetailsQuery.data.updatedAt)
          : ticketDetailsQuery.data.updatedAt,
        resolvedAt: ticketDetailsQuery.data.resolvedAt
          ? (typeof ticketDetailsQuery.data.resolvedAt === 'string'
              ? new Date(ticketDetailsQuery.data.resolvedAt)
              : ticketDetailsQuery.data.resolvedAt)
          : null,
      };
      setTicket(convertedTicket);
    }
  }, [ticketDetailsQuery.data]);

  // Load replies
  useEffect(() => {
    if (repliesQuery.data) {
      const convertedReplies = repliesQuery.data.map(r => ({
        ...r,
        createdAt: typeof r.createdAt === 'string' ? new Date(r.createdAt) : r.createdAt,
      }));
      setReplies(convertedReplies);
    }
  }, [repliesQuery.data]);

  const handleReply = async () => {
    if (!ticket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      await replyMutation.mutateAsync({
        ticketId: ticket.id,
        message: replyMessage,
      });

      setReplyMessage('');
      toast.success('Reply sent successfully');

      // Refetch replies
      await repliesQuery.refetch();
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!ticket) return;

    try {
      const updated = await updateTicketMutation.mutateAsync({
        ticketId: ticket.id,
        status: newStatus as 'open' | 'in_progress' | 'resolved' | 'closed',
      });

      const convertedUpdated: TicketDetails = {
        ...updated,
        status: (updated.status || 'open') as 'open' | 'in_progress' | 'resolved' | 'closed',
        priority: (updated.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        createdAt: typeof updated.createdAt === 'string' ? new Date(updated.createdAt) : updated.createdAt,
        updatedAt: typeof updated.updatedAt === 'string' ? new Date(updated.updatedAt) : updated.updatedAt,
        resolvedAt: updated.resolvedAt ? (typeof updated.resolvedAt === 'string' ? new Date(updated.resolvedAt) : updated.resolvedAt) : null,
      };

      setTicket(convertedUpdated);
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  if (ticketDetailsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8451E1]" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white">
        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#8451E1] hover:text-[#7040d1] mb-6 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </button>
          <div className="flex flex-col items-center justify-center py-12">
            <X className="w-12 h-12 text-[#808080] mb-4" />
            <p className="text-[#808080]">Ticket not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0E0E0E] border-b-2 border-[#E5E7EB] p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#8451E1] hover:text-[#7040d1] mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </button>
          <h1 className="text-2xl sm:text-4xl font-bold text-white">{ticket.subject}</h1>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        {/* Ticket Details */}
        <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6 mb-6">
          <div className="mb-6">
            <p className="text-[#DCDCDC] mb-4">{ticket.description}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-[#2B2B2B]">
            <div>
              <p className="text-xs text-[#808080] mb-2">Category</p>
              <p className="text-sm font-medium text-white">{ticket.category.replace(/_/g, ' ').toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-[#808080] mb-2">Priority</p>
              <span className={getPriorityBadge(ticket.priority)}>
                {ticket.priority.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-[#808080] mb-2">Status</p>
              <select
                value={ticket.status}
                onChange={e => handleUpdateStatus(e.target.value)}
                className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-sm text-white focus:outline-none focus:border-[#8451E1] cursor-pointer"
              >
                {STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-[#808080] mb-2">Created</p>
              <p className="text-sm font-medium text-white">{new Date(ticket.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-[#808080]">
            <p>Last updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
            {ticket.resolvedAt && <p>Resolved at: {new Date(ticket.resolvedAt).toLocaleString()}</p>}
          </div>
        </div>

        {/* Conversation */}
        <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#2B2B2B] bg-[#0E0E0E]">
            <h2 className="font-semibold text-white">Conversation</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
            {replies.length > 0 ? (
              replies.map((reply, idx) => (
                <div key={idx} className={`flex ${reply.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-md px-4 py-3 rounded-lg ${
                      reply.senderRole === 'admin'
                        ? 'bg-[#8451E1] text-white'
                        : 'bg-[#0E0E0E] text-[#DCDCDC] border border-[#2B2B2B]'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {reply.senderRole === 'admin' ? 'Admin' : reply.senderRole === 'seller' ? 'Brand Contact' : 'Customer'}
                    </p>
                    <p className="text-sm">{reply.message}</p>
                    <p className="text-xs opacity-50 mt-2">{new Date(reply.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-[#808080] py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No replies yet</p>
              </div>
            )}
          </div>

          {/* Reply Input */}
          <div className="p-6 border-t border-[#2B2B2B] bg-[#0E0E0E]">
            <div className="flex flex-col gap-3">
              <textarea
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Type your response..."
                className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white placeholder-[#808080] focus:outline-none focus:border-[#8451E1] resize-none"
                rows={3}
              />
              <button
                onClick={handleReply}
                disabled={sendingReply || !replyMessage.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8451E1] hover:bg-[#7040d1] disabled:opacity-50 disabled:cursor-not-allowed rounded text-white font-medium transition-colors cursor-pointer"
              >
                {sendingReply ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}