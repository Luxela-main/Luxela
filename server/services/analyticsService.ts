import { db } from '@/server/db';
import { orders, supportTickets, refunds, users } from '@/server/db/schema';
import { eq, gte, lte, and, count, sum, avg } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

interface AnalyticsMetrics {
  revenue: {
    total: number;
    daily: { date: string; amount: number }[];
    monthly: { month: string; amount: number }[];
    topSellers: { sellerId: string; sellerName: string; revenue: number }[];
  };
  orders: {
    total: number;
    avgValue: number;
    byStatus: Record<string, number>;
    conversionRate: number;
    repeatCustomers: number;
  };
  customers: {
    total: number;
    active: number;
    ltv: number;
    churnRate: number;
    avgOrderValue: number;
    avgOrderFrequency: number;
  };
  disputes: {
    total: number;
    resolved: number;
    avgResolutionTime: number;
    resolutionRate: number;
  };
  refunds: {
    total: number;
    totalAmount: number;
    rate: number;
    avgProcessingTime: number;
  };
  trends: {
    orderGrowth: number;
    revenueGrowth: number;
    customerGrowth: number;
    disputeRate: number;
  };
}

export class AnalyticsService {
  static async getDashboardMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsMetrics> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const [
      totalOrders,
      totalRevenue,
      ordersByStatus,
      disputeStats,
      refundStats,
      customerStats,
    ] = await Promise.all([
      this.getOrderMetrics(start, end),
      this.getRevenueMetrics(start, end),
      this.getOrdersByStatus(start, end),
      this.getDisputeMetrics(start, end),
      this.getRefundMetrics(start, end),
      this.getCustomerMetrics(start, end),
    ]);

    const prevPeriodStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
    const prevPeriodEnd = start;

    const prevMetrics = await Promise.all([
      this.getOrderMetrics(prevPeriodStart, prevPeriodEnd),
      this.getRevenueMetrics(prevPeriodStart, prevPeriodEnd),
    ]);

    const orderGrowth =
      prevMetrics[0].total > 0
        ? ((totalOrders.total - prevMetrics[0].total) / prevMetrics[0].total) * 100
        : 0;

    const revenueGrowth =
      prevMetrics[1].total > 0
        ? ((totalRevenue.total - prevMetrics[1].total) / prevMetrics[1].total) * 100
        : 0;

    const customerGrowth =
      customerStats.previous > 0
        ? ((customerStats.total - customerStats.previous) / customerStats.previous) * 100
        : 0;

