"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/_trpc/client";
import { useQueryClient } from "@tanstack/react-query";

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

export default function EditTicketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const updateMutation = trpc.support.updateTicket.useMutation({
    onSuccess: () => {
      
      queryClient.invalidateQueries({
        queryKey: [['support', 'getTicket'], { input: { ticketId } }],
      });
    },
  });

  
  const ticketQuery = trpc.support.getTicket.useQuery(
    { ticketId },
    {
      enabled: !!user?.id && !!ticketId,
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
      setFormData({
        title: convertedTicket.subject,
        description: convertedTicket.description,
        category: convertedTicket.category,
        priority: convertedTicket.priority,
      });
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

  
  
  const canEdit =
    ticket.status === "open" || ticket.status === "in_progress";

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-[#808080] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-white">Edit Ticket</h1>
          </div>

          <div className="bg-[#141414] border border-[#2B2B2B] rounded-lg p-6">
            <p className="text-[#808080]">
              This ticket cannot be edited. Only open or in-progress tickets
              created by you can be edited.
            </p>
            <Button
              onClick={() => router.back()}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.category
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        ticketId,
        subject: formData.title,
        description: formData.description,
      });
      toast.success("Ticket updated successfully");
      
      setTimeout(() => {
        router.push(`/buyer/dashboard/support-tickets/${ticketId}`);
      }, 500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to update ticket";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] p-6">
      <div className="max-w-4xl mx-auto">
        {}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-[#808080] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Edit Ticket</h1>
        </div>

        {}
        <div className="bg-[#141414] border border-[#2B2B2B] rounded-lg p-6">
          <div className="space-y-6">
            {}
            <div>
              <label className="block text-sm font-medium text-[#DCDCDC] mb-2">
                Subject
              </label>
              <Input
                placeholder="Brief description of your issue"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="bg-[#0E0E0E] border-[#2B2B2B] text-white"
              />
              <p className="text-xs text-[#808080] mt-1">Min 5 characters</p>
            </div>

            {}
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

            {}
            <div>
              <label className="block text-sm font-medium text-[#DCDCDC] mb-2">
                Priority
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    priority: value as "low" | "medium" | "high" | "urgent",
                  })
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

            {}
            <div>
              <label className="block text-sm font-medium text-[#DCDCDC] mb-2">
                Description
              </label>
              <Textarea
                placeholder="Please provide detailed information about your issue"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-[#0E0E0E] border-[#2B2B2B] text-white min-h-[200px]"
              />
              <p className="text-xs text-[#808080] mt-1">Min 10 characters</p>
            </div>

            {}
            <div className="border-t border-[#2B2B2B] pt-6 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-[#2B2B2B] text-white hover:bg-[#141414]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}