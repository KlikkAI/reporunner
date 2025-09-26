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
