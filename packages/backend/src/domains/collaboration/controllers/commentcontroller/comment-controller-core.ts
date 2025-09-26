/**
 * Comment Controller for Collaboration REST API
 * Provides HTTP endpoints for collaborative comment system
 */

import type { Request, Response } from 'express';
import { Comment } from '../../../models/Comment.js';
import { CollaborationService } from '../../../services/CollaborationService.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/response.js';

export class CommentController {
  constructor() {
    this.collaborationService = CollaborationService.getInstance();
  }

  /**
   * Get comments for a workflow
   * GET /collaboration/comments/:workflowId
   */
  public getWorkflowComments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { workflowId } = req.params;
    const {
      status,
      nodeId,
      limit = 50,
      page = 1,
      includeReplies = true,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    if (!workflowId) {
      res.status(400).json(ApiResponse.error('Workflow ID is required'));
      return;
    }

    const filter: any = { workflowId };

    if (status) {
      filter.status = status;
    }

    if (nodeId) {
      filter['position.nodeId'] = nodeId;
    }

    const comments = await Comment.find(filter)
      .populate('authorId', 'name email avatar')
      .populate('resolvedBy', 'name email')
      .sort({ [sortBy as string]: sortOrder === 'desc' ? -1 : 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const processedComments = comments.map((comment) => {
      const commentObj = comment.toObject();

      // Include thread replies if requested
      if (includeReplies === 'true' && commentObj.thread.length > 0) {
        commentObj.thread = commentObj.thread.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      } else if (includeReplies === 'false') {
        (commentObj as any).replyCount = commentObj.thread.length;
        (commentObj as any).thread = undefined;
      }

      return commentObj;
    });

    const total = await Comment.countDocuments(filter);

    res.json(
      ApiResponse.success({
        comments: processedComments,
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
   * Create new comment
   * POST /collaboration/comments
   */
  public createComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      workflowId,
      content,
      position,
      parentCommentId,
      mentions = [],
      attachments = [],
      visibility = 'public',
      priority = 'medium',
      tags = [],
