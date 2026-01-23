import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { trpc } from '@/lib/_trpc/client';
import { supportKeys } from './queryKeys';

// Types from backend
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketCategory =
  | 'general_inquiry'
  | 'technical_issue'
  | 'payment_problem'
  | 'order_issue'
  | 'refund_request'
  | 'account_issue'
  | 'listing_help'
  | 'other';
type SenderRole = 'buyer' | 'seller' | 'admin';

export interface SupportTicket {
  id: string;
  buyerId: string;
  sellerId: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: SenderRole;
  message: string;
  attachmentUrl: string | null;
  createdAt: Date;
}

/**
 * Create a new support ticket
 */
export function useCreateTicket(): UseMutationResult<
  SupportTicket,
  Error,
  {
    subject: string;
    description: string;
    category: TicketCategory;
    priority?: TicketPriority;
  }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const result = await (trpc.support as any).createTicket.mutate(data);
      return result as SupportTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.all() });
    },
  });
}

/**
 * Get all support tickets for the current user
 */
export function useGetTickets(
  status?: TicketStatus
): UseQueryResult<SupportTicket[], Error> {
  return useQuery({
    queryKey: supportKeys.list(status),
    queryFn: async () => {
      const result = await (trpc.support as any).getTickets.query({ status });
      return result as SupportTicket[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Get a specific support ticket
 */
export function useGetTicket(
  ticketId: string
): UseQueryResult<SupportTicket, Error> {
  return useQuery({
    queryKey: supportKeys.detail(ticketId),
    queryFn: async () => {
      const result = await (trpc.support as any).getTicket.query({ ticketId });
      return result as SupportTicket;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!ticketId,
  });
}

/**
 * Update a support ticket
 */
export function useUpdateTicket(): UseMutationResult<
  SupportTicket,
  Error,
  {
    ticketId: string;
    subject?: string;
    description?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
  }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const result = await (trpc.support as any).updateTicket.mutate(data);
      return result as SupportTicket;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: supportKeys.list() });
    },
  });
}

/**
 * Close a support ticket
 */
export function useCloseTicket(): UseMutationResult<
  SupportTicket,
  Error,
  { ticketId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId }) => {
      const result = await (trpc.support as any).closeTicket.mutate({ ticketId });
      return result as SupportTicket;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: supportKeys.list() });
    },
  });
}

/**
 * Delete a support ticket
 */
export function useDeleteTicket(): UseMutationResult<
  { success: boolean },
  Error,
  { ticketId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId }) => {
      const result = await (trpc.support as any).deleteTicket.mutate({ ticketId });
      return result as { success: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.all() });
    },
  });
}

/**
 * Reply to a support ticket
 */
export function useReplyToTicket(): UseMutationResult<
  TicketReply,
  Error,
  {
    ticketId: string;
    message: string;
    attachmentUrl?: string;
  }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const result = await (trpc.support as any).replyToTicket.mutate(data);
      return result as TicketReply;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: supportKeys.replies(data.ticketId),
      });
      queryClient.invalidateQueries({ queryKey: supportKeys.detail(data.ticketId) });
    },
  });
}

/**
 * Get all replies for a ticket
 */
export function useGetTicketReplies(
  ticketId: string
): UseQueryResult<TicketReply[], Error> {
  return useQuery({
    queryKey: supportKeys.replies(ticketId),
    queryFn: async () => {
      const result = await (trpc.support as any).getTicketReplies.query({ ticketId });
      return result as TicketReply[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!ticketId,
  });
}

/**
 * Delete a ticket reply
 */
export function useDeleteReply(): UseMutationResult<
  { success: boolean },
  Error,
  { replyId: string; ticketId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ replyId }) => {
      const result = await (trpc.support as any).deleteReply.mutate({ replyId });
      return result as { success: boolean };
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({
        queryKey: supportKeys.replies(ticketId),
      });
    },
  });
}

/**
 * Get support statistics
 */
export interface SupportStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
}

export function useGetTicketsStats(): UseQueryResult<SupportStats, Error> {
  return useQuery({
    queryKey: supportKeys.stats(),
    queryFn: async () => {
      const result = await (trpc.support as any).getTicketsStats.query();
      return result as SupportStats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });
}