/**
 * Seller Query Hooks Module
 * Central export for all seller-related React Query hooks
 */

export {
  usePendingOrders,
  useOrdersByStatus,
  useOrderById,
  useOrderStats,
  useConfirmOrder,
  useCancelOrder,
  useUpdateOrderStatus,
  useShipOrder,
  prefetchPendingOrders,
  type PendingOrder,
  type PendingOrdersFilters,
} from './usePendingOrders';

export {
  useGetTickets,
  useGetTicket,
  useUpdateTicket,
  useCloseTicket,
  useReplyToTicket,
  useGetTicketReplies,
  useDeleteReply,
  useGetTicketsStats,
  useTicketsByStatus,
  useUrgentTickets,
  type SupportTicket,
  type TicketReply,
  type SupportStats,
} from './useSupport';

export {
  useUpdateListing,
  useUpdateListingPrice,
  useUpdateListingStock,
  useUpdateListingShipping,
  type UpdateListingInput,
} from './useUpdateListing';

export {
  usePayoutStats,
  usePayoutHistory,
} from './usePayoutStats';

export {
  usePayoutMethods,
  useAddPayoutMethod,
  useUpdatePayoutMethod,
  useDeletePayoutMethod,
} from './usePayoutMethods';

export { useProductVariants } from './useProductVariants';

export { useShippingConfiguration } from './useShippingConfiguration';

export { useOrderTransitions } from './useOrderTransitions';

export { useFinancialLedger } from './useFinancialLedger';

export { useInventoryReservations } from './useInventoryReservations';

export { useSales, prefetchSales, type Sale } from './useSales';

export { sellerQueryKeys, supportKeys, queryKeys } from './queryKeys';