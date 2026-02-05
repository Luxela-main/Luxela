'use client';

import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/hooks/useToast';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  Search,
  X,
  Loader2,
  Flag,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';

interface TicketWithReplies {
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
  replies?: Array<{
    id: string;
    message: string;
    senderRole: 'buyer' | 'seller' | 'admin';
    createdAt: Date;
    ticketId: string;
    senderId: string;
    attachmentUrl: string | null;
  }>;
}

const CATEGORIES = [
  'general_inquiry',
  'technical_issue',
  'payment_problem',
  'order_issue',
  'refund_request',
  'account_issue',
  'listing_help',
  'other',
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const STATUS_CONFIG = {
  open: { color: 'bg-blue-500', label: 'Open', icon: AlertCircle },
  in_progress: { color: 'bg-yellow-500', label: 'In Progress', icon: Clock },
  resolved: { color: 'bg-green-500', label: 'Resolved', icon: CheckCircle },
  closed: { color: 'bg-gray-500', label: 'Closed', icon: CheckCircle },
};

const PRIORITY_CONFIG = {
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10' },
  urgent: { color: 'text-red-400', bg: 'bg-red-500/10' },
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'low':
      return 'text-blue-400';
    case 'medium':
      return 'text-yellow-400';
    case 'high':
      return 'text-orange-400';
    case 'urgent':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
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

export default function AdminTicketsPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<TicketWithReplies[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithReplies | null>(null);
  const [filteredTickets, setFilteredTickets] = useState<TicketWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch all tickets
  const ticketsQuery = trpc.supportAdmin.getAllTickets.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Fetch ticket details with replies
  const ticketDetailsQuery = trpc.support.getTicket.useQuery(
    { ticketId: selectedTicket?.id || '' },
    { enabled: !!selectedTicket?.id, refetchInterval: 15000 }
  );

  // Fetch replies
  const repliesQuery = trpc.support.getTicketReplies.useQuery(
    { ticketId: selectedTicket?.id || '' },
    { enabled: !!selectedTicket?.id, refetchInterval: 15000 }
  );

  // Update ticket status mutation
  const updateTicketMutation = trpc.supportAdmin.updateTicketStatus.useMutation();

  // Reply to ticket mutation
  const replyMutation = trpc.support.replyToTicket.useMutation();

  // Load tickets
  useEffect(() => {
    if (ticketsQuery.data) {
      const convertedTickets = ticketsQuery.data.map(ticket => ({
        ...ticket,
        orderId: ticket.orderId ?? null,
        assignedTo: ticket.assignedTo ?? null,
        status: (ticket.status || 'open') as 'open' | 'in_progress' | 'resolved' | 'closed',
        priority: (ticket.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        createdAt: typeof ticket.createdAt === 'string' ? new Date(ticket.createdAt) : ticket.createdAt,
        updatedAt: typeof ticket.updatedAt === 'string' ? new Date(ticket.updatedAt) : ticket.updatedAt,
        resolvedAt: ticket.resolvedAt ? (typeof ticket.resolvedAt === 'string' ? new Date(ticket.resolvedAt) : ticket.resolvedAt) : null,
      }));
      setTickets(convertedTickets);
      setLoading(false);
    }
  }, [ticketsQuery.data]);

  // Load ticket details and replies
  useEffect(() => {
    if (ticketDetailsQuery.data && repliesQuery.data && selectedTicket) {
      const updatedTicket: TicketWithReplies = {
        ...selectedTicket,
        ...ticketDetailsQuery.data,
        status: (ticketDetailsQuery.data.status || 'open') as 'open' | 'in_progress' | 'resolved' | 'closed',
        priority: (ticketDetailsQuery.data.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        replies: repliesQuery.data.map(r => ({
          ...r,
          createdAt: typeof r.createdAt === 'string' ? new Date(r.createdAt) : r.createdAt,
        })),
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
      setSelectedTicket(updatedTicket);
    }
  }, [ticketDetailsQuery.data, repliesQuery.data]);

  // Filter tickets
  useEffect(() => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(
        ticket =>
          ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(ticket => ticket.status === selectedStatus.toLowerCase());
    }

    if (selectedPriority !== 'ALL') {
      filtered = filtered.filter(ticket => ticket.priority === selectedPriority.toLowerCase());
    }

    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(ticket => ticket.category === selectedCategory);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, selectedStatus, selectedPriority, selectedCategory]);

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      await replyMutation.mutateAsync({
        ticketId: selectedTicket.id,
        message: replyMessage,
      });

      setReplyMessage('');
      toast.success('Reply sent successfully');
      repliesQuery.refetch();
      ticketDetailsQuery.refetch();
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket) return;

    try {
      const updated = await updateTicketMutation.mutateAsync({
        ticketId: selectedTicket.id,
        status: newStatus as 'open' | 'in_progress' | 'resolved' | 'closed',
      });

      const normalizedUpdated = {
        ...updated,
        orderId: updated.orderId ?? null,
        assignedTo: updated.assignedTo ?? null,
        status: (updated.status || 'open') as 'open' | 'in_progress' | 'resolved' | 'closed',
        priority: (updated.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        createdAt: typeof updated.createdAt === 'string' ? new Date(updated.createdAt) : updated.createdAt,
        updatedAt: typeof updated.updatedAt === 'string' ? new Date(updated.updatedAt) : updated.updatedAt,
        resolvedAt: updated.resolvedAt ? (typeof updated.resolvedAt === 'string' ? new Date(updated.resolvedAt) : updated.resolvedAt) : null,
      };

      setSelectedTicket({
        ...selectedTicket,
        ...normalizedUpdated,
      });

      setTickets(tickets.map(t => t.id === selectedTicket.id ? normalizedUpdated : t));
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8451E1]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0E0E0E] border-b-2 border-[#E5E7EB] p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 text-white">Support Tickets</h1>
          <p className="text-sm sm:text-base text-[#6B7280]">Manage and respond to customer support tickets</p>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        {isMobile ? (
          // Mobile Layout
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#808080]" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white placeholder-[#808080] focus:outline-none focus:border-[#8451E1]"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border border-[#2B2B2B] rounded text-white font-medium cursor-pointer"
            >
              <span>Filters</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Filters */}
            {showFilters && (
              <div className="space-y-3 bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-4">
                <div>
                  <label className="text-xs font-semibold text-[#DCDCDC] mb-2 block">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-sm text-white focus:outline-none focus:border-[#8451E1] cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    {STATUSES.map(status => (
                      <option key={status} value={status.toUpperCase()}>
                        {status.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#DCDCDC] mb-2 block">Priority</label>
                  <select
                    value={selectedPriority}
                    onChange={e => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-sm text-white focus:outline-none focus:border-[#8451E1] cursor-pointer"
                  >
                    <option value="ALL">All Priority</option>
                    {PRIORITIES.map(priority => (
                      <option key={priority} value={priority.toUpperCase()}>
                        {priority.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#DCDCDC] mb-2 block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-sm text-white focus:outline-none focus:border-[#8451E1] cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Tickets List - Mobile Card View */}
            {filteredTickets.length === 0 ? (
              <div className="p-6 text-center bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg text-[#808080]">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tickets found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map(ticket => {
                  const StatusIcon = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.icon;
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full p-4 text-left rounded-lg transition-all border-2 ${
                        selectedTicket?.id === ticket.id
                          ? 'border-[#8451E1] bg-[#1a1a1a]'
                          : 'border-[#2B2B2B] bg-[#0E0E0E] hover:border-[#8451E1]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-medium text-white line-clamp-2 flex-1">{ticket.subject}</h3>
                        <span className={getPriorityBadge(ticket.priority)}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-[#808080] mb-2 line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center justify-between text-xs text-[#DCDCDC]">
                        <span className="flex items-center gap-1">
                          {StatusIcon && <StatusIcon size={12} />}
                          {STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.label}
                        </span>
                        <span className="text-[#808080]">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Ticket Details - Mobile Slide In */}
            {selectedTicket && (
              <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSelectedTicket(null)}>
                <div className="absolute inset-0 right-auto w-full sm:w-96 bg-[#1a1a1a] border-l border-[#2B2B2B] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  {/* Ticket Header */}
                  <div className="p-4 border-b border-[#2B2B2B] sticky top-0 bg-[#1a1a1a]">
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-lg font-bold text-white flex-1 line-clamp-2">{selectedTicket.subject}</h2>
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="p-1 hover:bg-[#0E0E0E] rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-4 space-y-3 border-b border-[#2B2B2B]">
                    <div>
                      <p className="text-xs text-[#808080] mb-1">Description</p>
                      <p className="text-sm text-[#DCDCDC]">{selectedTicket.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[#808080] mb-1">Category</p>
                        <p className="text-sm font-medium text-white">{selectedTicket.category.replace(/_/g, ' ').toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#808080] mb-1">Priority</p>
                        <span className={getPriorityBadge(selectedTicket.priority)}>
                          {selectedTicket.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-[#808080] mb-1">Status</p>
                      <select
                        value={selectedTicket.status}
                        onChange={e => handleUpdateStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-sm text-white focus:outline-none focus:border-[#8451E1]"
                      >
                        {STATUSES.map(status => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <p className="text-xs text-[#808080] mb-1">Created</p>
                      <p className="text-sm font-medium text-white">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Conversation */}
                  <div className="p-4 space-y-3 min-h-40 border-b border-[#2B2B2B]">
                    {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                      selectedTicket.replies.map((reply, idx) => (
                        <div key={idx} className={`flex ${reply.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                              reply.senderRole === 'admin'
                                ? 'bg-[#8451E1] text-white'
                                : 'bg-[#0E0E0E] text-[#DCDCDC] border border-[#2B2B2B]'
                            }`}
                          >
                            <p className="text-xs font-semibold mb-1 opacity-75">
                              {reply.senderRole === 'admin' ? 'Admin' : 'Customer'}
                            </p>
                            <p>{reply.message}</p>
                            <p className="text-xs opacity-50 mt-1">{new Date(reply.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-[#808080] py-4">
                        <p className="text-sm">No replies yet</p>
                      </div>
                    )}
                  </div>

                  {/* Reply Input */}
                  <div className="p-4 border-t border-[#2B2B2B] bg-[#0E0E0E]">
                    <textarea
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      placeholder="Type your response..."
                      className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-sm text-white placeholder-[#808080] focus:outline-none focus:border-[#8451E1] resize-none"
                      rows={2}
                    />
                    <button
                      onClick={handleReply}
                      disabled={sendingReply || !replyMessage.trim()}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#8451E1] hover:bg-[#7040d1] disabled:opacity-50 disabled:cursor-not-allowed rounded text-white font-medium transition-colors text-sm cursor-pointer"
                    >
                      {sendingReply ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reply'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Desktop Layout
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-1 bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
              {/* Search and Filters */}
              <div className="p-4 border-b border-[#2B2B2B] space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-[#808080]" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white placeholder-[#808080] focus:outline-none focus:border-[#8451E1]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#DCDCDC]">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-sm text-white focus:outline-none focus:border-[#8451E1] cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    {STATUSES.map(status => (
                      <option key={status} value={status.toUpperCase()}>
                        {status.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#DCDCDC]">Priority</label>
                  <select
                    value={selectedPriority}
                    onChange={e => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-sm text-white focus:outline-none focus:border-[#8451E1] cursor-pointer"
                  >
                    <option value="ALL">All Priority</option>
                    {PRIORITIES.map(priority => (
                      <option key={priority} value={priority.toUpperCase()}>
                        {priority.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#DCDCDC]">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-sm text-white focus:outline-none focus:border-[#8451E1] cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tickets */}
              <div className="flex-1 overflow-y-auto">
                {filteredTickets.length === 0 ? (
                  <div className="p-4 text-center text-[#808080]">
                    <p>No tickets found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#2B2B2B]">
                    {filteredTickets.map(ticket => {
                      const StatusIcon = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.icon;
                      return (
                        <button
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          className={`w-full p-4 text-left hover:bg-[#0E0E0E] transition-colors border-l-2 cursor-pointer ${
                            selectedTicket?.id === ticket.id
                              ? 'border-[#8451E1] bg-[#0E0E0E]'
                              : 'border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-medium text-white line-clamp-2 flex-1">{ticket.subject}</h3>
                            <span className={getPriorityBadge(ticket.priority)}>
                              {ticket.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-[#808080] mb-2 line-clamp-1">{ticket.description}</p>
                          <div className="flex items-center justify-between text-xs text-[#DCDCDC]">
                            <span className="flex items-center gap-1">
                              {StatusIcon && <StatusIcon size={12} />}
                              {STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.label}
                            </span>
                            <span className="text-[#808080]">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Details */}
            {selectedTicket ? (
              <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
                {/* Ticket Header */}
                <div className="p-6 border-b border-[#2B2B2B] space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedTicket.subject}</h2>
                      <p className="text-[#DCDCDC]">{selectedTicket.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="p-2 hover:bg-[#0E0E0E] rounded transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2B2B2B]">
                    <div>
                      <p className="text-xs text-[#808080] mb-1">Category</p>
                      <p className="text-sm font-medium text-white">{selectedTicket.category.replace(/_/g, ' ').toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#808080] mb-1">Priority</p>
                      <span className={getPriorityBadge(selectedTicket.priority)}>
                        {selectedTicket.priority.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-[#808080] mb-1">Status</p>
                      <select
                        value={selectedTicket.status}
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
                      <p className="text-xs text-[#808080] mb-1">Created</p>
                      <p className="text-sm font-medium text-white">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Conversation */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                    selectedTicket.replies.map((reply, idx) => (
                      <div key={idx} className={`flex ${reply.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs px-4 py-3 rounded-lg ${
                            reply.senderRole === 'admin'
                              ? 'bg-[#8451E1] text-white'
                              : 'bg-[#0E0E0E] text-[#DCDCDC] border border-[#2B2B2B]'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {reply.senderRole === 'admin' ? 'Admin' : 'Customer'}
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
                <div className="p-6 border-t border-[#2B2B2B]">
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      placeholder="Type your response..."
                      className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white placeholder-[#808080] focus:outline-none focus:border-[#8451E1] resize-none"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={handleReply}
                    disabled={sendingReply || !replyMessage.trim()}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8451E1] hover:bg-[#7040d1] disabled:opacity-50 disabled:cursor-not-allowed rounded text-white font-medium transition-colors cursor-pointer"
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
            ) : (
              <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg flex items-center justify-center h-80">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-[#808080] mx-auto mb-4" />
                  <p className="text-[#808080]">Select a ticket to view details</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}