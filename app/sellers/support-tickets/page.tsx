'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toastSvc } from '@/services/toast';
import { useAuth } from '@/context/AuthContext';
import {
  AlertCircle,
  Plus,
  Search,
  MessageSquare,
  X,
  Loader2,
  Send,
  Trash2,
  Edit,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useSupportTickets,
  useSupportTicketById,
  useCreateSupportTicket,
  useUpdateSupportTicket,
  useTicketReplies,
  useReplyToTicket,
  useCloseTicket,
  useDeleteReply,
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
  const { user } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [replyMessage, setReplyMessage] = useState('');
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    subject: '',
    description: '',
    category: 'general_inquiry',
    priority: 'medium',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general_inquiry',
    priority: 'medium',
  });

  const ticketsQuery = useSupportTickets();
  const selectedTicketQuery = useSupportTicketById(selectedTicketId || '');
  const repliesQuery = useTicketReplies(selectedTicketId || '');

  const createMutation = useCreateSupportTicket();
  const updateMutation = useUpdateSupportTicket();
  const replyMutation = useReplyToTicket();
  const closeTicketMutation = useCloseTicket();
  const deleteReplyMutation = useDeleteReply();

  // Get replies and sort chronologically (oldest to newest)
  const rawReplies = (repliesQuery.data || []) as any[];
  const replies = rawReplies && rawReplies.length > 0 
    ? [...rawReplies].sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return timeA - timeB;
      })
    : [];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // Use setTimeout to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, []);

  useEffect(() => {
    // Auto-scroll when replies change or ticket selection changes
    scrollToBottom();
  }, [replies.length, selectedTicketId, scrollToBottom]);

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

    const messageToSend = replyMessage;
    setReplyMessage('');

    try {
      await replyMutation.mutateAsync({
        ticketId: selectedTicketId,
        message: messageToSend,
      });
    } catch (error) {
      setReplyMessage(messageToSend);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicketId) return;

    try {
      await closeTicketMutation.mutateAsync({ ticketId: selectedTicketId });
      setCloseDialogOpen(false);
      setSelectedTicketId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!selectedTicketId) return;

    try {
      await deleteReplyMutation.mutateAsync({ replyId, ticketId: selectedTicketId });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleOpenEditDialog = () => {
    if (selectedTicket) {
      setEditFormData({
        subject: selectedTicket.subject,
        description: selectedTicket.description,
        category: selectedTicket.category,
        priority: selectedTicket.priority,
      });
      setEditDialogOpen(true);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicketId) return;

    try {
      await updateMutation.mutateAsync({
        ticketId: selectedTicketId,
        priority: editFormData.priority as any,
      });
      setEditDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const tickets = (ticketsQuery.data || []) as SupportTicket[];
  const selectedTicket = selectedTicketQuery.data as SupportTicket | undefined;

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation with Back Button */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-black border-b border-[#333] p-6">
        <div className="max-w-7xl mx-auto">
          {selectedTicketId && (
            <button
              onClick={() => setSelectedTicketId(null)}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tickets
            </button>
          )}
          <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
          <p className="text-gray-400">Create and manage your support tickets</p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {}
          <div className="lg:col-span-1 bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
            {}
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

            {}
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
                    <div
                      key={ticket.id}
                      className={`text-left p-4 hover:bg-[#0a0a0a] transition-all duration-200 border-l-2 cursor-pointer hover:border-purple-500/50 ${
                        selectedTicketId === ticket.id
                          ? 'border-purple-600 bg-[#0a0a0a]'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <button
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className="text-sm font-medium text-white line-clamp-2 flex-1 text-left hover:text-purple-400 transition-colors"
                        >
                          {ticket.subject}
                        </button>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicketId(ticket.id);
                              setEditFormData({
                                subject: ticket.subject,
                                description: ticket.description,
                                category: ticket.category,
                                priority: ticket.priority,
                              });
                              setEditDialogOpen(true);
                            }}
                            className="p-1 hover:bg-purple-600/20 rounded transition-colors cursor-pointer text-purple-400 hover:text-purple-300"
                            title="Edit ticket"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {ticket.status !== 'closed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicketId(ticket.id);
                                setCloseDialogOpen(true);
                              }}
                              className="p-1 hover:bg-red-600/20 rounded transition-colors cursor-pointer text-red-400 hover:text-red-300"
                              title="Close ticket"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <span className={`text-xs px-2 py-1 rounded whitespace-nowrap cursor-pointer transition-opacity duration-200 hover:opacity-80 ${PRIORITY_COLORS[ticket.priority]}`}>
                            {ticket.priority}
                          </span>
                        </div>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {}
          {selectedTicket ? (
            <div className="lg:col-span-3 bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
              {}
              <div className="p-6 border-b border-[#333] space-y-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-gray-400">{selectedTicket.description}</p>
                </div>

                {}
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

                {selectedTicket.status !== 'closed' && (
                  <div className="border-t border-[#333] mt-6 pt-6 flex gap-3 justify-end">
                    <button
                      onClick={() => setCloseDialogOpen(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-medium flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Close Ticket
                    </button>
                  </div>
                )}
              </div>

              {}
              <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-black to-[#0a0a0a] min-h-[400px]" ref={chatContainerRef}>
                {repliesQuery.isLoading ? (
                  <div className="text-center text-gray-600 py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  </div>
                ) : replies && replies.length > 0 ? (
                  <>
                    {replies.map((reply, idx) => {
                      // Determine if this is the current user's message
                      const isCurrentUser = user?.id && reply.senderId === user.id;
                      const isAdmin = reply.senderRole === 'admin';
                      const isBuyer = reply.senderRole === 'buyer';
                      const isSeller = reply.senderRole === 'seller';
                      
                      // Determine sender label
                      let senderLabel = 'Unknown';
                      if (isCurrentUser) {
                        senderLabel = 'You';
                      } else if (isAdmin) {
                        senderLabel = 'Support Admin';
                      } else if (isBuyer) {
                        senderLabel = 'Buyer';
                      } else if (isSeller) {
                        senderLabel = 'Seller';
                      }
                      
                      return (
                      <div key={`${reply.id}-${idx}`} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
                        <div
                          className={`max-w-2xl px-5 py-4 rounded-xl ${
                            isCurrentUser
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                              : 'bg-[#0a0a0a] text-gray-200 border border-[#444] shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-sm font-bold opacity-90">
                              {senderLabel}
                            </p>
                            {isCurrentUser && (
                              <button
                                onClick={() => handleDeleteReply(reply.id)}
                                className="p-1 hover:opacity-60 transition-opacity"
                                title="Delete message"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-base leading-relaxed break-words">{reply.message}</p>
                          <p className="text-sm opacity-60 mt-3">
                            {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                    })},
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-16 flex flex-col items-center justify-center h-full">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">No replies yet</p>
                    <p className="text-sm opacity-60 mt-1">Await a response from the customer.</p>
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {}
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
            <div className="lg:col-span-3 bg-[#1a1a1a] border border-[#333] rounded-lg flex items-center justify-center h-80">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600">Select a ticket to view details and respond</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close Ticket Dialog */}
      {closeDialogOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Close Support Ticket</h2>
            <p className="text-gray-400 text-sm">
              Are you sure you want to close this ticket? Closed tickets cannot be reopened.
            </p>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                onClick={() => setCloseDialogOpen(false)}
                variant="outline"
                className="border-[#333] text-white hover:bg-[#1a1a1a]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloseTicket}
                disabled={closeTicketMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {closeTicketMutation.isPending ? 'Closing...' : 'Close Ticket'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
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

      {/* Edit Ticket Dialog */}
      {editDialogOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit Support Ticket</h2>
              <button
                onClick={() => setEditDialogOpen(false)}
                className="p-1 hover:bg-[#0a0a0a] rounded transition-colors cursor-pointer hover:text-red-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={editFormData.subject}
                  onChange={e => setEditFormData({ ...editFormData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-[#333] rounded text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 cursor-text transition-colors duration-200 hover:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-[#333] rounded text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 resize-none cursor-text transition-colors duration-200 hover:border-purple-500/50"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">
                  Category
                </label>
                <select
                  value={editFormData.category}
                  onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
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
                  value={editFormData.priority}
                  onChange={e => setEditFormData({ ...editFormData, priority: e.target.value })}
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
                onClick={() => setEditDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTicket}
                disabled={updateMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Ticket'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}