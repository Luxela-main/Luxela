'use client';

import React, { useState } from 'react';
import { toastSvc } from '@/services/toast';
import {
  AlertCircle,
  Plus,
  Search,
  MessageSquare,
  X,
  Loader2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useSupportTickets,
  useSupportTicketById,
  useCreateSupportTicket,
  useTicketReplies,
  useReplyToTicket,
} from '@/modules/sellers/queries/useSupportTickets';

interface SupportTicket {
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
    senderId: string;
    createdAt: Date;
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

const STATUS_COLORS = {
  open: 'bg-blue-500/10 text-blue-400',
  in_progress: 'bg-yellow-500/10 text-yellow-400',
  resolved: 'bg-green-500/10 text-green-400',
  closed: 'bg-gray-500/10 text-gray-400',
};

const PRIORITY_COLORS = {
  low: 'bg-blue-500/10 text-blue-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  high: 'bg-orange-500/10 text-orange-400',
  urgent: 'bg-red-500/10 text-red-400',
};

export default function SellerSupportTicketsPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [replyMessage, setReplyMessage] = useState('');

  // Form states for creating ticket
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general_inquiry',
    priority: 'medium',
  });

  // Fetch tickets using React Query
  const ticketsQuery = useSupportTickets();
  const selectedTicketQuery = useSupportTicketById(selectedTicketId || '');
  const repliesQuery = useTicketReplies(selectedTicketId || '');

  // Mutations
  const createMutation = useCreateSupportTicket();
  const replyMutation = useReplyToTicket();

  const handleCreateTicket = async () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      toastSvc.error('Please fill in all fields');
      return;
    }

    createMutation.mutate({
      subject: formData.subject,
      description: formData.description,
      category: formData.category as any,
      priority: formData.priority as any,
    });

    if (!createMutation.isPending) {
      setFormData({ subject: '', description: '', category: 'general_inquiry', priority: 'medium' });
      setIsCreateModalOpen(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicketId || !replyMessage.trim()) {
      toastSvc.error('Please enter a message');
      return;
    }

    replyMutation.mutate({
      ticketId: selectedTicketId,
      message: replyMessage,
    });

    setReplyMessage('');
  };

  const tickets = (ticketsQuery.data || []) as SupportTicket[];
  const selectedTicket = selectedTicketQuery.data as SupportTicket | undefined;
  const replies = (repliesQuery.data || []) as any[];

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-black border-b border-[#333] p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
          <p className="text-gray-400">Create and manage your support tickets</p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1 bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
            {/* Search and Create */}
            <div className="p-4 border-b border-[#333] space-y-4">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                New Ticket
              </Button>

              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black border border-[#333] rounded text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 cursor-text transition-colors duration-200 hover:border-purple-500/50"
                />
              </div>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-[#333] rounded text-sm text-white focus:outline-none focus:border-purple-600 cursor-pointer transition-colors duration-200 hover:border-purple-500/50"
              >
                <option value="ALL">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Tickets */}
            <div className="flex-1 overflow-y-auto">
              {ticketsQuery.isLoading ? (
                <div className="p-4 text-center text-gray-600">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-4 text-center text-gray-600">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No support tickets found</p>
                </div>
              ) : (
                <div className="divide-y divide-[#333]">
                  {filteredTickets.map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`w-full text-left p-4 hover:bg-[#0a0a0a] transition-all duration-200 border-l-2 cursor-pointer hover:border-purple-500/50 ${
                        selectedTicketId === ticket.id
                          ? 'border-purple-600 bg-[#0a0a0a]'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-medium text-white line-clamp-2 flex-1">
                          {ticket.subject}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap cursor-pointer transition-opacity duration-200 hover:opacity-80 ${PRIORITY_COLORS[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                        {ticket.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className={`px-2 py-1 rounded cursor-pointer transition-opacity duration-200 hover:opacity-80 ${STATUS_COLORS[ticket.status]}`}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ticket Details */}
          {selectedTicket ? (
            <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="p-6 border-b border-[#333] space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedTicket.subject}
                    </h2>
                    <p className="text-gray-400">{selectedTicket.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTicketId(null)}
                    className="p-2 hover:bg-[#0a0a0a] rounded transition-colors cursor-pointer hover:text-red-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#333]">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Category</p>
                    <p className="text-sm font-medium text-white">
                      {selectedTicket.category.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Priority</p>
                    <span className={`inline-block text-xs font-bold px-2 py-1 rounded cursor-pointer transition-opacity duration-200 hover:opacity-80 ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <span className={`inline-block text-xs font-bold px-2 py-1 rounded cursor-pointer transition-opacity duration-200 hover:opacity-80 ${STATUS_COLORS[selectedTicket.status]}`}>
                      {selectedTicket.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Created</p>
                    <p className="text-sm font-medium text-white">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Conversation */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {repliesQuery.isLoading ? (
                  <div className="text-center text-gray-600 py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </div>
                ) : replies && replies.length > 0 ? (
                  replies.map((reply, idx) => (
                    <div key={idx} className={`flex ${reply.senderRole === 'seller' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs px-4 py-3 rounded-lg ${
                          reply.senderRole === 'seller'
                            ? 'bg-purple-600 text-white'
                            : 'bg-[#0a0a0a] text-gray-300 border border-[#333]'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1 opacity-75">
                          {reply.senderRole === 'seller' ? 'You' : reply.senderRole === 'admin' ? 'Admin' : 'Customer'}
                        </p>
                        <p className="text-sm">{reply.message}</p>
                        <p className="text-xs opacity-50 mt-2">
                          {new Date(reply.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-600 py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No replies yet. Await a response from the customer.</p>
                  </div>
                )}
              </div>

              {/* Reply Input */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-6 border-t border-[#333]">
                  <div className="space-y-3">
                    <textarea
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      placeholder="Type your response..."
                      className="w-full px-4 py-3 bg-black border border-[#333] rounded text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 resize-none cursor-text transition-colors duration-200 hover:border-purple-500/50"
                      rows={3}
                    />
                    <Button
                      onClick={handleReply}
                      disabled={replyMutation.isPending || !replyMessage.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 hover:shadow-md enabled:hover:shadow-lg"
                    >
                      {replyMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#333] rounded-lg flex items-center justify-center h-80">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600">Select a ticket to view details and respond</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create Support Ticket</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-[#0a0a0a] rounded transition-colors cursor-pointer hover:text-red-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 bg-black border border-[#333] rounded text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 cursor-text transition-colors duration-200 hover:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of your issue"
                  className="w-full px-3 py-2 bg-black border border-[#333] rounded text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 resize-none cursor-text transition-colors duration-200 hover:border-purple-500/50"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-[#333] rounded text-white focus:outline-none focus:border-purple-600 cursor-pointer transition-colors duration-200 hover:border-purple-500/50"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-[#333] rounded text-white focus:outline-none focus:border-purple-600 cursor-pointer transition-colors duration-200 hover:border-purple-500/50"
                >
                  {PRIORITIES.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setIsCreateModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={createMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}