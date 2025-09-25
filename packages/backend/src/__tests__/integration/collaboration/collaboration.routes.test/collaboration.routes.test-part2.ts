})

describe('POST /collaboration/comments', () =>
{
  it('should create a new comment', async () => {
    const commentData = {
      workflowId: testWorkflowId,
      content: 'New integration test comment',
      position: { x: 100, y: 200, nodeId: 'node123' },
      visibility: 'public',
      priority: 'medium',
      tags: ['test', 'integration'],
    };

    const response = await request(app)
      .post('/collaboration/comments')
      .send(commentData)
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        comment: expect.objectContaining({
          content: 'New integration test comment',
          workflowId: testWorkflowId,
          position: expect.objectContaining({
            x: 100,
            y: 200,
            nodeId: 'node123',
          }),
          status: 'open',
        }),
        message: 'Comment created successfully',
      },
    });

    // Verify comment exists in database
    const createdComment = await Comment.findOne({
      content: 'New integration test comment',
    });
    expect(createdComment).toBeTruthy();
  });

  it('should return validation error for missing required fields', async () => {
    const response = await request(app)
      .post('/collaboration/comments')
      .send({ content: 'Missing workflow ID' })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Workflow ID and content are required',
    });
  });
}
)

describe('PATCH /collaboration/comments/:commentId', () => {
  it('should update a comment', async () => {
    const comment = await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Original content',
      status: 'open',
    });

    const updateData = {
      content: 'Updated content',
      priority: 'high',
      tags: ['updated', 'important'],
    };

    const response = await request(app)
      .patch(`/collaboration/comments/${comment._id}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        comment: expect.objectContaining({
          content: 'Updated content',
          priority: 'high',
          tags: ['updated', 'important'],
        }),
        message: 'Comment updated successfully',
      },
    });
  });
});

describe('POST /collaboration/comments/:commentId/replies', () => {
      it('should add a reply to a comment', async () => {
        const comment = await Comment.create({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: 'Original comment',
          status: 'open',
        });

        const replyData = {
          content: 'This is a reply',
