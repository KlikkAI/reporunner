}).limit(100)

// Test 4: Position-based query (spatial)
const spatialComments = await Comment.find({
  workflowId: testWorkflowId,
  'position.x': { $gte: 50, $lte: 150 },
  'position.y': { $gte: 100, $lte: 200 },
}).limit(100);

const endTime = Date.now();
const queryDuration = endTime - startTime;

// All queries should complete within 2 seconds
expect(queryDuration).toBeLessThan(2000);

// Verify query results
expect(page1).toHaveLength(50);
expect(openComments.length).toBeGreaterThan(0);
expect(taggedComments.length).toBeGreaterThan(0);
expect(spatialComments.length).toBeGreaterThan(0);

console.log(`Executed complex queries on ${commentCount} comments in ${queryDuration}ms`);
}, 15000)

it('should handle comment aggregation efficiently', async () =>
{
      // Create diverse test data
      const commentCount = 2000;
      const users = [];

      // Create multiple users
      for (let i = 0; i < 10; i++) {
        const user = await testUtils.createTestUser({
          email: `perf-user-${i}@test.com`,
        });
        users.push(user);
      }

      const comments = [];
      for (let i = 0; i < commentCount; i++) {
        const user = users[i % users.length];
        comments.push({
          workflowId: testWorkflowId,
          authorId: user._id,
          content: `Aggregation test comment ${i}`,
          status: ['open', 'resolved', 'closed'][i % 3],
          reactions: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => ({
            userId: users[j % users.length]._id.toString(),
            type: ['👍', '👎', '❤️', '😂'][j % 4],
            timestamp: new Date(),
          })),
          thread: Array.from({ length: Math.floor(Math.random() * 3) }, (_, j) => ({
            authorId: users[j % users.length]._id,
            content: `Reply ${j}`,
            timestamp: new Date(),
          })),
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
      }

      await Comment.insertMany(comments);

      const startTime = Date.now();

      // Complex aggregation pipeline
      const analytics = await Comment.aggregate([
        {
          $match: {
            workflowId: testWorkflowId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: null,
            totalComments: { $sum: 1 },
            openComments: {
              $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] },
            },
            resolvedComments: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
            },
            totalReplies: { $sum: { $size: '$thread' } },
            totalReactions: { $sum: { $size: '$reactions' } },
            averageRepliesPerComment: { $avg: { $size: '$thread' } },
          },
        },
      ]);

      // Daily activity aggregation
      const dailyActivity = await Comment.aggregate([
        {
          $match: {
            workflowId: testWorkflowId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
