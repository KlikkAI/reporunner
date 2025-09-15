import WebSocket from "ws";
import { EventEmitter } from "events";

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

      this.ws.on("open", () => {
        console.debug("[Reporunner SDK] WebSocket connected");
        this.reconnectAttempts = 0;
        this.emit("connected");
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error(
            "[Reporunner SDK] Failed to parse WebSocket message:",
            error,
          );
        }
      });

      this.ws.on("close", (code, reason) => {
        console.debug(`[Reporunner SDK] WebSocket closed: ${code} ${reason}`);
        this.emit("disconnected");
        this.handleReconnect();
      });

      this.ws.on("error", (error) => {
        console.error("[Reporunner SDK] WebSocket error:", error);
        this.emit("error", error);
      });
    } catch (error) {
      console.error(
        "[Reporunner SDK] Failed to create WebSocket connection:",
        error,
      );
      this.handleReconnect();
    }
  }

  private handleMessage(message: any): void {
    const { type, data } = message;

    switch (type) {
      case "execution:update":
        this.emit("execution:update", data);
        break;
      case "workflow:update":
        this.emit("workflow:update", data);
        break;
      case "node:update":
        this.emit("node:update", data);
        break;
      case "ping":
        this.send({ type: "pong" });
        break;
      default:
        console.debug(`[Reporunner SDK] Unknown message type: ${type}`);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.debug(
        `[Reporunner SDK] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error("[Reporunner SDK] Max reconnection attempts reached");
      this.emit("maxReconnectAttemptsReached");
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn(
        "[Reporunner SDK] Cannot send message: WebSocket not connected",
      );
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
