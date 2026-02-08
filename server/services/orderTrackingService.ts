import { eq, and } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { orders, notifications, orderStateTransitions } from '@/server/db/schema';

export interface TrackingUpdate {
  trackingNumber: string;
  status: 'not_shipped' | 'in_transit' | 'delivered';
  lastUpdate: Date;
  currentLocation?: string;
  estimatedDelivery?: Date;
  events?: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

export interface CourierConfig {
  name: string;
  apiKey: string;
  apiUrl: string;
  trackingUrlPattern: string;
}

export class OrderTrackingService {
  private static courierConfigs: Map<string, CourierConfig> = new Map([
    [
      'dhl',
      {
        name: 'DHL',
        apiKey: process.env.DHL_API_KEY || '',
        apiUrl: 'https://api.dhl.com/tracking',
        trackingUrlPattern: 'https://tracking.dhl.com/tracking?id={tracking}',
      },
    ],
    [
      'fedex',
      {
        name: 'FedEx',
        apiKey: process.env.FEDEX_API_KEY || '',
        apiUrl: 'https://apis.fedex.com/track',
        trackingUrlPattern: 'https://tracking.fedex.com/tracking?tracknumbers={tracking}',
      },
    ],
    [
      'ups',
      {
        name: 'UPS',
        apiKey: process.env.UPS_API_KEY || '',
        apiUrl: 'https://onlinetools.ups.com/track/v1/details',
        trackingUrlPattern: 'https://www.ups.com/track?tracknum={tracking}',
      },
    ],
  ]);

  // Assign tracking number to order
  static async assignTracking(
    orderId: string,
    trackingNumber: string,
    courier: string,
    estimatedArrival?: Date
  ) {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) throw new Error('Order not found');

      const [updated] = await db
        .update(orders)
        .set({
          trackingNumber,
          deliveryStatus: 'in_transit',
          estimatedArrival,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Log state transition
      await db.insert(orderStateTransitions).values({
        orderId,
        fromStatus: order.orderStatus,
        toStatus: 'shipped',
        reason: `Tracking assigned: ${trackingNumber}`,
        triggeredBy: '00000000-0000-0000-0000-000000000000',
        triggeredByRole: 'admin',
      });

      // Notify buyer with tracking link
      const trackingUrl = this.getTrackingUrl(courier, trackingNumber);
      await db.insert(notifications).values({
        sellerId: order.sellerId,
        buyerId: order.buyerId,
        orderId,
        type: 'delivery_confirmed',
        message: `Your order is on the way! Tracking: ${trackingNumber}. View status: ${trackingUrl}`,
      });

      return {
        ...updated,
        trackingUrl,
        courier,
      };
    } catch (error) {
      console.error('Error assigning tracking:', error);
      throw error;
    }
  }

  // Get tracking status
  static async getTrackingStatus(orderId: string) {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) throw new Error('Order not found');
      if (!order.trackingNumber) {
        return {
          orderId,
          status: 'not_shipped',
          message: 'Order has not been shipped yet',
        };
      }

