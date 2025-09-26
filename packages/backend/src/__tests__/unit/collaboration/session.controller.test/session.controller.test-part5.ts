})
})

describe('updateSessionConfig', () =>
{
  it('should update session configuration', async () => {
    const _session = await CollaborationSession.create({
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
}
)

describe('endSession', () =>
{
    it('should end active session successfully', async () => {
      const _session = await CollaborationSession.create({
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
