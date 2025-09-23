import { EventEmitter } from 'node:events';
import WebSocket from 'ws';

export class WebSocketClient extends EventEmitter {
  private ws?: WebSocket;
  private url: string;
  private apiKey: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  constructor(url: string, apiKey: string) {
    super();
    this.url = url;
    this.apiKey = apiKey;
    this.connect();
  }

  private connect(): void {
    try {
      const wsUrl = this.apiKey ? `${this.url}?token=${this.apiKey}` : this.url;

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.reconnectAttempts = 0;
        this.emit('connected');
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (_error) {}
      });

      this.ws.on('close', (_code, _reason) => {
        this.emit('disconnected');
        this.handleReconnect();
      });

      this.ws.on('error', (error) => {
        this.emit('error', error);
      });
    } catch (_error) {
      this.handleReconnect();
    }
  }

  private handleMessage(message: any): void {
    const { type, data } = message;

    switch (type) {
      case 'execution:update':
        this.emit('execution:update', data);
        break;
      case 'workflow:update':
        this.emit('workflow:update', data);
        break;
      case 'node:update':
        this.emit('node:update', data);
        break;
      case 'ping':
        this.send({ type: 'pong' });
        break;
      default:
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      this.emit('maxReconnectAttemptsReached');
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
