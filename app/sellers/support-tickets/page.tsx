'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/hooks/useToast';
import {
  Search,
  Filter,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Plus,
  Loader,
  ChevronDown,
  Edit2,
  Eye,
  X as XIcon,
  MoreVertical,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { trpc } from '@/app/_trpc/client';
import { CreateTicketModal } from './CreateTicketModal';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

interface Reply {
  id: string;
  message: string;
  senderRole: 'buyer' | 'seller' | 'admin';
  createdAt: Date;
}

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
  closed: { label: 'Closed', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: CheckCircle },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-green-400', bg: 'bg-green-500/10' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  high: { label: 'High', color: 'text-red-400', bg: 'bg-red-500/10' },
  urgent: { label: 'Urgent', color: 'text-red-500', bg: 'bg-red-500/20', bold: true },
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'low':
      return 'text-green-400';
    case 'medium':
      return 'text-yellow-400';
    case 'high':
      return 'text-red-400';
    case 'urgent':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'low':
      return 'text-sm px-3 py-1 rounded text-green-400 bg-green-500/10';
    case 'medium':
      return 'text-sm px-3 py-1 rounded text-yellow-400 bg-yellow-500/10';
    case 'high':
      return 'text-sm px-3 py-1 rounded text-red-400 bg-red-500/10';
    case 'urgent':
      return 'text-sm px-3 py-1 rounded text-red-500 bg-red-500/20';
    default:
      return 'text-sm px-3 py-1 rounded text-gray-400 bg-gray-500/10';
  }
};

// Return combined classes for a status (static strings for Tailwind to keep)
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

