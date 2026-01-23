import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { toastSvc } from '@/services/toast';

export const useInventoryReservations = () => {
  const queryClient = useQueryClient();

  // Get all inventory reservations
  const getAllReservations = trpc.inventory.getInventoryReservations.useQuery(
    undefined,
    { staleTime: 1000 * 60 * 5 }
  );

  // Get reservations by product ID
  const getReservationsByProduct = (productId: string) =>
    trpc.inventory.getInventoryReservations.useQuery(
      { productId },
      { staleTime: 1000 * 60 * 5, enabled: !!productId }
    );

  // Create a new reservation
  const createReservation = trpc.inventory.reserveInventory.useMutation({
    onSuccess: () => {
      toastSvc.success('Inventory reserved successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory', 'reservations'] });
    },
    onError: (error: any) => {
      toastSvc.error(error.message || 'Failed to reserve inventory');
    },
  });

  // Release/cancel a reservation
  const releaseReservation = trpc.inventory.releaseInventory.useMutation({
    onSuccess: () => {
      toastSvc.success('Inventory reservation released');
      queryClient.invalidateQueries({ queryKey: ['inventory', 'reservations'] });
    },
    onError: (error: any) => {
      toastSvc.error(error.message || 'Failed to release inventory');
    },
  });

  // Get reservation status
  const getReservationStatus = (reservationId: string) =>
    trpc.inventory.getInventoryReservations.useQuery(
      { reservationId },
      { enabled: !!reservationId }
    );

  return {
    getAllReservations,
    getReservationsByProduct,
    createReservation,
    releaseReservation,
    getReservationStatus,
  };
};