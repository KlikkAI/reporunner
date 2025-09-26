mentions: [],
}

const response = await request(app)
  .post(`/collaboration/comments/${comment._id}/replies`)
  .send(replyData)
  .expect(201);

expect(response.body).toMatchObject({
  success: true,
  data: {
    reply: expect.objectContaining({
      content: 'This is a reply',
      authorId: testUser._id.toString(),
    }),
    message: 'Reply added successfully',
  },
});
})
})

describe('POST /collaboration/comments/:commentId/reactions', () =>
{
  it('should add a reaction to a comment', async () => {
    const comment = await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Comment to react to',
      status: 'open',
    });

    const response = await request(app)
      .post(`/collaboration/comments/${comment._id}/reactions`)
      .send({ type: '👍' })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        reactions: expect.arrayContaining([
          expect.objectContaining({
            userId: testUser._id.toString(),
            type: '👍',
          }),
        ]),
        message: 'Reaction added successfully',
      },
    });
  });
}
)

describe('POST /collaboration/comments/:commentId/resolve', () =>
{
  it('should resolve a comment', async () => {
    const comment = await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Comment to resolve',
      status: 'open',
    });

    const response = await request(app)
      .post(`/collaboration/comments/${comment._id}/resolve`)
      .send({ resolution: 'Fixed the issue' })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        comment: expect.objectContaining({
          status: 'resolved',
          resolvedBy: testUser._id.toString(),
        }),
        message: 'Comment resolved successfully',
      },
    });
  });
}
)

describe('DELETE /collaboration/comments/:commentId', () =>
{
      it('should delete a comment', async () => {
        const comment = await Comment.create({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: 'Comment to delete',
          status: 'open',
        });

        const response = await request(app)
          .delete(`/collaboration/comments/${comment._id}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            message: 'Comment deleted successfully',
          },
        });

        // Verify comment was deleted
        const deletedComment = await Comment.findById(comment._id);
        expect(deletedComment).toBeNull();
