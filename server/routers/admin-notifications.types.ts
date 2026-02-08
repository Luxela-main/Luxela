/**
 * Shared types for admin notifications
 * Used across server and client to ensure type consistency
 */

export enum NotificationCategory {
  URGENT_TICKET = 'urgent_ticket',
  SLA_BREACH = 'sla_breach',
  ESCALATION = 'escalation',
  TEAM_CAPACITY = 'team_capacity',
  SYSTEM_ALERT = 'system_alert',
  NEW_REPLY = 'new_reply',
}

export enum NotificationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface AdminNotification {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  relatedEntityId: string | null;
  relatedEntityType: 'ticket' | 'team_member' | 'system' | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}