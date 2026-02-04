"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateSupportTicketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = trpc.support.createSellerTicket.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || formData.subject.length < 5) {
      toast.error("Subject must be at least 5 characters");
      return;
    }

    if (!formData.description.trim() || formData.description.length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createMutation.mutateAsync({
        subject: formData.subject,
        description: formData.description,
        category: formData.category as any,
        priority: formData.priority,
      });

      toast.success("Support ticket created successfully");
      router.push(`/sellers/dashboard/support-tickets/${result.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create ticket";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-[#808080] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Create Support Ticket</h1>
        </div>

        {/* Form */}
        <div className="bg-[#141414] border border-[#2B2B2B] rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-[#DCDCDC] mb-2">
                Subject *
              </label>
              <Input
                placeholder="Brief description of your issue"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="bg-[#0E0E0E] border-[#2B2B2B] text-white"
                minLength={5}
              />
              <p className="text-xs text-[#808080] mt-1">Minimum 5 characters</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[#DCDCDC] mb-2">
                Category *
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger className="bg-[#0E0E0E] border-[#2B2B2B] text-white cursor-pointer">
                  <SelectValue placeholder="Select a category" />
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
                Priority *
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
                <SelectTrigger className="bg-[#0E0E0E] border-[#2B2B2B] text-white cursor-pointer">
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
                Description *
              </label>
              <Textarea
                placeholder="Please provide detailed information about your issue"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-[#0E0E0E] border-[#2B2B2B] text-white min-h-[200px]"
                minLength={10}
              />
              <p className="text-xs text-[#808080] mt-1">Minimum 10 characters</p>
            </div>

            {/* Actions */}
            <div className="border-t border-[#2B2B2B] pt-6 flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-[#2B2B2B] text-white hover:bg-[#141414]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                {isSubmitting || createMutation.isPending ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}