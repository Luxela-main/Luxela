export const buyerQueryKeys = {
  all: ["buyer"] as const,
  profile: () => [...buyerQueryKeys.all, "profile"] as const,
  accountDetails: () => [...buyerQueryKeys.all, "accountDetails"] as const,
  billingAddresses: () => [...buyerQueryKeys.all, "billingAddresses"] as const,
  billingAddressById: (id: string) =>
    [...buyerQueryKeys.billingAddresses(), id] as const,
  favorites: () => [...buyerQueryKeys.all, "favorites"] as const,
  orders: () => [...buyerQueryKeys.all, "orders"] as const,
  orderById: (id: string) => [...buyerQueryKeys.orders(), id] as const,
  orderStats: () => [...buyerQueryKeys.all, "orderStats"] as const,
};

export const inventoryKeys = {
  all: ["inventory"] as const,
  inventory: (listingId: string) =>
    [...inventoryKeys.all, "inventory", listingId] as const,
  myReservations: () => [...inventoryKeys.all, "myReservations"] as const,
};

export const paymentKeys = {
  all: ["payment"] as const,
  list: (limit: number, offset: number) =>
    [...paymentKeys.all, "list", limit, offset] as const,
  status: (intentId: string) => [...paymentKeys.all, "status", intentId] as const,
};

export const orderKeys = {
  all: ["order"] as const,
  status: (orderId: string) => [...orderKeys.all, "status", orderId] as const,
  tracking: (orderId: string) =>
    [...orderKeys.all, "tracking", orderId] as const,
  history: (orderId: string) =>
    [...orderKeys.all, "history", orderId] as const,
  byStatus: (status: string, limit?: number, offset?: number) =>
    [...orderKeys.all, "byStatus", status, limit, offset] as const,
  stats: (startDate?: Date, endDate?: Date) =>
    [
      ...orderKeys.all,
      "stats",
      startDate?.toISOString(),
      endDate?.toISOString(),
    ] as const,
};

export const shippingKeys = {
  all: ["shipping"] as const,
  costs: () => [...shippingKeys.all, "costs"] as const,
  rates: () => [...shippingKeys.all, "rates"] as const,
  options: () => [...shippingKeys.all, "options"] as const,
  zones: () => [...shippingKeys.all, "zones"] as const,
};

export const emailKeys = {
  all: ["email"] as const,
  history: () => [...emailKeys.all, "history"] as const,
  templates: () => [...emailKeys.all, "templates"] as const,
  byOrder: (orderId: string) =>
    [...emailKeys.all, "byOrder", orderId] as const,
};

export const webhookKeys = {
  all: ["webhook"] as const,
  failed: () => [...webhookKeys.all, "failed"] as const,
  stats: () => [...webhookKeys.all, "stats"] as const,
  details: () => [...webhookKeys.all, "details"] as const,
  health: () => [...webhookKeys.all, "health"] as const,
};

export const supportKeys = {
  all: () => ["support"] as const,
  list: (status?: string) =>
    [...supportKeys.all(), "list", status] as const,
  detail: (ticketId: string) =>
    [...supportKeys.all(), "detail", ticketId] as const,
  replies: (ticketId: string) =>
    [...supportKeys.all(), "replies", ticketId] as const,
  stats: () => [...supportKeys.all(), "stats"] as const,
};

export const brandKeys = {
  all: ["brands"] as const,
  list: () => [...brandKeys.all, "list"] as const,
  brands: (page: number, limit: number, search?: string, sortBy?: string) =>
    [...brandKeys.list(), page, limit, search, sortBy] as const,
  details: () => [...brandKeys.all, "details"] as const,
  brandDetails: (brandId: string) =>
    [...brandKeys.details(), brandId] as const,
  sellerBrands: () => [...brandKeys.all, "sellerBrands"] as const,
  sellerBrandsWithProducts: (sellerId: string, page?: number, limit?: number) =>
    [...brandKeys.sellerBrands(), sellerId, page, limit] as const,
};

export const queryKeys = {
  shipping: shippingKeys,
  email: emailKeys,
  webhook: webhookKeys,
  buyer: buyerQueryKeys,
  inventory: inventoryKeys,
  payment: paymentKeys,
  order: orderKeys,
  support: supportKeys,
  brands: brandKeys.brands,
  brandDetails: brandKeys.brandDetails,
  sellerBrandsWithProducts: brandKeys.sellerBrandsWithProducts,
};