      // In production, fetch from courier API
      // For now, return simulated data
      return {
        orderId,
        trackingNumber: order.trackingNumber,
        status: order.deliveryStatus,
        estimatedArrival: order.estimatedArrival,
        currentLocation: 'In Transit',
        lastUpdate: new Date(),
        events: [
          {
            timestamp: new Date(),
            status: 'in_transit',
            location: 'Distribution Center',
            description: 'Package is in transit',
          },
        ],
      };
    } catch (error) {
      console.error('Error fetching tracking status:', error);
      throw error;
    }
  }

  // Sync tracking with courier API (called by Vercel cron)
  static async syncTracking(trackingNumber: string, courier: string) {
    try {
      const courierConfig = this.courierConfigs.get(courier.toLowerCase());
      if (!courierConfig) throw new Error(`Unknown courier: ${courier}`);

      // Fetch tracking data from courier API
      const trackingData = await this.fetchFromCourier(
        courierConfig,
        trackingNumber
      );

      // Find orders with this tracking number
      const ordersToUpdate = await db.query.orders.findMany({
        where: eq(orders.trackingNumber, trackingNumber),
      });

      for (const order of ordersToUpdate) {
        // Update delivery status based on tracking
        const newStatus = this.mapCourierStatusToDeliveryStatus(
          trackingData.status
        );

        if (newStatus !== order.deliveryStatus) {
          await db
            .update(orders)
            .set({
              deliveryStatus: newStatus,
              estimatedArrival:
                trackingData.estimatedDelivery || order.estimatedArrival,
              updatedAt: new Date(),
              deliveredDate:
                newStatus === 'delivered' ? new Date() : order.deliveredDate,
            })
            .where(eq(orders.id, order.id));

          // Notify buyer of status change
          const statusMessages = {
            in_transit: 'Your package is on the way!',
            delivered: 'Your package has been delivered!',
            not_shipped: 'Your order is being prepared',
          };

          await db.insert(notifications).values({
            sellerId: order.sellerId,
            buyerId: order.buyerId,
            orderId: order.id,
            type: 'delivery_confirmed',
            message:
              statusMessages[newStatus as keyof typeof statusMessages] ||
              'Order status updated',
          });
        }
      }

      return trackingData;
    } catch (error) {
      console.error('Error syncing tracking:', error);
      throw error;
    }
  }

  // Webhook handler for courier updates
  static async handleCourierWebhook(
    courier: string,
    payload: Record<string, any>
  ) {
    try {
      const trackingNumber = payload.tracking_number || payload.tracknumber;
      if (!trackingNumber) throw new Error('No tracking number in webhook');

      const trackingData = {
        status: payload.status || payload.event,
        location: payload.location,
        timestamp: new Date(payload.timestamp),
        description: payload.description || payload.message,
      };

      // Update tracking
      await this.syncTracking(trackingNumber, courier);

      return { success: true, trackingNumber };
    } catch (error) {
      console.error('Error handling courier webhook:', error);
      throw error;
    }
  }

  // Get batch tracking status (for multiple orders)
  static async getMultipleTrackingStatus(orderIds: string[]) {
    try {
      const trackingData = await Promise.all(
        orderIds.map((id) => this.getTrackingStatus(id))
      );
      return trackingData;
    } catch (error) {
      console.error('Error fetching multiple tracking status:', error);
      throw error;
    }
  }

  // Setup webhook endpoint (called during initialization)
  static async setupCourierWebhooks() {
    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/courier`;

      for (const [courier, config] of this.courierConfigs) {
        // In production, register webhook with courier
        console.log(`Setting up ${courier} webhook at ${webhookUrl}`);
        // Example: await registerWebhookWithCourier(config, webhookUrl);
      }

      return { success: true, webhookUrl };
    } catch (error) {
      console.error('Error setting up courier webhooks:', error);
      throw error;
    }
  }

  // Private helper methods
  private static async fetchFromCourier(
    config: CourierConfig,
    trackingNumber: string
  ) {
    try {
      const response = await fetch(`${config.apiUrl}/${trackingNumber}`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Courier API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.normalizeCourierResponse(data);
    } catch (error) {
      console.error('Error fetching from courier API:', error);
      // Return cached/last known status
      return {
        status: 'in_transit',
        location: 'Unknown',
        estimatedDelivery: new Date(),
      };
    }
  }

  private static normalizeCourierResponse(data: any) {
    // Normalize responses from different couriers to common format
    return {
      status: data.status?.toLowerCase() || 'in_transit',
      location: data.location?.city || data.location || 'In Transit',
      estimatedDelivery:
        data.estimatedDelivery || data.eta || data.estimated_delivery,
      events: (data.events || data.milestones || []).map((event: any) => ({
        timestamp: new Date(event.timestamp || event.date),
        status: event.status || event.type,
        location: event.location || event.city,
        description: event.description || event.message,
      })),
    };
  }

  private static mapCourierStatusToDeliveryStatus(
    courierStatus: string
  ): 'not_shipped' | 'in_transit' | 'delivered' {
    const status = courierStatus.toLowerCase();
    if (status.includes('deliver')) return 'delivered';
    if (status.includes('transit') || status.includes('shipped')) return 'in_transit';
    return 'not_shipped';
  }

  private static getTrackingUrl(courier: string, trackingNumber: string) {
    const config = this.courierConfigs.get(courier.toLowerCase());
    if (!config) return '#';
    return config.trackingUrlPattern.replace('{tracking}', trackingNumber);
  }
}