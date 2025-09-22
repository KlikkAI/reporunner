/**
 * Comment Controller for Collaboration REST API
 * Provides HTTP endpoints for collaborative comment system
 */

import { Request, Response } from "express";
import { CollaborationService } from "../../../services/CollaborationService.js";
import { Comment } from "../../../models/Comment.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/response.js";

export class CommentController {
  private collaborationService: CollaborationService;

  constructor() {
    this.collaborationService = CollaborationService.getInstance();
  }

  /**
   * Get comments for a workflow
   * GET /collaboration/comments/:workflowId
   */
  public getWorkflowComments = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { workflowId } = req.params;
      const {
        status,
        nodeId,
        limit = 50,
        page = 1,
        includeReplies = true,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      if (!workflowId) {
        res.status(400).json(ApiResponse.error("Workflow ID is required"));
        return;
      }

      const filter: any = { workflowId };

      if (status) {
        filter.status = status;
      }

      if (nodeId) {
        filter["position.nodeId"] = nodeId;
      }

      const comments = await Comment.find(filter)
        .populate("authorId", "name email avatar")
        .populate("resolvedBy", "name email")
        .sort({ [sortBy as string]: sortOrder === "desc" ? -1 : 1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      let processedComments = comments.map((comment) => {
        const commentObj = comment.toObject();

        // Include thread replies if requested
        if (includeReplies === "true" && commentObj.thread.length > 0) {
          commentObj.thread = commentObj.thread.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );
        } else if (includeReplies === "false") {
          (commentObj as any).replyCount = commentObj.thread.length;
          delete (commentObj as any).thread;
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
        }),
      );
    },
  );

  /**
   * Create new comment
   * POST /collaboration/comments
   */
  public createComment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const {
        workflowId,
        content,
        position,
        parentCommentId,
        mentions = [],
        attachments = [],
        visibility = "public",
        priority = "medium",
        tags = [],
      } = req.body;

      if (!workflowId || !content) {
        res
          .status(400)
          .json(ApiResponse.error("Workflow ID and content are required"));
        return;
      }

      // Get user from request (assuming auth middleware sets req.user)
      const authorId = (req as any).user?.id;
      if (!authorId) {
        res.status(401).json(ApiResponse.error("Authentication required"));
        return;
      }

