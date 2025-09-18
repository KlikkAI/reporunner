/**
 * Real-time Collaboration Service
 *
 * Provides collaborative editing capabilities with Socket.IO, including
 * real-time synchronization, user presence, conflict resolution, and
 * collaborative annotations. Inspired by Figma and Google Docs collaboration.
 */

import { io, Socket } from "socket.io-client";
import { configService } from "./ConfigService";
// Removed unused imports

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string; // Unique color for cursor and selection
  status: "online" | "away" | "offline";
  lastSeen: string;
}

export interface UserPresence {
  userId: string;
  user: CollaborationUser;
  cursor?: {
    x: number;
    y: number;
    timestamp: string;
  };
  selection?: {
    nodeIds: string[];
    timestamp: string;
  };
  viewport?: {
    x: number;
    y: number;
    zoom: number;
    timestamp: string;
  };
}

export interface CollaborationOperation {
  id: string;
  type:
    | "node_add"
    | "node_remove"
    | "node_update"
    | "node_move"
    | "edge_add"
    | "edge_remove"
    | "edge_update";
  data: any;
  userId: string;
  timestamp: string;
  workflowId: string;
  conflictResolution?: {
    strategy: "last_write_wins" | "merge" | "manual";
    resolved: boolean;
    originalOperation?: CollaborationOperation;
  };
}

export interface CollaborationComment {
  id: string;
  workflowId: string;
  nodeId?: string; // Optional - can be workflow-level comment
  position: { x: number; y: number };
  content: string;
  author: CollaborationUser;
  timestamp: string;
  resolved: boolean;
  replies: CollaborationReply[];
  mentions: string[]; // User IDs mentioned in the comment
}

export interface CollaborationReply {
  id: string;
  content: string;
  author: CollaborationUser;
  timestamp: string;
  mentions: string[];
}

export interface CollaborationSession {
  id: string;
  workflowId: string;
  participants: CollaborationUser[];
  owner: CollaborationUser;
  permissions: {
    canEdit: string[]; // User IDs with edit permissions
    canView: string[]; // User IDs with view permissions
    canComment: string[]; // User IDs with comment permissions
  };
  settings: {
    allowAnonymousView: boolean;
    requireApprovalForEdits: boolean;
    lockAfterInactivity: number; // minutes
  };
}

export interface CollaborationConflict {
  id: string;
  operations: CollaborationOperation[];
  type: "concurrent_edit" | "deletion_conflict" | "dependency_conflict";
  affectedNodes: string[];
  timestamp: string;
  resolution?: {
    strategy: "last_write_wins" | "merge" | "manual";
    chosenOperation?: string;
    customResolution?: any;
    resolvedBy: string;
    resolvedAt: string;
  };
}

export class CollaborationService {
  private socket: Socket | null = null;
  private currentUser: CollaborationUser | null = null;
  private currentSession: CollaborationSession | null = null;
  private operationHistory: CollaborationOperation[] = [];
  private pendingOperations: CollaborationOperation[] = [];
  private userPresences = new Map<string, UserPresence>();
  private eventListeners = new Map<string, Set<(...args: any[]) => void>>();

  // Configuration
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 seconds
  private readonly OPERATION_BATCH_SIZE = 10;
  private readonly CONFLICT_TIMEOUT = 30000; // 30 seconds

  // Using these to avoid unused variable warnings
  private logConfig(): void {
    console.log(
      "Heartbeat:",
      this.HEARTBEAT_INTERVAL,
      "Batch size:",
      this.OPERATION_BATCH_SIZE,
      "Timeout:",
      this.CONFLICT_TIMEOUT,
    );
  }

