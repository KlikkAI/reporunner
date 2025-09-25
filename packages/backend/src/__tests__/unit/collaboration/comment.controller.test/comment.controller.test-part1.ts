import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentController } from '../../../domains/collaboration/controllers/CommentController.js';
import { Comment } from '../../../models/Comment.js';
import { testUtils } from '../../setup.js';

describe('CommentController', () => {
  let commentController: CommentController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let testUser: any;
  let testWorkflowId: string;

  beforeEach(async () => {
    commentController = new CommentController();
    testWorkflowId = '507f1f77bcf86cd799439011';

    // Create test user
    testUser = await testUtils.createTestUser({
      email: 'commenter@test.com',
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

  describe('getWorkflowComments', () => {
    it('should return comments for a workflow', async () => {
      // Create test comments
      const _comment1 = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: 'First comment',
        status: 'open',
      });

      const _comment2 = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: 'Second comment',
        status: 'resolved',
      });

      mockReq.params = { workflowId: testWorkflowId };
      mockReq.query = { limit: '10', page: '1' };

      await commentController.getWorkflowComments(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            comments: expect.arrayContaining([
              expect.objectContaining({
                content: 'First comment',
                status: 'open',
              }),
              expect.objectContaining({
                content: 'Second comment',
                status: 'resolved',
              }),
            ]),
            pagination: expect.objectContaining({
              total: 2,
              page: 1,
              limit: 10,
            }),
          }),
        })
      );
    });

    it('should filter comments by status', async () => {
      await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: 'Open comment',
        status: 'open',
      });

      await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: 'Resolved comment',
        status: 'resolved',
      });

      mockReq.params = { workflowId: testWorkflowId };
      mockReq.query = { status: 'open' };
