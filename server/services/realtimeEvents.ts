/**
 * Server-side Real-time Event Bus
 * 
 * Replaces WebSocket servers with an event-driven architecture
 * Events are emitted from various services and received by TRPC subscriptions
 */

import { EventEmitter } from 'events';

class RealtimeEventBus extends EventEmitter {
  /**
   * Support-related events
   */
  
  emitTicketUpdate(ticketId: string, update: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    lastActivity?: Date;
    [key: string]: any;
  }) {
    this.emit(`ticket:${ticketId}`, {
      type: 'ticket_update',
      ticketId,
      data: update,
      timestamp: Date.now(),
    });
  }

  emitTicketCreated(ticket: {
    id: string;
    subject: string;
    priority?: string;
    category?: string;
    createdAt?: Date;
  }) {
    this.emit('support:ticket_created', {
      type: 'ticket_created',
      data: ticket,
      timestamp: Date.now(),
    });
  }

  emitSLABreach(ticketId: string, breach: {
    type: 'response' | 'resolution';
    breachTime: Date;
    subject: string;
    [key: string]: any;
  }) {
    // Notify specific ticket subscribers and all admins
    this.emit(`ticket:${ticketId}`, {
      type: 'sla_breach',
      ticketId,
      data: breach,
      severity: 'critical',
      timestamp: Date.now(),
    });

    this.emit('support:sla_breach', {
      type: 'sla_breach',
      ticketId,
      data: breach,
      severity: 'critical',
      timestamp: Date.now(),
    });
  }

  emitEscalation(ticketId: string, escalation: {
    fromLevel?: number;
    toLevel?: number;
    reason?: string;
    escalatedTo?: string;
    [key: string]: any;
  }) {
    this.emit(`ticket:${ticketId}`, {
      type: 'escalation',
      ticketId,
      data: escalation,
      severity: 'high',
      timestamp: Date.now(),
    });

    this.emit('support:escalation', {
      type: 'escalation',
      ticketId,
      data: escalation,
      severity: 'high',
      timestamp: Date.now(),
    });
  }

  emitTicketMessage(ticketId: string, message: {
    from: string;
    content: string;
    type?: 'internal_note' | 'customer_message';
    attachments?: string[];
    [key: string]: any;
  }) {
    this.emit(`ticket:${ticketId}`, {
      type: 'ticket_message',
      ticketId,
      data: message,
      timestamp: Date.now(),
    });
  }

  emitAdminAction(action: {
    actionType: string;
    ticketId?: string;
    userId: string;
    details: any;
  }) {
    this.emit('support:admin_action', {
      type: 'admin_action',
      data: action,
      timestamp: Date.now(),
    });

    // Also emit to specific ticket if applicable
    if (action.ticketId) {
      this.emit(`ticket:${action.ticketId}`, {
        type: 'admin_action',
        data: action,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Payout-related events
   */

  emitBalanceUpdate(sellerId: string, balance: {
    availableBalance: number;
    pendingPayouts: number;
    totalPaidOut: number;
    currency: string;
    updatedAt?: Date;
  }) {
    this.emit(`payout:balance:${sellerId}`, {
      type: 'balance_update',
      sellerId,
      data: balance,
      timestamp: Date.now(),
    });
  }

  emitTransactionUpdate(sellerId: string, transaction: {
    transactionId: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    description: string;
    timestamp?: Date;
    [key: string]: any;
  }) {
    this.emit(`payout:transaction:${sellerId}`, {
      type: 'transaction_update',
      sellerId,
      data: transaction,
      timestamp: Date.now(),
    });

    // Also update balance since transaction affects balance
    this.emit(`payout:balance:${sellerId}`, {
      type: 'transaction_notification',
      sellerId,
      data: transaction,
      timestamp: Date.now(),
    });
  }

  emitPayoutStatusChange(sellerId: string, payout: {
    payoutId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    amount: number;
    method: string;
    processingTime?: number;
    statusMessage?: string;
    retryable?: boolean;
    failureReason?: string;
    [key: string]: any;
  }) {
    this.emit(`payout:status:${sellerId}`, {
      type: 'payout_status',
      sellerId,
      data: payout,
      timestamp: Date.now(),
    });

    // Also emit to balance channel for dashboard updates
    this.emit(`payout:balance:${sellerId}`, {
      type: 'payout_status',
      sellerId,
      data: payout,
      timestamp: Date.now(),
    });
  }

  emitPayoutCreated(sellerId: string, payout: {
    payoutId: string;
    amount: number;
    method: string;
    [key: string]: any;
  }) {
    this.emit(`payout:status:${sellerId}`, {
      type: 'payout_created',
      sellerId,
      data: payout,
      timestamp: Date.now(),
    });
  }

  /**
   * Listener management
   */

  onTicketUpdate(ticketId: string, callback: (data: any) => void) {
    this.on(`ticket:${ticketId}`, callback);
    return () => this.off(`ticket:${ticketId}`, callback);
  }

  onBalanceUpdate(sellerId: string, callback: (data: any) => void) {
    this.on(`payout:balance:${sellerId}`, callback);
    return () => this.off(`payout:balance:${sellerId}`, callback);
  }

  onPayoutStatus(sellerId: string, callback: (data: any) => void) {
    this.on(`payout:status:${sellerId}`, callback);
    return () => this.off(`payout:status:${sellerId}`, callback);
  }

  /**
   * Admin subscriptions (receive all events)
   */

  onAdminSLAAlerts(callback: (data: any) => void) {
    this.on('support:sla_breach', callback);
    return () => this.off('support:sla_breach', callback);
  }

  onAdminEscalations(callback: (data: any) => void) {
    this.on('support:escalation', callback);
    return () => this.off('support:escalation', callback);
  }

  onAdminActions(callback: (data: any) => void) {
    this.on('support:admin_action', callback);
    return () => this.off('support:admin_action', callback);
  }

  /**
   * Get current subscription count for monitoring
   */

  getStats() {
    const eventNames = this.eventNames();
    return {
      activeChannels: eventNames.length,
      totalListeners: eventNames.reduce((sum, name) => sum + this.listenerCount(name), 0),
      channels: eventNames.map(name => ({
        name: String(name),
        listeners: this.listenerCount(name),
      })),
      timestamp: Date.now(),
    };
  }
}

// Export singleton instance
export const realtimeEventBus = new RealtimeEventBus();

// Set max listeners to prevent memory leak warnings
realtimeEventBus.setMaxListeners(100);