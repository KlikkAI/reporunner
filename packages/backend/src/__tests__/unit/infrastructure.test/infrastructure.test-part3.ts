expect(typeof token).toBe('string');
expect(token.split('.')).toHaveLength(3); // JWT has 3 parts separated by dots
})

it('should clean database between tests', async () =>
{
  const testWorkflowId = '507f1f77bcf86cd799439011';

  // Create some data
  await Comment.create({
    workflowId: testWorkflowId,
    authorId: testUser._id,
    content: 'Data to be cleaned',
    status: 'open',
  });

  // Verify data exists
  const beforeClean = await Comment.countDocuments({
    workflowId: testWorkflowId,
  });
  expect(beforeClean).toBe(1);

  // Clean database
  await testUtils.cleanDatabase();

  // Verify data is cleaned
  const afterClean = await Comment.countDocuments({
    workflowId: testWorkflowId,
  });
  expect(afterClean).toBe(0);

  // But test user should still exist (created in beforeEach after clean)
  const userExists = await testUtils.createTestUser({
    email: 'after-clean@test.com',
  });
  expect(userExists).toBeTruthy();
}
)
})

describe('Performance Validation', () =>
{
    it('should handle bulk operations efficiently', async () => {
      const testWorkflowId = '507f1f77bcf86cd799439011';
      const commentCount = 100;

      const startTime = Date.now();

      // Create comments in batch
      const comments = Array.from({ length: commentCount }, (_, i) => ({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: `Bulk comment ${i}`,
        status: i % 2 === 0 ? 'open' : 'resolved',
        tags: [`tag-${i % 5}`, 'bulk-test'],
      }));

      await Comment.insertMany(comments);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be fast (under 2 seconds for 100 comments)
      expect(duration).toBeLessThan(2000);

      // Verify all comments were created
      const createdCount = await Comment.countDocuments({
        workflowId: testWorkflowId,
      });
      expect(createdCount).toBe(commentCount);

      console.log(`Bulk created ${commentCount} comments in ${duration}ms`);
    });

    it('should handle complex queries efficiently', async () => {
      const testWorkflowId = '507f1f77bcf86cd799439011';

      // Create diverse test data
      const comments = Array.from({ length: 200 }, (_, i) => ({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: `Query test comment ${i}`,
        status: ['open', 'resolved', 'closed'][i % 3],
        position: { x: i % 100, y: Math.floor(i / 100) * 50 },
        tags: [`category-${i % 5}`, `priority-${i % 3}`, 'query-test'],
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
      }));

      await Comment.insertMany(comments);

      const queryStart = Date.now();

      // Execute multiple complex queries
      const [statusQuery, tagQuery, spatialQuery, recentQuery, aggregateQuery] = await Promise.all([
        Comment.find({ workflowId: testWorkflowId, status: 'open' }).limit(50),
        Comment.find({
          workflowId: testWorkflowId,
          tags: 'category-2',
        }).limit(50),
        Comment.find({
          workflowId: testWorkflowId,
          'position.x': { $gte: 20, $lte: 80 },
        }).limit(50),
