import { eq, or } from 'drizzle-orm';
import { db } from '@/server/db/client';
import {
  orders,
  sales,
  reviews,
  refunds,
  supportTickets,
  supportAnalytics,
} from '@/server/db/schema';
import { differenceInDays, addDays, subDays } from 'date-fns';

export interface DeliveryPrediction {
  orderId: string;
  estimatedDeliveryDate: Date;
  confidence: number;
  factors: string[];
}

export interface ChurnPrediction {
  buyerId: string;
  churnRisk: 'low' | 'medium' | 'high';
  riskScore: number;
  recommendations: string[];
}

export interface CustomerBehavior {
  buyerId: string;
  totalOrders: number;
  averageOrderValue: number;
  purchaseFrequency: string;
  preferredCategories: string[];
  lastPurchaseDate: Date;
  loyaltyScore: number;
}

export interface Recommendation {
  listingId: string;
  title: string;
  image: string;
  score: number;
  reason: string;
}

export class PredictiveAnalyticsService {
  // Predict delivery date based on historical data
  static async predictDeliveryDate(orderId: string): Promise<DeliveryPrediction> {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) throw new Error('Order not found');

      // Get seller's historical delivery times
      const sellerOrders = await db.query.orders.findMany({
        where: eq(orders.sellerId, order.sellerId),
        limit: 50,
      });

      const deliveryTimes: number[] = sellerOrders
        .filter((o) => o.deliveredDate && o.orderDate)
        .map((o) => differenceInDays(o.deliveredDate!, o.orderDate));

      const avgDeliveryDays =
        deliveryTimes.length > 0
          ? deliveryTimes.reduce((a, b) => a + b) / deliveryTimes.length
          : 5;

      // Get shipping zone factor
      const shippingFactor = this.getShippingFactor(order.shippingAddress);
      const adjustedDays = avgDeliveryDays + shippingFactor;

      const estimatedDate = addDays(order.orderDate, Math.ceil(adjustedDays));
      const confidence = Math.min(100, 85 + (deliveryTimes.length * 0.5));

      const factors = [
        `Seller's average: ${avgDeliveryDays.toFixed(1)} days`,
        `Shipping zone adjustment: +${shippingFactor} days`,
        `Based on ${sellerOrders.length} historical orders`,
      ];

