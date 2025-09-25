expect(mockRes.status).toHaveBeenCalledWith(400);
expect(mockRes.json).toHaveBeenCalledWith(
  expect.objectContaining({
    success: false,
    message: 'Workflow ID and user information are required',
  })
);
})
})

describe('getUserSessions', () =>
{
    it('should return sessions for a user', async () => {
      // Create test sessions
      const _session1 = await CollaborationSession.create({
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

      const _session2 = await CollaborationSession.create({
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
