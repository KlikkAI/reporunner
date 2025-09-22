/**
 * Session Controller for Collaboration REST API
 * Provides HTTP endpoints for collaboration session management
 */

import type { Request, Response } from 'express';
import { CollaborationSession } from '../../../models/CollaborationSession.js';
import { Operation } from '../../../models/Operation.js';
import { CollaborationService } from '../../../services/CollaborationService.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/response.js';

export class SessionController {
  private collaborationService: CollaborationService;

  constructor() {
    this.collaborationService = CollaborationService.getInstance();
  }

  /**
   * Get active collaboration session for a workflow
   * GET /collaboration/sessions/:workflowId
   */
  public getSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { workflowId } = req.params;

    if (!workflowId) {
      res.status(400).json(ApiResponse.error('Workflow ID is required'));
      return;
    }

    const session = await CollaborationSession.findOne({
      workflowId,
      isActive: true,
    }).populate('participants.userId', 'name email');

    if (!session) {
      res.status(404).json(ApiResponse.error('No active collaboration session found'));
      return;
    }

    // Get session statistics
    const stats = await this.collaborationService.getSessionStats(workflowId);

    res.json(
      ApiResponse.success({
        session: session.toObject(),
        statistics: stats,
        participants: this.collaborationService.getSessionParticipants(workflowId),
      })
    );
  });

  /**
   * Create or join collaboration session
   * POST /collaboration/sessions/:workflowId/join
   */
  public joinSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { workflowId } = req.params;
    const { user, sessionConfig } = req.body;

    if (!workflowId || !user) {
      res.status(400).json(ApiResponse.error('Workflow ID and user information are required'));
      return;
    }

    try {
      const result = await this.collaborationService.joinSession(
        workflowId,
        {
          ...user,
          socketId: `http_${user.id}_${Date.now()}`, // Temporary socket ID for HTTP requests
          lastActivity: new Date(),
        },
        sessionConfig
      );

      res.json(
        ApiResponse.success({
          session: result.session.toObject(),
          isNewSession: result.isNewSession,
          participantCount: result.participantCount,
          message: result.isNewSession
            ? 'New collaboration session created'
            : 'Joined existing collaboration session',
        })
      );
    } catch (error) {
      console.error('Error joining session:', error);
      res.status(500).json(ApiResponse.error('Failed to join collaboration session'));
    }
  });

  /**
   * Get all sessions for a user
   * GET /collaboration/sessions/user/:userId
   */
  public getUserSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { active, limit = 10, page = 1 } = req.query;

    if (!userId) {
      res.status(400).json(ApiResponse.error('User ID is required'));
      return;
    }

    const filter: any = {
      'participants.userId': userId,
    };

    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const sessions = await CollaborationSession.find(filter)
      .populate('workflowId', 'name description')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await CollaborationSession.countDocuments(filter);

    res.json(
      ApiResponse.success({
        sessions: sessions.map((s) => s.toObject()),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      })
    );
  });

  /**
   * Get session operations history
   * GET /collaboration/sessions/:sessionId/operations
   */
  public getSessionOperations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const { limit = 50, page = 1, status, type } = req.query;

    if (!sessionId) {
      res.status(400).json(ApiResponse.error('Session ID is required'));
      return;
    }

    const filter: any = { sessionId };

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    const operations = await Operation.find(filter)
      .populate('authorId', 'name email')
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Operation.countDocuments(filter);

    res.json(
      ApiResponse.success({
        operations: operations.map((op) => op.toObject()),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      })
    );
  });

  /**
   * Update session configuration
   * PATCH /collaboration/sessions/:sessionId/config
   */
  public updateSessionConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const { settings } = req.body;

    if (!sessionId) {
      res.status(400).json(ApiResponse.error('Session ID is required'));
      return;
    }

    const session = await CollaborationSession.findOne({
      sessionId,
      isActive: true,
    });

    if (!session) {
      res.status(404).json(ApiResponse.error('Session not found'));
      return;
    }

    // Update settings
    if (settings) {
      session.settings = {
        ...session.settings,
        ...settings,
      };
      await session.save();
    }

    res.json(
      ApiResponse.success({
        session: session.toObject(),
        message: 'Session configuration updated successfully',
      })
    );
  });

  /**
   * End collaboration session
   * POST /collaboration/sessions/:sessionId/end
   */
  public endSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json(ApiResponse.error('Session ID is required'));
      return;
    }

    const session = await CollaborationSession.findOne({
      sessionId,
      isActive: true,
    });

    if (!session) {
      res.status(404).json(ApiResponse.error('Session not found'));
      return;
    }

    // End the session
    session.isActive = false;
    session.endedAt = new Date();
    await session.save();

    res.json(
      ApiResponse.success({
        session: session.toObject(),
        message: 'Collaboration session ended successfully',
      })
    );
  });

  /**
   * Get collaboration analytics for a workflow
   * GET /collaboration/analytics/:workflowId
   */
  public getCollaborationAnalytics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { workflowId } = req.params;
      const { dateRange = 7 } = req.query; // days

      if (!workflowId) {
        res.status(400).json(ApiResponse.error('Workflow ID is required'));
        return;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(dateRange));

      // Get session analytics
      const sessionStats = await CollaborationSession.aggregate([
        {
          $match: {
            workflowId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            activeSessions: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
            },
            averageParticipants: { $avg: { $size: '$participants' } },
            totalParticipants: { $sum: { $size: '$participants' } },
          },
        },
      ]);

      // Get operation analytics
      const operationStats = await Operation.aggregate([
        {
          $match: {
            workflowId,
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]);

      const analytics = {
        dateRange: Number(dateRange),
        sessions: sessionStats[0] || {
          totalSessions: 0,
          activeSessions: 0,
          averageParticipants: 0,
          totalParticipants: 0,
        },
        operations: operationStats.reduce(
          (acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      res.json(ApiResponse.success(analytics));
    }
  );
}
