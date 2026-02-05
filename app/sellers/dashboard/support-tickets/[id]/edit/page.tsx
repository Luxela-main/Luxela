"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch ticket details
  const ticketQuery = trpc.support.getTicket.useQuery(
    { ticketId },
    {
      enabled: !!user?.id && !!ticketId,
    }
  );

  const queryClient = useQueryClient();
  const updateMutation = trpc.support.updateTicket.useMutation({
    onSuccess: () => {
      // Invalidate the ticket query to force a refetch
      queryClient.invalidateQueries({
        queryKey: [['support', 'getTicket'], { input: { ticketId } }],
      });
    },
  });

  useEffect(() => {
    if (ticketQuery.data) {
      const convertedTicket = {
        ...ticketQuery.data,
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

  // Check if ticket can be edited (only if status is open or in_progress)
  const canEdit = ticket.status === "open" || ticket.status === "in_progress";

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
              can be edited.
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
    if (!formData.title.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
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
      // Navigate back to detail view after successful update
      setTimeout(() => {
        router.push(`/sellers/dashboard/support-tickets/${ticketId}`);
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-[#ECBEE3]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-[#808080] hover:text-[#EA795B] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Edit Ticket</h1>
        </div>

        {/* Edit Form */}
        <div className="bg-[#141414] border border-[#2B2B2B] rounded-lg p-6">
          <div className="space-y-6">
            {/* Subject */}
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

            {/* Description */}
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

            {/* Action Buttons */}
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
                disabled={isSaving || updateMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                {isSaving || updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}