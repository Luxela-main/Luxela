/**
 * Query keys for seller operations
 * Maintains a hierarchical key structure for React Query cache management
 */

export const sellerQueryKeys = {
  all: ['seller'] as const,
  listings: () => [...sellerQueryKeys.all, 'listings'] as const,
  listingById: (listingId: string) =>
    [...sellerQueryKeys.listings(), 'byId', listingId] as const,
  listingsByType: (type: 'single' | 'collection') =>
    [...sellerQueryKeys.listings(), 'byType', type] as const,
  listingsByStatus: (status: string, limit?: number, offset?: number) =>
    [...sellerQueryKeys.listings(), 'byStatus', status, limit, offset] as const,
  orders: () => [...sellerQueryKeys.all, 'orders'] as const,
  ordersByStatus: (status: string, limit?: number, offset?: number) =>
    [...sellerQueryKeys.orders(), 'byStatus', status, limit, offset] as const,
  pendingOrders: (limit?: number, offset?: number) =>
    [...sellerQueryKeys.orders(), 'pending', limit, offset] as const,
  confirmedOrders: (limit?: number, offset?: number) =>
    [...sellerQueryKeys.orders(), 'confirmed', limit, offset] as const,
  processingOrders: (limit?: number, offset?: number) =>
    [...sellerQueryKeys.orders(), 'processing', limit, offset] as const,
  shippedOrders: (limit?: number, offset?: number) =>
    [...sellerQueryKeys.orders(), 'shipped', limit, offset] as const,
  deliveredOrders: (limit?: number, offset?: number) =>
    [...sellerQueryKeys.orders(), 'delivered', limit, offset] as const,
  canceledOrders: (limit?: number, offset?: number) =>
    [...sellerQueryKeys.orders(), 'canceled', limit, offset] as const,
  orderById: (orderId: string) =>
    [...sellerQueryKeys.orders(), 'byId', orderId] as const,
  orderStats: (startDate?: Date, endDate?: Date) =>
    [
      ...sellerQueryKeys.all,
      'orderStats',
      startDate?.toISOString(),
      endDate?.toISOString(),
    ] as const,
  dashboard: () => [...sellerQueryKeys.all, 'dashboard'] as const,
  sales: (status?: string) =>
    status
      ? ([...sellerQueryKeys.all, 'sales', status] as const)
      : ([...sellerQueryKeys.all, 'sales'] as const),
  sale: (saleId: string) =>
    [...sellerQueryKeys.all, 'sales', 'byId', saleId] as const,
  salesByStatus: (status: string, limit?: number, offset?: number) =>
    [...sellerQueryKeys.sales(status), 'byStatus', status, limit, offset] as const,
  inventory: () => [...sellerQueryKeys.all, 'inventory'] as const,
  inventoryByListing: (listingId: string) =>
    [...sellerQueryKeys.inventory(), listingId] as const,
  payouts: () => [...sellerQueryKeys.all, 'payouts'] as const,
  payoutStats: () => [...sellerQueryKeys.payouts(), 'stats'] as const,
  payoutHistory: (month?: string, year?: number) =>
    [...sellerQueryKeys.payouts(), 'history', month, year] as const,
  payoutMethods: () => [...sellerQueryKeys.payouts(), 'methods'] as const,
  returns: () => [...sellerQueryKeys.all, 'returns'] as const,
  returnsByStatus: (status: string, limit?: number, offset?: number) =>
    [...sellerQueryKeys.returns(), 'byStatus', status, limit, offset] as const,
  disputes: () => [...sellerQueryKeys.all, 'disputes'] as const,
  reviews: () => [...sellerQueryKeys.all, 'reviews'] as const,
  shippingSettings: () => [...sellerQueryKeys.all, 'shippingSettings'] as const,
  profile: () => [...sellerQueryKeys.all, 'profile'] as const,
  support: () => [...sellerQueryKeys.all, 'support'] as const,
  financialLedger: () => [...sellerQueryKeys.all, 'financialLedger'] as const,
  ledgerEntry: (entryId: string) =>
    [...sellerQueryKeys.financialLedger(), entryId] as const,
};

export const supportKeys = {
  all: () => ['support'] as const,
  list: (status?: string) =>
    [...supportKeys.all(), 'list', status] as const,
  detail: (ticketId: string) =>
    [...supportKeys.all(), 'detail', ticketId] as const,
  replies: (ticketId: string) =>
    [...supportKeys.all(), 'replies', ticketId] as const,
  stats: () => [...supportKeys.all(), 'stats'] as const,
  urgent: () => [...supportKeys.all(), 'urgent'] as const,
};

/**
 * Export all query keys in a flat structure for easy access
 */
export const queryKeys = {
  seller: sellerQueryKeys,
  support: supportKeys,
};