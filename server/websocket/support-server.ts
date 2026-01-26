import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { supportNotificationService } from '../services/support-notifications';

/**
 * WebSocket Server for Real-time Support Updates
 * Provides:
 * - Live ticket status updates
 * - Real-time team member notifications
 * - SLA breach alerts
 * - Escalation notifications
 * - Team activity feed
 */

interface SupportMessage {
  type: 'subscribe' | 'unsubscribe' | 'ticket_update' | 'message' | 'heartbeat' | 'admin_action';
  userId: string;
  ticketId?: string;
  data?: Record<string, any>;
  timestamp?: number;
}

class SupportWebSocketServer {
  private wss: WebSocketServer;
  private clientMap: Map<string, Set<WebSocket>> = new Map();
  private ticketSubscriptions: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | undefined;

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
    this.setupHeartbeat();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log('[Support WS] New connection:', req.url);

      let userId: string | null = null;

      ws.on('message', (data: Buffer) => {
        try {
          const message: SupportMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message, userId);
          userId = message.userId;
        } catch (error) {
          console.error('[Support WS] Message parse error:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        if (userId) {
          this.removeClient(userId, ws);
        }
        console.log('[Support WS] Connection closed:', userId);
      });

      ws.on('error', (error) => {
        console.error('[Support WS] Error:', error);
      });
    });

    console.log('[Support WS] WebSocket server started on port 8080');
  }

  private handleMessage(ws: WebSocket, message: SupportMessage, userId: string | null): void {
    const actualUserId = message.userId || userId;

    // Require authentication for user-specific operations
    if (!actualUserId && (message.type === 'subscribe' || message.type === 'unsubscribe' || message.type === 'message')) {
      ws.close(4001, 'Unauthorized: User ID required');
      return;
    }

    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(ws, actualUserId!, message.ticketId);
        break;

      case 'unsubscribe':
        this.handleUnsubscribe(actualUserId!, message.ticketId);
        break;

      case 'ticket_update':
        this.broadcastTicketUpdate(message.ticketId, message.data);
        break;

      case 'message':
        this.handleChatMessage(actualUserId!, message.ticketId, message.data);
        break;

      case 'admin_action':
        if (!actualUserId) {
          ws.close(4001, 'Unauthorized: User ID required');
          return;
        }
        this.handleAdminAction(actualUserId, message.data);
        break;

      case 'heartbeat':
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
        break;

      default:
        console.warn('[Support WS] Unknown message type:', message.type);
    }
  }

  private handleSubscribe(ws: WebSocket, userId: string, ticketId?: string): void {
    // Add client to user group
    if (!this.clientMap.has(userId)) {
      this.clientMap.set(userId, new Set());
    }
    this.clientMap.get(userId)!.add(ws);

    // Subscribe to ticket updates
    if (ticketId) {
      if (!this.ticketSubscriptions.has(ticketId)) {
        this.ticketSubscriptions.set(ticketId, new Set());
      }
      this.ticketSubscriptions.get(ticketId)!.add(userId);
    }

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'subscribed',
      userId,
      ticketId,
      timestamp: Date.now(),
    }));

    console.log(`[Support WS] User ${userId} subscribed to ticket ${ticketId || 'dashboard'}`);
  }

  private handleUnsubscribe(userId: string, ticketId?: string): void {
    if (ticketId) {
      const subscribers = this.ticketSubscriptions.get(ticketId);
      if (subscribers) {
        subscribers.delete(userId);
      }
    }

    console.log(`[Support WS] User ${userId} unsubscribed from ticket ${ticketId || 'dashboard'}`);
  }

  private broadcastTicketUpdate(ticketId: string | undefined, data: any): void {
    if (!ticketId) return;

    const subscribers = this.ticketSubscriptions.get(ticketId);
    if (subscribers) {
      const message = JSON.stringify({
        type: 'ticket_update',
        ticketId,
        data,
        timestamp: Date.now(),
      });

      subscribers.forEach(userId => {
        const clients = this.clientMap.get(userId);
        if (clients) {
          clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(message);
            }
          });
        }
      });
    }
  }

  private handleChatMessage(userId: string, ticketId: string | undefined, data: any): void {
    if (!ticketId) return;

    const message = JSON.stringify({
      type: 'chat_message',
      ticketId,
      userId,
      message: data.message,
      timestamp: Date.now(),
    });

    // Broadcast to all subscribers of this ticket
    const subscribers = this.ticketSubscriptions.get(ticketId);
    if (subscribers) {
      subscribers.forEach(subscribedUserId => {
        const clients = this.clientMap.get(subscribedUserId);
        if (clients) {
          clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(message);
            }
          });
        }
      });
    }
  }

  private handleAdminAction(userId: string, data: any): void {
    const message = JSON.stringify({
      type: 'admin_action',
      action: data.action,
      ticketId: data.ticketId,
      details: data.details,
      timestamp: Date.now(),
    });

    // Broadcast to all admin connections
    const adminClients = this.clientMap.get('admin');
    if (adminClients) {
      adminClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }

    // Also notify affected ticket subscribers
    if (data.ticketId) {
      this.broadcastTicketUpdate(data.ticketId, data.details);
    }
  }

  private removeClient(userId: string, ws: WebSocket): void {
    const clients = this.clientMap.get(userId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.clientMap.delete(userId);
      }
    }
  }

  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clientMap.forEach((clients, userId) => {
        clients.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          }
        });
      });
    }, 30000); // 30 second heartbeat
  }

  /**
   * Broadcast notification to specific user
   */
  notifyUser(userId: string, notification: any): void {
    const clients = this.clientMap.get(userId);
    if (clients) {
      const message = JSON.stringify({
        type: 'notification',
        ...notification,
        timestamp: Date.now(),
      });

      clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  /**
   * Broadcast to all admin users
   */
  notifyAdmins(notification: any): void {
    const adminClients = this.clientMap.get('admin');
    if (adminClients) {
      const message = JSON.stringify({
        type: 'admin_notification',
        ...notification,
        timestamp: Date.now(),
      });

      adminClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  /**
   * Broadcast SLA breach alert
   */
  notifySLABreach(ticketId: string, breach: any): void {
    const subscribers = this.ticketSubscriptions.get(ticketId);
    if (subscribers) {
      const message = JSON.stringify({
        type: 'sla_breach',
        ticketId,
        breach,
        severity: 'critical',
        timestamp: Date.now(),
      });

      subscribers.forEach(userId => {
        this.notifyUser(userId, JSON.parse(message));
      });
    }

    // Also notify all admins
    this.notifyAdmins({
      type: 'sla_breach',
      ticketId,
      breach,
      severity: 'critical',
    });
  }

  /**
   * Broadcast escalation
   */
  notifyEscalation(ticketId: string, escalation: any): void {
    const subscribers = this.ticketSubscriptions.get(ticketId);
    if (subscribers) {
      const message = JSON.stringify({
        type: 'escalation',
        ticketId,
        escalation,
        severity: 'high',
        timestamp: Date.now(),
      });

      subscribers.forEach(userId => {
        this.notifyUser(userId, JSON.parse(message));
      });
    }

    // Notify all admins
    this.notifyAdmins({
      type: 'escalation',
      ticketId,
      escalation,
      severity: 'high',
    });
  }

  /**
   * Get connection stats
   */
  getStats(): any {
    return {
      connectedUsers: this.clientMap.size,
      totalConnections: Array.from(this.clientMap.values()).reduce((sum, set) => sum + set.size, 0),
      ticketSubscriptions: this.ticketSubscriptions.size,
      timestamp: Date.now(),
    };
  }

  /**
   * Cleanup on shutdown
   */
  shutdown(): void {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }
}

export const supportWebSocketServer = new SupportWebSocketServer(parseInt(process.env.WS_PORT || '8080'));