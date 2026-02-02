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

function generateReplyEmailHTML(payload: SupportTicketEmailPayload): string {
  const appUrl = process.env.APP_URL || 'https://luxela.com';
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
  const appUrl = process.env.APP_URL || 'https://luxela.com';
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