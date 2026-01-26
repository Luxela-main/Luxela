import nodemailer from 'nodemailer';
import { EventEmitter } from 'events';

/**
 * Enterprise Support Notification Service
 * Handles:
 * - Email notifications
 * - Real-time WebSocket updates
 * - SLA breach alerts
 * - Escalation notifications
 * - Team member notifications
 */

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

interface NotificationEvent {
  type: 'ticket_created' | 'ticket_assigned' | 'ticket_updated' | 'sla_breached' | 'escalated' | 'resolved';
  ticketId: string;
  recipientId?: string;
  data: Record<string, any>;
}

class SupportNotificationService extends EventEmitter {
  private emailTransporter: nodemailer.Transporter;
  private wsConnections: Map<string, Set<WebSocket>> = new Map();

  constructor() {
    super();
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(options: EmailOptions): Promise<void> {
    const templates = {
      ticket_created: this.templateTicketCreated,
      ticket_assigned: this.templateTicketAssigned,
      ticket_resolved: this.templateTicketResolved,
      sla_breached: this.templateSLABreach,
      escalation: this.templateEscalation,
    };

    const template = templates[options.template as keyof typeof templates];
    if (!template) {
      console.error(`Email template not found: ${options.template}`);
      return;
    }

    const htmlContent = template(options.data);

    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'support@luxela.com',
        to: options.to,
        subject: options.subject,
        html: htmlContent,
      });

      console.log(`[Support Email] Sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      console.error('[Support Email Error]', error);
      throw error;
    }
  }

  /**
   * Broadcast real-time update via WebSocket
   */
  broadcastUpdate(event: NotificationEvent): void {
    this.emit('notification', event);

    // Notify specific user if recipientId is set
    if (event.recipientId) {
      const connections = this.wsConnections.get(event.recipientId);
      if (connections) {
        connections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: event.type,
              ticketId: event.ticketId,
              data: event.data,
              timestamp: new Date().toISOString(),
            }));
          }
        });
      }
    }

    // Broadcast to all admins
    const adminConnections = this.wsConnections.get('admin');
    if (adminConnections) {
      adminConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: event.type,
            ticketId: event.ticketId,
            data: event.data,
            timestamp: new Date().toISOString(),
          }));
        }
      });
    }
  }

  /**
   * Register WebSocket connection for real-time updates
   */
  registerConnection(userId: string, ws: WebSocket): void {
    if (!this.wsConnections.has(userId)) {
      this.wsConnections.set(userId, new Set());
    }
    this.wsConnections.get(userId)!.add(ws);

    ws.addEventListener('close', () => {
      this.wsConnections.get(userId)?.delete(ws);
    });
  }

  /**
   * Notify when ticket is created
   */
  async notifyTicketCreated(ticket: any, creatorEmail: string): Promise<void> {
    // Email to support team
    await this.sendEmailNotification({
      to: process.env.SUPPORT_TEAM_EMAIL || 'support@luxela.com',
      subject: `[New Support Ticket] ${ticket.subject}`,
      template: 'ticket_created',
      data: {
        ticketId: ticket.id,
        subject: ticket.subject,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: new Date(ticket.createdAt),
      },
    });

    // Broadcast to admin dashboard
    this.broadcastUpdate({
      type: 'ticket_created',
      ticketId: ticket.id,
      data: {
        subject: ticket.subject,
        priority: ticket.priority,
        category: ticket.category,
      },
    });
  }

  /**
   * Notify when ticket is assigned
   */
  async notifyTicketAssigned(ticket: any, assignedToEmail: string, teamMemberName: string): Promise<void> {
    // Email to assigned team member
    await this.sendEmailNotification({
      to: assignedToEmail,
      subject: `[Assigned] Support Ticket: ${ticket.subject}`,
      template: 'ticket_assigned',
      data: {
        ticketId: ticket.id,
        subject: ticket.subject,
        priority: ticket.priority,
        assignedAt: new Date(),
      },
    });

    // Broadcast to assigned team member
    this.broadcastUpdate({
      type: 'ticket_assigned',
      ticketId: ticket.id,
      recipientId: teamMemberName,
      data: {
        subject: ticket.subject,
        priority: ticket.priority,
      },
    });
  }

  /**
   * Notify when SLA is breached
   */
  async notifySLABreach(ticket: any, slaMetrics: any, supervisorEmail: string): Promise<void> {
    const breachType = slaMetrics.responseBreached ? 'Response' : 'Resolution';

    // Email to supervisor
    await this.sendEmailNotification({
      to: supervisorEmail,
      subject: `⚠️ [SLA BREACH] ${breachType} SLA - Ticket ${ticket.id}`,
      template: 'sla_breached',
      data: {
        ticketId: ticket.id,
        subject: ticket.subject,
        breachType,
        priority: ticket.priority,
        createdAt: new Date(ticket.createdAt),
        deadline: new Date(slaMetrics.responseSlaDeadline),
      },
    });

    // Broadcast critical alert
    this.broadcastUpdate({
      type: 'sla_breached',
      ticketId: ticket.id,
      recipientId: 'admin',
      data: {
        breachType,
        subject: ticket.subject,
        priority: ticket.priority,
      },
    });
  }

  /**
   * Notify when ticket is escalated
   */
  async notifyEscalation(ticket: any, escalationLevel: number, managerEmail: string): Promise<void> {
    // Email to manager
    await this.sendEmailNotification({
      to: managerEmail,
      subject: `🔴 [ESCALATION LEVEL ${escalationLevel}] Ticket ${ticket.id}`,
      template: 'escalation',
      data: {
        ticketId: ticket.id,
        subject: ticket.subject,
        priority: ticket.priority,
        escalationLevel,
        createdAt: new Date(ticket.createdAt),
      },
    });

    // Broadcast escalation alert
    this.broadcastUpdate({
      type: 'escalated',
      ticketId: ticket.id,
      recipientId: 'admin',
      data: {
        escalationLevel,
        subject: ticket.subject,
        priority: ticket.priority,
      },
    });
  }

  /**
   * Notify when ticket is resolved
   */
  async notifyTicketResolved(ticket: any, customerEmail: string): Promise<void> {
    // Email to customer
    await this.sendEmailNotification({
      to: customerEmail,
      subject: `✓ [RESOLVED] Your support ticket ${ticket.id}`,
      template: 'ticket_resolved',
      data: {
        ticketId: ticket.id,
        subject: ticket.subject,
        resolvedAt: new Date(),
      },
    });

    // Broadcast resolution update
    this.broadcastUpdate({
      type: 'resolved',
      ticketId: ticket.id,
      data: {
        subject: ticket.subject,
      },
    });
  }

  // ============ EMAIL TEMPLATES ============

  private templateTicketCreated(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">🆕 New Support Ticket Created</h2>
          
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #8451E1; margin-bottom: 20px;">
            <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Priority:</strong> <span style="color: ${this.getPriorityColor(data.priority)}; font-weight: bold;">${data.priority.toUpperCase()}</span></p>
            <p><strong>Category:</strong> ${data.category}</p>
            <p><strong>Created:</strong> ${data.createdAt.toLocaleString()}</p>
          </div>

          <p style="color: #666; margin: 20px 0;">Please log in to the support dashboard to review and assign this ticket.</p>
          
          <a href="${process.env.APP_URL}/admin/support/tickets/${data.ticketId}" 
             style="display: inline-block; background: #8451E1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            View Ticket
          </a>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated notification from Luxela Support System.</p>
        </div>
      </div>
    `;
  }

