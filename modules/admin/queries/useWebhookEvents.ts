import { trpc } from '@/lib/trpc';
import { useQueryClient } from '@tanstack/react-query';

export const useWebhookEvents = () => {
  const queryClient = useQueryClient();

  // Get webhook events with pagination
  const getWebhookEvents = trpc.webhook.getWebhookEvents.useQuery(
    { limit: 50, offset: 0 },
    { staleTime: 1000 * 60, refetchInterval: 1000 * 60 } // Refetch every minute
  );

  // Get events by type
  const getEventsByType = (eventType: string) => {
    return trpc.webhook.getEventsByType.useQuery(
      { eventType, limit: 50 },
      { enabled: !!eventType, staleTime: 1000 * 60 }
    );
  };

  // Create webhook event (internal logging)
  const createWebhookEvent = trpc.webhook.createWebhookEvent.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'getWebhookEvents'] });
    },
  });

  // Retry failed webhook
  const retryFailedEvent = trpc.webhook.retryFailedEvent.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'getWebhookEvents'] });
    },
  });

  // Get failed events
  const getFailedEvents = trpc.webhook.getFailedEvents.useQuery(
    { limit: 50 },
    { staleTime: 1000 * 60 }
  );

  // Mark event as processed
  const markEventAsProcessed = trpc.webhook.markEventAsProcessed.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'getWebhookEvents'] });
    },
  });

  return {
    getWebhookEvents,
    getEventsByType,
    createWebhookEvent,
    retryFailedEvent,
    getFailedEvents,
    markEventAsProcessed,
  };
};