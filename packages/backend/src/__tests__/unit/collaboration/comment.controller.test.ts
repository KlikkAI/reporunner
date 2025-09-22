import { describe, it, expect, beforeEach, vi } from "vitest";
import { Request, Response } from "express";
import { CommentController } from "../../../domains/collaboration/controllers/CommentController.js";
import { Comment } from "../../../models/Comment.js";
import { testUtils } from "../../setup.js";

describe("CommentController", () => {
  let commentController: CommentController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let testUser: any;
  let testWorkflowId: string;

  beforeEach(async () => {
    commentController = new CommentController();
    testWorkflowId = "507f1f77bcf86cd799439011";

    // Create test user
    testUser = await testUtils.createTestUser({
      email: "commenter@test.com",
    });

    // Mock Express request and response objects
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: testUser._id.toString() },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("getWorkflowComments", () => {
    it("should return comments for a workflow", async () => {
      // Create test comments
      const comment1 = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "First comment",
        status: "open",
      });

      const comment2 = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Second comment",
        status: "resolved",
      });

      mockReq.params = { workflowId: testWorkflowId };
      mockReq.query = { limit: "10", page: "1" };

      await commentController.getWorkflowComments(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            comments: expect.arrayContaining([
              expect.objectContaining({
                content: "First comment",
                status: "open",
              }),
              expect.objectContaining({
                content: "Second comment",
                status: "resolved",
              }),
            ]),
            pagination: expect.objectContaining({
              total: 2,
              page: 1,
              limit: 10,
            }),
          }),
        }),
      );
    });

    it("should filter comments by status", async () => {
      await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Open comment",
        status: "open",
      });

      await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Resolved comment",
        status: "resolved",
      });

      mockReq.params = { workflowId: testWorkflowId };
      mockReq.query = { status: "open" };

      await commentController.getWorkflowComments(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            comments: expect.arrayContaining([
              expect.objectContaining({
                content: "Open comment",
                status: "open",
              }),
            ]),
          }),
        }),
      );

      // Should only return 1 comment (open one)
      const call = (mockRes.json as any).mock.calls[0][0];
      expect(call.data.comments).toHaveLength(1);
    });

    it("should return error when workflowId is missing", async () => {
      mockReq.params = {};

      await commentController.getWorkflowComments(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Workflow ID is required",
        }),
      );
    });
  });

  describe("createComment", () => {
    it("should create a new comment successfully", async () => {
      mockReq.body = {
        workflowId: testWorkflowId,
        content: "New test comment",
        position: { x: 100, y: 200, nodeId: "node123" },
        visibility: "public",
        priority: "medium",
      };

      await commentController.createComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            comment: expect.objectContaining({
              content: "New test comment",
              position: expect.objectContaining({
                x: 100,
                y: 200,
                nodeId: "node123",
              }),
              status: "open",
            }),
            message: "Comment created successfully",
          }),
        }),
      );

      // Verify comment exists in database
      const createdComment = await Comment.findOne({
        content: "New test comment",
      });
      expect(createdComment).toBeTruthy();
      expect(createdComment?.workflowId).toBe(testWorkflowId);
    });

    it("should return error when required fields are missing", async () => {
      mockReq.body = {
        content: "Missing workflow ID",
      };

      await commentController.createComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Workflow ID and content are required",
        }),
      );
    });

    it("should return error when user is not authenticated", async () => {
      mockReq.user = undefined;
      mockReq.body = {
        workflowId: testWorkflowId,
        content: "Test comment",
      };

      await commentController.createComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Authentication required",
        }),
      );
    });
  });

  describe("updateComment", () => {
    it("should update comment successfully", async () => {
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Original content",
        status: "open",
      });

      mockReq.params = { commentId: comment._id.toString() };
      mockReq.body = {
        content: "Updated content",
        priority: "high",
        tags: ["important"],
      };

      await commentController.updateComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            comment: expect.objectContaining({
              content: "Updated content",
              priority: "high",
              tags: ["important"],
            }),
            message: "Comment updated successfully",
          }),
        }),
      );

      // Verify edit history was created
      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment?.editHistory).toHaveLength(1);
      expect(updatedComment?.editHistory[0].previousContent).toBe(
        "Original content",
      );
    });

    it("should return error when user is not the author", async () => {
      const otherUser = await testUtils.createTestUser({
        email: "other@test.com",
      });

      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: otherUser._id,
        content: "Other user comment",
        status: "open",
      });

      mockReq.params = { commentId: comment._id.toString() };
      mockReq.body = { content: "Trying to update" };

      await commentController.updateComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Not authorized to edit this comment",
        }),
      );
    });
  });

  describe("addReply", () => {
    it("should add reply to comment successfully", async () => {
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Original comment",
        status: "open",
      });

      mockReq.params = { commentId: comment._id.toString() };
      mockReq.body = {
        content: "This is a reply",
        mentions: [{ userId: testUser._id, userName: "Test User" }],
      };

      await commentController.addReply(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            reply: expect.objectContaining({
              content: "This is a reply",
              authorId: testUser._id.toString(),
            }),
            message: "Reply added successfully",
          }),
        }),
      );

      // Verify reply was added to thread
      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment?.thread).toHaveLength(1);
      expect(updatedComment?.thread[0].content).toBe("This is a reply");
    });
  });

  describe("addReaction", () => {
    it("should add reaction to comment successfully", async () => {
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Comment to react to",
        status: "open",
      });

      mockReq.params = { commentId: comment._id.toString() };
      mockReq.body = { type: "👍" };

      await commentController.addReaction(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            reactions: expect.arrayContaining([
              expect.objectContaining({
                userId: testUser._id.toString(),
                type: "👍",
              }),
            ]),
            message: "Reaction added successfully",
          }),
        }),
      );
    });

    it("should update existing reaction from same user", async () => {
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Comment with existing reaction",
        status: "open",
        reactions: [
          {
            userId: testUser._id.toString(),
            type: "👍",
            timestamp: new Date(),
          },
        ],
      });

      mockReq.params = { commentId: comment._id.toString() };
      mockReq.body = { type: "❤️" };

      await commentController.addReaction(
        mockReq as Request,
        mockRes as Response,
      );

      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment?.reactions).toHaveLength(1);
      expect(updatedComment?.reactions[0].type).toBe("❤️");
    });
  });

  describe("removeReaction", () => {
    it("should remove user reaction successfully", async () => {
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Comment with reaction",
        status: "open",
        reactions: [
          {
            userId: testUser._id.toString(),
            type: "👍",
            timestamp: new Date(),
          },
        ],
      });

      mockReq.params = { commentId: comment._id.toString() };

      await commentController.removeReaction(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            reactions: [],
            message: "Reaction removed successfully",
          }),
        }),
      );
    });
  });

  describe("resolveComment", () => {
    it("should resolve comment successfully", async () => {
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Comment to resolve",
        status: "open",
      });

      mockReq.params = { commentId: comment._id.toString() };
      mockReq.body = { resolution: "Fixed the issue" };

      await commentController.resolveComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            comment: expect.objectContaining({
              status: "resolved",
              resolvedBy: testUser._id.toString(),
            }),
            message: "Comment resolved successfully",
          }),
        }),
      );
    });

    it("should return error when comment is already resolved", async () => {
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Already resolved comment",
        status: "resolved",
        resolvedBy: testUser._id,
        resolvedAt: new Date(),
      });

      mockReq.params = { commentId: comment._id.toString() };

      await commentController.resolveComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Comment is already resolved",
        }),
      );
    });
  });

  describe("deleteComment", () => {
    it("should delete comment successfully when user is author", async () => {
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Comment to delete",
        status: "open",
      });

      mockReq.params = { commentId: comment._id.toString() };

      await commentController.deleteComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            message: "Comment deleted successfully",
          }),
        }),
      );

      // Verify comment was deleted
      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment).toBeNull();
    });

    it("should return error when user is not the author", async () => {
      const otherUser = await testUtils.createTestUser({
        email: "other@test.com",
      });

      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: otherUser._id,
        content: "Other user comment",
        status: "open",
      });

      mockReq.params = { commentId: comment._id.toString() };

      await commentController.deleteComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Not authorized to delete this comment",
        }),
      );
    });
  });

  describe("getCommentAnalytics", () => {
    it("should return comment analytics for workflow", async () => {
      // Create test comments with different statuses
      await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Open comment 1",
        status: "open",
      });

      await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Open comment 2",
        status: "open",
      });

      await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Resolved comment",
        status: "resolved",
        thread: [
          { authorId: testUser._id, content: "Reply 1", timestamp: new Date() },
          { authorId: testUser._id, content: "Reply 2", timestamp: new Date() },
        ],
        reactions: [
          {
            userId: testUser._id.toString(),
            type: "👍",
            timestamp: new Date(),
          },
        ],
      });

      mockReq.params = { workflowId: testWorkflowId };
      mockReq.query = { dateRange: "7" };

      await commentController.getCommentAnalytics(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            dateRange: 7,
            summary: expect.objectContaining({
              totalComments: 3,
              openComments: 2,
              resolvedComments: 1,
              totalReplies: 2,
              totalReactions: 1,
            }),
            dailyActivity: expect.any(Array),
            topCommenters: expect.any(Array),
          }),
        }),
      );
    });
  });
});
