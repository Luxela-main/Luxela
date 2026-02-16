import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellersKeys } from "./queryKeys";
import { toastSvc } from "@/services/toast";
import { getVanillaTRPCClient } from "@/lib/trpc";

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category:
    | "general_inquiry"
    | "technical_issue"
    | "payment_problem"
    | "order_issue"
    | "refund_request"
    | "account_issue"
    | "listing_help"
    | "other";
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export const useSupportTickets = () => {
  return useQuery<SupportTicket[]>({
    queryKey: sellersKeys.support(),
    queryFn: async () => {
      const client: any = getVanillaTRPCClient();
      return await client.support.getTickets.query({});
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSupportTicketById = (ticketId: string) => {
  return useQuery<SupportTicket>({
    queryKey: [...sellersKeys.support(), ticketId],
    queryFn: async () => {
      const client: any = getVanillaTRPCClient();
      return await client.support.getTicket.query({ ticketId });
    },
    enabled: !!ticketId,
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subject,
      description,
      category,
      priority,
    }: {
      subject: string;
      description: string;
      category: SupportTicket["category"];
      priority?: SupportTicket["priority"];
    }) => {
      const client: any = getVanillaTRPCClient();
      return await client.support.createTicket({
        subject,
        description,
        category,
        priority: priority || "medium",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.support() });
      toastSvc.success("Support ticket created successfully");
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
};

export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
      priority,
    }: {
      ticketId: string;
      status?: SupportTicket["status"];
      priority?: SupportTicket["priority"];
    }) => {
      const client: any = getVanillaTRPCClient();
      return await client.support.updateTicket({
        ticketId,
        status,
        priority,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.support() });
      toastSvc.success("Support ticket updated successfully");
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
};

export const useDeleteSupportTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId }: { ticketId: string }) => {
      const client: any = getVanillaTRPCClient();
      return await client.support.deleteTicket({ ticketId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.support() });
      toastSvc.success("Support ticket deleted successfully");
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
};

export const useCloseTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId }: { ticketId: string }) => {
      const client: any = getVanillaTRPCClient();
      return await client.support.closeTicket({ ticketId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.support() });
      toastSvc.success("Support ticket closed successfully");
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
};

export interface TicketReply {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'buyer' | 'seller' | 'admin';
  message: string;
  attachmentUrl?: string;
  createdAt: Date;
}

export const useTicketReplies = (ticketId: string) => {
  return useQuery<TicketReply[]>({
    queryKey: [...sellersKeys.support(), ticketId, 'replies'],
    queryFn: async () => {
      const client: any = getVanillaTRPCClient();
      return await client.support.getTicketReplies.query({ ticketId });
    },
    enabled: !!ticketId,
  });
};

export const useReplyToTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      message,
      attachmentUrl,
    }: {
      ticketId: string;
      message: string;
      attachmentUrl?: string;
    }) => {
      const client: any = getVanillaTRPCClient();
      return await client.support.replyToTicket({
        ticketId,
        message,
        attachmentUrl,
      });
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({
        queryKey: [...sellersKeys.support(), ticketId, 'replies'],
      });
      queryClient.invalidateQueries({ queryKey: sellersKeys.support() });
      toastSvc.success("Reply added successfully");
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
};

export const useDeleteReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ replyId, ticketId }: { replyId: string; ticketId: string }) => {
      const client: any = getVanillaTRPCClient();
      return await client.support.deleteReply({ replyId });
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({
        queryKey: [...sellersKeys.support(), ticketId, 'replies'],
      });
      toastSvc.success("Reply deleted successfully");
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
};

export interface TicketsStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
}

export const useTicketsStats = () => {
  return useQuery<TicketsStats>({
    queryKey: [...sellersKeys.support(), 'stats'],
    queryFn: async () => {
      const client: any = getVanillaTRPCClient();
      return await client.support.getTicketsStats.query({});
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};