'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/hooks/useToast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  CheckCircle,
  Send,
  Loader2,
  User,
  MessageSquare,
  Calendar,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

interface DisputeDetail {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  buyerId: string | null;
  sellerId: string | null;
  orderId: string | null;
  assignedTo: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  resolvedAt: string | Date | null;
  replies?: Array<{
    id: string;
    message: string;
    senderRole: 'buyer' | 'seller' | 'admin';
    senderId: string;
    createdAt: string | Date;
    ticketId: string;
    attachmentUrl: string | null;
  }>;
}

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500/10 text-red-500',
  in_progress: 'bg-yellow-500/10 text-yellow-500',
  resolved: 'bg-green-500/10 text-green-500',
  closed: 'bg-gray-500/10 text-gray-400',
};

const DISPUTE_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-orange-500/10 text-orange-500',
  urgent: 'bg-red-500/10 text-red-500',
};

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [newStatus, setNewStatus] = useState<string>('open');
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch dispute details
  const ticketDetailsQuery = trpc.support.getTicket.useQuery(
    { ticketId: disputeId },
    { enabled: !!disputeId }
  );

  // Fetch dispute replies
  const repliesQuery = trpc.support.getTicketReplies.useQuery(
    { ticketId: disputeId },
    { enabled: !!disputeId }
  );

  // Mutations
  const replyMutation = trpc.support.replyToTicket.useMutation();
  const updateStatusMutation = trpc.supportAdmin.updateTicketStatus.useMutation();

  // Load dispute data
  useEffect(() => {
    if (ticketDetailsQuery.data && repliesQuery.data) {
      const ticketData = ticketDetailsQuery.data;
      setDispute({
        ...ticketData,
        replies: repliesQuery.data.map((r) => ({
          ...r,
          createdAt:
            typeof r.createdAt === 'string'
              ? new Date(r.createdAt)
              : r.createdAt,
        })),
        createdAt:
          typeof ticketData.createdAt === 'string'
            ? new Date(ticketData.createdAt)
            : ticketData.createdAt,
        updatedAt:
          typeof ticketData.updatedAt === 'string'
            ? new Date(ticketData.updatedAt)
            : ticketData.updatedAt,
        resolvedAt: ticketData.resolvedAt
          ? typeof ticketData.resolvedAt === 'string'
            ? new Date(ticketData.resolvedAt)
            : ticketData.resolvedAt
          : null,
      } as DisputeDetail);
      setNewStatus(ticketData.status || 'open');
      setLoading(false);
    }
  }, [ticketDetailsQuery.data, repliesQuery.data]);

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setSendingReply(true);
    try {
      await replyMutation.mutateAsync({
        ticketId: disputeId,
        message: replyMessage,
      });

      setReplyMessage('');
      toast.success('Reply sent successfully');
      // Refetch replies
      repliesQuery.refetch();
    } catch (error) {
      console.error('Reply error:', error);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;

    setUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({
        ticketId: disputeId,
        status: newStatus as 'open' | 'in_progress' | 'resolved' | 'closed',
      });

      if (dispute) {
        setDispute({
          ...dispute,
          status: newStatus as
            | 'open'
            | 'in_progress'
            | 'resolved'
            | 'closed',
        });
      }

      toast.success('Status updated successfully');
      ticketDetailsQuery.refetch();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#8451e1]" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin/disputes">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Disputes
            </Button>
          </Link>
        </div>
        <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-gray-400">Dispute not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/disputes">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Disputes
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Overview */}
          <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl text-white mb-2">
                    {dispute.subject}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={
                        DISPUTE_STATUS_COLORS[dispute.status] ||
                        'bg-gray-500/10 text-gray-400'
                      }
                    >
                      {DISPUTE_STATUS_LABELS[dispute.status] || dispute.status}
                    </Badge>
                    <Badge className={PRIORITY_COLORS[dispute.priority] || ''}>
                      {dispute.priority.charAt(0).toUpperCase() +
                        dispute.priority.slice(1)}{' '}
                      Priority
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dispute Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">
                  Description
                </h3>
                <p className="text-gray-400 whitespace-pre-wrap">
                  {dispute.description}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Case ID</p>
                  <p className="text-sm text-white font-mono">
                    {dispute.id.substring(0, 12)}...
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <p className="text-sm text-white">
                    {dispute.category
                      .replace('_', ' ')
                      .charAt(0)
                      .toUpperCase() + dispute.category.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Opened</p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(dispute.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {dispute.resolvedAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Resolved</p>
                    <p className="text-sm text-white flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {new Date(dispute.resolvedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conversation Thread */}
          <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversation
              </CardTitle>
              <CardDescription className="text-gray-400">
                {dispute.replies?.length || 0} message
                {(dispute.replies?.length || 0) !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {dispute.replies && dispute.replies.length > 0 ? (
                  dispute.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-lg ${
                        reply.senderRole === 'admin'
                          ? 'bg-[#8451e1]/10 border border-[#8451e1]/30'
                          : 'bg-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#8451e1]/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-[#8451e1]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white capitalize">
                              {reply.senderRole}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(reply.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {reply.senderRole === 'admin' && (
                          <Badge className="bg-[#8451e1]/20 text-[#8451e1] text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">
                        {reply.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No replies yet. Be the first to respond.</p>
                  </div>
                )}
              </div>

              {/* Reply Input */}
              <div className="space-y-3 pt-4 border-t border-[#1a1a1a]">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500 min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="border-[#2a2a2a] text-gray-400 hover:text-white"
                    onClick={() => setReplyMessage('')}
                    disabled={sendingReply}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#8451e1] text-white hover:bg-[#8451e1]/90"
                    onClick={handleReply}
                    disabled={sendingReply || !replyMessage.trim()}
                  >
                    {sendingReply ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white">Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Change Status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <SelectItem value="open" className="text-white">
                      Open
                    </SelectItem>
                    <SelectItem value="in_progress" className="text-white">
                      In Progress
                    </SelectItem>
                    <SelectItem value="resolved" className="text-white">
                      Resolved
                    </SelectItem>
                    <SelectItem value="closed" className="text-white">
                      Closed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-[#8451e1] text-white hover:bg-[#8451e1]/90"
                onClick={handleUpdateStatus}
                disabled={
                  updatingStatus ||
                  newStatus === dispute.status
                }
              >
                {updatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dispute.orderId && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <Link href={`/admin/orders/${dispute.orderId}`}>
                    <p className="text-sm text-[#8451e1] hover:underline font-mono">
                      {dispute.orderId.substring(0, 12)}...
                    </p>
                  </Link>
                </div>
              )}

              {dispute.buyerId && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Buyer ID</p>
                  <p className="text-sm text-gray-300 font-mono">
                    {dispute.buyerId.substring(0, 12)}...
                  </p>
                </div>
              )}

              {dispute.sellerId && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Seller ID</p>
                  <p className="text-sm text-gray-300 font-mono">
                    {dispute.sellerId.substring(0, 12)}...
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                <p className="text-sm text-gray-300">
                  {new Date(dispute.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}