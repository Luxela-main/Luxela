import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { 
  orders, 
  listings, 
  buyers, 
  sellers, 
  reviews,
  disputes
} from '../db/schema';
import { 
  eq, 
  desc, 
  count as countFn, 
  and, 
  gte, 
  lt, 
  sum,
  avg,
} from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

async function verifyAdminRole(ctx: any) {
  if (ctx.user?.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
}

// Stored report configurations (in production, use database)
const reportConfigs = new Map<
  string,
  {
    id: string;
    name: string;
    type: string;
    schedule: string;
    recipients: string[];
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
  }
>();

export const adminReportGeneratorRouter = createTRPCRouter({
  /**
   * Generate on-demand report
   */
  generateReport: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          'sales_summary',
          'seller_performance',
          'payment_summary',
          'dispute_summary',
          'user_metrics',
          'inventory_report',
          'tax_report',
        ]),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        format: z.enum(['pdf', 'csv', 'excel', 'json']).default('pdf'),
        filters: z.any().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        reportId: z.string(),
        fileName: z.string(),
        data: z.any(),
        generatedAt: z.date(),
        summary: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const startDate = new Date(input.startDate as string);
      const endDate = new Date(input.endDate as string);

      let reportData: any = {};
      let summary: any = {};

      switch (input.type) {
        case 'sales_summary':
          reportData = await generateSalesSummary(startDate, endDate);
          summary = {
            totalOrders: reportData.orders.length,
            totalRevenue: reportData.totalRevenue,
            averageOrderValue: reportData.avgOrderValue,
          };
          break;

        case 'seller_performance':
          reportData = await generateSellerPerformance(startDate, endDate);
          summary = {
            totalSellers: reportData.sellers.length,
            topSeller: reportData.topSeller,
            averageRating: reportData.avgRating,
          };
          break;

        case 'payment_summary':
          reportData = await generatePaymentSummary(startDate, endDate);
          summary = {
            totalTransactions: reportData.transactions.length,
            totalProcessed: reportData.totalProcessed,
            failedTransactions: reportData.failedCount,
          };
          break;

        case 'dispute_summary':
          reportData = await generateDisputeSummary(startDate, endDate);
          summary = {
            totalDisputes: reportData.disputes.length,
            resolvedCount: reportData.resolvedCount,
            resolutionRate: reportData.resolutionRate,
          };
          break;

        case 'user_metrics':
          reportData = await generateUserMetrics(startDate, endDate);
          summary = {
            newBuyers: reportData.newBuyers,
            newSellers: reportData.newSellers,
            activeUsers: reportData.activeUsers,
          };
          break;

        case 'inventory_report':
          reportData = await generateInventoryReport(startDate, endDate);
          summary = {
            totalListings: reportData.listings.length,
            activeListings: reportData.activeCount,
            lowStockItems: reportData.lowStockCount,
          };
          break;

        case 'tax_report':
          reportData = await generateTaxReport(startDate, endDate);
          summary = {
            totalGross: reportData.totalGross,
            totalFees: reportData.totalFees,
            totalNet: reportData.totalNet,
          };
          break;
      }

      const reportId = Math.random().toString(36).substr(2, 9);
      const fileName = `${input.type}_${new Date().toISOString().split('T')[0]}.${input.format}`;

      return {
        success: true,
        reportId,
        fileName,
        data: reportData,
        generatedAt: new Date(),
        summary,
      };
    }),

  /**
   * Get scheduled reports
   */
  getScheduledReports: protectedProcedure
    .output(
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          schedule: z.string(),
          recipients: z.array(z.string()),
          enabled: z.boolean(),
          lastRun: z.date().optional(),
          nextRun: z.date().optional(),
        })
      )
    )
    .query(async ({ ctx }) => {
      await verifyAdminRole(ctx);
      return Array.from(reportConfigs.values());
    }),

  /**
   * Create scheduled report
   */
  createScheduledReport: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.string(),
        schedule: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
        recipients: z.array(z.string().email()),
        enabled: z.boolean().default(true),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        reportId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const reportId = Math.random().toString(36).substr(2, 9);
      const now = new Date();
      const nextRun = calculateNextRun(input.schedule, now);

      reportConfigs.set(reportId, {
        id: reportId,
        name: input.name,
        type: input.type,
        schedule: input.schedule,
        recipients: input.recipients,
        enabled: input.enabled,
        nextRun,
      });

      return {
        success: true,
        reportId,
      };
    }),

  /**
   * Update scheduled report
   */
  updateScheduledReport: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        name: z.string().optional(),
        schedule: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
        recipients: z.array(z.string().email()).optional(),
        enabled: z.boolean().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const report = reportConfigs.get(input.reportId);
      if (!report) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        });
      }

      Object.assign(report, {
        name: input.name || report.name,
        schedule: input.schedule || report.schedule,
        recipients: input.recipients || report.recipients,
        enabled: input.enabled !== undefined ? input.enabled : report.enabled,
      });

      if (input.schedule) {
        report.nextRun = calculateNextRun(input.schedule, new Date());
      }

      return {
        success: true,
      };
    }),

  /**
   * Delete scheduled report
   */
  deleteScheduledReport: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);
      reportConfigs.delete(input.reportId);
      return {
        success: true,
      };
    }),

  /**
   * Export report data
   */
  exportReportData: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        format: z.enum(['csv', 'excel', 'json']).default('csv'),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Generate CSV data
      let csvData = '';
      let mimeType = 'text/csv';

      if (input.format === 'json') {
        mimeType = 'application/json';
        // Fetch data based on type and return as JSON
        const orders_data = await db
          .select()
          .from(orders)
          .where(
            and(
              gte(orders.orderDate, startDate),
              lt(orders.orderDate, endDate)
            )
          );
        csvData = JSON.stringify(orders_data, null, 2);
      } else {
        // CSV format
        csvData = generateCSVData(input.type, startDate, endDate);
      }

      const fileName = `report_${new Date().toISOString().split('T')[0]}.${
        input.format === 'json' ? 'json' : 'csv'
      }`;

      return {
        success: true,
        data: csvData,
        fileName,
        mimeType,
      };
    }),

  /**
   * Get report templates
   */
  getReportTemplates: protectedProcedure
    .output(
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          type: z.string(),
        })
      )
    )
    .query(async ({ ctx }) => {
      await verifyAdminRole(ctx);

      return [
        {
          id: 'daily_summary',
          name: 'Daily Summary',
          description: 'Daily sales, orders, and user activity',
          type: 'sales_summary',
        },
        {
          id: 'weekly_performance',
          name: 'Weekly Performance',
          description: 'Weekly sales metrics and seller performance',
          type: 'seller_performance',
        },
        {
          id: 'monthly_financial',
          name: 'Monthly Financial',
          description: 'Monthly revenue, expenses, and net profit',
          type: 'payment_summary',
        },
        {
          id: 'seller_rankings',
          name: 'Seller Rankings',
          description: 'Top performing sellers and quality metrics',
          type: 'seller_performance',
        },
        {
          id: 'tax_summary',
          name: 'Tax Summary',
          description: 'Tax-related financial data for reporting',
          type: 'tax_report',
        },
      ];
    }),
});

