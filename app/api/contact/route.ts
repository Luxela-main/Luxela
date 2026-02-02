import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@luxela.com';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validate input
    if (!body.name || !body.email || !body.subject || !body.message || !body.category) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate message length
    if (body.message.length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }

    const transporter = getTransporter();
    const fromEmail = process.env.SMTP_FROM || 'noreply@luxela.com';

    // Send email to admin
    try {
      await transporter.sendMail({
        from: fromEmail,
        to: ADMIN_EMAIL,
        subject: `New Contact Form Submission: ${body.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
            <h2 style="color: #8451E1;">New Contact Form Submission</h2>
            <hr style="border: 1px solid #e0e0e0;">
            
            <p><strong>From:</strong> ${body.name} (${body.email})</p>
            <p><strong>Category:</strong> ${body.category.replace(/_/g, ' ').toUpperCase()}</p>
            <p><strong>Subject:</strong> ${body.subject}</p>
            
            <hr style="border: 1px solid #e0e0e0;">
            <h3 style="color: #333;">Message:</h3>
            <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 5px;">
              ${body.message}
            </p>
            
            <hr style="border: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999;">
              This email was sent from the Luxela contact form. Please reply to ${body.email} to respond.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send admin email:', emailError);
      // Don't fail the request if admin email fails
    }

    // Send confirmation email to user
    try {
      await transporter.sendMail({
        from: fromEmail,
        to: body.email,
        subject: 'We received your message - Luxela Support',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
            <h2 style="color: #8451E1;">Thank You for Contacting Luxela</h2>
            <p>Hi ${body.name},</p>
            
            <p>We've received your message and will get back to you as soon as possible. Our support team typically responds within 24 hours during business days.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Your submitted information:</strong></p>
              <p><strong>Subject:</strong> ${body.subject}</p>
              <p><strong>Category:</strong> ${body.category.replace(/_/g, ' ').toUpperCase()}</p>
              <p style="white-space: pre-wrap;"><strong>Message:</strong><br/>${body.message}</p>
            </div>
            
            <p>If you need immediate assistance, please contact our support team at ${ADMIN_EMAIL}.</p>
            
            <p>Best regards,<br/>Luxela Support Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if confirmation email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been received. We will get back to you soon!',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again later.' },
      { status: 500 }
    );
  }
}