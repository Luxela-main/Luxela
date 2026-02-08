import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface NotificationPayload {
  seller_id: string;
  buyer_name: string;
  buyer_email: string;
  message: string;
  brand_id: string;
  support_ticket_id: string;
}

/**
 * Send in-app notification to seller
 */
export async function sendInAppNotification(payload: NotificationPayload) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: payload.seller_id,
          type: 'new_message',
          title: `New message from ${payload.buyer_name}`,
          message: payload.message.substring(0, 150), // Preview
          related_id: payload.support_ticket_id,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Failed to create in-app notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error in sendInAppNotification:', err);
    return { success: false, error: err };
  }
}

/**
 * Send email notification to seller
 */
export async function sendEmailNotification(payload: NotificationPayload) {
  try {
    // Get seller email from database
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', payload.seller_id)
      .single();

    if (sellerError || !seller) {
      console.error('Failed to fetch seller email:', sellerError);
      return { success: false, error: sellerError };
    }

    // Send email via your email service (Resend, SendGrid, etc.)
    const response = await fetch('/api/emails/send-seller-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seller_email: seller.email,
        seller_name: seller.full_name,
        buyer_name: payload.buyer_name,
        buyer_email: payload.buyer_email,
        message: payload.message,
        ticket_id: payload.support_ticket_id,
        brand_id: payload.brand_id,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email notification');
    }

    return { success: true };
  } catch (err) {
    console.error('Error in sendEmailNotification:', err);
    return { success: false, error: err };
  }
}

/**
 * Send notifications to seller (both in-app and email)
 */
export async function notifySellerOfMessage(payload: NotificationPayload) {
  const results = await Promise.all([
    sendInAppNotification(payload),
    sendEmailNotification(payload),
  ]);

  return {
    inApp: results[0],
    email: results[1],
    success: results[0].success || results[1].success, // At least one should succeed
  };
}