// Helper functions

function calculateNextRun(
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly',
  currentDate: Date
): Date {
  const next = new Date(currentDate);
  switch (schedule) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
  }
  return next;
}

async function generateSalesSummary(
  startDate: Date,
  endDate: Date
): Promise<any> {
  const orders_data = await db
    .select({
      id: orders.id,
      total: orders.amountCents,
      date: orders.orderDate,
    })
    .from(orders)
    .where(
      and(
        gte(orders.orderDate, startDate),
        lt(orders.orderDate, endDate)
      )
    );

  const totalRevenue = orders_data.reduce((sum: any, o: any) => sum + (o.total || 0), 0) / 100;
  const avgOrderValue = orders_data.length > 0 ? totalRevenue / orders_data.length : 0;

  return {
    orders: orders_data,
    totalRevenue,
    avgOrderValue,
  };
}

async function generateSellerPerformance(
  startDate: Date,
  endDate: Date
): Promise<any> {
  const sellerData = await db
    .select({
      sellerId: sellers.id,
      orders: countFn(),
      revenue: sum(orders.amountCents),
      avgRating: avg(reviews.rating),
    })
    .from(sellers)
    .leftJoin(listings, eq(listings.sellerId, sellers.id))
    .leftJoin(orders, eq(orders.listingId, listings.id))
    .leftJoin(reviews, eq(reviews.listingId, listings.id))
    .where(
      and(
        gte(orders.orderDate, startDate),
        lt(orders.orderDate, endDate)
      )
    )
    .groupBy(sellers.id)
    .orderBy(desc(sum(orders.amountCents)));

  const avgRating = sellerData.length > 0
    ? sellerData.reduce((sum: any, s: any) => sum + Number(s.avgRating || 0), 0) / sellerData.length
    : 0;

  return {
    sellers: sellerData,
    topSeller: sellerData[0],
    avgRating,
  };
}

