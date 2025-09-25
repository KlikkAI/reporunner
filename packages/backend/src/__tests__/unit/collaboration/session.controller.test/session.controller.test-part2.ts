})

describe('joinSession', () =>
{
    it('should create new session when none exists', async () => {
      mockReq.params = { workflowId: testWorkflowId };
      mockReq.body = {
        user: {
          id: testUser._id.toString(),
          name: 'Test User',
          email: 'collaborator@test.com',
        },
        sessionConfig: {
          allowedRoles: ['editor', 'viewer'],
          maxParticipants: 10,
        },
      };

      // Mock CollaborationService joinSession method
      const mockJoinSession = vi.fn().mockResolvedValue({
        session: {
          sessionId: 'new-session-123',
          workflowId: testWorkflowId,
          isActive: true,
          toObject: () => ({
            sessionId: 'new-session-123',
            workflowId: testWorkflowId,
            isActive: true,
          }),
        },
        isNewSession: true,
        participantCount: 1,
      });

      sessionController.collaborationService.joinSession = mockJoinSession;

      await sessionController.joinSession(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            session: expect.objectContaining({
              sessionId: 'new-session-123',
              workflowId: testWorkflowId,
            }),
            isNewSession: true,
            participantCount: 1,
            message: 'New collaboration session created',
          }),
        })
      );
    });

    it('should join existing session', async () => {
      mockReq.params = { workflowId: testWorkflowId };
      mockReq.body = {
        user: {
          id: testUser._id.toString(),
          name: 'Test User',
          email: 'collaborator@test.com',
        },
      };

      // Mock CollaborationService joinSession method
      const mockJoinSession = vi.fn().mockResolvedValue({
        session: {
          sessionId: 'existing-session-123',
          workflowId: testWorkflowId,
          isActive: true,
          toObject: () => ({
            sessionId: 'existing-session-123',
            workflowId: testWorkflowId,
            isActive: true,
          }),
        },
        isNewSession: false,
        participantCount: 2,
      });

      sessionController.collaborationService.joinSession = mockJoinSession;

      await sessionController.joinSession(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            isNewSession: false,
            participantCount: 2,
            message: 'Joined existing collaboration session',
          }),
        })
      );
    });

    it('should return error when required data is missing', async () => {
      mockReq.params = { workflowId: testWorkflowId };
      mockReq.body = {}; // Missing user data

      await sessionController.joinSession(mockReq as Request, mockRes as Response);