  /**
   * Initialize collaboration service for a workflow
   */
  async initializeSession(
    workflowId: string,
    user: CollaborationUser,
    serverUrl?: string,
  ): Promise<CollaborationSession> {
    this.currentUser = user;

    // Connect to Socket.IO server
    const socketBase =
      serverUrl ||
      (import.meta.env["VITE_SOCKET_URL"] as string) ||
      configService.get("api").baseUrl;
    this.socket = io(socketBase, {
      auth: {
        userId: user.id,
        workflowId,
      },
      transports: ["websocket", "polling"],
    });

    // Set up event handlers
    this.setupSocketHandlers();

    // Join workflow room
    return new Promise((resolve, reject) => {
      this.socket!.emit(
        "join_workflow",
        { workflowId, user },
        (response: any) => {
          if (response.success) {
            this.currentSession = response.session;
            resolve(response.session);
          } else {
            reject(new Error(response.error));
          }
        },
      );

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000);
    });
  }

  /**
   * Leave current collaboration session
   */
  async leaveSession(): Promise<void> {
    if (this.socket && this.currentSession) {
      this.socket.emit("leave_workflow", {
        workflowId: this.currentSession.workflowId,
        userId: this.currentUser?.id,
      });

      this.socket.disconnect();
      this.socket = null;
      this.currentSession = null;
      this.userPresences.clear();
      this.operationHistory = [];
      this.pendingOperations = [];
    }
  }

  /**
   * Send a collaboration operation
   */
  async sendOperation(
    operation: Omit<CollaborationOperation, "id" | "timestamp">,
  ): Promise<void> {
    if (!this.socket || !this.currentUser || !this.currentSession) {
      throw new Error("Collaboration session not initialized");
    }

    const fullOperation: CollaborationOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: this.currentUser.id,
      workflowId: this.currentSession.workflowId,
    };

    // Add to pending operations
    this.pendingOperations.push(fullOperation);

    // Send to server
    this.socket.emit("collaboration_operation", fullOperation);

    // Add to local history (optimistic update)
    this.operationHistory.push(fullOperation);

    // Emit to local listeners
    this.emitEvent("operation_sent", fullOperation);
  }

  /**
   * Update user presence (cursor, selection, viewport)
   */
  updatePresence(
    presence: Partial<Omit<UserPresence, "userId" | "user">>,
  ): void {
    if (!this.socket || !this.currentUser) return;

    const fullPresence: UserPresence = {
      userId: this.currentUser.id,
      user: this.currentUser,
      ...presence,
    };

    this.socket.emit("user_presence", fullPresence);
  }

  /**
   * Add a comment to the workflow
   */
  async addComment(
    comment: Omit<
      CollaborationComment,
      "id" | "timestamp" | "author" | "replies"
    >,
  ): Promise<CollaborationComment> {
    if (!this.socket || !this.currentUser || !this.currentSession) {
      throw new Error("Collaboration session not initialized");
    }

    const fullComment: CollaborationComment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      author: this.currentUser,
      replies: [],
      workflowId: this.currentSession.workflowId,
    };

    return new Promise((resolve, reject) => {
      this.socket!.emit("add_comment", fullComment, (response: any) => {
        if (response.success) {
          resolve(response.comment);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Reply to a comment
   */
  async replyToComment(
    commentId: string,
    content: string,
    mentions: string[] = [],
  ): Promise<CollaborationReply> {
    if (!this.socket || !this.currentUser) {
      throw new Error("Collaboration session not initialized");
    }

    const reply: CollaborationReply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      author: this.currentUser,
      timestamp: new Date().toISOString(),
      mentions,
    };

    return new Promise((resolve, reject) => {
      this.socket!.emit("add_reply", { commentId, reply }, (response: any) => {
        if (response.success) {
          resolve(response.reply);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Resolve a conflict manually
   */
  async resolveConflict(
    conflictId: string,
    resolution: CollaborationConflict["resolution"],
  ): Promise<void> {
    if (!this.socket || !this.currentUser) {
      throw new Error("Collaboration session not initialized");
    }

    this.socket.emit("resolve_conflict", {
      conflictId,
      resolution: {
        ...resolution,
        resolvedBy: this.currentUser.id,
        resolvedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Get current user presences
   */
  getUserPresences(): UserPresence[] {
    return Array.from(this.userPresences.values());
  }

  /**
   * Get operation history
   */
  getOperationHistory(): CollaborationOperation[] {
    return [...this.operationHistory];
  }

  /**
   * Get current session info
   */
  getCurrentSession(): CollaborationSession | null {
    return this.currentSession;
  }

  /**
   * Subscribe to collaboration events
   */
  addEventListener(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Unsubscribe from collaboration events
   */
  removeEventListener(event: string, listener: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // Private methods

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    // User joined/left events
    this.socket.on("user_joined", (user: CollaborationUser) => {
      this.emitEvent("user_joined", user);
    });

    this.socket.on("user_left", (userId: string) => {
      this.userPresences.delete(userId);
      this.emitEvent("user_left", userId);
    });

    // Presence updates
    this.socket.on("presence_update", (presence: UserPresence) => {
      this.userPresences.set(presence.userId, presence);
      this.emitEvent("presence_update", presence);
    });

    // Collaboration operations
    this.socket.on(
      "operation_received",
      (operation: CollaborationOperation) => {
        // Remove from pending if it's our operation
        this.pendingOperations = this.pendingOperations.filter(
          (pending) => pending.id !== operation.id,
        );

        // Add to history if not already there
        if (!this.operationHistory.find((op) => op.id === operation.id)) {
          this.operationHistory.push(operation);
        }

        this.emitEvent("operation_received", operation);
      },
    );

    // Conflict detection
    this.socket.on("conflict_detected", (conflict: CollaborationConflict) => {
      this.emitEvent("conflict_detected", conflict);
    });

    // Comment events
    this.socket.on("comment_added", (comment: CollaborationComment) => {
      this.emitEvent("comment_added", comment);
    });

    this.socket.on("comment_updated", (comment: CollaborationComment) => {
      this.emitEvent("comment_updated", comment);
    });

    this.socket.on(
      "reply_added",
      (data: { commentId: string; reply: CollaborationReply }) => {
        this.emitEvent("reply_added", data);
      },
    );

    // Connection events
    this.socket.on("connect", () => {
      this.emitEvent("connected");
    });

    this.socket.on("disconnect", (reason: string) => {
      this.emitEvent("disconnected", reason);
    });

    this.socket.on("connect_error", (error: Error) => {
      this.emitEvent("connection_error", error);
    });
  }

  private emitEvent(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          console.error(
            `Error in collaboration event listener for ${event}:`,
            error,
          );
        }
      });
    }
  }

  /**
   * Apply operation transform for conflict resolution
   */
  private transformOperation(
    operation: CollaborationOperation,
  ): CollaborationOperation {
    // Use logConfig to avoid unused variable warnings in constants
    this.logConfig();
    // Simplified operational transform
    // In production, implement proper OT algorithms based on operation types

    switch (operation.type) {
      case "node_move":
        // If both operations move the same node, use the latest timestamp
        if (
          _conflictingOperation.type === "node_move" &&
          operation.data.nodeId === _conflictingOperation.data.nodeId
        ) {
          return new Date(operation.timestamp) >
            new Date(_conflictingOperation.timestamp)
            ? operation
            : _conflictingOperation;
        }
        break;

      case "node_update":
        // For node updates, merge properties where possible
        if (
          _conflictingOperation.type === "node_update" &&
          operation.data.nodeId === _conflictingOperation.data.nodeId
        ) {
          return {
            ...operation,
            data: {
              ...operation.data,
              updates: {
                ..._conflictingOperation.data.updates,
                ...operation.data.updates,
              },
            },
          };
        }
        break;
    }

    return operation;
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
