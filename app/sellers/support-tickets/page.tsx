"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/hooks/useToast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  MoreVertical,
  Plus,
  Search,
  Filter,
  MessageSquare,
  Zap,
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

const CATEGORIES = [
  "general_inquiry",
  "technical_issue",
  "payment_problem",
  "order_issue",
  "refund_request",
  "account_issue",
  "listing_help",
  "other",
];

const PRIORITIES = ["low", "medium", "high", "urgent"];

const STATUS_CONFIG = {
  open: { color: "bg-blue-500", icon: AlertCircle },
  in_progress: { color: "bg-yellow-500", icon: Clock },
  resolved: { color: "bg-green-500", icon: CheckCircle },
  closed: { color: "bg-gray-500", icon: CheckCircle },
};

export default function SellerSupportTicketsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
  });

  // Form validation
  const isFormValid =
    formData.title.trim().length >= 5 &&
    formData.description.trim().length >= 10 &&
    formData.category &&
    formData.priority;

  // Fetch tickets using tRPC
  const ticketsQuery = trpc.support.getTickets.useQuery(
    { status: undefined },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!user?.id,
    }
  );

  useEffect(() => {
    if (ticketsQuery.data) {
      // Convert string dates to Date objects
      const convertedTickets = ticketsQuery.data.map(ticket => ({
        ...ticket,
        createdAt: typeof ticket.createdAt === 'string' ? new Date(ticket.createdAt) : ticket.createdAt,
        updatedAt: typeof ticket.updatedAt === 'string' ? new Date(ticket.updatedAt) : ticket.updatedAt,
        resolvedAt: ticket.resolvedAt ? (typeof ticket.resolvedAt === 'string' ? new Date(ticket.resolvedAt) : ticket.resolvedAt) : null,
      }));
      setTickets(convertedTickets);
      setLoading(false);
    } else if (ticketsQuery.isLoading) {
      setLoading(true);
    }
  }, [ticketsQuery.data, ticketsQuery.isLoading]);


  useEffect(() => {
    if (ticketsQuery.error) {
      toast.error("Failed to load support tickets");
      console.error(ticketsQuery.error);
    }
  }, [ticketsQuery.error, toast]);

  // Filter tickets
  useEffect(() => {
    let filtered = tickets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== "ALL") {
      filtered = filtered.filter(
        (ticket) => ticket.status === selectedStatus.toLowerCase()
      );
    }

    // Priority filter
    if (selectedPriority !== "ALL") {
      filtered = filtered.filter(
        (ticket) => ticket.priority === selectedPriority.toLowerCase()
      );
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, selectedStatus, selectedPriority]);

  // Handle create ticket
  const createTicketMutation = trpc.support.createTicket.useMutation();

  const handleCreateTicket = async () => {
    try {
      await createTicketMutation.mutateAsync({
        subject: formData.title,
        description: formData.description,
        category: formData.category as any,
        priority: formData.priority as any,
      });

      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "medium",
      });
      setOpenDialog(false);
      toast.success("Support ticket created successfully");
      // Refetch tickets
      ticketsQuery.refetch();
    } catch (error) {
      toast.error("Failed to create support ticket");
      console.error(error);
    }
  };

  // Handle reply to ticket
  const replyMutation = trpc.support.replyToTicket.useMutation();

  const handleReplyToTicket = async (ticketId: string, reply: string) => {
    try {
      await replyMutation.mutateAsync({
        ticketId,
        message: reply,
      });

      toast.success("Reply sent successfully");
      // Refetch tickets to get updated replies
      ticketsQuery.refetch();
    } catch (error) {
      toast.error("Failed to send reply");
      console.error(error);
    }
  };

  const getStatusIcon = (status: string) => {
    const config =
      STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    return config?.icon;
  };

  const getStatusColor = (status: string) => {
    const config =
      STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    return config?.color;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0E0E0E]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-[#DCDCDC] mt-4">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Support Tickets
            </h1>
            <p className="text-[#808080]">
              Manage customer support requests and track their resolution
            </p>
          </div>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create New Ticket
              </Button>
            </DialogTrigger>

            <DialogContent className="bg-[#141414] border border-[#2B2B2B]">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Create Support Ticket
                </DialogTitle>
                <DialogDescription className="text-[#808080]">
                  Create a new support ticket for tracking
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-[#DCDCDC] mb-2">
                    Subject
                  </label>
                  <Input
                    placeholder="Brief description of the issue"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="bg-[#0E0E0E] border-[#2B2B2B] text-white"
                  />
                  <p className="text-xs text-[#808080] mt-1">Min 5 characters</p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-[#DCDCDC] mb-2">
                    Category
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="bg-[#0E0E0E] border-[#2B2B2B] text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141414] border-[#2B2B2B]">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-[#DCDCDC] mb-2">
                    Priority
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger className="bg-[#0E0E0E] border-[#2B2B2B] text-white">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141414] border-[#2B2B2B]">
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#DCDCDC] mb-2">
                    Description
                  </label>
                  <Textarea
                    placeholder="Provide detailed information about the issue"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="bg-[#0E0E0E] border-[#2B2B2B] text-white min-h-[150px]"
                  />
                  <p className="text-xs text-[#808080] mt-1">Min 10 characters</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                  className="border-[#2B2B2B] text-white hover:bg-[#141414]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTicket}
                  disabled={!isFormValid || createTicketMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#808080]" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#141414] border-[#2B2B2B] text-white"
            />
          </div>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="bg-[#141414] border-[#2B2B2B] text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-[#141414] border-[#2B2B2B]">
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="bg-[#141414] border-[#2B2B2B] text-white">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent className="bg-[#141414] border-[#2B2B2B]">
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 bg-[#141414] rounded-lg border border-[#2B2B2B]">
            <p className="text-[#808080] mb-4">No support tickets found</p>
            <Button
              onClick={() => setOpenDialog(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Create Your First Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const StatusIcon = getStatusIcon(ticket.status);
              const statusColor = getStatusColor(ticket.status);

              return (
                <div
                  key={ticket.id}
                  className="bg-[#141414] border border-[#2B2B2B] rounded-lg p-6 hover:border-[#3B3B3B] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-white">
                          {ticket.subject}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded text-white text-xs font-medium ${statusColor}`}
                        >
                          {ticket.status.toUpperCase().replace("_", " ")}
                        </span>
                        <span className="px-3 py-1 rounded bg-[#1a1a1a] text-[#DCDCDC] text-xs border border-[#2B2B2B]">
                          {ticket.priority.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-[#808080] text-sm mb-3">
                        {ticket.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-xs text-[#808080]">
                        <div>
                          <span className="text-[#DCDCDC]">Category:</span>{" "}
                          {ticket.category.replace(/_/g, " ")}
                        </div>
                        <div>
                          <span className="text-[#DCDCDC]">Created:</span>{" "}
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-[#DCDCDC]">Updated:</span>{" "}
                          {new Date(ticket.updatedAt).toLocaleDateString()}
                        </div>
                        {ticket.resolvedAt && (
                          <div>
                            <span className="text-[#DCDCDC]">
                              Resolved:
                            </span>{" "}
                            {new Date(ticket.resolvedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#2B2B2B] text-[#808080] hover:text-white"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Reply
                        </Button>
                        {ticket.status !== "closed" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#808080] hover:text-white"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#141414] rounded-lg p-4 border border-[#2B2B2B]">
            <p className="text-[#808080] text-sm mb-2">Total Tickets</p>
            <p className="text-2xl font-bold text-white">{tickets.length}</p>
          </div>

          <div className="bg-[#141414] rounded-lg p-4 border border-[#2B2B2B]">
            <p className="text-[#808080] text-sm mb-2">Open</p>
            <p className="text-2xl font-bold text-blue-400">
              {tickets.filter((t) => t.status === "open").length}
            </p>
          </div>

          <div className="bg-[#141414] rounded-lg p-4 border border-[#2B2B2B]">
            <p className="text-[#808080] text-sm mb-2">In Progress</p>
            <p className="text-2xl font-bold text-yellow-400">
              {tickets.filter((t) => t.status === "in_progress").length}
            </p>
          </div>

          <div className="bg-[#141414] rounded-lg p-4 border border-[#2B2B2B]">
            <p className="text-[#808080] text-sm mb-2">Resolved</p>
            <p className="text-2xl font-bold text-green-400">
              {tickets.filter((t) => t.status === "resolved").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}