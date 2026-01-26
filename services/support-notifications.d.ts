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
declare class SupportNotificationService extends EventEmitter {
    private emailTransporter;
    private wsConnections;
    constructor();
    /**
     * Send email notification
     */
    sendEmailNotification(options: EmailOptions): Promise<void>;
    /**
     * Broadcast real-time update via WebSocket
     */
    broadcastUpdate(event: NotificationEvent): void;
    /**
     * Register WebSocket connection for real-time updates
     */
    registerConnection(userId: string, ws: WebSocket): void;
    /**
     * Notify when ticket is created
     */
    notifyTicketCreated(ticket: any, creatorEmail: string): Promise<void>;
    /**
     * Notify when ticket is assigned
     */
    notifyTicketAssigned(ticket: any, assignedToEmail: string, teamMemberName: string): Promise<void>;
    /**
     * Notify when SLA is breached
     */
    notifySLABreach(ticket: any, slaMetrics: any, supervisorEmail: string): Promise<void>;
    /**
     * Notify when ticket is escalated
     */
    notifyEscalation(ticket: any, escalationLevel: number, managerEmail: string): Promise<void>;
    /**
     * Notify when ticket is resolved
     */
    notifyTicketResolved(ticket: any, customerEmail: string): Promise<void>;
    private templateTicketCreated;
    private templateTicketAssigned;
    private templateTicketResolved;
    private templateSLABreach;
    private templateEscalation;
    private getPriorityColor;
}
export declare const supportNotificationService: SupportNotificationService;
export {};
//# sourceMappingURL=support-notifications.d.ts.map