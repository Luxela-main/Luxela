import nodemailer from 'nodemailer';

interface SupportTicketEmailPayload {
  type: 'ticket_reply' | 'ticket_status_update';
  recipientEmail: string;
  ticketId: string;
  ticketSubject: string;
  replyMessage?: string;
  newStatus?: string;
  oldStatus?: string;
  senderName?: string;
}

interface PayoutVerificationEmailPayload {
  recipientEmail: string;
  recipientName: string;
  sellerId: string;
  methodId: string;
  verificationCode: string;
  methodType: 'bank' | 'paypal' | 'stripe' | 'flutterwave' | 'tsara' | 'mobile_money' | 'wise' | 'other';
  accountDetails: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendPayoutVerificationEmail(
  payload: PayoutVerificationEmailPayload
): Promise<void> {
  try {
    const transporter = getTransporter();
    const fromEmail = process.env.SMTP_FROM || 'noreply@luxela.com';
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'https://luxela.com';

    console.log('[PayoutVerification] Preparing to send verification email', {
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      methodId: payload.methodId,
      methodType: payload.methodType,
      fromEmail: fromEmail,
      smtpHost: process.env.SMTP_HOST,
    });

    const subject = 'Verify Your Payout Method - Luxela';
    const htmlContent = generatePayoutVerificationEmailHTML(payload, appUrl);

    const result = await transporter.sendMail({
      from: fromEmail,
      to: payload.recipientEmail,
      subject: subject,
      html: htmlContent,
    });

    console.log(`[PayoutVerification] Email sent successfully to ${payload.recipientEmail}`, {
      messageId: result.messageId,
      methodId: payload.methodId,
      methodType: payload.methodType,
      verificationCode: payload.verificationCode.substring(0, 2) + '****',
    });
  } catch (error: any) {
    console.error('[PayoutVerification] Failed to send verification email:', {
      error: error?.message || String(error),
      recipientEmail: payload.recipientEmail,
      methodId: payload.methodId,
      stack: error?.stack,
    });
    throw error;
  }
}

export async function sendSupportTicketEmail(
  payload: SupportTicketEmailPayload
): Promise<void> {
  try {
    const transporter = getTransporter();
    const fromEmail = process.env.SMTP_FROM || 'noreply@luxela.com';

    let subject = '';
    let htmlContent = '';

    if (payload.type === 'ticket_reply') {
      subject = `New Reply to Support Ticket: ${payload.ticketSubject}`;
      htmlContent = generateReplyEmailHTML(payload);
    } else if (payload.type === 'ticket_status_update') {
      subject = `Support Ticket Status Updated: ${payload.ticketSubject}`;
      htmlContent = generateStatusUpdateEmailHTML(payload);
    }

    await transporter.sendMail({
      from: fromEmail,
      to: payload.recipientEmail,
      subject: subject,
      html: htmlContent,
    });

    console.log(`Support ticket email sent to ${payload.recipientEmail}`);
  } catch (error) {
    console.error('Failed to send support ticket email:', error);
    throw error;
  }
}

function generatePayoutVerificationEmailHTML(
  payload: PayoutVerificationEmailPayload,
  appUrl: string
): string {
  const methodTypeLabels: Record<string, string> = {
    bank: '🏦 Bank Transfer',
    paypal: '🅿️ PayPal',
    stripe: '💳 Stripe',
    flutterwave: '🌊 Flutterwave',
    tsara: '📱 Tsara',
    mobile_money: '📱 Mobile Money',
    wise: '💱 Wise Transfer',
    other: '💼 Other',
  };

  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #1f2937; margin-bottom: 10px; font-size: 24px;">Verify Your Payout Method</h1>
            <p style="color: #6b7280; margin-bottom: 20px;">Hi ${payload.recipientName},</p>

            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              To keep your account secure, we need you to verify your ${methodTypeLabels[payload.methodType] || 'payout method'}.
            </p>

            <div style="background-color: #f3f4f6; border-left: 4px solid #7c3aed; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Your Verification Code</p>
              <div style="background-color: white; padding: 15px; border-radius: 4px; text-align: center; margin: 10px 0;">
                <p style="font-size: 32px; font-weight: bold; color: #7c3aed; letter-spacing: 5px; margin: 0; font-family: 'Courier New', monospace;">${payload.verificationCode}</p>
              </div>
              <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">⏱️ This code expires in 10 minutes</p>
            </div>

            <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 4px; padding: 15px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>🔒 Security Tip:</strong> Never share this code with anyone. Luxela support will never ask for it.
              </p>
            </div>

            <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 15px; margin: 20px 0;">
              <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6;">
                <strong>📋 Method Details:</strong><br>
                ${payload.accountDetails}
              </p>
            </div>

            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">
              <strong>How to verify:</strong>
            </p>
            <ol style="color: #374151; line-height: 1.8; margin: 10px 0 20px 20px;">
              <li>Go to your <a href="${appUrl}/sellers/account/payment-settings" style="color: #7c3aed; text-decoration: none; font-weight: 500;">Payment Settings</a></li>
              <li>Click "Verify" on your pending payout method</li>
              <li>Enter the 6-digit code above</li>
              <li>Your method will be verified immediately</li>
            </ol>

            <p style="color: #6b7280; font-size: 13px; margin: 20px 0;">
              If you didn't request this verification, please <a href="${appUrl}/sellers/support" style="color: #7c3aed; text-decoration: none; font-weight: 500;">contact our support team</a>.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              © 2024 Luxela. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateReplyEmailHTML(payload: SupportTicketEmailPayload): string {
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'https://luxela.com';
  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">New Reply to Your Support Ticket</h2>
          <p>Hello,</p>
          <p>Your support ticket <strong>${payload.ticketSubject}</strong> has received a new reply from ${payload.senderName || 'Support Team'}.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #7c3aed; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${payload.replyMessage || ''}</p>
          </div>

          <p>
            <a href="${appUrl}/buyer/support/tickets/${payload.ticketId}" 
               style="display: inline-block; padding: 10px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px;">
              View Your Ticket
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </body>
    </html>
  `;
}

function generateStatusUpdateEmailHTML(payload: SupportTicketEmailPayload): string {
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'https://luxela.com';
  const statusLabel = payload.newStatus
    ?.replace(/_/g, ' ')
    .toUpperCase() || 'UPDATED';

  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Your Support Ticket Status Has Changed</h2>
          <p>Hello,</p>
          <p>Your support ticket <strong>${payload.ticketSubject}</strong> status has been updated.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 10px 0;">
              <strong>Previous Status:</strong> <span style="text-transform: capitalize;">${payload.oldStatus || 'N/A'}</span>
            </p>
            <p style="margin: 10px 0;">
              <strong>New Status:</strong> <span style="color: #7c3aed; font-weight: bold; text-transform: capitalize;">${statusLabel}</span>
            </p>
          </div>

          <p>
            <a href="${appUrl}/buyer/support/tickets/${payload.ticketId}" 
               style="display: inline-block; padding: 10px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px;">
              View Your Ticket
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </body>
    </html>
  `;
}