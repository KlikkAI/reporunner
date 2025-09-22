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
      const session = await CollaborationSession.create({
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
  });

  describe('joinSession', () => {
    it('should create new session when none exists', async () => {
      mockReq.params = { workflowId: testWorkflowId };
      mockReq.body = {
        user: {
          id: testUser._id.toString(),
          name: 'Test User',
          email: 'collaborator@test.com',
        },
        sessionConfig: {
          allowedRoles: ['editor', 'viewer'],
          maxParticipants: 10,
        },
      };

      // Mock CollaborationService joinSession method
      const mockJoinSession = vi.fn().mockResolvedValue({
        session: {
          sessionId: 'new-session-123',
          workflowId: testWorkflowId,
          isActive: true,
          toObject: () => ({
            sessionId: 'new-session-123',
            workflowId: testWorkflowId,
            isActive: true,
          }),
        },
        isNewSession: true,
        participantCount: 1,
      });

      sessionController['collaborationService'].joinSession = mockJoinSession;

      await sessionController.joinSession(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            session: expect.objectContaining({
              sessionId: 'new-session-123',
              workflowId: testWorkflowId,
            }),
            isNewSession: true,
            participantCount: 1,
            message: 'New collaboration session created',
          }),
        })
      );
    });

    it('should join existing session', async () => {
      mockReq.params = { workflowId: testWorkflowId };
      mockReq.body = {
        user: {
          id: testUser._id.toString(),
          name: 'Test User',
          email: 'collaborator@test.com',
        },
      };

      // Mock CollaborationService joinSession method
      const mockJoinSession = vi.fn().mockResolvedValue({
        session: {
          sessionId: 'existing-session-123',
          workflowId: testWorkflowId,
          isActive: true,
          toObject: () => ({
            sessionId: 'existing-session-123',
            workflowId: testWorkflowId,
            isActive: true,
          }),
        },
        isNewSession: false,
        participantCount: 2,
      });

      sessionController['collaborationService'].joinSession = mockJoinSession;

      await sessionController.joinSession(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            isNewSession: false,
            participantCount: 2,
            message: 'Joined existing collaboration session',
          }),
        })
      );
    });

    it('should return error when required data is missing', async () => {
      mockReq.params = { workflowId: testWorkflowId };
      mockReq.body = {}; // Missing user data

      await sessionController.joinSession(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Workflow ID and user information are required',
        })
      );
    });
  });

  describe('getUserSessions', () => {
    it('should return sessions for a user', async () => {
      // Create test sessions
      const session1 = await CollaborationSession.create({
        sessionId: 'session-1',
        workflowId: testWorkflowId,
        createdBy: testUser._id,
        participants: [
          {
            userId: testUser._id,
            joinedAt: new Date(),
            socketId: 'socket1',
            isActive: true,
            role: 'owner',
          },
        ],
        isActive: true,
      });

      const session2 = await CollaborationSession.create({
        sessionId: 'session-2',
        workflowId: '507f1f77bcf86cd799439012',
        createdBy: testUser._id,
        participants: [
          {
            userId: testUser._id,
            joinedAt: new Date(),
            socketId: 'socket2',
            isActive: false,
            role: 'owner',
          },
        ],
        isActive: false,
      });

      mockReq.params = { userId: testUser._id.toString() };
      mockReq.query = { limit: '10', page: '1' };

      await sessionController.getUserSessions(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            sessions: expect.arrayContaining([
              expect.objectContaining({
                sessionId: 'session-1',
              }),
              expect.objectContaining({
                sessionId: 'session-2',
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

    it('should filter sessions by active status', async () => {
      await CollaborationSession.create({
        sessionId: 'active-session',
        workflowId: testWorkflowId,
        createdBy: testUser._id,
        participants: [
          {
            userId: testUser._id,
            joinedAt: new Date(),
            socketId: 'socket1',
            isActive: true,
            role: 'owner',
          },
        ],
        isActive: true,
      });

      await CollaborationSession.create({
        sessionId: 'inactive-session',
        workflowId: testWorkflowId,
        createdBy: testUser._id,
        participants: [
          {
            userId: testUser._id,
            joinedAt: new Date(),
            socketId: 'socket2',
            isActive: false,
            role: 'owner',
          },
        ],
        isActive: false,
      });

      mockReq.params = { userId: testUser._id.toString() };
      mockReq.query = { active: 'true' };

      await sessionController.getUserSessions(mockReq as Request, mockRes as Response);

      const call = (mockRes.json as any).mock.calls[0][0];
      expect(call.data.sessions).toHaveLength(1);
      expect(call.data.sessions[0].sessionId).toBe('active-session');
    });
  });

  describe('getSessionOperations', () => {
    it('should return operations for a session', async () => {
      const sessionId = 'test-session-123';

      // Create test operations
      await Operation.create({
        sessionId,
        workflowId: testWorkflowId,
        authorId: testUser._id,
        type: 'node_add',
        target: { type: 'node', id: 'node1' },
        data: { name: 'Test Node' },
        status: 'applied',
      });

      await Operation.create({
        sessionId,
        workflowId: testWorkflowId,
        authorId: testUser._id,
        type: 'edge_add',
        target: { type: 'edge', id: 'edge1' },
        data: { source: 'node1', target: 'node2' },
        status: 'applied',
      });

      mockReq.params = { sessionId };
      mockReq.query = { limit: '50', page: '1' };

      await sessionController.getSessionOperations(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            operations: expect.arrayContaining([
              expect.objectContaining({
                type: 'node_add',
                status: 'applied',
              }),
              expect.objectContaining({
                type: 'edge_add',
                status: 'applied',
              }),
            ]),
            pagination: expect.objectContaining({
              total: 2,
            }),
          }),
        })
      );
    });

    it('should filter operations by status', async () => {
      const sessionId = 'test-session-123';

      await Operation.create({
        sessionId,
        workflowId: testWorkflowId,
        authorId: testUser._id,
        type: 'node_add',
        target: { type: 'node', id: 'node1' },
        data: { name: 'Applied Node' },
        status: 'applied',
      });

      await Operation.create({
        sessionId,
        workflowId: testWorkflowId,
        authorId: testUser._id,
        type: 'node_add',
        target: { type: 'node', id: 'node2' },
        data: { name: 'Pending Node' },
        status: 'pending',
      });

      mockReq.params = { sessionId };
      mockReq.query = { status: 'applied' };

      await sessionController.getSessionOperations(mockReq as Request, mockRes as Response);

      const call = (mockRes.json as any).mock.calls[0][0];
      expect(call.data.operations).toHaveLength(1);
      expect(call.data.operations[0].status).toBe('applied');
    });
  });

  describe('updateSessionConfig', () => {
    it('should update session configuration', async () => {
      const session = await CollaborationSession.create({
        sessionId: 'test-session-123',
        workflowId: testWorkflowId,
        createdBy: testUser._id,
        participants: [
          {
            userId: testUser._id,
            joinedAt: new Date(),
            socketId: 'socket1',
            isActive: true,
            role: 'owner',
          },
        ],
        isActive: true,
        settings: {
          allowedRoles: ['editor'],
          maxParticipants: 5,
        },
      });

      mockReq.params = { sessionId: 'test-session-123' };
      mockReq.body = {
        settings: {
          allowedRoles: ['editor', 'viewer'],
          maxParticipants: 10,
        },
      };

      await sessionController.updateSessionConfig(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            session: expect.objectContaining({
              settings: expect.objectContaining({
                allowedRoles: ['editor', 'viewer'],
                maxParticipants: 10,
              }),
            }),
            message: 'Session configuration updated successfully',
          }),
        })
      );
    });

    it('should return error when session not found', async () => {
      mockReq.params = { sessionId: 'non-existent-session' };
      mockReq.body = { settings: {} };

      await sessionController.updateSessionConfig(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Session not found',
        })
      );
    });
  });

  describe('endSession', () => {
    it('should end active session successfully', async () => {
      const session = await CollaborationSession.create({
        sessionId: 'test-session-123',
        workflowId: testWorkflowId,
        createdBy: testUser._id,
        participants: [
          {
            userId: testUser._id,
            joinedAt: new Date(),
            socketId: 'socket1',
            isActive: true,
            role: 'owner',
          },
        ],
        isActive: true,
      });

      mockReq.params = { sessionId: 'test-session-123' };

      await sessionController.endSession(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            session: expect.objectContaining({
              isActive: false,
            }),
            message: 'Collaboration session ended successfully',
          }),
        })
      );

      // Verify session was ended in database
      const updatedSession = await CollaborationSession.findOne({
        sessionId: 'test-session-123',
      });
      expect(updatedSession?.isActive).toBe(false);
      expect(updatedSession?.endedAt).toBeTruthy();
    });
  });

  describe('getCollaborationAnalytics', () => {
    it('should return collaboration analytics', async () => {
      const currentDate = new Date();
      const weekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Create test sessions
      await CollaborationSession.create({
        sessionId: 'session-1',
        workflowId: testWorkflowId,
        createdBy: testUser._id,
        participants: [
          {
            userId: testUser._id,
            joinedAt: new Date(),
            socketId: 'socket1',
            isActive: true,
            role: 'owner',
          },
          {
            userId: 'user2',
            joinedAt: new Date(),
            socketId: 'socket2',
            isActive: true,
            role: 'editor',
          },
        ],
        isActive: true,
        createdAt: currentDate,
      });

      await CollaborationSession.create({
        sessionId: 'session-2',
        workflowId: testWorkflowId,
        createdBy: testUser._id,
        participants: [
          {
            userId: testUser._id,
            joinedAt: new Date(),
            socketId: 'socket3',
            isActive: false,
            role: 'owner',
          },
        ],
        isActive: false,
        createdAt: weekAgo,
      });

      // Create test operations
      await Operation.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        type: 'node_add',
        target: { type: 'node', id: 'node1' },
        data: { name: 'Test Node' },
        status: 'applied',
        timestamp: currentDate,
      });

      await Operation.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        type: 'edge_add',
        target: { type: 'edge', id: 'edge1' },
        data: { source: 'node1', target: 'node2' },
        status: 'applied',
        timestamp: currentDate,
      });

      mockReq.params = { workflowId: testWorkflowId };
      mockReq.query = { dateRange: '7' };

      await sessionController.getCollaborationAnalytics(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            dateRange: 7,
            sessions: expect.objectContaining({
              totalSessions: 2,
              activeSessions: 1,
              averageParticipants: expect.any(Number),
              totalParticipants: expect.any(Number),
            }),
            operations: expect.objectContaining({
              node_add: 1,
              edge_add: 1,
            }),
          }),
        })
      );
    });

    it('should return error when workflowId is missing', async () => {
      mockReq.params = {};

      await sessionController.getCollaborationAnalytics(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Workflow ID is required',
        })
      );
    });
  });
});
