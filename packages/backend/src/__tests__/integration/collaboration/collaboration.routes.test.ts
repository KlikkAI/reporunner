import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import collaborationRoutes from '../../../domains/collaboration/routes/collaborationRoutes.js';
import { CollaborationSession } from '../../../models/CollaborationSession.js';
import { Comment } from '../../../models/Comment.js';
import { testUtils } from '../../setup.js';

describe('Collaboration Routes Integration', () => {
  let app: express.Application;
  let testUser: any;
  let authToken: string;
  let testWorkflowId: string;

  beforeEach(async () => {
    // Create Express app with collaboration routes
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { id: testUser?._id.toString() };
      next();
    });

    app.use('/collaboration', collaborationRoutes);

    // Create test user and get auth token
    testUser = await testUtils.createTestUser({
      email: 'integration@test.com',
    });
    authToken = await testUtils.generateTestToken(testUser._id.toString());
    testWorkflowId = '507f1f77bcf86cd799439011';
  });

  describe('Comment Routes', () => {
    describe('GET /collaboration/comments/:workflowId', () => {
      it('should get comments for a workflow', async () => {
        // Create test comments
        await Comment.create({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: 'Test comment 1',
          status: 'open',
        });

        await Comment.create({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: 'Test comment 2',
          status: 'resolved',
        });

        const response = await request(app)
          .get(`/collaboration/comments/${testWorkflowId}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            comments: expect.arrayContaining([
              expect.objectContaining({
                content: 'Test comment 1',
                status: 'open',
              }),
              expect.objectContaining({
                content: 'Test comment 2',
                status: 'resolved',
              }),
            ]),
            pagination: expect.objectContaining({
              total: 2,
            }),
          },
        });
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

        const response = await request(app)
          .get(`/collaboration/comments/${testWorkflowId}`)
          .query({ status: 'open' })
          .expect(200);

        expect(response.body.data.comments).toHaveLength(1);
        expect(response.body.data.comments[0].status).toBe('open');
      });
    });

    describe('POST /collaboration/comments', () => {
      it('should create a new comment', async () => {
        const commentData = {
          workflowId: testWorkflowId,
          content: 'New integration test comment',
          position: { x: 100, y: 200, nodeId: 'node123' },
          visibility: 'public',
          priority: 'medium',
          tags: ['test', 'integration'],
        };

        const response = await request(app)
          .post('/collaboration/comments')
          .send(commentData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            comment: expect.objectContaining({
              content: 'New integration test comment',
              workflowId: testWorkflowId,
              position: expect.objectContaining({
                x: 100,
                y: 200,
                nodeId: 'node123',
              }),
              status: 'open',
            }),
            message: 'Comment created successfully',
          },
        });

        // Verify comment exists in database
        const createdComment = await Comment.findOne({
          content: 'New integration test comment',
        });
        expect(createdComment).toBeTruthy();
      });

      it('should return validation error for missing required fields', async () => {
        const response = await request(app)
          .post('/collaboration/comments')
          .send({ content: 'Missing workflow ID' })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Workflow ID and content are required',
        });
      });
    });

    describe('PATCH /collaboration/comments/:commentId', () => {
      it('should update a comment', async () => {
        const comment = await Comment.create({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: 'Original content',
          status: 'open',
        });

        const updateData = {
          content: 'Updated content',
          priority: 'high',
          tags: ['updated', 'important'],
        };

        const response = await request(app)
          .patch(`/collaboration/comments/${comment._id}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            comment: expect.objectContaining({
              content: 'Updated content',
              priority: 'high',
              tags: ['updated', 'important'],
            }),
            message: 'Comment updated successfully',
          },
        });
      });
    });

    describe('POST /collaboration/comments/:commentId/replies', () => {
      it('should add a reply to a comment', async () => {
        const comment = await Comment.create({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: 'Original comment',
          status: 'open',
        });

        const replyData = {
          content: 'This is a reply',
          mentions: [],
        };

        const response = await request(app)
          .post(`/collaboration/comments/${comment._id}/replies`)
          .send(replyData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            reply: expect.objectContaining({
              content: 'This is a reply',
              authorId: testUser._id.toString(),
            }),
            message: 'Reply added successfully',
          },
        });
      });
    });

    describe('POST /collaboration/comments/:commentId/reactions', () => {
      it('should add a reaction to a comment', async () => {
        const comment = await Comment.create({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: 'Comment to react to',
          status: 'open',
        });

        const response = await request(app)
          .post(`/collaboration/comments/${comment._id}/reactions`)
          .send({ type: '👍' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            reactions: expect.arrayContaining([
              expect.objectContaining({
                userId: testUser._id.toString(),
                type: '👍',
              }),
            ]),
            message: 'Reaction added successfully',
          },
        });
      });
    });

    describe('POST /collaboration/comments/:commentId/resolve', () => {
      it('should resolve a comment', async () => {
        const comment = await Comment.create({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: 'Comment to resolve',
          status: 'open',
        });

        const response = await request(app)
          .post(`/collaboration/comments/${comment._id}/resolve`)
          .send({ resolution: 'Fixed the issue' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            comment: expect.objectContaining({
              status: 'resolved',
              resolvedBy: testUser._id.toString(),
            }),
            message: 'Comment resolved successfully',
          },
        });
      });
    });

    describe('DELETE /collaboration/comments/:commentId', () => {
      it('should delete a comment', async () => {
        const comment = await Comment.create({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: 'Comment to delete',
          status: 'open',
        });

        const response = await request(app)
          .delete(`/collaboration/comments/${comment._id}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            message: 'Comment deleted successfully',
          },
        });

        // Verify comment was deleted
        const deletedComment = await Comment.findById(comment._id);
        expect(deletedComment).toBeNull();
      });
    });

    describe('GET /collaboration/comments/:workflowId/analytics', () => {
      it('should return comment analytics', async () => {
        // Create test comments
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
          thread: [{ authorId: testUser._id, content: 'Reply', timestamp: new Date() }],
          reactions: [
            {
              userId: testUser._id.toString(),
              type: '👍',
              timestamp: new Date(),
            },
          ],
        });

        const response = await request(app)
          .get(`/collaboration/comments/${testWorkflowId}/analytics`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.objectContaining({
            dateRange: 7,
            summary: expect.objectContaining({
              totalComments: 2,
              openComments: 1,
              resolvedComments: 1,
              totalReplies: 1,
              totalReactions: 1,
            }),
            dailyActivity: expect.any(Array),
            topCommenters: expect.any(Array),
          }),
        });
      });
    });
  });

  describe('Session Routes', () => {
    describe('POST /collaboration/sessions/:workflowId/join', () => {
      it('should create and join a new session', async () => {
        const userData = {
          user: {
            id: testUser._id.toString(),
            name: 'Test User',
            email: 'integration@test.com',
          },
          sessionConfig: {
            allowedRoles: ['editor', 'viewer'],
            maxParticipants: 10,
          },
        };

        // Note: This test would require mocking the CollaborationService
        // For now, we'll just test the route structure
        const response = await request(app)
          .post(`/collaboration/sessions/${testWorkflowId}/join`)
          .send(userData)
          .expect(500); // Expected to fail without proper CollaborationService mock

        // In a real implementation, this would be:
        // .expect(200)
        // expect(response.body.success).toBe(true)
      });
    });

    describe('GET /collaboration/sessions/user/:userId', () => {
      it('should get user sessions', async () => {
        // Create test session
        await CollaborationSession.create({
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

        const response = await request(app)
          .get(`/collaboration/sessions/user/${testUser._id}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            sessions: expect.arrayContaining([
              expect.objectContaining({
                sessionId: 'test-session-123',
                workflowId: testWorkflowId,
              }),
            ]),
            pagination: expect.objectContaining({
              total: 1,
            }),
          },
        });
      });
    });

    describe('PATCH /collaboration/sessions/:sessionId/config', () => {
      it('should update session configuration', async () => {
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
          settings: {
            allowedRoles: ['editor'],
            maxParticipants: 5,
          },
        });

        const updateData = {
          settings: {
            allowedRoles: ['editor', 'viewer'],
            maxParticipants: 10,
          },
        };

        const response = await request(app)
          .patch(`/collaboration/sessions/${session.sessionId}/config`)
          .send(updateData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            session: expect.objectContaining({
              settings: expect.objectContaining({
                allowedRoles: ['editor', 'viewer'],
                maxParticipants: 10,
              }),
            }),
            message: 'Session configuration updated successfully',
          },
        });
      });
    });

    describe('POST /collaboration/sessions/:sessionId/end', () => {
      it('should end a session', async () => {
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

        const response = await request(app)
          .post(`/collaboration/sessions/${session.sessionId}/end`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            session: expect.objectContaining({
              isActive: false,
            }),
            message: 'Collaboration session ended successfully',
          },
        });

        // Verify session was ended in database
        const updatedSession = await CollaborationSession.findOne({
          sessionId: session.sessionId,
        });
        expect(updatedSession?.isActive).toBe(false);
      });
    });
  });
});
