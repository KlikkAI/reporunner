import { beforeEach, describe, expect, it } from 'vitest';
import { Comment } from '../../models/Comment.js';
import { testUtils } from '../setup.js';

describe('Testing Infrastructure', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      email: 'infrastructure@test.com',
    });
  });

  describe('Database Operations', () => {
    it('should create and retrieve comments', async () => {
      const testWorkflowId = '507f1f77bcf86cd799439011';

      // Create a comment
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: 'Infrastructure test comment',
        status: 'open',
      });

      expect(comment).toBeTruthy();
      expect(comment.content).toBe('Infrastructure test comment');
      expect(comment.workflowId).toBe(testWorkflowId);
      expect(comment.status).toBe('open');

      // Retrieve the comment
      const retrievedComment = await Comment.findById(comment._id);
      expect(retrievedComment).toBeTruthy();
      expect(retrievedComment?.content).toBe('Infrastructure test comment');
    });

    it('should handle comment queries with pagination', async () => {
      const testWorkflowId = '507f1f77bcf86cd799439011';

      // Create multiple comments
      const comments = [];
      for (let i = 0; i < 15; i++) {
        comments.push({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: `Test comment ${i}`,
          status: i % 2 === 0 ? 'open' : 'resolved',
        });
      }

      await Comment.insertMany(comments);

      // Test pagination
      const page1 = await Comment.find({ workflowId: testWorkflowId })
        .sort({ createdAt: -1 })
        .limit(10)
        .skip(0);

      const page2 = await Comment.find({ workflowId: testWorkflowId })
        .sort({ createdAt: -1 })
        .limit(10)
        .skip(10);

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(5);

      // Test status filtering
      const openComments = await Comment.find({
        workflowId: testWorkflowId,
        status: 'open',
      });

      expect(openComments).toHaveLength(8); // 0, 2, 4, 6, 8, 10, 12, 14 = 8 comments
    });

    it('should handle comment updates and edit history', async () => {
      const testWorkflowId = '507f1f77bcf86cd799439011';

      // Create a comment
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: 'Original content',
        status: 'open',
      });

      // Update the comment content (simulating edit)
      comment.editHistory.push({
        timestamp: new Date(),
        previousContent: comment.content,
        editedBy: testUser._id.toString(),
      });
      comment.content = 'Updated content';

      await comment.save();

      // Verify update
      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment?.content).toBe('Updated content');
      expect(updatedComment?.editHistory).toHaveLength(1);
