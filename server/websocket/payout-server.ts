import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

interface PayoutMessage {
  type: 'subscribe' | 'unsubscribe' | 'balance_update' | 'transaction_update' | 'payout_status' | 'heartbeat';
  sellerId: string;
  data?: Record<string, any>;
  timestamp?: number;
}

class PayoutWebSocketServer {
  private wss: WebSocketServer;
  private sellerConnections: Map<string, Set<WebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | undefined;

  constructor(port: number = 8081) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
    this.setupHeartbeat();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log('[Payout WS] New connection:', req.url);

      let sellerId: string | null = null;

      ws.on('message', (data: Buffer) => {
        try {
          const message: PayoutMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
          sellerId = message.sellerId;
        } catch (error) {
          console.error('[Payout WS] Parse error:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
        }
      });

      ws.on('close', () => {
        if (sellerId) {
          this.removeClient(sellerId, ws);
        }
        console.log('[Payout WS] Connection closed:', sellerId);
      });

      ws.on('error', (error) => {
        console.error('[Payout WS] Error:', error);
      });
    });

    console.log('[Payout WS] WebSocket server started on port 8081');
  }

  private handleMessage(ws: WebSocket, message: PayoutMessage): void {
    const { sellerId, type, data } = message;

    if (!sellerId) {
      ws.close(4001, 'Unauthorized: Seller ID required');
      return;
    }

    switch (type) {
      case 'subscribe':
        this.handleSubscribe(ws, sellerId);
        break;

      case 'unsubscribe':
        this.handleUnsubscribe(sellerId, ws);
        break;

      case 'balance_update':
        this.broadcastBalanceUpdate(sellerId, data);
        break;

      case 'transaction_update':
        this.broadcastTransactionUpdate(sellerId, data);
        break;

      case 'payout_status':
        this.broadcastPayoutStatus(sellerId, data);
        break;

      case 'heartbeat':
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now(), sellerId }));
        break;

      default:
        console.warn('[Payout WS] Unknown message type:', type);
    }
  }

  private handleSubscribe(ws: WebSocket, sellerId: string): void {
    if (!this.sellerConnections.has(sellerId)) {
      this.sellerConnections.set(sellerId, new Set());
    }
    this.sellerConnections.get(sellerId)!.add(ws);

    ws.send(JSON.stringify({
      type: 'subscribed',
      sellerId,
      timestamp: Date.now(),
    }));

    console.log(`[Payout WS] Seller ${sellerId} subscribed`);
  }

  private handleUnsubscribe(sellerId: string, ws: WebSocket): void {
    const connections = this.sellerConnections.get(sellerId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.sellerConnections.delete(sellerId);
      }
    }
  }

  private broadcastBalanceUpdate(sellerId: string, data: any): void {
    const connections = this.sellerConnections.get(sellerId);
    if (!connections || connections.size === 0) return;

    const message = JSON.stringify({
      type: 'balance_update',
      sellerId,
      data: {
        availableBalance: data.availableBalance || 0,
        pendingPayouts: data.pendingPayouts || 0,
        totalPaidOut: data.totalPaidOut || 0,
        currency: data.currency || 'NGN',
      },
      timestamp: Date.now(),
    });

    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });

    console.log(`[Payout WS] Balance update sent to seller ${sellerId}`);
  }

  private broadcastTransactionUpdate(sellerId: string, data: any): void {
    const connections = this.sellerConnections.get(sellerId);
    if (!connections || connections.size === 0) return;

    const message = JSON.stringify({
      type: 'transaction_update',
      sellerId,
      data: {
        transactionId: data.transactionId,
        amount: data.amount,
        status: data.status,
        description: data.description,
        timestamp: data.timestamp || Date.now(),
      },
      receivedAt: Date.now(),
    });

    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });

    console.log(`[Payout WS] Transaction update sent to seller ${sellerId}`);
  }

  private broadcastPayoutStatus(sellerId: string, data: any): void {
    const connections = this.sellerConnections.get(sellerId);
    if (!connections || connections.size === 0) return;

    const message = JSON.stringify({
      type: 'payout_status',
      sellerId,
      data: {
        payoutId: data.payoutId,
        status: data.status, // pending, processing, completed, failed
        amount: data.amount,
        method: data.method,
        processingTime: data.processingTime,
        statusMessage: data.statusMessage,
        retryable: data.retryable || false,
      },
      timestamp: Date.now(),
    });

    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });

    console.log(`[Payout WS] Payout status sent to seller ${sellerId}: ${data.status}`);
  }

  private removeClient(sellerId: string, ws: WebSocket): void {
    const connections = this.sellerConnections.get(sellerId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.sellerConnections.delete(sellerId);
      }
    }
  }

  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sellerConnections.forEach((connections, sellerId) => {
        connections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          }
        });
      });
    }, 30000); // 30 second heartbeat
  }

  notifyBalanceChange(sellerId: string, balanceData: any): void {
    this.broadcastBalanceUpdate(sellerId, balanceData);
  }

  notifyNewTransaction(sellerId: string, transactionData: any): void {
    this.broadcastTransactionUpdate(sellerId, transactionData);
  }

  notifyPayoutStatusChange(sellerId: string, payoutData: any): void {
    this.broadcastPayoutStatus(sellerId, payoutData);
  }

  getStats(): any {
    return {
      connectedSellers: this.sellerConnections.size,
      totalConnections: Array.from(this.sellerConnections.values()).reduce((sum, set) => sum + set.size, 0),
      timestamp: Date.now(),
    };
  }

  shutdown(): void {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }
}

export const payoutWebSocketServer = new PayoutWebSocketServer(parseInt(process.env.WS_PAYOUT_PORT || '8081'));