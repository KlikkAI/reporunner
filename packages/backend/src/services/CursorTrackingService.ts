/**
 * Cursor Tracking Service for Real-time User Presence
 * Manages cursor positions, user presence, and visual collaboration indicators
 */

import { Server as SocketIOServer } from "socket.io";

export interface CursorPosition {
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
  viewport?: {
    zoom: number;
    x: number;
    y: number;
  };
  timestamp: Date;
}

export interface UserPresence {
  userId: string;
  socketId: string;
  userName: string;
  userAvatar?: string;
  userColor?: string;
  cursor?: CursorPosition;
  selection?: {
    nodeIds: string[];
    edgeIds: string[];
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  activeArea?: {
    type: "canvas" | "property_panel" | "node_panel" | "toolbar";
    details?: Record<string, any>;
  };
  status: "active" | "idle" | "away";
  lastActivity: Date;
  sessionStartTime: Date;
}

export interface PresenceEvent {
  type:
    | "cursor_move"
    | "selection_change"
    | "area_change"
    | "status_change"
    | "user_join"
    | "user_leave";
  userId: string;
  workflowId: string;
  data: any;
  timestamp: Date;
}

export class CursorTrackingService {
  private static instance: CursorTrackingService;
  private io: SocketIOServer | null = null;

  // Active presence data per workflow
  private workflowPresence = new Map<string, Map<string, UserPresence>>(); // workflowId -> userId -> presence
  private socketToWorkflow = new Map<string, string>(); // socketId -> workflowId
  private socketToUser = new Map<string, string>(); // socketId -> userId

  // User color assignments for visual distinction
  private userColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FECA57",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#FF9F43",
    "#10AC84",
    "#EE5A24",
    "#0ABDE3",
    "#3867D6",
    "#8854D0",
  ];
  private workflowColorAssignments = new Map<string, Map<string, string>>(); // workflowId -> userId -> color

  private constructor() {}

  public static getInstance(): CursorTrackingService {
    if (!CursorTrackingService.instance) {
      CursorTrackingService.instance = new CursorTrackingService();
    }
    return CursorTrackingService.instance;
  }

  /**
   * Initialize cursor tracking service with Socket.IO
   */
  public initialize(io: SocketIOServer): void {
    this.io = io;
    this.setupEventHandlers();

    // Set up periodic cleanup of inactive users
    setInterval(() => {
      this.cleanupInactiveUsers();
    }, 30000); // Every 30 seconds
  }

  /**
   * Add user to workflow presence tracking
   */
  public async joinWorkflowPresence(
    workflowId: string,
    userId: string,
    socketId: string,
    userInfo: {
      userName: string;
      userAvatar?: string;
    },
  ): Promise<UserPresence[]> {
    if (!this.workflowPresence.has(workflowId)) {
      this.workflowPresence.set(workflowId, new Map());
      this.workflowColorAssignments.set(workflowId, new Map());
    }

    const workflowUsers = this.workflowPresence.get(workflowId)!;
    const colorAssignments = this.workflowColorAssignments.get(workflowId)!;

    // Assign color if not already assigned
    if (!colorAssignments.has(userId)) {
      const usedColors = new Set(colorAssignments.values());
      const availableColor =
        this.userColors.find((color) => !usedColors.has(color)) ||
        this.userColors[Math.floor(Math.random() * this.userColors.length)];
      colorAssignments.set(userId, availableColor);
    }

    const userPresence: UserPresence = {
      userId,
      socketId,
      userName: userInfo.userName,
      userAvatar: userInfo.userAvatar,
      userColor: colorAssignments.get(userId),
      status: "active",
      lastActivity: new Date(),
      sessionStartTime: new Date(),
    };

    workflowUsers.set(userId, userPresence);
    this.socketToWorkflow.set(socketId, workflowId);
    this.socketToUser.set(socketId, userId);

    // Broadcast user joined event
    this.broadcastPresenceEvent(
      workflowId,
      {
        type: "user_join",
        userId,
        workflowId,
        data: { userPresence },
        timestamp: new Date(),
      },
      socketId,
    );

    return Array.from(workflowUsers.values());
  }

