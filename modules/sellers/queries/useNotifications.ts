import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { sellersKeys } from './queryKeys';

export interface Notification {
  id: string;
  sellerId: string;
  type: 'purchase' | 'review' | 'comment' | 'reminder';
  message: string;
  isRead: boolean;
  isStarred: boolean;
  createdAt: Date;
}

export const useNotifications = () => {
  return useQuery<Notification[]>({
    queryKey: sellersKeys.notifications(),
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.notifications() });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.notifications() });
    },
  });
};

export const useToggleNotificationStar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/notifications/${id}/star`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.notifications() });
    },
  });
};