export default function SellerSupportTicketsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [ticketToClose, setTicketToClose] = useState<string | null>(null);

  // Fetch tickets
  const ticketsQuery = trpc.support.getTickets.useQuery(
    { status: selectedStatus !== 'all' ? (selectedStatus as any) : undefined },
    {
      enabled: !!user?.id,
    }
  );

  // Fetch replies for selected ticket
  const repliesQuery = trpc.support.getTicketReplies.useQuery(
    { ticketId: selectedTicket?.id || '' },
    {
      enabled: !!selectedTicket?.id,
    }
  );

  useEffect(() => {
    if (ticketsQuery.data) {
      const convertedTickets = (ticketsQuery.data as any[]).map((ticket: any) => ({
        ...ticket,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt),
      }));
      setTickets(convertedTickets);
      setLoading(false);
      if (!selectedTicket && convertedTickets.length > 0) {
        setSelectedTicket(convertedTickets[0]);
      }
    }
  }, [ticketsQuery.data]);

  useEffect(() => {
    if (repliesQuery.data) {
      const convertedReplies = (repliesQuery.data as any[]).map((reply: any) => ({
        ...reply,
        createdAt: new Date(reply.createdAt),
      }));
      setReplies(convertedReplies);
    }
  }, [repliesQuery.data]);

  useEffect(() => {
    setLoadingReplies(repliesQuery.isLoading);
  }, [repliesQuery.isLoading]);

  // Filter tickets
  useEffect(() => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((ticket) => ticket.status === selectedStatus);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, selectedStatus]);

  // Send reply mutation
  const replyMutation = trpc.support.replyToTicket.useMutation({
    onSuccess: () => {
      setReplyText('');
      repliesQuery.refetch();
      toast.success('Reply sent successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send reply');
    },
  });

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    setSendingReply(true);
    try {
      await replyMutation.mutateAsync({
        ticketId: selectedTicket.id,
        message: replyText,
      });
    } finally {
      setSendingReply(false);
    }
  };

  const handleTicketCreated = () => {
    ticketsQuery.refetch();
  };

  const handleViewTicket = (ticketId: string) => {
    setOpenMenuId(null);
    router.push(`/sellers/support-tickets/${ticketId}`);
  };

  const handleEditTicket = (ticketId: string) => {
    setOpenMenuId(null);
    router.push(`/sellers/support-tickets/${ticketId}/edit`);
  };

  const handleCloseTicket = (ticketId: string) => {
    setTicketToClose(ticketId);
    setCloseDialogOpen(true);
    setOpenMenuId(null);
  };

  const confirmCloseTicket = async () => {
    if (!ticketToClose) return;
    try {
      await replyMutation.mutateAsync({
        ticketId: ticketToClose,
        message: 'Ticket closed by seller',
      });
      ticketsQuery.refetch();
      toast.success('Ticket closed successfully');
      setCloseDialogOpen(false);
      setTicketToClose(null);
    } catch (error) {
      toast.error('Failed to close ticket');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#8451E1] mx-auto mb-4" />
          <p className="text-gray-400">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-[#E5E7EB]">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Support Tickets</h1>
            <p className="text-[#6B7280]">Manage customer inquiries and track resolution</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8451E1] hover:bg-[#7040d1] text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            New Ticket
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
            <p className="text-gray-400 text-sm mb-2">Total Tickets</p>
            <p className="text-2xl font-bold text-white">{tickets.length}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
            <p className="text-gray-400 text-sm mb-2">Open</p>
            <p className="text-2xl font-bold text-blue-400">{tickets.filter((t) => t.status === 'open').length}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
            <p className="text-gray-400 text-sm mb-2">In Progress</p>
            <p className="text-2xl font-bold text-yellow-400">{tickets.filter((t) => t.status === 'in_progress').length}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
            <p className="text-gray-400 text-sm mb-2">Resolved</p>
            <p className="text-2xl font-bold text-green-400">{tickets.filter((t) => t.status === 'resolved').length}</p>
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] rounded-lg border border-[#333] h-[600px] flex flex-col overflow-hidden">
              {/* Search and Filter */}
              <div className="p-4 border-b border-[#333] space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#333] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#8451E1]"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#333] rounded text-white focus:outline-none focus:border-[#8451E1] appearance-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Tickets */}
              <div className="flex-1 overflow-y-auto">
                {filteredTickets.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center p-4">
                    <div>
                      <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-2 opacity-50" />
                      <p className="text-gray-400">No tickets found</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[#333]">
                    {filteredTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`w-full p-4 text-left transition-colors ${
                          selectedTicket?.id === ticket.id
                            ? 'bg-[#8451E1]/10 border-l-2 border-l-[#8451E1]'
                            : 'hover:bg-[#252525]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-medium text-sm">{ticket.subject}</h3>
                          <span className={getStatusClasses(ticket.status)}>
                            {STATUS_CONFIG[ticket.status].label}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className={getPriorityText(ticket.priority)}>
                            {PRIORITY_CONFIG[ticket.priority].label}
                          </span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Details & Conversation */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-[#1a1a1a] rounded-lg border border-[#333] h-[600px] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-[#333]">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white mb-2">{selectedTicket.subject}</h2>
                      <p className="text-gray-400 text-sm mb-4">{selectedTicket.description}</p>
                    </div>
                    <div className="flex flex-col gap-2 text-right">
                      <span className={`text-sm px-3 py-1 rounded ${getStatusClasses(selectedTicket.status)}`}>
                        {STATUS_CONFIG[selectedTicket.status].label}
                      </span>
                      <span className={getPriorityBadge(selectedTicket.priority)}>
                        {PRIORITY_CONFIG[selectedTicket.priority].label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500 mb-1">Category</p>
                      <p className="text-white capitalize">{selectedTicket.category.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Created</p>
                      <p className="text-white">{new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Updated</p>
                      <p className="text-white">{new Date(selectedTicket.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Conversation */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingReplies ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader className="w-8 h-8 animate-spin text-[#8451E1]" />
                    </div>
                  ) : replies.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No replies yet. Start a conversation!</p>
                    </div>
                  ) : (
                    replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`flex ${reply.senderRole === 'admin' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            reply.senderRole === 'admin'
                              ? 'bg-[#8451E1]/20 border border-[#8451E1]/30 text-gray-300'
                              : 'bg-[#8451E1] text-white'
                          }`}
                        >
                          <p className="text-sm">{reply.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(reply.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Input */}
                <div className="p-4 border-t border-[#333] flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    disabled={sendingReply}
                    className="flex-1 px-4 py-2 bg-[#0f0f0f] border border-[#333] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#8451E1] disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sendingReply}
                    className="px-4 py-2 bg-[#8451E1] hover:bg-[#7040d1] text-white rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {sendingReply ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#1a1a1a] rounded-lg border border-[#333] h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Select a ticket to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTicketCreated}
      />
    </div>
  );
}