  /**
   * Remove user from workflow presence tracking
   */
  public async leaveWorkflowPresence(socketId: string): Promise<void> {
    const workflowId = this.socketToWorkflow.get(socketId);
    const userId = this.socketToUser.get(socketId);

    if (!workflowId || !userId) return;

    const workflowUsers = this.workflowPresence.get(workflowId);
    if (workflowUsers) {
      workflowUsers.delete(userId);

      // Broadcast user left event
      this.broadcastPresenceEvent(
        workflowId,
        {
          type: "user_leave",
          userId,
          workflowId,
          data: { userId },
          timestamp: new Date(),
        },
        socketId,
      );

      // Clean up if no more users
      if (workflowUsers.size === 0) {
        this.workflowPresence.delete(workflowId);
        this.workflowColorAssignments.delete(workflowId);
      }
    }

    this.socketToWorkflow.delete(socketId);
    this.socketToUser.delete(socketId);
  }

  /**
   * Update user cursor position
   */
  public async updateCursorPosition(
    socketId: string,
    cursor: CursorPosition,
  ): Promise<void> {
    const workflowId = this.socketToWorkflow.get(socketId);
    const userId = this.socketToUser.get(socketId);

    if (!workflowId || !userId) return;

    const workflowUsers = this.workflowPresence.get(workflowId);
    const userPresence = workflowUsers?.get(userId);

    if (userPresence) {
      userPresence.cursor = { ...cursor, timestamp: new Date() };
      userPresence.lastActivity = new Date();
      userPresence.status = "active";

      // Broadcast cursor update (throttled on client side)
      this.broadcastPresenceEvent(
        workflowId,
        {
          type: "cursor_move",
          userId,
          workflowId,
          data: {
            userId,
            cursor: userPresence.cursor,
            userColor: userPresence.userColor,
          },
          timestamp: new Date(),
        },
        socketId,
      );
    }
  }

  /**
   * Update user selection
   */
  public async updateSelection(
    socketId: string,
    selection: UserPresence["selection"],
  ): Promise<void> {
    const workflowId = this.socketToWorkflow.get(socketId);
    const userId = this.socketToUser.get(socketId);

    if (!workflowId || !userId) return;

    const workflowUsers = this.workflowPresence.get(workflowId);
    const userPresence = workflowUsers?.get(userId);

    if (userPresence) {
      userPresence.selection = selection;
      userPresence.lastActivity = new Date();
      userPresence.status = "active";

      this.broadcastPresenceEvent(
        workflowId,
        {
          type: "selection_change",
          userId,
          workflowId,
          data: {
            userId,
            selection,
            userColor: userPresence.userColor,
          },
          timestamp: new Date(),
        },
        socketId,
      );
    }
  }

  /**
   * Update user active area (which part of the interface they're interacting with)
   */
  public async updateActiveArea(
    socketId: string,
    activeArea: UserPresence["activeArea"],
  ): Promise<void> {
    const workflowId = this.socketToWorkflow.get(socketId);
    const userId = this.socketToUser.get(socketId);

    if (!workflowId || !userId) return;

    const workflowUsers = this.workflowPresence.get(workflowId);
    const userPresence = workflowUsers?.get(userId);

    if (userPresence) {
      userPresence.activeArea = activeArea;
      userPresence.lastActivity = new Date();

      this.broadcastPresenceEvent(
        workflowId,
        {
          type: "area_change",
          userId,
          workflowId,
          data: {
            userId,
            activeArea,
          },
          timestamp: new Date(),
        },
        socketId,
      );
    }
  }

  /**
   * Get all users present in a workflow
   */
  public getWorkflowPresence(workflowId: string): UserPresence[] {
    const workflowUsers = this.workflowPresence.get(workflowId);
    return workflowUsers ? Array.from(workflowUsers.values()) : [];
  }

  /**
   * Get specific user presence
   */
  public getUserPresence(
    workflowId: string,
    userId: string,
  ): UserPresence | null {
    const workflowUsers = this.workflowPresence.get(workflowId);
    return workflowUsers?.get(userId) || null;
  }