async function generatePaymentSummary(
  startDate: Date,
  endDate: Date
): Promise<any> {
  const transactions = await db
    .select()
    .from(orders)
    .where(
      and(
        gte(orders.orderDate, startDate),
        lt(orders.orderDate, endDate)
      )
    );

  const totalProcessed = transactions
    .filter((t: any) => t.orderStatus === 'delivered')
    .reduce((sum: any, t: any) => sum + (t.amountCents || 0), 0) / 100;

  const failedCount = transactions.filter((t: any) => t.orderStatus === 'canceled').length;

  return {
    transactions,
    totalProcessed,
    failedCount,
  };
}

async function generateDisputeSummary(
  startDate: Date,
  endDate: Date
): Promise<any> {
  const disputeData = await db
    .select()
    .from(disputes)
    .where(
      and(
        gte(disputes.createdAt, startDate),
        lt(disputes.createdAt, endDate)
      )
    );

  const resolvedCount = disputeData.filter((d: any) => d.status === 'resolved').length;
  const resolutionRate = disputeData.length > 0 
    ? (resolvedCount / disputeData.length) * 100 
    : 0;

  return {
    disputes: disputeData,
    resolvedCount,
    resolutionRate,
  };
}

async function generateUserMetrics(
  startDate: Date,
  endDate: Date
): Promise<any> {
  const newBuyersResult = await db
    .select({ count: countFn() })
    .from(buyers)
    .where(
      and(
        gte(buyers.createdAt, startDate),
        lt(buyers.createdAt, endDate)
      )
    );

  const newSellersResult = await db
    .select({ count: countFn() })
    .from(sellers)
    .where(
      and(
        gte(sellers.createdAt, startDate),
        lt(sellers.createdAt, endDate)
      )
    );

  return {
    newBuyers: Number(newBuyersResult[0]?.count || 0),
    newSellers: Number(newSellersResult[0]?.count || 0),
    activeUsers: 0, // Would need to track sessions
  };
}

async function generateInventoryReport(
  startDate: Date,
  endDate: Date
): Promise<any> {
  const listingsData = await db.select().from(listings);

  const activeCount = listingsData.filter((l: any) => l.status === 'approved').length;
  const lowStockCount = 0; // Would need inventory tracking

  return {
    listings: listingsData,
    activeCount,
    lowStockCount,
  };
}

async function generateTaxReport(
  startDate: Date,
  endDate: Date
): Promise<any> {
  const ordersData = await db
    .select({ total: sum(orders.amountCents) })
    .from(orders)
    .where(
      and(
        gte(orders.orderDate, startDate),
        lt(orders.orderDate, endDate),
        eq(orders.orderStatus, 'delivered')
      )
    );

  const totalGross = (Number(ordersData[0]?.total) || 0) / 100;
  const totalFees = totalGross * 0.05; // 5% commission
  const totalNet = totalGross - totalFees;

  return {
    totalGross,
    totalFees,
    totalNet,
  };
}

function generateCSVData(type: string, startDate: Date, endDate: Date): string {
  const headers = ['Date', 'Amount', 'Status', 'Type'];
  const rows: string[][] = [headers];
  // In production, fetch actual data and format as CSV
  return rows.map((row) => row.join(',')).join('\n');
}