      try {
        const comment = new Comment({
          workflowId,
          authorId,
          parentCommentId,
          content,
          mentions,
          attachments,
          position,
          visibility,
          priority,
          tags,
          status: "open",
        });

        await comment.save();
        await comment.populate("authorId", "name email avatar");

        res.status(201).json(
          ApiResponse.success({
            comment: comment.toObject(),
            message: "Comment created successfully",
          }),
        );
      } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json(ApiResponse.error("Failed to create comment"));
      }
    },
  );

  /**
   * Update comment
   * PATCH /collaboration/comments/:commentId
   */
  public updateComment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { commentId } = req.params;
      const { content, visibility, priority, tags, status } = req.body;

      if (!commentId) {
        res.status(400).json(ApiResponse.error("Comment ID is required"));
        return;
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        res.status(404).json(ApiResponse.error("Comment not found"));
        return;
      }

      // Check if user is author or has permission to edit
      const userId = (req as any).user?.id;
      if (comment.authorId !== userId) {
        res
          .status(403)
          .json(ApiResponse.error("Not authorized to edit this comment"));
        return;
      }

      // Store edit history if content is being changed
      if (content && content !== comment.content) {
        comment.editHistory.push({
          timestamp: new Date(),
          previousContent: comment.content,
          editedBy: userId,
        });
        comment.content = content;
      }

      // Update other fields
      if (visibility) comment.visibility = visibility;
      if (priority) comment.priority = priority;
      if (tags) comment.tags = tags;
      if (status) comment.status = status;

      await comment.save();
      await comment.populate("authorId", "name email avatar");

      res.json(
        ApiResponse.success({
          comment: comment.toObject(),
          message: "Comment updated successfully",
        }),
      );
    },
  );

  /**
   * Delete comment
   * DELETE /collaboration/comments/:commentId
   */
  public deleteComment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { commentId } = req.params;

      if (!commentId) {
        res.status(400).json(ApiResponse.error("Comment ID is required"));
        return;
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        res.status(404).json(ApiResponse.error("Comment not found"));
        return;
      }

      const userId = (req as any).user?.id;

      // Check if user is author or has admin permissions
      if (comment.authorId !== userId) {
        res
          .status(403)
          .json(ApiResponse.error("Not authorized to delete this comment"));
        return;
      }

      await Comment.findByIdAndDelete(commentId);

      res.json(
        ApiResponse.success({ message: "Comment deleted successfully" }),
      );
    },
  );

  /**
   * Add reply to comment
   * POST /collaboration/comments/:commentId/replies
   */
  public addReply = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { commentId } = req.params;
      const { content, mentions = [] } = req.body;

      if (!commentId || !content) {
        res
          .status(400)
          .json(ApiResponse.error("Comment ID and content are required"));
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json(ApiResponse.error("Authentication required"));
        return;
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        res.status(404).json(ApiResponse.error("Comment not found"));
        return;
      }

      const reply = {
        authorId: userId,
        content,
        mentions,
        timestamp: new Date(),
      };

      comment.thread.push(reply);
      await comment.save();
      await comment.populate("authorId", "name email avatar");

      res.status(201).json(
        ApiResponse.success({
          reply,
          comment: comment.toObject(),
          message: "Reply added successfully",
        }),
      );
    },
  );

  /**
   * Add reaction to comment
   * POST /collaboration/comments/:commentId/reactions
   */
  public addReaction = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { commentId } = req.params;
      const { type } = req.body;

      if (!commentId || !type) {
        res
          .status(400)
          .json(ApiResponse.error("Comment ID and reaction type are required"));
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json(ApiResponse.error("Authentication required"));
        return;
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        res.status(404).json(ApiResponse.error("Comment not found"));
        return;
      }

      // Check if user already reacted
      const existingReactionIndex = comment.reactions.findIndex(
        (r) => r.userId === userId,
      );

      if (existingReactionIndex !== -1) {
        // Update existing reaction
        comment.reactions[existingReactionIndex].type = type;
        comment.reactions[existingReactionIndex].timestamp = new Date();
      } else {
        // Add new reaction
        comment.reactions.push({
          userId,
          type,
          timestamp: new Date(),
        });
      }

      await comment.save();

      res.json(
        ApiResponse.success({
          reactions: comment.reactions,
          message: "Reaction added successfully",
        }),
      );
    },
  );

  /**
   * Remove reaction from comment
   * DELETE /collaboration/comments/:commentId/reactions
   */
  public removeReaction = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { commentId } = req.params;

      if (!commentId) {
        res.status(400).json(ApiResponse.error("Comment ID is required"));
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json(ApiResponse.error("Authentication required"));
        return;
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        res.status(404).json(ApiResponse.error("Comment not found"));
        return;
      }

      const reactionIndex = comment.reactions.findIndex(
        (r) => r.userId === userId,
      );
      if (reactionIndex === -1) {
        res.status(404).json(ApiResponse.error("User reaction not found"));
        return;
      }

      // Remove user's reaction
      comment.reactions.splice(reactionIndex, 1);
      await comment.save();

      res.json(
        ApiResponse.success({
          reactions: comment.reactions,
          message: "Reaction removed successfully",
        }),
      );
    },
  );

  /**
   * Resolve comment
   * POST /collaboration/comments/:commentId/resolve
   */
  public resolveComment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { commentId } = req.params;
      const { resolution } = req.body;

      if (!commentId) {
        res.status(400).json(ApiResponse.error("Comment ID is required"));
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json(ApiResponse.error("Authentication required"));
        return;
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        res.status(404).json(ApiResponse.error("Comment not found"));
        return;
      }

      if (comment.status === "resolved") {
        res.status(409).json(ApiResponse.error("Comment is already resolved"));
        return;
      }

      comment.status = "resolved";
      comment.resolvedBy = userId;
      comment.resolvedAt = new Date();
      // Note: resolution field would need to be added to IComment interface if needed

      await comment.save();
      await comment.populate("authorId", "name email avatar");
      await comment.populate("resolvedBy", "name email avatar");

      res.json(
        ApiResponse.success({
          comment: comment.toObject(),
          message: "Comment resolved successfully",
        }),
      );
    },
  );

  /**
   * Get comment analytics for a workflow
   * GET /collaboration/comments/:workflowId/analytics
   */
  public getCommentAnalytics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { workflowId } = req.params;
      const { dateRange = 7 } = req.query; // days

      if (!workflowId) {
        res.status(400).json(ApiResponse.error("Workflow ID is required"));
        return;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(dateRange));

      // Get comment analytics
      const commentStats = await Comment.aggregate([
        {
          $match: {
            workflowId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalComments: { $sum: 1 },
            openComments: {
              $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
            },
            resolvedComments: {
              $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
            },
            totalReplies: { $sum: { $size: "$thread" } },
            totalReactions: { $sum: { $size: "$reactions" } },
            averageRepliesPerComment: { $avg: { $size: "$thread" } },
          },
        },
      ]);

      // Get comment activity by day
      const dailyActivity = await Comment.aggregate([
        {
          $match: {
            workflowId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get top commenters
      const topCommenters = await Comment.aggregate([
        {
          $match: {
            workflowId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$authorId",
            commentCount: { $sum: 1 },
          },
        },
        { $sort: { commentCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $project: {
            _id: 1,
            commentCount: 1,
            name: "$author.name",
            email: "$author.email",
          },
        },
      ]);

      const analytics = {
        dateRange: Number(dateRange),
        summary: commentStats[0] || {
          totalComments: 0,
          openComments: 0,
          resolvedComments: 0,
          totalReplies: 0,
          totalReactions: 0,
          averageRepliesPerComment: 0,
        },
        dailyActivity,
        topCommenters,
      };

      res.json(ApiResponse.success(analytics));
    },
  );
}
