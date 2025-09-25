import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionController } from '../../../domains/collaboration/controllers/SessionController.js';
import { CollaborationSession } from '../../../models/CollaborationSession.js';
import { Operation } from '../../../models/Operation.js';
import { testUtils } from '../../setup.js';

describe('SessionController', () => {
  let sessionController: SessionController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let testUser: any;
  let testWorkflowId: string;

  beforeEach(async () => {
    sessionController = new SessionController();
    testWorkflowId = '507f1f77bcf86cd799439011';

    // Create test user
    testUser = await testUtils.createTestUser({
      email: 'collaborator@test.com',
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

  describe('getSession', () => {
    it('should return active session for workflow', async () => {
      const _session = await CollaborationSession.create({
        sessionId: 'test-session-123',
        workflowId: testWorkflowId,
        createdBy: testUser._id,
        participants: [
          {
            userId: testUser._id,
            joinedAt: new Date(),
            socketId: 'socket123',
            isActive: true,
            role: 'owner',
          },
        ],
        isActive: true,
      });

      mockReq.params = { workflowId: testWorkflowId };

      await sessionController.getSession(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            session: expect.objectContaining({
              sessionId: 'test-session-123',
              workflowId: testWorkflowId,
              isActive: true,
            }),
          }),
        })
      );
    });

    it('should return 404 when no active session exists', async () => {
      mockReq.params = { workflowId: testWorkflowId };

      await sessionController.getSession(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'No active collaboration session found',
        })
      );
    });

    it('should return error when workflowId is missing', async () => {
      mockReq.params = {};

      await sessionController.getSession(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Workflow ID is required',
        })
      );
    });
