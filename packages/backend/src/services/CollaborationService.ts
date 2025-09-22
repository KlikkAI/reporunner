/**
 * Collaboration Service for Real-time Editing Sessions
 * Manages multi-user workflow editing with operational transforms and conflict resolution
 */

import type { Server as SocketIOServer } from 'socket.io';
import {
  CollaborationSession,
  type ICollaborationSession,
} from '../models/CollaborationSession.js';
import { Comment, type IComment } from '../models/Comment.js';
import { type IOperation, Operation } from '../models/Operation.js';
import {
  OperationalTransformService,
  type TransformResult,
} from './OperationalTransformService.js';

export interface ParticipantData {
  userId: string;
  socketId: string;
  userName: string;
  role: 'owner' | 'editor' | 'viewer';
  cursor?: {
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
  };
  selection?: {
    nodeIds: string[];
    edgeIds: string[];
  };
  lastActivity: Date;
}

export interface SessionConfig {
  maxParticipants: number;
  conflictResolution: 'last-write-wins' | 'operational-transform' | 'manual';
  permissions: {
    allowAnonymous: boolean;
    defaultRole: 'viewer' | 'editor';
    requireApproval: boolean;
  };
  features: {
    enableCursors: boolean;
    enableComments: boolean;
    enableVoiceChat: boolean;
    autoSave: boolean;
    autoSaveInterval: number; // seconds
  };
}

export class CollaborationService {
  private static instance: CollaborationService;
  private io: SocketIOServer | null = null;
  private operationalTransform: OperationalTransformService;
  private activeSessions = new Map<string, ICollaborationSession>();
  private participantSockets = new Map<string, Set<string>>(); // workflowId -> Set<socketId>
  private socketToWorkflow = new Map<string, string>(); // socketId -> workflowId

  private constructor() {
    this.operationalTransform = OperationalTransformService.getInstance();
  }

  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  /**
   * Initialize collaboration service with Socket.IO server
   */
  public initialize(io: SocketIOServer): void {
    this.io = io;
    this.setupSocketHandlers();
  }

  /**
   * Create or join a collaboration session for a workflow
   */
  public async joinSession(
    workflowId: string,
    participant: ParticipantData,
    sessionConfig?: Partial<SessionConfig>
  ): Promise<{
    session: ICollaborationSession;
    isNewSession: boolean;
    participantCount: number;
  }> {
    let session = await this.getSession(workflowId);
    let isNewSession = false;

    if (!session) {
      // Create new session
      session = await this.createSession(workflowId, participant, sessionConfig);
      isNewSession = true;
    } else {
      // Join existing session
      session = await this.addParticipant(session, participant);
    }

    // Cache session and track participant
    this.activeSessions.set(workflowId, session);

    if (!this.participantSockets.has(workflowId)) {
      this.participantSockets.set(workflowId, new Set());
    }
    this.participantSockets.get(workflowId)!.add(participant.socketId);
    this.socketToWorkflow.set(participant.socketId, workflowId);

    // Join Socket.IO room
    if (this.io) {
      const socket = this.io.sockets.sockets.get(participant.socketId);
      if (socket) {
        await socket.join(`workflow-${workflowId}`);
      }
    }

    return {
      session,
      isNewSession,
      participantCount: session.participants.length,
    };
  }

