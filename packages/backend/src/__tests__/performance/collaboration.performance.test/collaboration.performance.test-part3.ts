},
        },
{
  $sort: {
    _id: 1;
  }
}
,
      ])

// Top commenters aggregation
const topCommenters = await Comment.aggregate([
  {
    $match: {
      workflowId: testWorkflowId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  },
  {
    $group: {
      _id: '$authorId',
      commentCount: { $sum: 1 },
    },
  },
  { $sort: { commentCount: -1 } },
  { $limit: 5 },
]);

const endTime = Date.now();
const aggregationDuration = endTime - startTime;

// Aggregations should complete within 3 seconds
expect(aggregationDuration).toBeLessThan(3000);

// Verify aggregation results
expect(analytics[0]).toMatchObject({
  totalComments: expect.any(Number),
  openComments: expect.any(Number),
  resolvedComments: expect.any(Number),
  totalReplies: expect.any(Number),
  totalReactions: expect.any(Number),
  averageRepliesPerComment: expect.any(Number),
});

expect(dailyActivity).toBeInstanceOf(Array);
expect(topCommenters).toBeInstanceOf(Array);

console.log(
  `Executed complex aggregations on ${commentCount} comments in ${aggregationDuration}ms`
);
}, 20000)
})

describe('Session Performance', () =>
{
    it('should handle multiple concurrent sessions efficiently', async () => {
      const sessionCount = 100;
      const startTime = Date.now();

      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < sessionCount; i++) {
        sessions.push({
          sessionId: `perf-session-${i}`,
          workflowId: `workflow-${i % 10}`, // 10 different workflows
          createdBy: testUser._id,
          participants: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
            userId: `user-${j}`,
            joinedAt: new Date(),
            socketId: `socket-${i}-${j}`,
            isActive: Math.random() > 0.3,
            role: ['owner', 'editor', 'viewer'][j % 3],
          })),
          isActive: Math.random() > 0.2,
          settings: {
            allowedRoles: ['editor', 'viewer'],
            maxParticipants: 10,
            autoSave: true,
          },
        });
      }

      await CollaborationSession.insertMany(sessions);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should create sessions quickly
      expect(duration).toBeLessThan(3000);

      // Test session queries
      const queryStart = Date.now();

      // Active sessions query
      const _activeSessions = await CollaborationSession.find({
        isActive: true,
      });

      // User sessions query
      const _userSessions = await CollaborationSession.find({
        'participants.userId': 'user-1',
      });

      // Workflow sessions query
      const _workflowSessions = await CollaborationSession.find({
        workflowId: 'workflow-1',
