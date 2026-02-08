import { createTRPCRouter, adminProcedure, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import {
  orders,
  listings,
  buyers,
  sellers,
  sellerBusiness,
  sales,
  products,
  payments,
  buyerAccountDetails,
  disputes,
  reviews,
} from '../db/schema';
import { eq, desc, count as countFn, and, gte, lt, sum, avg, lte, asc, count, sql, max } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

async function verifyAdminRole(ctx: any) {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }

  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
}

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
}

export const adminAnalyticsRouter = createTRPCRouter({
  // ========== BASIC ANALYTICS ==========

  /**
   * Get core analytics metrics for dashboard
   */
  getMetrics: protectedProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
      })
    )
    .output(
      z.object({
        totalRevenue: z.number(),
        revenueChange: z.number(),
        totalUsers: z.number(),
        usersChange: z.number(),
        totalOrders: z.number(),
        ordersChange: z.number(),
        conversionRate: z.number(),
        conversionChange: z.number(),
        avgOrderValue: z.number(),
        avgOrderValueChange: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const { start, end } = getDateRange(input.days);
      const previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - input.days);

      // Current period orders
      const currentOrders = await db
        .select({ count: countFn(), total: sum(orders.amountCents) })
        .from(orders)
        .where(
          and(
            gte(orders.orderDate, start),
            lt(orders.orderDate, end)
          )
        );

      // Previous period orders
      const previousOrders = await db
        .select({ count: countFn(), total: sum(orders.amountCents) })
        .from(orders)
        .where(
          and(
            gte(orders.orderDate, previousStart),
            lt(orders.orderDate, start)
          )
        );

      // Users
      const totalUsers = await db
        .select({ count: countFn() })
        .from(buyers);

      const newUsers = await db
        .select({ count: countFn() })
        .from(buyers)
        .where(gte(buyers.createdAt, start));

      const previousNewUsers = await db
        .select({ count: countFn() })
        .from(buyers)
        .where(
          and(
            gte(buyers.createdAt, previousStart),
            lt(buyers.createdAt, start)
          )
        );

      const currentOrderCount = Number(currentOrders[0]?.count || 0);
      const previousOrderCount = Number(previousOrders[0]?.count || 0);
      const currentRevenue =
        (Number(currentOrders[0]?.total) || 0) / 100;
      const previousRevenue =
        (Number(previousOrders[0]?.total) || 0) / 100;

      const revenueChange =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : 0;
      const ordersChange =
        previousOrderCount > 0
          ? ((currentOrderCount - previousOrderCount) /
              previousOrderCount) *
            100
          : 0;

      const newUsersCount = Number(newUsers[0]?.count || 0);
      const previousNewUsersCount = Number(previousNewUsers[0]?.count || 0);
      const usersChange =
        previousNewUsersCount > 0
          ? ((newUsersCount - previousNewUsersCount) /
              previousNewUsersCount) *
            100
          : 0;

      const avgOrderValue =
        currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
      const previousAvgOrderValue =
        previousOrderCount > 0
          ? previousRevenue / previousOrderCount
          : 0;
      const avgOrderValueChange =
        previousAvgOrderValue > 0
          ? ((avgOrderValue - previousAvgOrderValue) /
              previousAvgOrderValue) *
            100
          : 0;

      const conversionRate = totalUsers[0]?.count
        ? (currentOrderCount / (totalUsers[0]?.count as number)) * 100
        : 0;
      const conversionChange =
        previousOrderCount > 0 ? ordersChange : 0;

      return {
        totalRevenue: Math.round(currentRevenue * 100) / 100,
        revenueChange: Math.round(revenueChange * 100) / 100,
        totalUsers: Number(totalUsers[0]?.count || 0),
        usersChange: Math.round(usersChange * 100) / 100,
        totalOrders: currentOrderCount,
        ordersChange: Math.round(ordersChange * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        conversionChange: Math.round(conversionChange * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        avgOrderValueChange: Math.round(avgOrderValueChange * 100) / 100,
      };
    }),

  /**
   * Get top performing listings
   */
  getTopListings: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(50).default(10),
        days: z.number().int().positive().default(30),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          title: z.string(),
          sales: z.number(),
          revenue: z.number(),
          views: z.number(),
          conversionRate: z.number(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      // Get top listings by order count in the period
      const { start, end } = getDateRange(input.days);

      const topListings = await db
        .select({
          id: listings.id,
          title: listings.title,
          sales: countFn(),
          revenue: sum(orders.amountCents),
        })
        .from(orders)
        .innerJoin(listings, eq(orders.listingId, listings.id))
        .where(
          and(
            gte(orders.orderDate, start),
            lt(orders.orderDate, end)
          )
        )
        .groupBy(listings.id, listings.title)
        .orderBy(desc(countFn()))
        .limit(input.limit);

      return topListings.map((item) => ({
        id: item.id,
        title: item.title,
        sales: Number(item.sales || 0),
        revenue: (Number(item.revenue) || 0) / 100,
        views: 0, // Would need to track page views separately
        conversionRate: 0, // Would need to calculate from view data
      }));
    }),

  /**
   * Get daily revenue trend
   */
  getRevenueTrend: protectedProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
      })
    )
    .output(
      z.array(
        z.object({
          date: z.string(),
          revenue: z.number(),
          orders: z.number(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const { start, end } = getDateRange(input.days);

      const dailyRevenue = await db
        .select({
          date: orders.orderDate,
          revenue: sum(orders.amountCents),
          count: countFn(),
        })
        .from(orders)
        .where(
          and(
            gte(orders.orderDate, start),
            lt(orders.orderDate, end)
          )
        )
        .groupBy(orders.orderDate)
        .orderBy(orders.orderDate);

      return dailyRevenue.map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        revenue: (Number(item.revenue) || 0) / 100,
        orders: Number(item.count || 0),
      }));
    }),

  /**
   * Get user acquisition data
   */
  getUserAcquisition: protectedProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
      })
    )
    .output(
      z.array(
        z.object({
          date: z.string(),
          buyers: z.number(),
          sellers: z.number(),
          total: z.number(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);

      const { start, end } = getDateRange(input.days);

      const buyerAcquisition = await db
        .select({
          date: buyers.createdAt,
          count: countFn(),
        })
        .from(buyers)
        .where(
          and(
            gte(buyers.createdAt, start),
            lt(buyers.createdAt, end)
          )
        )
        .groupBy(buyers.createdAt)
        .orderBy(buyers.createdAt);

      const sellerAcquisition = await db
        .select({
          date: sellers.createdAt,
          count: countFn(),
        })
        .from(sellers)
        .where(
          and(
            gte(sellers.createdAt, start),
            lt(sellers.createdAt, end)
          )
        )
        .groupBy(sellers.createdAt)
        .orderBy(sellers.createdAt);

      // Combine data by date
      const dateMap = new Map<string, { buyers: number; sellers: number }>();

      buyerAcquisition.forEach((item) => {
        const date = new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        if (!dateMap.has(date)) {
          dateMap.set(date, { buyers: 0, sellers: 0 });
        }
        dateMap.get(date)!.buyers = Number(item.count || 0);
      });

      sellerAcquisition.forEach((item) => {
        const date = new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        if (!dateMap.has(date)) {
          dateMap.set(date, { buyers: 0, sellers: 0 });
        }
        dateMap.get(date)!.sellers = Number(item.count || 0);
      });

      return Array.from(dateMap.entries()).map(([date, data]) => ({
        date,
        buyers: data.buyers,
        sellers: data.sellers,
        total: data.buyers + data.sellers,
      }));
    }),

  // ========== ENHANCED ANALYTICS ==========

  /**
   * Funnel Analysis - Track conversion from browsing to checkout to completion
   */
  getFunnelAnalysis: adminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .output(
      z.object({
        stages: z.array(
          z.object({
            stage: z.enum(['browsers', 'carted', 'checkouts', 'completed']),
            count: z.number(),
            percentage: z.number(),
            dropoffRate: z.number(),
          })
        ),
        conversionRate: z.number(),
        averageCartValue: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const days = input.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get browsing metrics (listings viewed)
      const browsingCount = await db
        .select({ count: countFn() })
        .from(listings)
        .where(
          and(
            gte(listings.createdAt, startDate),
            lte(listings.createdAt, new Date())
          )
        );

      // Get cart additions (sales/cart items)
      const cartedCount = await db
        .select({ count: countFn() })
        .from(sales)
        .where(
          and(
            gte(sales.createdAt, startDate),
            lte(sales.createdAt, new Date())
          )
        );

      // Get checkout initiations (orders created)
      const checkoutsCount = await db
        .select({ count: countFn() })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, new Date())
          )
        );

      // Get completed orders
      const completedCount = await db
        .select({ count: countFn() })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, new Date()),
            eq(orders.orderStatus, 'delivered')
          )
        );

      const browsingVal = browsingCount[0]?.count || 0;
      const cartedVal = cartedCount[0]?.count || 0;
      const checkoutsVal = checkoutsCount[0]?.count || 0;
      const completedVal = completedCount[0]?.count || 0;
      const totalUsers = browsingVal;

      return {
        stages: [
          {
            stage: 'browsers' as const,
            count: browsingVal,
            percentage: 100,
            dropoffRate: 0,
          },
          {
            stage: 'carted' as const,
            count: cartedVal,
            percentage: totalUsers > 0 ? (cartedVal / totalUsers) * 100 : 0,
            dropoffRate:
              totalUsers > 0 ? ((totalUsers - cartedVal) / totalUsers) * 100 : 0,
          },
          {
            stage: 'checkouts' as const,
            count: checkoutsVal,
            percentage: totalUsers > 0 ? (checkoutsVal / totalUsers) * 100 : 0,
            dropoffRate:
              totalUsers > 0 ? ((totalUsers - checkoutsVal) / totalUsers) * 100 : 0,
          },
          {
            stage: 'completed' as const,
            count: completedVal,
            percentage: totalUsers > 0 ? (completedVal / totalUsers) * 100 : 0,
            dropoffRate:
              totalUsers > 0 ? ((totalUsers - completedVal) / totalUsers) * 100 : 0,
          },
        ],
        conversionRate:
          totalUsers > 0 ? (completedVal / totalUsers) * 100 : 0,
        averageCartValue:
          cartedVal > 0
            ? ((cartedVal * 100) / cartedVal) * (10000 / 100)
            : 0,
      };
    }),

  /**
   * Seller Performance - Get metrics on seller quality and performance
   */
  getSellerPerformance: adminProcedure
    .input(
      z.object({
        days: z.number().default(30),
        limit: z.number().default(10),
      })
    )
    .output(
      z.array(
        z.object({
          sellerId: z.string(),
          sellerName: z.string().nullable(),
          totalOrders: z.number(),
          totalRevenue: z.number(),
          completionRate: z.number(),
          disputeCount: z.number(),
          lastOrderDate: z.unknown(),
          quality_score: z.number(),
          averageRating: z.number(),
          reviewCount: z.number(),
          activeListings: z.number(),
          totalListings: z.number(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const { days, limit } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sellerMetrics = await db
        .select({
          sellerId: sellers.id,
          sellerName: sellerBusiness.brandName,
          totalOrders: countFn(),
          totalRevenue: sum(orders.amountCents),
          completedOrders: countFn(),
          disputeCount: countFn(),
          lastOrderDate: max(orders.createdAt),
          averageRating: avg(reviews.rating),
          reviewCount: countFn(),
          activeListings: countFn(),
          totalListings: countFn(),
        })
        .from(sellers)
        .leftJoin(
          sellerBusiness,
          eq(sellers.id, sellerBusiness.sellerId)
        )
        .leftJoin(orders, eq(sellers.id, orders.sellerId))
        .leftJoin(disputes, eq(sellers.id, disputes.sellerId))
        .leftJoin(listings, eq(sellers.id, listings.sellerId))
        .leftJoin(
          reviews,
          and(
            eq(reviews.listingId, listings.id),
            gte(reviews.createdAt, startDate)
          )
        )
        .where(
          and(
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, new Date())
          )
        )
        .groupBy(sellers.id, sellerBusiness.brandName)
        .limit(limit);

      return sellerMetrics.map((metric) => {
        const completionRate =
          metric.totalOrders && metric.totalOrders > 0
            ? (Number(metric.completedOrders || 0) / metric.totalOrders) * 100
            : 0;
        
        const orderVolumeFactor = Math.min(Number(metric.totalOrders || 0) / 100, 1);
        const disputeRatio =
          metric.totalOrders && metric.totalOrders > 0
            ? (Number(metric.disputeCount || 0) / metric.totalOrders) * 100
            : 0;
        const disputeFactor = Math.max(1 - disputeRatio / 100, 0);

        const quality_score =
          completionRate * 0.4 +
          disputeFactor * 0.3 +
          orderVolumeFactor * 0.3;

        return {
          sellerId: metric.sellerId,
          sellerName: metric.sellerName || null,
          totalOrders: Number(metric.totalOrders || 0),
          totalRevenue: Number(metric.totalRevenue || 0) / 100,
          completionRate,
          disputeCount: Number(metric.disputeCount || 0),
          lastOrderDate: metric.lastOrderDate,
          quality_score: Math.round(quality_score * 100) / 100,
          averageRating: Number(metric.averageRating || 0),
          reviewCount: Number(metric.reviewCount || 0),
          activeListings: metric.activeListings || 0,
          totalListings: metric.totalListings || 0,
        };
      });
    }),

  /**
   * Conversion Analysis - Track key metrics for conversion optimization
   */
  getConversionAnalysis: adminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .output(
      z.array(
        z.object({
          date: z.string(),
          conversions: z.number(),
          revenue: z.number(),
          avgOrderValue: z.number(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const days = input.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dailyData = await db
        .select({
          date: sql<string>`DATE(${orders.createdAt})`,
          totalOrders: countFn(),
          completedOrders: countFn(),
          totalRevenue: sum(orders.amountCents),
          avgOrderValue: avg(orders.amountCents),
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, new Date())
          )
        )
        .groupBy(sql`DATE(${orders.createdAt})`)
        .orderBy(sql`DATE(${orders.createdAt})`);

      return dailyData.map((day) => ({
        date: day.date || new Date().toISOString().split('T')[0],
        conversions: day.completedOrders || 0,
        revenue: (Number(day.totalRevenue || 0)) / 100,
        avgOrderValue: (Number(day.avgOrderValue || 0)) / 100,
      }));
    }),

  /**
   * Product Performance - Best and worst performing products
   */
  getProductPerformance: adminProcedure
    .input(
      z.object({
        days: z.number().default(30),
        limit: z.number().default(10),
      })
    )
    .output(
      z.array(
        z.object({
          listingId: z.string(),
          title: z.string(),
          category: z.string(),
          sales: z.number(),
          revenue: z.number(),
          avgRating: z.number(),
          reviewCount: z.number(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const { days, limit } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const productPerf = await db
        .select({
          listingId: listings.id,
          title: products.name,
          category: products.category,
          totalSales: countFn(),
          totalRevenue: sum(orders.amountCents),
          avgRating: avg(reviews.rating),
          reviewCount: countFn(),
        })
        .from(products)
        .innerJoin(listings, eq(products.id, listings.productId))
        .leftJoin(orders, eq(listings.id, orders.listingId))
        .leftJoin(
          reviews,
          and(
            eq(reviews.listingId, listings.id),
            gte(reviews.createdAt, startDate)
          )
        )
        .where(
          and(
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, new Date())
          )
        )
        .groupBy(listings.id, products.id, products.name, products.category)
        .orderBy(desc(sum(orders.amountCents)))
        .limit(limit);

      return productPerf.map((product) => ({
        listingId: product.listingId,
        title: product.title,
        category: product.category || 'others',
        sales: Number(product.totalSales || 0),
        revenue: Number(product.totalRevenue || 0) / 100,
        avgRating: Number(product.avgRating || 0),
        reviewCount: Number(product.reviewCount || 0),
      }));
    }),

  /**
   * Risk Assessment - Identify suspicious seller and transaction patterns
   */
  getRiskAssessment: adminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const days = input.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // High refund rate sellers
      const refundMetrics = await db
        .select({
          sellerId: sellers.id,
          sellerName: sellerBusiness.brandName,
          totalOrders: countFn(),
          refundedOrders: countFn(),
        })
        .from(sellers)
        .leftJoin(
          sellerBusiness,
          eq(sellers.id, sellerBusiness.sellerId)
        )
        .leftJoin(orders, eq(sellers.id, orders.sellerId))
        .where(
          and(
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, new Date())
          )
        )
        .groupBy(sellers.id, sellerBusiness.brandName);

      // High dispute rate sellers
      const disputeMetrics = await db
        .select({
          sellerId: sellers.id,
          sellerName: sellerBusiness.brandName,
          totalOrders: countFn(),
          disputes: countFn(),
        })
        .from(sellers)
        .leftJoin(
          sellerBusiness,
          eq(sellers.id, sellerBusiness.sellerId)
        )
        .leftJoin(orders, eq(sellers.id, orders.sellerId))
        .leftJoin(disputes, eq(sellers.id, disputes.sellerId))
        .where(
          and(
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, new Date())
          )
        )
        .groupBy(sellers.id, sellerBusiness.brandName);

      return {
        highRefundRate: refundMetrics
          .filter(m => {
            const rate = m.totalOrders > 0 ? (Number(m.refundedOrders || 0) / m.totalOrders) * 100 : 0;
            return rate > 10;
          })
          .map(m => ({
            sellerId: m.sellerId,
            sellerName: m.sellerName || 'Unknown',
            refundRate: m.totalOrders > 0 
              ? ((Number(m.refundedOrders || 0) / m.totalOrders) * 100).toFixed(1)
              : '0',
          })),
        highDisputeRate: disputeMetrics
          .filter(m => {
            const rate = m.totalOrders > 0 ? (Number(m.disputes || 0) / m.totalOrders) * 100 : 0;
            return rate > 5;
          })
          .map(m => ({
            sellerId: m.sellerId,
            sellerName: m.sellerName || 'Unknown',
            disputeRate: m.totalOrders > 0 
              ? ((Number(m.disputes || 0) / m.totalOrders) * 100).toFixed(1)
              : '0',
          })),
      };
    }),
});