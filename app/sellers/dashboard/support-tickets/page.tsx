"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/_trpc/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/hooks/useToast";
import {
  ChevronRight,
  Clock,
  AlertCircle,
  MessageSquare,
  Plus,
} from "lucide-react";

interface TicketStatus {
  value: string;
  label: string;
  color: string;
}

const TICKET_STATUSES: TicketStatus[] = [
  { value: "open", label: "Open", color: "bg-[#BEE3EC]" },
  { value: "in_progress", label: "In Progress", color: "bg-[#EA795B]" },
  { value: "resolved", label: "Resolved", color: "bg-[#BEECE3]" },
  { value: "closed", label: "Closed", color: "bg-[#ECBEE3]" },
];

const PRIORITIES = {
  low: "text-blue-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  urgent: "text-red-400",
};

export default function SellerSupportTicketsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const ticketsQuery = trpc.support.getTickets.useQuery(
    { status: filterStatus as any },
    {
      enabled: !!user?.id,
    }
  );

  const getStatusColor = (status: string) => {
    return TICKET_STATUSES.find((s) => s.value === status)?.color || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    return TICKET_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (ticketsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0E0E0E]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-[#DCDCDC] mt-4">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  const tickets = ticketsQuery.data || [];
  const filteredTickets = filterStatus
    ? tickets.filter((t) => t.status === filterStatus)
    : tickets;

  return (
    <div className="min-h-screen bg-[#0E0E0E] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-[#ECBEE3]">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Support Tickets</h1>
            <p className="text-[#EA795B]">
              Manage your support tickets and communicate with the admin team
            </p>
          </div>
          <Link href="/sellers/dashboard/support-tickets/create">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Create Ticket
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            onClick={() => setFilterStatus(null)}
            variant={filterStatus === null ? "default" : "outline"}
            className={
              filterStatus === null
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "border-[#2B2B2B] text-[#DCDCDC] hover:bg-[#141414]"
            }
          >
            All ({tickets.length})
          </Button>
          {TICKET_STATUSES.map((status) => {
            const count = tickets.filter((t) => t.status === status.value).length;
            return (
              <Button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                variant={filterStatus === status.value ? "default" : "outline"}
                className={
                  filterStatus === status.value
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "border-[#2B2B2B] text-[#DCDCDC] hover:bg-[#141414]"
                }
              >
                {status.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="bg-[#141414] border border-[#2B2B2B] rounded-lg p-12 text-center">
            <MessageSquare className="w-12 h-12 text-[#808080] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Tickets</h3>
            <p className="text-[#808080] mb-4">
              {filterStatus
                ? "No tickets found with this status"
                : "You haven't created any support tickets yet"}
            </p>
            {!filterStatus && (
              <Link href="/sellers/dashboard/support-tickets/create">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Create Your First Ticket
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/sellers/dashboard/support-tickets/${ticket.id}`}
              >
                <div className="bg-[#141414] border border-[#2B2B2B] rounded-lg p-4 hover:border-purple-500 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {ticket.subject}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {getStatusLabel(ticket.status)}
                        </span>
                        {ticket.priority !== "medium" && (
                          <span
                            className={`text-sm font-medium ${
                              PRIORITIES[ticket.priority as keyof typeof PRIORITIES]
                            }`}
                          >
                            {ticket.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-[#808080] text-sm mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#808080]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(ticket.createdAt)}
                        </span>
                        <span className="capitalize">{ticket.category.replace(/_/g, " ")}</span>
                        {ticket.sellerId && (
                          <span className="text-[#606060]">
                            Seller ID: {ticket.sellerId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#808080] flex-shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}