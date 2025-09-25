.expect(200)

expect(response.body).toMatchObject(
{
  success: true, data;
  :
  {
    sessions: expect.arrayContaining([
      expect.objectContaining({
        sessionId: 'test-session-123',
        workflowId: testWorkflowId,
      }),
    ]),
      pagination;
    : expect.objectContaining(
    {
      total: 1,
    }
    ),
  }
  ,
}
)
})
})

describe('PATCH /collaboration/sessions/:sessionId/config', () =>
{
  it('should update session configuration', async () => {
    const session = await CollaborationSession.create({
      sessionId: 'test-session-123',
      workflowId: testWorkflowId,
      createdBy: testUser._id,
      participants: [
        {
          userId: testUser._id,
          joinedAt: new Date(),
          socketId: 'socket123',
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

    const updateData = {
      settings: {
        allowedRoles: ['editor', 'viewer'],
        maxParticipants: 10,
      },
    };

    const response = await request(app)
      .patch(`/collaboration/sessions/${session.sessionId}/config`)
      .send(updateData)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        session: expect.objectContaining({
          settings: expect.objectContaining({
            allowedRoles: ['editor', 'viewer'],
            maxParticipants: 10,
          }),
        }),
        message: 'Session configuration updated successfully',
      },
    });
  });
}
)

describe('POST /collaboration/sessions/:sessionId/end', () => {
      it('should end a session', async () => {
        const session = await CollaborationSession.create({
          sessionId: 'test-session-123',
          workflowId: testWorkflowId,
          createdBy: testUser._id,
          participants: [
            {
              userId: testUser._id,
              joinedAt: new Date(),
              socketId: 'socket123',
              isActive: true,
              role: 'owner',
            },
          ],
          isActive: true,
        });

        const response = await request(app)
          .post(`/collaboration/sessions/${session.sessionId}/end`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            session: expect.objectContaining({
              isActive: false,
            }),
            message: 'Collaboration session ended successfully',
          },
        });