  private templateTicketAssigned(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">📋 Ticket Assigned to You</h2>
          
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
            <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Priority:</strong> <span style="color: ${this.getPriorityColor(data.priority)}; font-weight: bold;">${data.priority.toUpperCase()}</span></p>
            <p><strong>Assigned At:</strong> ${data.assignedAt.toLocaleString()}</p>
          </div>

          <p style="color: #666; margin: 20px 0;">You have been assigned a new support ticket. Please review the details and start working on the resolution.</p>
          
          <a href="${process.env.APP_URL}/support/tickets/${data.ticketId}" 
             style="display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            View Assigned Ticket
          </a>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated notification from Luxela Support System.</p>
        </div>
      </div>
    `;
  }

  private templateTicketResolved(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">✓ Your Ticket Has Been Resolved</h2>
          
          <div style="background: #f0f8f0; padding: 15px; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
            <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Resolved At:</strong> ${data.resolvedAt.toLocaleString()}</p>
          </div>

          <p style="color: #666; margin: 20px 0;">Your support ticket has been resolved. If you have any follow-up questions or if the issue persists, please reply to this ticket.</p>
          
          <a href="${process.env.APP_URL}/help" 
             style="display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            View Resolution
          </a>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated notification from Luxela Support System.</p>
        </div>
      </div>
    `;
  }

  private templateSLABreach(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <h2 style="color: #d32f2f; margin-bottom: 20px;">⚠️ SLA BREACH ALERT</h2>
          
          <div style="background: #ffebee; padding: 15px; border-left: 4px solid #d32f2f; margin-bottom: 20px;">
            <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Breach Type:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.breachType} SLA</span></p>
            <p><strong>Priority:</strong> ${data.priority.toUpperCase()}</p>
            <p><strong>Created:</strong> ${data.createdAt.toLocaleString()}</p>
            <p><strong>Deadline:</strong> ${data.deadline.toLocaleString()}</p>
          </div>

          <p style="color: #666; margin: 20px 0;"><strong>URGENT:</strong> The SLA deadline for this ticket has been breached. Immediate action is required.</p>
          
          <a href="${process.env.APP_URL}/admin/support/tickets/${data.ticketId}" 
             style="display: inline-block; background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Take Action Now
          </a>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated notification from Luxela Support System.</p>
        </div>
      </div>
    `;
  }

  private templateEscalation(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <h2 style="color: #ff6f00; margin-bottom: 20px;">🔴 TICKET ESCALATION - Level ${data.escalationLevel}</h2>
          
          <div style="background: #fff3e0; padding: 15px; border-left: 4px solid #ff6f00; margin-bottom: 20px;">
            <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Escalation Level:</strong> <span style="color: #ff6f00; font-weight: bold;">Level ${data.escalationLevel}</span></p>
            <p><strong>Priority:</strong> ${data.priority.toUpperCase()}</p>
            <p><strong>Created:</strong> ${data.createdAt.toLocaleString()}</p>
          </div>

          <p style="color: #666; margin: 20px 0;">This ticket has been escalated and requires immediate management attention.</p>
          
          <a href="${process.env.APP_URL}/admin/support/tickets/${data.ticketId}" 
             style="display: inline-block; background: #ff6f00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Review Escalated Ticket
          </a>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated notification from Luxela Support System.</p>
        </div>
      </div>
    `;
  }

  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      urgent: '#d32f2f',
      high: '#ff6f00',
      medium: '#fbc02d',
      low: '#388e3c',
    };
    return colors[priority.toLowerCase()] || '#666';
  }
}

export const supportNotificationService = new SupportNotificationService();
