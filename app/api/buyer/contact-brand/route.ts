import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/server/db';
import { supportTickets, buyers, sellers, buyerAccountDetails } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { notifySellerOfMessage } from '@/lib/services/notificationService';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { brandId, sellerId, subject, message } = await request.json();

    if (!subject || !message || !sellerId) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, message, sellerId' },
        { status: 400 }
      );
    }

    // Get buyer from user
    const buyer = await db
      .select({ id: buyers.id })
      .from(buyers)
      .where(eq(buyers.userId, user.id))
      .limit(1);

    if (!buyer.length) {
      return NextResponse.json(
        { error: 'Buyer profile not found' },
        { status: 404 }
      );
    }

    // Get buyer details for notification
    const buyerDetails = await db
      .select({ email: buyerAccountDetails.email, name: buyerAccountDetails.fullName })
      .from(buyerAccountDetails)
      .where(eq(buyerAccountDetails.buyerId, buyer[0].id))
      .limit(1);

    // Get seller details
    const sellerDetails = await db
      .select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .limit(1);

    if (!sellerDetails.length) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Create a support ticket for brand contact
    const insertResult = await db.insert(supportTickets).values({
      buyerId: buyer[0].id,
      sellerId: sellerId,
      subject: `Brand Contact: ${subject}`,
      description: message,
      status: 'open',
      priority: 'medium',
      category: 'general_inquiry',
    }).returning();

    // Get the inserted ticket ID
    const ticketId = insertResult?.[0]?.id || `ticket-${Date.now()}`;

    // Send notifications to seller (in-app + email)
    await notifySellerOfMessage({
      seller_id: sellerId,
      buyer_name: buyerDetails[0]?.name || 'Anonymous',
      buyer_email: buyerDetails[0]?.email || 'no-email@example.com',
      message: message,
      brand_id: brandId,
      support_ticket_id: ticketId as string,
    }).catch((err) => {
      // Log error but don't fail the request - notification is non-critical
      console.error('Failed to send seller notification:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent to the brand',
    });
  } catch (error) {
    console.error('Contact brand error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}