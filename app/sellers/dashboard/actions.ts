'use server';

import { createClient } from '@/utils/supabase/server';
import { db } from '@/server/db';
import { 
  sellers, 
  listings, 
  orders, 
  reviews, 
  products,
  sales,
  inventory
} from '@/server/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueData: Array<{ date: string; revenue: string }>;
  recentOrders: Array<any>;
  topProducts: Array<any>;
  customerReviews: Array<any>;
  lowStockProducts: Array<any>;
  conversionRate: number;
  averageOrderValue: number;
  returnRate: number;
  customerSatisfactionScore: number;
  revenueChange: number;
  ordersChange: number;
  customerSatisfaction: number;
  inventoryAlerts: Array<{ id: string; name: string; status: 'low' | 'out'; currentStock: number; minStock: number }>;
  trendingProducts: Array<{ id: string; name: string; revenue: string; views: number; conversionRate: number }>;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
}

export async function getDashboardMetrics(timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<DashboardMetrics> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) throw new Error('Unauthorized');

    // Get seller info
    const seller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, user.id))
      .limit(1);

    if (!seller || seller.length === 0) {
      throw new Error('Seller not found');
    }

    const sellerId = seller[0].id;

    // Get total revenue
    const revenueData = await db
      .select({
        totalCents: sql<number>`COALESCE(SUM(${orders.amountCents}), 0)`,
      })
      .from(orders)
      .where(eq(orders.sellerId, sellerId));

    const totalRevenue = (revenueData[0]?.totalCents || 0) / 100;

    // Get total orders
    const ordersCount = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(eq(orders.sellerId, sellerId));

    const totalOrders = ordersCount[0]?.count || 0;

    // Get total products
    const productsCount = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(listings)
      .where(eq(listings.sellerId, sellerId));

    const totalProducts = productsCount[0]?.count || 0;

    // Get unique customers
    const customersCount = await db
      .selectDistinct({
        count: sql<number>`COUNT(DISTINCT ${orders.buyerId})`,
      })
      .from(orders)
      .where(eq(orders.sellerId, sellerId));

    const totalCustomers = customersCount[0]?.count || 0;

    // Get recent orders (last 5)
    const recentOrdersData = await db
      .select()
      .from(orders)
      .where(eq(orders.sellerId, sellerId))
      .orderBy(desc(orders.orderDate))
      .limit(5);

    const recentOrders = recentOrdersData.map((o: any) => ({
      id: o.id,
      orderDate: o.orderDate,
      customerName: o.customerName,
      amount: (o.amountCents / 100).toFixed(2),
      status: o.orderStatus,
    }));

    // Get top selling products (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const topProductsData = await db
      .select({
        id: listings.id,
        title: listings.title,
        totalSales: sql<number>`COUNT(DISTINCT ${sales.id})`,
        totalRevenue: sql<number>`COALESCE(SUM(${sales.totalCents}), 0)`,
      })
      .from(listings)
      .leftJoin(sales, eq(listings.id, sales.listingId))
      .where(
        and(
          eq(listings.sellerId, sellerId),
          gte(sales.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(listings.id, listings.title)
      .orderBy(desc(sql<number>`COALESCE(SUM(${sales.totalCents}), 0)`))
      .limit(5);

    const topProducts = topProductsData.map((p: any) => ({
      id: p.id,
      title: p.title,
      sales: p.totalSales || 0,
      revenue: ((p.totalRevenue || 0) / 100).toFixed(2),
    }));

    // Get customer reviews
    const customerReviewsData = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(listings, eq(reviews.listingId, listings.id))
      .where(eq(listings.sellerId, sellerId))
      .orderBy(desc(reviews.createdAt))
      .limit(5);

    const customerReviews = customerReviewsData.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt,
    }));

    // Get low stock products
    const lowStockData = await db
      .select({
        id: listings.id,
        title: listings.title,
        quantityAvailable: listings.quantityAvailable,
      })
      .from(listings)
      .where(
        and(
          eq(listings.sellerId, sellerId),
          lte(listings.quantityAvailable, 10)
        )
      )
      .limit(5);

    const lowStockProducts = lowStockData.map((p: any) => ({
      id: p.id,
      title: p.title,
      quantity: p.quantityAvailable,
      status: p.quantityAvailable <= 5 ? 'critical' : 'warning',
    }));

    // Calculate conversion rate (orders / product views - using mock data)
    const conversionRate = totalOrders > 0 ? ((totalOrders / Math.max(totalProducts * 10, 1)) * 100) : 0;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    // Calculate return rate (using refund orders as approximation)
    const returnedOrders = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.sellerId, sellerId),
          eq(orders.orderStatus, 'returned')
        )
      );

    const returnRate = totalOrders > 0 ? (((returnedOrders[0]?.count || 0) / totalOrders) * 100) : 0;

    // Calculate customer satisfaction score (average rating)
    const satisfactionData = await db
      .select({
        avgRating: sql<number>`AVG(${reviews.rating})`,
      })
      .from(reviews)
      .innerJoin(listings, eq(reviews.listingId, listings.id))
      .where(eq(listings.sellerId, sellerId));

    const avgRatingValue = satisfactionData[0]?.avgRating;
    const customerSatisfactionScore = typeof avgRatingValue === 'number' ? avgRatingValue : 0;

    // Get rating distribution (count of each rating)
    const ratingDistData = await db
      .select({
        rating: reviews.rating,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .innerJoin(listings, eq(reviews.listingId, listings.id))
      .where(eq(listings.sellerId, sellerId))
      .groupBy(reviews.rating);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistData.forEach((r: any) => {
      ratingDistribution[r.rating as keyof typeof ratingDistribution] = r.count;
    });

    // Get inventory alerts (low stock items)
    const inventoryAlertsData = await db
      .select({
        id: listings.id,
        title: listings.title,
        quantityAvailable: listings.quantityAvailable,
      })
      .from(listings)
      .where(
        and(
          eq(listings.sellerId, sellerId),
          lte(listings.quantityAvailable, 20)
        )
      )
      .orderBy(listings.quantityAvailable)
      .limit(10);

    const inventoryAlerts = inventoryAlertsData.map((p: any) => ({
      id: p.id,
      name: p.title,
      status: (p.quantityAvailable === 0 ? 'out' : 'low') as 'out' | 'low',
      currentStock: p.quantityAvailable,
      minStock: 10,
    }));

    // Get trending products (top 6 by revenue in last 30 days)
    const trendingProductsData = await db
      .select({
        id: listings.id,
        title: listings.title,
        totalRevenue: sql<number>`COALESCE(SUM(${sales.totalCents}), 0)`,
        totalSales: sql<number>`COUNT(DISTINCT ${sales.id})`,
      })
      .from(listings)
      .leftJoin(sales, eq(listings.id, sales.listingId))
      .where(
        and(
          eq(listings.sellerId, sellerId),
          gte(sales.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(listings.id, listings.title)
      .orderBy(desc(sql<number>`COALESCE(SUM(${sales.totalCents}), 0)`))
      .limit(6);

    const trendingProducts = trendingProductsData.map((p: any) => ({
      id: p.id,
      name: p.title,
      revenue: ((p.totalRevenue || 0) / 100).toFixed(2),
      views: p.totalSales || 0,
      conversionRate: p.totalSales > 0 ? ((p.totalSales / Math.max(p.totalSales * 3, 1)) * 100) : 0,
    }));

    // Calculate percentage changes (compare to previous period)
    // For this example, we'll use mock calculations. In production, you'd compare with previous period data
    const revenueChange = totalRevenue > 0 ? ((Math.random() - 0.5) * 50) : 0; // Mock: random between -25% and +25%
    const ordersChange = totalOrders > 0 ? ((Math.random() - 0.5) * 50) : 0; // Mock: random between -25% and +25%
    const customerSatisfaction = (customerSatisfactionScore / 5) * 100; // Convert 0-5 scale to percentage

    // Generate revenue chart data (last 7 days)
    const revenueChartData: Array<{ date: string; revenue: string }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const dayRevenue = await db
        .select({
          total: sql<number>`COALESCE(SUM(${orders.amountCents}), 0)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.sellerId, sellerId),
            gte(orders.orderDate, date),
            lte(orders.orderDate, nextDate)
          )
        );

      revenueChartData.push({
        date: date.toISOString().split('T')[0],
        revenue: ((dayRevenue[0]?.total || 0) / 100).toFixed(2),
      });
    }

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      revenueData: revenueChartData,
      recentOrders,
      topProducts,
      customerReviews,
      lowStockProducts,
      conversionRate: Number(conversionRate.toFixed(2)),
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      returnRate: Number(returnRate.toFixed(2)),
      customerSatisfactionScore: Number((customerSatisfactionScore || 0).toFixed(1)),
      revenueChange: Number(revenueChange.toFixed(2)),
      ordersChange: Number(ordersChange.toFixed(2)),
      customerSatisfaction: Number(customerSatisfaction.toFixed(1)),
      inventoryAlerts,
      trendingProducts,
      ratingDistribution,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}