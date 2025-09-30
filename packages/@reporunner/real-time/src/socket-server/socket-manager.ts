import type { Server as HTTPServer } from 'node:http';
import type { IJwtPayload } from '@reporunner/api-types';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { type Socket, Server as SocketIOServer } from 'socket.io';
import { OperationalTransform } from '../operational-transform/operation-engine';
import { PresenceTracker } from '../presence/presence-tracker';
import { RoomManager } from './room-manager';

export interface SocketConfig {
  corsOrigin: string[];
  redisUrl: string;
  jwtSecret: string;
  pingTimeout: number;
  pingInterval: number;
}

export interface CollaborationSession {
  workflowId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userColor: string;
  cursor?: {
    x: number;
    y: number;
    nodeId?: string;
  };
  selection?: {
    nodeIds: string[];
    edgeIds: string[];
  };
  isActive: boolean;
  lastActivity: Date;
}

export class SocketManager {
  private io: SocketIOServer;
  private presenceTracker: PresenceTracker;
  private operationalTransform: OperationalTransform;
  private sessions: Map<string, CollaborationSession> = new Map();
  private config: SocketConfig;

  constructor(httpServer: HTTPServer, config: SocketConfig) {
    this.config = config;

    // Initialize Socket.IO with Redis adapter for scaling
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        credentials: true,
      },
      pingTimeout: config.pingTimeout,
      pingInterval: config.pingInterval,
      transports: ['websocket', 'polling'],
    });

    // Setup Redis adapter for horizontal scaling
    this.setupRedisAdapter();

    // Initialize managers
    this.roomManager = new RoomManager();
    this.presenceTracker = new PresenceTracker();
    this.operationalTransform = new OperationalTransform();

    // Setup middleware and handlers
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private async setupRedisAdapter(): Promise<void> {
    const pubClient = createClient({ url: this.config.redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.io.adapter(createAdapter(pubClient, subClient));
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const user = await this.verifyToken(token);
        socket.data.user = user;
        socket.data.sessionId = `${user.sub}-${Date.now()}`;

        next();
      } catch (_error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const _user = socket.data.user as IJwtPayload;
      const _sessionId = socket.data.sessionId;

      // Handle workflow room joining
      socket.on('join:workflow', async (data: { workflowId: string }) => {
        await this.handleJoinWorkflow(socket, data.workflowId);
      });

      // Handle cursor movement
      socket.on('cursor:move', (data: { x: number; y: number; nodeId?: string }) => {
        this.handleCursorMove(socket, data);
      });

      // Handle selection changes
      socket.on('selection:change', (data: { nodeIds: string[]; edgeIds: string[] }) => {
        this.handleSelectionChange(socket, data);
      });

      // Handle workflow operations (with OT)
      socket.on('operation:apply', async (operation: any) => {
        await this.handleOperation(socket, operation);
      });

      // Handle node operations
      socket.on('node:add', (data: any) => this.handleNodeAdd(socket, data));
      socket.on('node:update', (data: any) => this.handleNodeUpdate(socket, data));
      socket.on('node:delete', (data: any) => this.handleNodeDelete(socket, data));
      socket.on('node:move', (data: any) => this.handleNodeMove(socket, data));

      // Handle edge operations
      socket.on('edge:add', (data: any) => this.handleEdgeAdd(socket, data));
      socket.on('edge:update', (data: any) => this.handleEdgeUpdate(socket, data));
      socket.on('edge:delete', (data: any) => this.handleEdgeDelete(socket, data));

      // Handle comments
      socket.on('comment:add', (data: any) => this.handleCommentAdd(socket, data));
      socket.on('comment:reply', (data: any) => this.handleCommentReply(socket, data));
      socket.on('comment:resolve', (data: any) => this.handleCommentResolve(socket, data));

      // Handle typing indicators
      socket.on('typing:start', (data: { nodeId: string; field: string }) => {
        this.handleTypingStart(socket, data);
      });
      socket.on('typing:stop', (data: { nodeId: string; field: string }) => {
        this.handleTypingStop(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle leaving workflow
      socket.on('leave:workflow', () => {
        this.handleLeaveWorkflow(socket);
      });
    });
  }

  private async handleJoinWorkflow(socket: Socket, workflowId: string): Promise<void> {
    const user = socket.data.user as IJwtPayload;
    const sessionId = socket.data.sessionId;

    // Check permissions
    if (!this.checkWorkflowAccess(user, workflowId)) {
      socket.emit('error', { message: 'Access denied to workflow' });
      return;
    }

    // Join room
    await socket.join(`workflow:${workflowId}`);
    socket.data.workflowId = workflowId;

    // Create collaboration session
    const session: CollaborationSession = {
      workflowId,
      userId: user.sub,
      userName: user.email,
      userColor: this.generateUserColor(user.sub),
      isActive: true,
      lastActivity: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Track presence
    await this.presenceTracker.addUser(workflowId, {
      userId: user.sub,
      sessionId,
      socketId: socket.id,
      userName: user.email,
      userColor: session.userColor,
      joinedAt: new Date(),
    });

    // Get current collaborators
    const collaborators = await this.presenceTracker.getUsers(workflowId);

    // Notify others in the room
    socket.to(`workflow:${workflowId}`).emit('user:joined', {
      userId: user.sub,
      userName: user.email,
      userColor: session.userColor,
      sessionId,
    });

    // Send current state to joining user
    socket.emit('workflow:state', {
      collaborators,
      // Include current workflow state if needed
    });
  }

  private handleCursorMove(socket: Socket, data: { x: number; y: number; nodeId?: string }): void {
    const sessionId = socket.data.sessionId;
    const workflowId = socket.data.workflowId;
    const session = this.sessions.get(sessionId);

    if (!(session && workflowId)) {
      return;
    }

    // Update session cursor
    session.cursor = data;
    session.lastActivity = new Date();

    // Broadcast to others in the room
    socket.to(`workflow:${workflowId}`).emit('cursor:moved', {
      userId: session.userId,
      sessionId,
      cursor: data,
    });
  }

  private handleSelectionChange(
    socket: Socket,
    data: { nodeIds: string[]; edgeIds: string[] }
  ): void {
    const sessionId = socket.data.sessionId;
    const workflowId = socket.data.workflowId;
    const session = this.sessions.get(sessionId);

    if (!(session && workflowId)) {
      return;
    }

    // Update session selection
    session.selection = data;
    session.lastActivity = new Date();

    // Broadcast to others
    socket.to(`workflow:${workflowId}`).emit('selection:changed', {
      userId: session.userId,
      sessionId,
      selection: data,
    });
  }

  private async handleOperation(socket: Socket, operation: any): Promise<void> {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    try {
      // Apply operational transform
      const transformedOp = await this.operationalTransform.transform(
        workflowId,
        operation,
        user.sub
      );

      // Apply operation to workflow
      await this.applyOperationToWorkflow(workflowId, transformedOp);

      // Broadcast to all clients including sender
      this.io.to(`workflow:${workflowId}`).emit('operation:applied', {
        operation: transformedOp,
        userId: user.sub,
        timestamp: new Date(),
      });
    } catch (error) {
      socket.emit('operation:error', {
        message: 'Failed to apply operation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private handleNodeAdd(socket: Socket, data: any): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    // Broadcast node addition
    socket.to(`workflow:${workflowId}`).emit('node:added', {
      ...data,
      userId: user.sub,
      timestamp: new Date(),
    });
  }

  private handleNodeUpdate(socket: Socket, data: any): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    // Check for conflicts
    const isLocked = this.checkNodeLock(workflowId, data.nodeId, user.sub);
    if (isLocked) {
      socket.emit('node:locked', { nodeId: data.nodeId });
      return;
    }

    // Broadcast node update
    socket.to(`workflow:${workflowId}`).emit('node:updated', {
      ...data,
      userId: user.sub,
      timestamp: new Date(),
    });
  }

  private handleNodeDelete(socket: Socket, data: any): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    socket.to(`workflow:${workflowId}`).emit('node:deleted', {
      ...data,
      userId: user.sub,
      timestamp: new Date(),
    });
  }

  private handleNodeMove(socket: Socket, data: any): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    socket.to(`workflow:${workflowId}`).emit('node:moved', {
      ...data,
      userId: user.sub,
      timestamp: new Date(),
    });
  }

  private handleEdgeAdd(socket: Socket, data: any): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    socket.to(`workflow:${workflowId}`).emit('edge:added', {
      ...data,
      userId: user.sub,
      timestamp: new Date(),
    });
  }

  private handleEdgeUpdate(socket: Socket, data: any): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    socket.to(`workflow:${workflowId}`).emit('edge:updated', {
      ...data,
      userId: user.sub,
      timestamp: new Date(),
    });
  }

  private handleEdgeDelete(socket: Socket, data: any): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    socket.to(`workflow:${workflowId}`).emit('edge:deleted', {
      ...data,
      userId: user.sub,
      timestamp: new Date(),
    });
  }

  private handleCommentAdd(socket: Socket, data: any): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    const comment = {
      id: `comment-${Date.now()}`,
      ...data,
      userId: user.sub,
      userName: user.email,
      timestamp: new Date(),
    };

    // Broadcast to all including sender for confirmation
    this.io.to(`workflow:${workflowId}`).emit('comment:added', comment);
  }

  private handleCommentReply(socket: Socket, data: any): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    const reply = {
      id: `reply-${Date.now()}`,
      ...data,
      userId: user.sub,
      userName: user.email,
      timestamp: new Date(),
    };

    this.io.to(`workflow:${workflowId}`).emit('comment:replied', reply);
  }

  private handleCommentResolve(socket: Socket, data: any): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    this.io.to(`workflow:${workflowId}`).emit('comment:resolved', {
      ...data,
      resolvedBy: user.sub,
      resolvedAt: new Date(),
    });
  }

  private handleTypingStart(socket: Socket, data: { nodeId: string; field: string }): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;
    const sessionId = socket.data.sessionId;

    if (!workflowId) {
      return;
    }

    socket.to(`workflow:${workflowId}`).emit('typing:started', {
      ...data,
      userId: user.sub,
      userName: user.email,
      sessionId,
    });
  }

  private handleTypingStop(socket: Socket, data: { nodeId: string; field: string }): void {
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;
    const sessionId = socket.data.sessionId;

    if (!workflowId) {
      return;
    }

    socket.to(`workflow:${workflowId}`).emit('typing:stopped', {
      ...data,
      userId: user.sub,
      sessionId,
    });
  }

  private handleLeaveWorkflow(socket: Socket): void {
    const workflowId = socket.data.workflowId;
    const sessionId = socket.data.sessionId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) {
      return;
    }

    // Leave room
    socket.leave(`workflow:${workflowId}`);

    // Remove presence
    this.presenceTracker.removeUser(workflowId, sessionId);

    // Notify others
    socket.to(`workflow:${workflowId}`).emit('user:left', {
      userId: user.sub,
      sessionId,
    });

    // Clean up session
    this.sessions.delete(sessionId);
  }

  private handleDisconnect(socket: Socket): void {
    const sessionId = socket.data.sessionId;
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (sessionId && workflowId) {
      // Remove from presence tracking
      this.presenceTracker.removeUser(workflowId, sessionId);

      // Notify others in the workflow
      socket.to(`workflow:${workflowId}`).emit('user:disconnected', {
        userId: user?.sub,
        sessionId,
      });

      // Clean up session
      this.sessions.delete(sessionId);
    }
  }

  // Helper methods
  private async verifyToken(_token: string): Promise<IJwtPayload> {
    // Implementation would verify JWT token
    // This is a placeholder
    return {} as IJwtPayload;
  }

  private checkWorkflowAccess(_user: IJwtPayload, _workflowId: string): boolean {
    // Check if user has access to the workflow
    // This would integrate with the permission engine
    return true;
  }

  private generateUserColor(userId: string): string {
    // Generate a consistent color for the user
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#FFB6C1',
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  }

  private checkNodeLock(_workflowId: string, _nodeId: string, _userId: string): boolean {
    // Check if node is locked by another user
    // This would be implemented with a locking mechanism
    return false;
  }

  private async applyOperationToWorkflow(_workflowId: string, _operation: any): Promise<void> {}

  // Public methods
  public getActiveCollaborators(workflowId: string): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.workflowId === workflowId && session.isActive
    );
  }

  public broadcastToWorkflow(workflowId: string, event: string, data: any): void {
    this.io.to(`workflow:${workflowId}`).emit(event, data);
  }
}

export default SocketManager;
