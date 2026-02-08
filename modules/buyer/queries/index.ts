// Profile Hooks
export {
  useProfile,
  useCreateBuyerProfile,
  useUpdateProfile,
  useUploadProfilePicture,
} from "./useProfile";

// Billing Address Hooks
export {
  useBillingAddresses,
  useBillingAddressById,
  useCreateBillingAddress,
  useUpdateBillingAddress,
  useDeleteBillingAddress,
  useSetDefaultBillingAddress,
} from "./useBillingAddress";

// Favorites Hooks
export {
  useFavorites,
  useAddToFavorites,
  useRemoveFromFavorites,
  useToggleFavorite,
} from "./useFavorites";

// Orders Hooks
export {
  useOrders,
  useOrderById,
  useCancelOrder,
  useReturnOrder,
} from "./useOrders";

// Product Browse Hooks
export {
  useSearchListings,
  useListingById,
  useBrands,
  useBrandById,
  useBrandListings,
  useCollectionById,
  useCollectionListings,
} from "./useProductBrowse";

// Collections Hooks
export {
  useCollections,
  useCollectionDetails,
  type Collection,
} from "./useCollections";

// Collection Products Hooks
export {
  useCollectionProducts,
  type CollectionProduct,
  type ProductImage,
  type ProductVariant,
  type InventoryInfo,
  type ItemsJSON,
  type CollectionDisplayData,
  type CollectionListing,
  type UseCollectionProductsResult,
  type UseCollectionProductsOptions,
} from "./useCollectionProducts";

// Cart Hooks
export {
  useCartItems,
  useCartSummary,
  useAddToCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart,
  useCheckout,
} from "./useCart";

// Review Hooks
export {
  useListingReviews,
  useMyReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useLikeReview,
} from "./useReviews";

// Refund Hooks
export {
  useRefunds,
  useRefundById,
  useRefundsByOrder,
  useRequestRefund,
  useCancelRefundRequest,
  useUploadRefundProof,
} from "./useRefunds";

// Payment Hooks
export {
  usePaymentMethods,
  usePaymentMethodById,
  useAddPaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  usePaymentTransactions,
  usePaymentTransactionById,
} from "./usePayment";

// Inventory Hooks
export {
  useInventory,
  useReserveInventory,
  useReleaseReservation,
  useConfirmReservation,
  useMyReservations,
} from "./useInventory";

// Payment Confirmation Hooks
export {
  useCreatePaymentIntent,
  useConfirmPayment,
  usePaymentStatus,
  useRefundPayment,
  useMyPayments,
  usePaymentWebhook,
} from "./usePaymentConfirmation";

// Order Status Hooks
export {
  useOrderStatus,
  useUpdateOrderStatus,
  useConfirmOrderReceipt,
  useOrderTracking,
  useOrdersByStatus,
  useOrderStats,
  useOrderHistory,
  useSellerOrdersByStatus,
  useSellerOrderStats,
  usePendingOrders,
  useProcessingOrders,
  useShippedOrders,
  useDeliveredOrders,
  useCompletedOrders,
} from "./useOrderStatus";

// Shipping Hooks
export {
  useShipping,
} from "./useShipping";

// Email Notification Hooks
export {
  useEmailNotification,
} from "./useEmailNotification";

// Support Hooks
export {
  useCreateTicket,
  useGetTickets,
  useGetTicket,
  useUpdateTicket,
  useCloseTicket,
  useDeleteTicket,
  useReplyToTicket,
  useGetTicketReplies,
  useDeleteReply,
  useGetTicketsStats,
  type SupportTicket,
  type TicketReply,
  type SupportStats,
} from "./useSupport";

// Notification Hooks
export {
  useNotifications,
  useNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useToggleNotificationFavorite,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "./useNotifications";

// Query Keys
export {
  buyerQueryKeys,
  inventoryKeys,
  paymentKeys,
  orderKeys,
  shippingKeys,
  emailKeys,
  webhookKeys,
  supportKeys,
  queryKeys,
} from "./queryKeys";