      return {
        orderId,
        estimatedDeliveryDate: estimatedDate,
        confidence: confidence / 100,
        factors,
      };
    } catch (error) {
      console.error('Error predicting delivery date:', error);
      throw error;
    }
  }

  // Analyze customer behavior patterns
  static async analyzeBuyerBehavior(buyerId: string): Promise<CustomerBehavior> {
    try {
      // Get buyer orders
      const buyerOrders = await db.query.orders.findMany({
        where: eq(orders.buyerId, buyerId),
      });

      const totalOrders = buyerOrders.length;
      const totalSpent = buyerOrders.reduce((sum, o) => sum + o.amountCents, 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Calculate purchase frequency
      const sortedOrders = buyerOrders.sort(
        (a, b) => b.orderDate.getTime() - a.orderDate.getTime()
      );
      const purchaseFrequency = this.calculateFrequency(sortedOrders);

      // Get preferred categories
      const categories: Record<string, number> = {};
      buyerOrders.forEach((order) => {
        if (order.productCategory) {
          categories[order.productCategory] =
            (categories[order.productCategory] || 0) + 1;
        }
      });

      const preferredCategories = Object.entries(categories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat);

      // Get last purchase
      const lastPurchaseDate = sortedOrders[0]?.orderDate || new Date();

      // Calculate loyalty score
      const loyaltyScore = this.calculateLoyaltyScore(buyerOrders);

      return {
        buyerId,
        totalOrders,
        averageOrderValue: averageOrderValue / 100,
        purchaseFrequency,
        preferredCategories,
        lastPurchaseDate,
        loyaltyScore,
      };
    } catch (error) {
      console.error('Error analyzing buyer behavior:', error);
      throw error;
    }
  }

  // Predict churn risk
  static async predictChurnRisk(buyerId: string): Promise<ChurnPrediction> {
    try {
      const behavior = await this.analyzeBuyerBehavior(buyerId);

      // Calculate churn factors
      let riskScore = 0;
      const reasons: string[] = [];

      // Factor 1: Days since last purchase (0-40 points)
      const daysSinceLastPurchase = differenceInDays(
        new Date(),
        behavior.lastPurchaseDate
      );
      if (daysSinceLastPurchase > 180) {
        riskScore += 40;
        reasons.push(`No purchase in ${daysSinceLastPurchase} days`);
      } else if (daysSinceLastPurchase > 90) {
        riskScore += 20;
        reasons.push(`${daysSinceLastPurchase} days since last purchase`);
      }

      // Factor 2: Order frequency (0-30 points)
      const frequencyScore = behavior.totalOrders > 5 ? 0 : 15 + (5 - behavior.totalOrders) * 3;
      riskScore += frequencyScore;
      if (frequencyScore > 0) reasons.push('Low purchase frequency');

      // Factor 3: Return rate (0-20 points)
      const buyerRefunds = await db.query.refunds.findMany({
        where: eq(refunds.buyerId, buyerId),
      });
      const returnRate = buyerRefunds.length / behavior.totalOrders;
      if (returnRate > 0.5) {
        riskScore += 20;
        reasons.push(`High return rate: ${(returnRate * 100).toFixed(0)}%`);
      }

      // Factor 4: Support tickets (0-10 points)
      const supportTicketsList = await db.query.supportTickets.findMany({
        where: (supportTickets) => or(eq(supportTickets.buyerId, buyerId), eq(supportTickets.sellerId, buyerId)),
      });
      const supportTickets = supportTicketsList;
      if (supportTickets.length > 3) {
        riskScore += 10;
        reasons.push(`${supportTickets.length} support tickets`);
      }

      // Determine risk level
      let churnRisk: 'low' | 'medium' | 'high' = 'low';
      if (riskScore > 70) churnRisk = 'high';
      else if (riskScore > 40) churnRisk = 'medium';

      const recommendations = this.generateChurnRecommendations(
        churnRisk,
        behavior,
        reasons
      );

      return {
        buyerId,
        churnRisk,
        riskScore: riskScore / 100,
        recommendations,
      };
    } catch (error) {
      console.error('Error predicting churn risk:', error);
      throw error;
    }
  }

  // Generate product recommendations
  static async getRecommendations(
    buyerId: string,
    limit = 5
  ): Promise<Recommendation[]> {
    try {
      const behavior = await this.analyzeBuyerBehavior(buyerId);

      // Get buyer's purchase history
      const buyerOrders = await db.query.orders.findMany({
        where: eq(orders.buyerId, buyerId),
      });

      const purchasedListingIds = new Set(
        buyerOrders.map((o) => o.listingId)
      );

      // Get similar products based on preferred categories
      const recommendations: Recommendation[] = [];

      // For each preferred category, find top-rated items
      for (const category of behavior.preferredCategories) {
        // In a real implementation, this would query the full listings/products table
        // For now, we'll simulate recommendations
        recommendations.push({
          listingId: `rec-${category}-${Math.random().toString(36).slice(7)}`,
          title: `Recommended ${category} Item`,
          image: `/images/placeholder-${category}.jpg`,
          score: 0.85 + Math.random() * 0.15,
          reason: `Popular in ${category}, your favorite category`,
        });
      }

      // Add trending items
      if (recommendations.length < limit) {
        recommendations.push({
          listingId: `trending-${Math.random().toString(36).slice(7)}`,
          title: 'Trending Item',
          image: '/images/trending.jpg',
          score: 0.8,
          reason: 'Currently trending with similar buyers',
        });
      }

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // Get analytics dashboard
  static async getAnalyticsDashboard(sellerId?: string) {
    try {
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 30);
      const ninetyDaysAgo = subDays(today, 90);

      // Get basic metrics
      const recentOrders = await db.query.orders.findMany({
        where: sellerId
          ? eq(orders.sellerId, sellerId)
          : undefined,
      });

      const ordersLast30 = recentOrders.filter(
        (o) => o.orderDate >= thirtyDaysAgo
      );
      const ordersLast90 = recentOrders.filter(
        (o) => o.orderDate >= ninetyDaysAgo
      );

      // Revenue metrics
      const revenue30 = ordersLast30.reduce((sum, o) => sum + o.amountCents, 0);
      const revenue90 = ordersLast90.reduce((sum, o) => sum + o.amountCents, 0);

      // Refund rate
      const refunds30 = await db.query.refunds.findMany({
        where: sellerId
          ? eq(refunds.sellerId, sellerId)
          : undefined,
      });
      const refundRate = ordersLast30.length > 0
        ? (refunds30.length / ordersLast30.length) * 100
        : 0;

      // Ticket metrics
      const tickets30 = await db.query.supportTickets.findMany({
        where: sellerId
          ? eq(supportTickets.sellerId, sellerId)
          : undefined,
      });

      // Customer satisfaction (estimated from reviews)
      const reviews30 = await db.query.reviews.findMany();
      const avgRating = reviews30.length > 0
        ? reviews30.reduce((sum: number, r) => sum + (r.rating as number || 0), 0) / reviews30.length
        : 0;

      return {
        period: '30 days',
        metrics: {
          orders: ordersLast30.length,
          revenue: revenue30 / 100,
          refundRate: refundRate.toFixed(2),
          supportTickets: tickets30.length,
          avgRating: avgRating.toFixed(1),
          conversionRate: (ordersLast30.length / (ordersLast30.length + 100)) * 100,
        },
        trends: {
          orderTrend: ordersLast30.length > recentOrders.length / 3,
          revenueTrend: revenue30 > revenue90 / 4,
          customerSatisfactionTrend: avgRating >= 4,
        },
        predictions: {
          nextMonth: {
            estimatedOrders: Math.ceil(ordersLast30.length * 1.1),
            estimatedRevenue: (revenue30 * 1.1) / 100,
            confidence: 0.85,
          },
        },
      };
    } catch (error) {
      console.error('Error generating analytics dashboard:', error);
      throw error;
    }
  }

  // Private helper methods
  private static getShippingFactor(address?: string | null): number {
    // Simple heuristic: international addresses add 5 days
    if (!address) return 0;
    const intlIndicators = ['international', 'overseas', 'abroad'];
    const isInternational = intlIndicators.some((ind) =>
      address.toLowerCase().includes(ind)
    );
    return isInternational ? 5 : 0;
  }

  private static calculateFrequency(orders: any[]): string {
    if (orders.length === 0) return 'inactive';
    if (orders.length < 2) return 'one_time';

    const daysSpan = differenceInDays(orders[0].orderDate, orders[orders.length - 1].orderDate);
    const avgDaysBetween = daysSpan / (orders.length - 1);

    if (avgDaysBetween < 30) return 'weekly';
    if (avgDaysBetween < 90) return 'monthly';
    if (avgDaysBetween < 180) return 'quarterly';
    return 'annual';
  }

  private static calculateLoyaltyScore(orders: any[]): number {
    let score = 0;

    // Recency (0-30 points)
    const lastOrderDays = differenceInDays(new Date(), orders[0]?.orderDate || new Date());
    score += Math.max(0, 30 - lastOrderDays / 10);

    // Frequency (0-40 points)
    score += Math.min(40, orders.length * 4);

    // Monetary (0-30 points)
    const totalSpent = orders.reduce((sum, o) => sum + o.amountCents, 0);
    score += Math.min(30, (totalSpent / 1000000) * 30);

    return Math.min(100, score);
  }

  private static generateChurnRecommendations(
    risk: string,
    behavior: CustomerBehavior,
    reasons: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (risk === 'high' || risk === 'medium') {
      recommendations.push('Send personalized re-engagement email');
      recommendations.push(`Offer discount on ${behavior.preferredCategories[0] || 'popular items'}`);
      recommendations.push('Ask for feedback on past purchases');
    }

    if (reasons.some((r) => r.includes('return'))) {
      recommendations.push('Review return/exchange process');
      recommendations.push('Follow up on product quality concerns');
    }

    if (reasons.some((r) => r.includes('support'))) {
      recommendations.push('Improve customer support response time');
      recommendations.push('Offer dedicated account support');
    }

    if (behavior.totalOrders < 3) {
      recommendations.push('Create loyalty program');
      recommendations.push('Offer first-purchase discount on new items');
    }

    return recommendations.slice(0, 4);
  }
}