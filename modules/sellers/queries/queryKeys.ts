// Query keys for sellers data
export const sellersKeys = {
  all: ['sellers'] as const,
  profile: () => [...sellersKeys.all, 'profile'] as const,
  listings: () => [...sellersKeys.all, 'listings'] as const,
  sales: (status?: string) => [...sellersKeys.all, 'sales', status ?? 'all'] as const,
  notifications: () => [...sellersKeys.all, 'notifications'] as const,
  dashboard: () => [...sellersKeys.all, 'dashboard'] as const,
} as const;
