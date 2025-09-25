import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import collaborationRoutes from '../../../domains/collaboration/routes/collaborationRoutes.js';
import { CollaborationSession } from '../../../models/CollaborationSession.js';
import { Comment } from '../../../models/Comment.js';
import { testUtils } from '../../setup.js';

describe('Collaboration Routes Integration', () => {
  let app: express.Application;
  let testUser: any;
  let _authToken: string;
  let testWorkflowId: string;

  beforeEach(async () => {
    // Create Express app with collaboration routes
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, _res, next) => {
      req.user = { id: testUser?._id.toString() };
      next();
    });

    app.use('/collaboration', collaborationRoutes);

    // Create test user and get auth token
    testUser = await testUtils.createTestUser({
      email: 'integration@test.com',
    });
    _authToken = await testUtils.generateTestToken(testUser._id.toString());
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
