import { beforeEach, describe, expect, it } from 'vitest';
import { CollaborationSession } from '../../models/CollaborationSession.js';
import { Comment } from '../../models/Comment.js';
import { Operation } from '../../models/Operation.js';
import { testUtils } from '../setup.js';

describe('Collaboration Performance Tests', () => {
  let testUser: any;
  let testWorkflowId: string;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      email: 'performance@test.com',
    });
    testWorkflowId = '507f1f77bcf86cd799439011';
  });

  describe('Comment Performance', () => {
    it('should handle bulk comment creation efficiently', async () => {
      const startTime = Date.now();
      const commentCount = 1000;

      // Create comments in batches for better performance
      const batchSize = 100;
      const batches = Math.ceil(commentCount / batchSize);

      for (let i = 0; i < batches; i++) {
        const batchComments = [];
        const start = i * batchSize;
        const end = Math.min(start + batchSize, commentCount);

        for (let j = start; j < end; j++) {
          batchComments.push({
            workflowId: testWorkflowId,
            authorId: testUser._id,
            content: `Performance test comment ${j}`,
            status: 'open',
            position: { x: j % 100, y: Math.floor(j / 100) * 50 },
            tags: ['performance', 'test', `batch-${i}`],
          });
        }

        await Comment.insertMany(batchComments);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should create 1000 comments in under 5 seconds
      expect(duration).toBeLessThan(5000);

      // Verify all comments were created
      const createdComments = await Comment.countDocuments({
        workflowId: testWorkflowId,
      });
      expect(createdComments).toBe(commentCount);

      console.log(
        `Created ${commentCount} comments in ${duration}ms (${((commentCount / duration) * 1000).toFixed(2)} comments/sec)`
      );
    }, 10000);

    it('should handle comment queries with large datasets efficiently', async () => {
      // Create a large dataset first
      const commentCount = 5000;
      const comments = [];

      for (let i = 0; i < commentCount; i++) {
        comments.push({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: `Query test comment ${i}`,
          status: i % 3 === 0 ? 'resolved' : 'open',
          position: { x: i % 200, y: Math.floor(i / 200) * 30 },
          tags: [`tag-${i % 10}`, 'performance'],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        });
      }

      await Comment.insertMany(comments);

      // Test various query patterns
      const startTime = Date.now();

      // Test 1: Pagination query
      const page1 = await Comment.find({ workflowId: testWorkflowId })
        .sort({ createdAt: -1 })
        .limit(50)
        .skip(0);

      // Test 2: Status filter query
      const openComments = await Comment.find({
        workflowId: testWorkflowId,
        status: 'open',
      }).limit(100);

      // Test 3: Tag filter query
      const taggedComments = await Comment.find({
        workflowId: testWorkflowId,
        tags: 'tag-5',
