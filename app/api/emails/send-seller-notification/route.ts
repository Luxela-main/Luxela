import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailPayload {
  seller_email: string;
  seller_name: string;
  buyer_name: string;
  buyer_email: string;
  message: string;
  ticket_id: string;
  brand_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: EmailPayload = await request.json();

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard/messages/${payload.ticket_id}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Message from ${payload.buyer_name}</h2>
        
        <p>Hi ${payload.seller_name},</p>
        
        <p>You have received a new message from a buyer:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>From:</strong> ${payload.buyer_name} (${payload.buyer_email})</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${payload.message}</p>
        </div>
        
        <p>
          <a href="${dashboardUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Message in Dashboard
          </a>
        </p>
        
        <p>Best regards,<br/>The Marketplace Team</p>
      </div>
    `;

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@marketplace.com',
      to: payload.seller_email,
      subject: `New message from ${payload.buyer_name}`,
      html: emailHtml,
    });

    if (response.error) {
      console.error('Resend error:', response.error);
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      id: response.data?.id,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}