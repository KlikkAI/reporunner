// Real-time Workflow Execution Monitoring Service
import type { WorkflowExecution } from "@/core/schemas";
import { configService } from "@/core/services/ConfigService";
import { io, Socket } from "socket.io-client";

export interface ExecutionEvent {
  type:
    | "execution_started"
    | "execution_completed"
    | "execution_failed"
    | "node_started"
    | "node_completed"
    | "node_failed"
    | "log_entry";
  executionId: string;
  timestamp: string;
  data: any;
}

export type ExecutionEventHandler = (event: ExecutionEvent) => void;

export class ExecutionMonitorService {
  private socket: Socket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, ExecutionEventHandler[]> = new Map();
  private isConnecting = false;
  private shouldReconnect = true;
  private subscriptions: Set<string> = new Set();

  /**
   * Connect to WebSocket for real-time updates
   */
  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) return;

    this.isConnecting = true;
    const authConfig = configService.get("auth");
    const token = localStorage.getItem(authConfig.tokenKey);
    const socketUrl =
      (import.meta.env["VITE_SOCKET_URL"] as string) || "http://localhost:5000";

    this.socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: token ? { token } : undefined,
    });

    this.socket.on("connect", () => {
      console.log("Execution monitor connected (socket.io)");
      this.isConnecting = false;
      // Resubscribe
      this.subscriptions.forEach((executionId) => {
        this.socket!.emit("execution_join", { executionId });
      });
    });

    this.socket.on("disconnect", () => {
      console.log("Execution monitor disconnected");
      this.isConnecting = false;
      if (this.shouldReconnect) this.scheduleReconnect();
    });

    this.socket.on("connect_error", (err) => {
      console.error("Execution monitor socket error:", err);
      this.isConnecting = false;
    });

    this.socket.on("execution_event", (event: ExecutionEvent) => {
      this.handleEvent(event);
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to execution updates
   */
  async subscribeToExecution(
    executionId: string,
    handler: ExecutionEventHandler,
  ): Promise<void> {
    // Add handler
    if (!this.eventHandlers.has(executionId)) {
      this.eventHandlers.set(executionId, []);
    }
    this.eventHandlers.get(executionId)!.push(handler);

    // Subscribe via WebSocket
    this.subscriptions.add(executionId);

    if (!this.socket || !this.socket.connected) await this.connect();
    this.socket!.emit("execution_join", { executionId });
  }

  /**
   * Unsubscribe from execution updates
   */
  unsubscribeFromExecution(
    executionId: string,
    handler?: ExecutionEventHandler,
  ): void {
    if (handler) {
      // Remove specific handler
      const handlers = this.eventHandlers.get(executionId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }

        // Clean up empty handler array
        if (handlers.length === 0) {
          this.eventHandlers.delete(executionId);
          this.subscriptions.delete(executionId);

          if (this.socket?.connected) {
            this.socket.emit("execution_leave", { executionId });
          }
        }
      }
    } else {
      // Remove all handlers for this execution
      this.eventHandlers.delete(executionId);
      this.subscriptions.delete(executionId);

      if (this.socket?.connected) {
        this.socket.emit("execution_leave", { executionId });
      }
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): "connected" | "connecting" | "disconnected" {
    if (this.socket?.connected) return "connected";
    if (this.isConnecting) return "connecting";
    return "disconnected";
  }

  /**
   * Handle incoming execution events
   */
  private handleEvent(event: ExecutionEvent): void {
    const handlers = this.eventHandlers.get(event.executionId);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error("Error in execution event handler:", error);
        }
      });
    }
  }

  /**
   * Send message to WebSocket
   */
  // Socket.IO handles messaging; retained for compatibility
  private sendMessage(_message: any): void {}

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      if (this.shouldReconnect) {
        console.log("Attempting to reconnect execution monitor...");
        this.connect().catch((error) => {
          console.error("Reconnection failed:", error);
          this.scheduleReconnect();
        });
      }
    }, configService.get("websocket").reconnectInterval);
  }

  /**
   * Get WebSocket URL
   */
  private getWebSocketUrl(): string {
    // Deprecated; kept for compatibility
    const socketUrl =
      (import.meta.env["VITE_SOCKET_URL"] as string) || "http://localhost:5000";
    return socketUrl;
  }
}

// Singleton instance
export const executionMonitor = new ExecutionMonitorService();

// Hook for React components
export function useExecutionMonitor(executionId: string | null) {
  const [execution, setExecution] = React.useState<WorkflowExecution | null>(
    null,
  );
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    if (!executionId) return;

    const handleExecutionEvent = (event: ExecutionEvent) => {
      setExecution((prev: WorkflowExecution | null) => {
        if (!prev) return prev;

        switch (event.type) {
          case "execution_started":
            return { ...prev, status: "running", startedAt: event.timestamp };

          case "execution_completed":
            return {
              ...prev,
              status: "completed",
              completedAt: event.timestamp,
              results: event.data.results || prev.results,
              duration: event.data.duration,
            };

          case "execution_failed":
            return {
              ...prev,
              status: "failed",
              completedAt: event.timestamp,
              error: event.data.error,
              duration: event.data.duration,
            };

          case "node_started":
            return {
              ...prev,
              progress: {
                ...prev.progress,
                currentNodeId: event.data.nodeId,
              },
            };

          case "node_completed":
            return {
              ...prev,
              progress: {
                ...prev.progress,
                completedNodes: [
                  ...(prev.progress?.completedNodes || []),
                  event.data.nodeId,
                ],
              },
              results: [
                ...(Array.isArray(prev.results) ? prev.results : []),
                {
                  nodeId: event.data.nodeId,
                  nodeName: event.data.nodeName,
                  status: "completed",
                  output: event.data.output,
                  executedAt: event.timestamp,
                  duration: event.data.duration,
                },
              ],
            };

          case "node_failed":
            return {
              ...prev,
              results: [
                ...(Array.isArray(prev.results) ? prev.results : []),
                {
                  nodeId: event.data.nodeId,
                  nodeName: event.data.nodeName,
                  status: "failed",
                  error: event.data.error,
                  executedAt: event.timestamp,
                  duration: event.data.duration,
                },
              ],
            };

          default:
            return prev;
        }
      });
    };

    // Subscribe to execution updates
    executionMonitor.subscribeToExecution(executionId, handleExecutionEvent);

    // Monitor connection status
    const checkConnection = () => {
      setIsConnected(executionMonitor.getConnectionStatus() === "connected");
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection();

    return () => {
      clearInterval(interval);
      executionMonitor.unsubscribeFromExecution(
        executionId,
        handleExecutionEvent,
      );
    };
  }, [executionId]);

  return { execution, isConnected };
}

// Import React for the hook
import React from "react";