  /**
   * Get presence statistics for a workflow
   */
  public getPresenceStats(workflowId: string): {
    totalUsers: number;
    activeUsers: number;
    idleUsers: number;
    awayUsers: number;
    averageSessionTime: number; // minutes
    mostActiveUser: string | null;
  } {
    const users = this.getWorkflowPresence(workflowId);

    if (users.length === 0) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        idleUsers: 0,
        awayUsers: 0,
        averageSessionTime: 0,
        mostActiveUser: null,
      };
    }

    const now = Date.now();
    const stats = users.reduce(
      (acc, user) => {
        acc.statusCounts[user.status]++;
        acc.totalSessionTime += now - user.sessionStartTime.getTime();

        const activityScore = now - user.lastActivity.getTime();
        if (!acc.mostActiveUser || activityScore < acc.mostActiveScore) {
          acc.mostActiveUser = user.userName;
          acc.mostActiveScore = activityScore;
        }

        return acc;
      },
      {
        statusCounts: { active: 0, idle: 0, away: 0 },
        totalSessionTime: 0,
        mostActiveUser: null as string | null,
        mostActiveScore: Infinity,
      },
    );

    return {
      totalUsers: users.length,
      activeUsers: stats.statusCounts.active,
      idleUsers: stats.statusCounts.idle,
      awayUsers: stats.statusCounts.away,
      averageSessionTime: Math.round(
        stats.totalSessionTime / users.length / (1000 * 60),
      ), // minutes
      mostActiveUser: stats.mostActiveUser,
    };
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket) => {
      // Join workflow presence
      socket.on("join_presence", async (data) => {
        const { workflowId, userId, userName, userAvatar } = data;
        try {
          const allUsers = await this.joinWorkflowPresence(
            workflowId,
            userId,
            socket.id,
            {
              userName,
              userAvatar,
            },
          );

          socket.emit("presence_joined", {
            success: true,
            users: allUsers,
            yourColor: this.workflowColorAssignments
              .get(workflowId)
              ?.get(userId),
          });
        } catch (error) {
          socket.emit("presence_error", { error: "Failed to join presence" });
        }
      });

      // Cursor movement
      socket.on("cursor_move", async (data) => {
        await this.updateCursorPosition(socket.id, data.cursor);
      });

      // Selection change
      socket.on("selection_change", async (data) => {
        await this.updateSelection(socket.id, data.selection);
      });

      // Active area change
      socket.on("active_area_change", async (data) => {
        await this.updateActiveArea(socket.id, data.activeArea);
      });

      // Manual status update
      socket.on("status_change", async (data) => {
        const workflowId = this.socketToWorkflow.get(socket.id);
        const userId = this.socketToUser.get(socket.id);

        if (workflowId && userId) {
          const userPresence = this.workflowPresence
            .get(workflowId)
            ?.get(userId);
          if (userPresence) {
            userPresence.status = data.status;
            userPresence.lastActivity = new Date();

            this.broadcastPresenceEvent(
              workflowId,
              {
                type: "status_change",
                userId,
                workflowId,
                data: { userId, status: data.status },
                timestamp: new Date(),
              },
              socket.id,
            );
          }
        }
      });

      // Disconnect cleanup
      socket.on("disconnect", async () => {
        await this.leaveWorkflowPresence(socket.id);
      });
    });
  }

  /**
   * Broadcast presence event to all users in workflow except sender
   */
  private broadcastPresenceEvent(
    workflowId: string,
    event: PresenceEvent,
    excludeSocketId?: string,
  ): void {
    if (!this.io) return;

    const room = `workflow-${workflowId}`;
    if (excludeSocketId) {
      this.io.to(room).except(excludeSocketId).emit("presence_event", event);
    } else {
      this.io.to(room).emit("presence_event", event);
    }
  }

  /**
   * Cleanup inactive users (idle/away detection)
   */
  private cleanupInactiveUsers(): void {
    const now = Date.now();
    const IDLE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
    const AWAY_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    const REMOVE_THRESHOLD = 15 * 60 * 1000; // 15 minutes

    for (const [workflowId, workflowUsers] of this.workflowPresence) {
      const usersToRemove: string[] = [];

      for (const [userId, userPresence] of workflowUsers) {
        const inactiveTime = now - userPresence.lastActivity.getTime();

        let newStatus = userPresence.status;

        if (inactiveTime > REMOVE_THRESHOLD) {
          // Remove completely inactive users
          usersToRemove.push(userId);
          continue;
        } else if (inactiveTime > AWAY_THRESHOLD) {
          newStatus = "away";
        } else if (inactiveTime > IDLE_THRESHOLD) {
          newStatus = "idle";
        } else {
          newStatus = "active";
        }

        // Update status if changed
        if (newStatus !== userPresence.status) {
          userPresence.status = newStatus;

          this.broadcastPresenceEvent(workflowId, {
            type: "status_change",
            userId,
            workflowId,
            data: { userId, status: newStatus },
            timestamp: new Date(),
          });
        }
      }

      // Remove inactive users
      for (const userId of usersToRemove) {
        workflowUsers.delete(userId);

        this.broadcastPresenceEvent(workflowId, {
          type: "user_leave",
          userId,
          workflowId,
          data: { userId, reason: "inactive" },
          timestamp: new Date(),
        });
      }

      // Clean up empty workflows
      if (workflowUsers.size === 0) {
        this.workflowPresence.delete(workflowId);
        this.workflowColorAssignments.delete(workflowId);
      }
    }
  }
}
