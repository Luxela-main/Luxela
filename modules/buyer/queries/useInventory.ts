import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { toastSvc } from '@/services/toast';
import { inventoryKeys } from './queryKeys';

export function useInventory(listingId: string) {
  return trpc.inventory.getInventory.useQuery(
    { listingId },
    {
      staleTime: 30 * 1000, // 30 seconds - inventory changes frequently
    }
  );
}

export function useReserveInventory() {
  const queryClient = useQueryClient();
  
  return trpc.inventory.reserveInventory.useMutation({
    onSuccess: (data, variables) => {
      toastSvc.success('Item reserved successfully');
      
      // Invalidate inventory query
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.inventory(variables.listingId),
      });
      
      // Invalidate reservations
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.myReservations(),
      });
    },
    onError: (error: any) => {
      const message =
        error?.message || 'Failed to reserve item. Please check stock availability.';
      toastSvc.error(message);
    },
  });
}

export function useReleaseReservation() {
  const queryClient = useQueryClient();
  
  return trpc.inventory.releaseReservation.useMutation({
    onSuccess: () => {
      toastSvc.success('Reservation released');
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.myReservations(),
      });
    },
    onError: (error: any) => {
      toastSvc.error(error?.message || 'Failed to release reservation');
    },
  });
}

export function useConfirmReservation() {
  const queryClient = useQueryClient();
  
  return trpc.inventory.confirmReservation.useMutation({
    onSuccess: () => {
      toastSvc.success('Inventory confirmed for order');
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.myReservations(),
      });
    },
    onError: (error: any) => {
      toastSvc.error(error?.message || 'Failed to confirm inventory');
    },
  });
}

export function useMyReservations() {
  return trpc.inventory.getInventoryReservations.useQuery(
    undefined,
    {
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );
}