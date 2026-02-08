import { NextRequest, NextResponse } from 'next/server';
import { OrderTrackingService } from '@/server/services/orderTrackingService';
import crypto from 'crypto';

// Courier webhook signatures for verification
const COURIER_SECRETS = {
  dhl: process.env.DHL_WEBHOOK_SECRET,
  fedex: process.env.FEDEX_WEBHOOK_SECRET,
  ups: process.env.UPS_WEBHOOK_SECRET,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const courier = request.headers.get('x-courier') || determineCourierFromPayload(body);

    if (!courier) {
      return NextResponse.json(
        { error: 'Unknown courier' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const signature = request.headers.get('x-signature');
    const secret = COURIER_SECRETS[courier as keyof typeof COURIER_SECRETS];

    if (signature && secret) {
      const expectedSignature = generateSignature(
        JSON.stringify(body),
        secret
      );

      if (!constantTimeCompare(signature, expectedSignature)) {
        console.warn(`[Webhook] Invalid signature for ${courier}`);
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    console.log(`[Webhook] Received tracking update from ${courier}`);

    // Handle webhook based on courier
    switch (courier) {
      case 'dhl':
        return await handleDHLWebhook(body);
      case 'fedex':
        return await handleFedExWebhook(body);
      case 'ups':
        return await handleUPSWebhook(body);
      default:
        return NextResponse.json(
          { error: 'Unsupported courier' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Webhook] Error processing courier webhook:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleDHLWebhook(payload: any) {
  try {
    const trackingNumber = payload.shipmentTrackingNumber || payload.trackingNumber;
    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'No tracking number' },
        { status: 400 }
      );
    }

    const trackingUpdate = {
      tracking_number: trackingNumber,
      status: payload.status || payload.delivery_status,
      location: payload.currentLocation || payload.location,
      timestamp: new Date(payload.timestamp || Date.now()),
      description: payload.description || payload.message,
    };

    await OrderTrackingService.handleCourierWebhook('dhl', trackingUpdate);

    return NextResponse.json({
      success: true,
      tracking: trackingNumber,
    });
  } catch (error) {
    console.error('[DHL Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process DHL webhook' },
      { status: 500 }
    );
  }
}

async function handleFedExWebhook(payload: any) {
  try {
    // FedEx TrackingEvent format
    const trackingNumber =
      payload.TrackingNumber || payload.tracknumber;
    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'No tracking number' },
        { status: 400 }
      );
    }

    const events = payload.TrackingEvents || [];
    const latestEvent = events[0] || {};

    const trackingUpdate = {
      tracking_number: trackingNumber,
      status: latestEvent.Status || payload.status,
      location: latestEvent.Location?.city || latestEvent.location,
      timestamp: new Date(latestEvent.Timestamp || Date.now()),
      description: latestEvent.StatusDescription || 'No description',
    };

    await OrderTrackingService.handleCourierWebhook('fedex', trackingUpdate);

    return NextResponse.json({
      success: true,
      tracking: trackingNumber,
    });
  } catch (error) {
    console.error('[FedEx Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process FedEx webhook' },
      { status: 500 }
    );
  }
}

async function handleUPSWebhook(payload: any) {
  try {
    const trackingNumber = payload.ShipmentNumber || payload.tracknumber;
    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'No tracking number' },
        { status: 400 }
      );
    }

    const activity = payload.PackageActivityList?.[0] || {};

    const trackingUpdate = {
      tracking_number: trackingNumber,
      status: activity.Status?.StatusType || payload.status,
      location: activity.Location?.City || activity.location,
      timestamp: new Date(activity.Date || Date.now()),
      description: activity.Status?.Description || 'No description',
    };

    await OrderTrackingService.handleCourierWebhook('ups', trackingUpdate);

    return NextResponse.json({
      success: true,
      tracking: trackingNumber,
    });
  } catch (error) {
    console.error('[UPS Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process UPS webhook' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateSignature(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function determineCourierFromPayload(payload: any): string | null {
  // DHL indicators
  if (payload.shipmentTrackingNumber || payload.currentLocation) {
    return 'dhl';
  }

  // FedEx indicators
  if (payload.TrackingNumber || payload.TrackingEvents) {
    return 'fedex';
  }

  // UPS indicators
  if (payload.ShipmentNumber || payload.PackageActivityList) {
    return 'ups';
  }

  return null;
}