  /**
   * Leave collaboration session
   */
  public async leaveSession(socketId: string): Promise<void> {
    const workflowId = this.socketToWorkflow.get(socketId);
    if (!workflowId) return;

    const session = this.activeSessions.get(workflowId);
    if (!session) return;

    // Remove participant from session
    session.participants = session.participants.filter((p) => p.socketId !== socketId);

    // Clean up tracking maps
    this.participantSockets.get(workflowId)?.delete(socketId);
    this.socketToWorkflow.delete(socketId);

    // Update session in database
    if (session.participants.length === 0) {
      // No participants left, end session
      await this.endSession(workflowId);
    } else {
      await this.updateSession(session);

      // Notify remaining participants
      this.broadcastToSession(workflowId, 'participant_left', {
        socketId,
        remainingParticipants: session.participants.length,
      });
    }

    // Leave Socket.IO room
    if (this.io) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        await socket.leave(`workflow-${workflowId}`);
      }
    }
  }

  /**
   * Handle collaborative operation (node/edge changes)
   */
  public async handleOperation(
    workflowId: string,
    authorSocketId: string,
    operationData: Partial<IOperation>
  ): Promise<{
    success: boolean;
    operation?: IOperation;
    conflicts?: TransformResult['conflicts'];
    requiresManualResolution?: boolean;
  }> {
    const session = this.activeSessions.get(workflowId);
    if (!session) {
      return { success: false };
    }

    try {
      // Create operation record
      const operation = new Operation({
        ...operationData,
        workflowId,
        sessionId: session.sessionId,
        authorId: this.getParticipantUserId(session, authorSocketId),
        timestamp: new Date(),
        status: 'pending',
      });

      // Get recent operations for conflict resolution
      const recentOperations = await Operation.find({
        workflowId,
        timestamp: { $gte: new Date(Date.now() - 30000) }, // Last 30 seconds
        status: { $in: ['applied', 'transformed'] },
      }).sort({ timestamp: 1 });

      let transformResult: TransformResult | undefined;

      if (
        session.settings.conflictResolution === 'operational-transform' &&
        recentOperations.length > 0
      ) {
        // Apply operational transform
        transformResult = await this.operationalTransform.transformOperationSequence(
          operation,
          recentOperations,
          'server'
        );

        operation.set(transformResult.transformedOperation);
        operation.conflicts = transformResult.conflicts.map((c) => ({
          conflictingOperationId: '', // Will be set by transform service
          resolutionStrategy: c.autoResolvable ? 'auto' : 'manual',
        }));

        if (transformResult.requiresManualResolution) {
          operation.status = 'pending';

          // Notify participants about conflict requiring manual resolution
          this.broadcastToSession(
            workflowId,
            'operation_conflict',
            {
              operation: operation.toObject(),
              conflicts: transformResult.conflicts,
            },
            authorSocketId
          );

          await operation.save();
          return {
            success: false,
            operation,
            conflicts: transformResult.conflicts,
            requiresManualResolution: true,
          };
        }
      }

      // Apply operation
      operation.status = 'applied';
      operation.version = session.currentVersion + 1;
      await operation.save();

      // Update session version
      session.currentVersion = operation.version;
      session.lastActivity = new Date();
      await this.updateSession(session);

      // Broadcast operation to all participants except author
      this.broadcastToSession(
        workflowId,
        'operation_applied',
        {
          operation: operation.toObject(),
          conflicts: transformResult?.conflicts || [],
        },
        authorSocketId
      );

      return {
        success: true,
        operation,
        conflicts: transformResult?.conflicts || [],
        requiresManualResolution: false,
      };
    } catch (error) {
      console.error('Error handling operation:', error);
      return { success: false };
    }
  }

  /**
   * Update participant cursor position
   */
  public async updateCursor(
    workflowId: string,
    socketId: string,
    cursor: ParticipantData['cursor']
  ): Promise<void> {
    const session = this.activeSessions.get(workflowId);
    if (!session) return;

    // Update participant cursor in session
    const participant = session.participants.find((p) => p.socketId === socketId);
    if (participant) {
      participant.cursor = cursor;
      participant.lastActivity = new Date();
      await this.updateSession(session);

      // Broadcast cursor update to other participants
      this.broadcastToSession(
        workflowId,
        'cursor_update',
        {
          userId: participant.userId,
          socketId,
          cursor,
        },
        socketId
      );
    }
  }

  /**
   * Update participant selection
   */
  public async updateSelection(
    workflowId: string,
    socketId: string,
    selection: ParticipantData['selection']
  ): Promise<void> {
    const session = this.activeSessions.get(workflowId);
    if (!session) return;

    const participant = session.participants.find((p) => p.socketId === socketId);
    if (participant) {
      participant.selection = selection;
      participant.lastActivity = new Date();
      await this.updateSession(session);

      // Broadcast selection update
      this.broadcastToSession(
        workflowId,
        'selection_update',
        {
          userId: participant.userId,
          socketId,
          selection,
        },
        socketId
      );
    }
  }

  /**
   * Add comment to workflow
   */
  public async addComment(
    workflowId: string,
    authorSocketId: string,
    commentData: Partial<IComment>
  ): Promise<IComment | null> {
    const session = this.activeSessions.get(workflowId);
    if (!session) return null;

    try {
      const comment = new Comment({
        ...commentData,
        workflowId,
        sessionId: session.sessionId,
        authorId: this.getParticipantUserId(session, authorSocketId),
      });

      await comment.save();

      // Broadcast comment to all participants
      this.broadcastToSession(workflowId, 'comment_added', {
        comment: comment.toObject(),
      });

      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  /**
   * Get active session participants
   */
  public getSessionParticipants(workflowId: string): ParticipantData[] {
    const session = this.activeSessions.get(workflowId);
    if (!session) return [];

    return session.participants.map((p) => ({
      userId: p.userId,
      socketId: p.socketId,
      userName: p.userName || 'Unknown User',
      role: p.role,
      cursor: p.cursor,
      selection: p.selection,
      lastActivity: p.lastActivity || new Date(),
    }));
  }

  /**
   * Get session statistics
   */
  public async getSessionStats(workflowId: string): Promise<{
    participants: number;
    operations: number;
    comments: number;
    sessionDuration: number; // minutes
  }> {
    const session = this.activeSessions.get(workflowId) || (await this.getSession(workflowId));
    if (!session) {
      return {
        participants: 0,
        operations: 0,
        comments: 0,
        sessionDuration: 0,
      };
    }

    const [operationCount, commentCount] = await Promise.all([
      Operation.countDocuments({ sessionId: session.sessionId }),
      Comment.countDocuments({ sessionId: session.sessionId }),
    ]);

    const sessionDuration = Math.round(
      (new Date().getTime() - session.createdAt.getTime()) / (1000 * 60)
    );

    return {
      participants: session.participants.length,
      operations: operationCount,
      comments: commentCount,
      sessionDuration,
    };
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      socket.on('join_collaboration', async (data) => {
        const { workflowId, participant } = data;
        try {
          const result = await this.joinSession(workflowId, {
            ...participant,
            socketId: socket.id,
            lastActivity: new Date(),
          });

          socket.emit('collaboration_joined', {
            success: true,
            session: result.session.toObject(),
            isNewSession: result.isNewSession,
            participantCount: result.participantCount,
          });

          // Notify other participants
          this.broadcastToSession(
            workflowId,
            'participant_joined',
            {
              participant: participant,
              participantCount: result.participantCount,
            },
            socket.id
          );
        } catch (error) {
          socket.emit('collaboration_error', {
            error: 'Failed to join collaboration session',
          });
        }
      });

      socket.on('collaboration_operation', async (data) => {
        const workflowId = this.socketToWorkflow.get(socket.id);
        if (!workflowId) return;

        const result = await this.handleOperation(workflowId, socket.id, data.operation);

        socket.emit('operation_result', {
          success: result.success,
          operation: result.operation?.toObject(),
          conflicts: result.conflicts,
          requiresManualResolution: result.requiresManualResolution,
        });
      });

      socket.on('cursor_move', async (data) => {
        const workflowId = this.socketToWorkflow.get(socket.id);
        if (workflowId) {
          await this.updateCursor(workflowId, socket.id, data.cursor);
        }
      });

      socket.on('selection_change', async (data) => {
        const workflowId = this.socketToWorkflow.get(socket.id);
        if (workflowId) {
          await this.updateSelection(workflowId, socket.id, data.selection);
        }
      });

      socket.on('add_comment', async (data) => {
        const workflowId = this.socketToWorkflow.get(socket.id);
        if (workflowId) {
          await this.addComment(workflowId, socket.id, data.comment);
        }
      });

      socket.on('disconnect', async () => {
        await this.leaveSession(socket.id);
      });
    });
  }

  /**
   * Create new collaboration session
   */
  private async createSession(
    workflowId: string,
    creator: ParticipantData,
    config?: Partial<SessionConfig>
  ): Promise<ICollaborationSession> {
    const defaultConfig: SessionConfig = {
      maxParticipants: 10,
      conflictResolution: 'operational-transform',
      permissions: {
        allowAnonymous: false,
        defaultRole: 'viewer',
        requireApproval: false,
      },
      features: {
        enableCursors: true,
        enableComments: true,
        enableVoiceChat: false,
        autoSave: true,
        autoSaveInterval: 30,
      },
    };

    const sessionConfig = { ...defaultConfig, ...config };

    const session = new CollaborationSession({
      workflowId,
      sessionId: `session_${workflowId}_${Date.now()}`,
      participants: [
        {
          userId: creator.userId,
          socketId: creator.socketId,
          userName: creator.userName,
          role: creator.role || 'owner',
          joinedAt: new Date(),
          lastSeen: new Date(),
          lastActivity: new Date(),
        },
      ],
      settings: {
        maxParticipants: sessionConfig.maxParticipants,
        conflictResolution: sessionConfig.conflictResolution,
        allowAnonymous: sessionConfig.permissions.allowAnonymous,
        autoSave: sessionConfig.features.autoSave,
        autoSaveInterval: sessionConfig.features.autoSaveInterval,
      },
      currentVersion: 0,
    });

    await session.save();
    return session;
  }

  /**
   * Add participant to existing session
   */
  private async addParticipant(
    session: ICollaborationSession,
    participant: ParticipantData
  ): Promise<ICollaborationSession> {
    // Check if participant already exists (reconnection)
    const existingIndex = session.participants.findIndex((p) => p.userId === participant.userId);

    if (existingIndex >= 0) {
      // Update existing participant
      session.participants[existingIndex] = {
        ...session.participants[existingIndex],
        socketId: participant.socketId,
        lastActivity: new Date(),
      };
    } else {
      // Add new participant
      session.participants.push({
        userId: participant.userId,
        socketId: participant.socketId,
        userName: participant.userName,
        role: participant.role || 'editor',
        joinedAt: new Date(),
        lastSeen: new Date(),
        lastActivity: new Date(),
      });
    }

    await session.save();
    return session;
  }

  /**
   * Get collaboration session
   */
  private async getSession(workflowId: string): Promise<ICollaborationSession | null> {
    return await CollaborationSession.findOne({
      workflowId,
      isActive: true,
    }).sort({ createdAt: -1 });
  }

  /**
   * Update session in database
   */
  private async updateSession(session: ICollaborationSession): Promise<void> {
    await session.save();
    this.activeSessions.set(session.workflowId, session);
  }

  /**
   * End collaboration session
   */
  private async endSession(workflowId: string): Promise<void> {
    const session = this.activeSessions.get(workflowId);
    if (session) {
      session.isActive = false;
      session.endedAt = new Date();
      await session.save();
    }

    // Clean up in-memory data
    this.activeSessions.delete(workflowId);
    this.participantSockets.delete(workflowId);
  }

  /**
   * Get participant user ID by socket ID
   */
  private getParticipantUserId(session: ICollaborationSession, socketId: string): string {
    const participant = session.participants.find((p) => p.socketId === socketId);
    return participant?.userId || '';
  }

  /**
   * Broadcast event to all session participants except excluded socket
   */
  private broadcastToSession(
    workflowId: string,
    event: string,
    data: any,
    excludeSocketId?: string
  ): void {
    if (!this.io) return;

    const room = `workflow-${workflowId}`;
    if (excludeSocketId) {
      this.io.to(room).except(excludeSocketId).emit(event, data);
    } else {
      this.io.to(room).emit(event, data);
    }
  }
}
