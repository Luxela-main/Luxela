import type { Order, OrderStatus, OrderFilterType } from '@/types/buyer';

export function formatPrice(amountCents: number, currency: string = 'NGN'): string {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amountCents / 100);
}

export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    canceled: 'Canceled',
    returned: 'Returned',
  };
  return labels[status] || status;
}

export function getStatusColorClasses(
  status: string
): { bg: string; text: string; icon: string } {
  switch (status.toLowerCase()) {
    case 'delivered':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        icon: 'text-green-500',
      };
    case 'canceled':
    case 'returned':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        icon: 'text-red-500',
      };
    case 'shipped':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        icon: 'text-blue-500',
      };
    default:
      return {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        icon: 'text-yellow-500',
      };
  }
}

export function canConfirmDelivery(order: Order): boolean {
  return order.orderStatus === 'shipped';
}

export function canReturnOrder(order: Order): boolean {
  return (
    order.orderStatus === 'delivered' &&
    (!order.deliveredDate || Date.now() - order.deliveredDate.getTime() < 30 * 24 * 60 * 60 * 1000)
  );
}

export function filterOrdersByStatus(orders: Order[], filter: OrderFilterType): Order[] {
  switch (filter) {
    case 'ongoing':
      return orders.filter((o) =>
        ['pending', 'confirmed', 'processing', 'shipped'].includes(o.orderStatus)
      );
    case 'delivered':
      return orders.filter((o) => o.orderStatus === 'delivered');
    case 'canceled':
      return orders.filter(
        (o) => o.orderStatus === 'canceled' || o.orderStatus === 'returned'
      );
    default:
      return orders;
  }
}

export function searchOrders(orders: Order[], searchTerm: string): Order[] {
  const term = searchTerm.toLowerCase();
  return orders.filter(
    (order) =>
      order.orderId.toLowerCase().includes(term) ||
      order.productTitle.toLowerCase().includes(term) ||
      (order.trackingNumber?.toLowerCase() || '').includes(term) ||
      (order.customerName?.toLowerCase() || '').includes(term)
  );
}

export function sortOrdersByDate(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );
}

export function calculateOrderStats(orders: Order[]) {
  return {
    total: orders.length,
    pending: orders.filter((o) => o.orderStatus === 'pending').length,
    processing: orders.filter(
      (o) => ['confirmed', 'processing'].includes(o.orderStatus)
    ).length,
    shipped: orders.filter((o) => o.orderStatus === 'shipped').length,
    delivered: orders.filter((o) => o.orderStatus === 'delivered').length,
    canceled: orders.filter(
      (o) => o.orderStatus === 'canceled' || o.orderStatus === 'returned'
    ).length,
    totalSpent: orders.reduce((sum, o) => sum + o.amountCents, 0) / 100,
  };
}

export function formatDate(
  date: Date,
  format: 'long' | 'short' | 'time' = 'long'
): string {
  if (!date) return 'N/A';

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    short: { month: 'short', day: 'numeric' },
    time: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  };

  const options = formatOptions[format];
  return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
}

export function getEstimatedDeliveryDate(
  orderDate: Date,
  daysToDeliver: number = 5
): Date {
  const date = new Date(orderDate);
  date.setDate(date.getDate() + daysToDeliver);
  return date;
}

export function isRecentOrder(order: Order): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(order.orderDate) > thirtyDaysAgo;
}

export function getTrackingProgress(order: Order): number {
  const stages = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStageIndex = stages.indexOf(order.orderStatus);
  if (currentStageIndex === -1) return 0;
  return ((currentStageIndex + 1) / stages.length) * 100;
}

export function isValidOrderId(orderId: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(orderId);
}

export function formatOrderSummary(order: Order) {
  return {
    id: order.orderId.slice(0, 8),
    product: order.productTitle,
    category: order.productCategory,
    price: formatPrice(order.amountCents, order.currency),
    date: formatDate(order.orderDate, 'long'),
    status: getStatusLabel(order.orderStatus),
    estimatedDelivery: order.estimatedArrival
      ? formatDate(order.estimatedArrival, 'short')
      : 'TBD',
  };
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return items.slice(start, end);
}

export function getPaginationMetadata(total: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(total / pageSize);
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    startIndex: (page - 1) * pageSize + 1,
    endIndex: Math.min(page * pageSize, total),
  };
}