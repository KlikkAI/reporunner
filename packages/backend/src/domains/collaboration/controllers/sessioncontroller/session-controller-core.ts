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
