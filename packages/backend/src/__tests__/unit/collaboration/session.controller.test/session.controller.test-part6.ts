// Verify session was ended in database
const updatedSession = await CollaborationSession.findOne({
  sessionId: 'test-session-123',
});
expect(updatedSession?.isActive).toBe(false);
expect(updatedSession?.endedAt).toBeTruthy();
})
})

describe('getCollaborationAnalytics', () =>
{
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