    return {
      revenue: {
        total: totalRevenue.total,
        daily: totalRevenue.daily,
        monthly: totalRevenue.monthly,
        topSellers: totalRevenue.topSellers,
      },
      orders: {
        total: totalOrders.total,
        avgValue: totalOrders.avgValue,
        byStatus: ordersByStatus,
        conversionRate: totalOrders.conversionRate,
        repeatCustomers: customerStats.repeat,
      },
      customers: {
        total: customerStats.total,
        active: customerStats.active,
        ltv: customerStats.ltv,
        churnRate: customerStats.churnRate,
        avgOrderValue: customerStats.avgOrderValue,
        avgOrderFrequency: customerStats.avgOrderFrequency,
      },
      disputes: {
        total: disputeStats.total,
        resolved: disputeStats.resolved,
        avgResolutionTime: disputeStats.avgResolutionTime,
        resolutionRate: disputeStats.resolutionRate,
      },
      refunds: {
        total: refundStats.total,
        totalAmount: refundStats.totalAmount,
        rate: refundStats.rate,
        avgProcessingTime: refundStats.avgProcessingTime,
      },
      trends: {
        orderGrowth,
        revenueGrowth,
        customerGrowth,
        disputeRate: (disputeStats.total / totalOrders.total) * 100,
      },
    };
  }

  private static async getOrderMetrics(startDate: Date, endDate: Date) {
    const result = await db
      .select({
        total: count(),
        avgValue: avg(orders.amountCents),
      })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

    const conversionRateResult = await db
      .select({
        confirmed: count(),
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
          eq(orders.orderStatus, 'confirmed')
        )
      );

    const totalCount = Number(result[0].total) || 0;
    const conversionRate = totalCount
      ? (Number(conversionRateResult[0].confirmed) / totalCount) * 100
      : 0;

    return {
      total: result[0].total || 0,
      avgValue: (Number(result[0].avgValue) || 0) / 100,
      conversionRate,
    };
  }

  private static async getRevenueMetrics(startDate: Date, endDate: Date) {
    const result = await db
      .select({
        total: sum(orders.amountCents),
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
          eq(orders.orderStatus, 'delivered')
        )
      );

    const totalRevenue = (Number(result[0].total) || 0) / 100;

    const dailyData = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        amount: sum(orders.amountCents),
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
          eq(orders.orderStatus, 'delivered')
        )
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    const monthly = await db
      .select({
        month: sql<string>`DATE_TRUNC('month', ${orders.createdAt})`,
        amount: sum(orders.amountCents),
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
          eq(orders.orderStatus, 'delivered')
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${orders.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${orders.createdAt})`);

    const topSellers = await db
      .select({
        sellerId: orders.sellerId,
        sellerName: sql<string>`COALESCE(${users.displayName}, 'Unknown Seller')`,
        revenue: sum(orders.amountCents),
      })
      .from(orders)
      .leftJoin(users, eq(orders.sellerId, users.id))
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
          eq(orders.orderStatus, 'delivered')
        )
      )
      .groupBy(orders.sellerId, users.displayName)
      .orderBy(sql`SUM(${orders.amountCents}) DESC`)
      .limit(10);

    return {
      total: totalRevenue,
      daily: dailyData.map((d: typeof dailyData[number]) => ({
        date: d.date,
        amount: (Number(d.amount) || 0) / 100,
      })),
      monthly: monthly.map((m: typeof monthly[number]) => ({
        month: m.month,
        amount: (Number(m.amount) || 0) / 100,
      })),
      topSellers: topSellers.map((s: typeof topSellers[number]) => ({
        sellerId: s.sellerId || '',
        sellerName: s.sellerName,
        revenue: (Number(s.revenue) || 0) / 100,
      })),
    };
  }

  private static async getOrdersByStatus(startDate: Date, endDate: Date) {
    const result = await db
      .select({
        status: orders.orderStatus,
        count: count(),
      })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
      .groupBy(orders.orderStatus);

    const stats: Record<string, number> = {};
    result.forEach((r: typeof result[number]) => {
      stats[r.status || 'unknown'] = r.count || 0;
    });

    return stats;
  }

  private static async getDisputeMetrics(startDate: Date, endDate: Date) {
    // TODO: Implement disputes metrics once disputes table is created in schema
    // For now, returning placeholder values
    return {
      total: 0,
      resolved: 0,
      avgResolutionTime: 0,
      resolutionRate: 0,
    };
  }

  private static async getRefundMetrics(startDate: Date, endDate: Date) {
    const result = await db
      .select({
        total: count(),
        totalAmount: sum(refunds.amountCents),
      })
      .from(refunds)
      .where(and(gte(refunds.createdAt, startDate), lte(refunds.createdAt, endDate)));

    const processingTimeResult = await db
      .select({
        avgTime: avg(sql`EXTRACT(EPOCH FROM (${refunds.refundedAt} - ${refunds.createdAt})) / 3600`),
      })
      .from(refunds)
      .where(
        and(
          gte(refunds.createdAt, startDate),
          lte(refunds.createdAt, endDate),
          sql`${refunds.refundedAt} IS NOT NULL`
        )
      );

    const totalOrders = await db
      .select({ count: count() })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

    const total = Number(result[0].total) || 0;
    const totalAmount = (Number(result[0].totalAmount) || 0) / 100;
    const refundRate = totalOrders[0].count ? (total / Number(totalOrders[0].count)) * 100 : 0;

    return {
      total,
      totalAmount,
      rate: refundRate,
      avgProcessingTime: processingTimeResult[0].avgTime ? Number(processingTimeResult[0].avgTime) : 0,
    };
  }

  private static async getCustomerMetrics(startDate: Date, endDate: Date) {
    const totalCustomers = await db
      .selectDistinct({ customerId: orders.buyerId })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

    const previousPeriodCustomers = await db
      .selectDistinct({ customerId: orders.buyerId })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))),
          lte(orders.createdAt, startDate)
        )
      );

    const activeCustomers = await db
      .selectDistinct({ customerId: orders.buyerId })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
          eq(orders.orderStatus, 'delivered')
        )
      );

    const repeatCustomersResult = await db
      .select({
        buyerId: orders.buyerId,
        orderCount: count(),
      })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
      .groupBy(orders.buyerId)
      .having(sql`COUNT(*) > 1`);

    const ltvResult = await db
      .select({
        buyerId: orders.buyerId,
        totalSpent: sum(orders.amountCents),
      })
      .from(orders)
      .where(eq(orders.orderStatus, 'delivered'))
      .groupBy(orders.buyerId);

    const avgLTV = ltvResult.length > 0
      ? ltvResult.reduce((sum: any, r: any) => sum + ((Number(r.totalSpent) || 0) / 100), 0) / ltvResult.length
      : 0;

    const avgOrderValue = await db
      .select({ avg: avg(orders.amountCents) })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

    const customerOrderFrequency = totalCustomers.length > 0
      ? totalCustomers.length / (endDate.getTime() - startDate.getTime()) * (30 * 24 * 60 * 60 * 1000)
      : 0;

    return {
      total: totalCustomers.length,
      active: activeCustomers.length,
      ltv: avgLTV,
      churnRate: previousPeriodCustomers.length > 0
        ? ((previousPeriodCustomers.length - totalCustomers.length) / previousPeriodCustomers.length) * 100
        : 0,
      avgOrderValue: (Number(avgOrderValue[0].avg) || 0) / 100,
      avgOrderFrequency: customerOrderFrequency,
      repeat: repeatCustomersResult.length,
      previous: previousPeriodCustomers.length,
    };
  }

  static async exportMetrics(format: 'csv' | 'json' = 'json') {
    const metrics = await this.getDashboardMetrics();

    if (format === 'csv') {
      return this.convertToCsv(metrics);
    }

    return JSON.stringify(metrics, null, 2);
  }

  private static convertToCsv(metrics: AnalyticsMetrics): string {
    const rows: string[] = [];

    rows.push('Analytics Export');
    rows.push(`Generated: ${new Date().toISOString()}`);
    rows.push('');

    rows.push('Revenue Metrics');
    rows.push(`Total Revenue,${metrics.revenue.total}`);
    rows.push('');

    rows.push('Order Metrics');
    rows.push(`Total Orders,${metrics.orders.total}`);
    rows.push(`Average Order Value,${metrics.orders.avgValue}`);
    rows.push(`Conversion Rate,${metrics.orders.conversionRate.toFixed(2)}%`);
    rows.push('');

    rows.push('Customer Metrics');
    rows.push(`Total Customers,${metrics.customers.total}`);
    rows.push(`Active Customers,${metrics.customers.active}`);
    rows.push(`Customer Lifetime Value,${metrics.customers.ltv}`);
    rows.push(`Churn Rate,${metrics.customers.churnRate.toFixed(2)}%`);
    rows.push('');

    rows.push('Dispute Metrics');
    rows.push(`Total Disputes,${metrics.disputes.total}`);
    rows.push(`Resolved Disputes,${metrics.disputes.resolved}`);
    rows.push(`Resolution Rate,${metrics.disputes.resolutionRate.toFixed(2)}%`);
    rows.push('');

    rows.push('Refund Metrics');
    rows.push(`Total Refunds,${metrics.refunds.total}`);
    rows.push(`Total Refund Amount,${metrics.refunds.totalAmount}`);
    rows.push(`Refund Rate,${metrics.refunds.rate.toFixed(2)}%`);

    return rows.join('\n');
  }
}