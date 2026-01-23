import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { getVanillaTRPCClient } from '@/lib/trpc';
const trpc = getVanillaTRPCClient();
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

export interface SupportStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
}

/**
 * Get all support tickets for the seller
 */
export function useGetTickets(
  status?: TicketStatus
): UseQueryResult<SupportTicket[], Error> {
  return useQuery({
    queryKey: supportKeys.list(status),
    queryFn: async () => {
      const result = await ((trpc.support as any).getTickets as any).query({ status });
      return (result as any[]).map((t) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
      })) as SupportTicket[];
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60, // Auto-refresh every 60 seconds
  });
}

/**
 * Get a specific support ticket with permission check
 */
export function useGetTicket(
  ticketId: string
): UseQueryResult<SupportTicket, Error> {
  return useQuery({
    queryKey: supportKeys.detail(ticketId),
    queryFn: async () => {
      const result = await ((trpc.support as any).getTicket as any).query({ ticketId });
      return {
        ...result,
        createdAt: new Date((result as any).createdAt),
        updatedAt: new Date((result as any).updatedAt),
        resolvedAt: (result as any).resolvedAt ? new Date((result as any).resolvedAt) : null,
      } as SupportTicket;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!ticketId,
  });
}

/**
 * Update a support ticket (status, priority, category)
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
      return {
        ...result,
        createdAt: new Date((result as any).createdAt),
        updatedAt: new Date((result as any).updatedAt),
        resolvedAt: (result as any).resolvedAt ? new Date((result as any).resolvedAt) : null,
      } as SupportTicket;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: supportKeys.list() });
      queryClient.invalidateQueries({ queryKey: supportKeys.stats() });
    },
  });
}

/**
 * Close a support ticket (marks as resolved and closed)
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
      return {
        ...result,
        createdAt: new Date((result as any).createdAt),
        updatedAt: new Date((result as any).updatedAt),
        resolvedAt: (result as any).resolvedAt ? new Date((result as any).resolvedAt) : null,
      } as SupportTicket;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: supportKeys.list() });
      queryClient.invalidateQueries({ queryKey: supportKeys.stats() });
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
      return {
        ...result,
        createdAt: new Date((result as any).createdAt),
      } as TicketReply;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: supportKeys.replies(data.ticketId),
      });
      queryClient.invalidateQueries({ queryKey: supportKeys.detail(data.ticketId) });
      queryClient.invalidateQueries({ queryKey: supportKeys.list() });
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
      const result = await ((trpc.support as any).getTicketReplies as any).query({ ticketId });
      return (result as any[]).map((r) => ({
        ...r,
        createdAt: new Date(r.createdAt),
      })) as TicketReply[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds for live conversation
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
 * Get support statistics for the seller's dashboard
 */
export function useGetTicketsStats(): UseQueryResult<SupportStats, Error> {
  return useQuery({
    queryKey: supportKeys.stats(),
    queryFn: async () => {
      const result = await ((trpc.support as any).getTicketsStats as any).query();
      return result as SupportStats;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 2, // Auto-refresh every 2 minutes
  });
}

/**
 * Get filtered tickets - combines multiple queries for dashboard
 */
export function useTicketsByStatus(
  status: TicketStatus
): UseQueryResult<SupportTicket[], Error> {
  return useQuery({
    queryKey: supportKeys.list(status),
    queryFn: async () => {
      const result = await ((trpc.support as any).getTickets as any).query({ status });
      return (result as any[]).map((t) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
      })) as SupportTicket[];
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchInterval: 1000 * 60, // Auto-refresh every 60 seconds
  });
}

/**
 * Get urgently prioritized tickets
 */
export function useUrgentTickets(): UseQueryResult<SupportTicket[], Error> {
  return useQuery({
    queryKey: [...supportKeys.list(), 'urgent'],
    queryFn: async () => {
      const result = await ((trpc.support as any).getTickets as any).query({});
      // Filter urgent tickets client-side
      return (result as any[]).map((t) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
      })).filter(
        (t) => t.priority === 'urgent' && t.status !== 'closed'
      ) as SupportTicket[];
    },
    staleTime: 1000 * 60 * 1, // 1 minute (urgent tickets need fresher data)
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
}