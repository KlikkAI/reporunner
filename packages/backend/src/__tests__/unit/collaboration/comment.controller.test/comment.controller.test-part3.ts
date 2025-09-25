expect(mockRes.status).toHaveBeenCalledWith(401);
expect(mockRes.json).toHaveBeenCalledWith(
  expect.objectContaining({
    success: false,
    message: 'Authentication required',
  })
);
})
})

describe('updateComment', () =>
{
  it('should update comment successfully', async () => {
    const comment = await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Original content',
      status: 'open',
    });

    mockReq.params = { commentId: comment._id.toString() };
    mockReq.body = {
      content: 'Updated content',
      priority: 'high',
      tags: ['important'],
    };

    await commentController.updateComment(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          comment: expect.objectContaining({
            content: 'Updated content',
            priority: 'high',
            tags: ['important'],
          }),
          message: 'Comment updated successfully',
        }),
      })
    );

    // Verify edit history was created
    const updatedComment = await Comment.findById(comment._id);
    expect(updatedComment?.editHistory).toHaveLength(1);
    expect(updatedComment?.editHistory[0].previousContent).toBe('Original content');
  });

  it('should return error when user is not the author', async () => {
    const otherUser = await testUtils.createTestUser({
      email: 'other@test.com',
    });

    const comment = await Comment.create({
      workflowId: testWorkflowId,
      authorId: otherUser._id,
      content: 'Other user comment',
      status: 'open',
    });

    mockReq.params = { commentId: comment._id.toString() };
    mockReq.body = { content: 'Trying to update' };

    await commentController.updateComment(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Not authorized to edit this comment',
      })
    );
  });
}
)

describe('addReply', () => {
    it('should add reply to comment successfully', async () => {
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: 'Original comment',
        status: 'open',
      });

      mockReq.params = { commentId: comment._id.toString() };
      mockReq.body = {
        content: 'This is a reply',
        mentions: [{ userId: testUser._id, userName: 'Test User' }],
      };

      await commentController.addReply(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            reply: expect.objectContaining({
              content: 'This is a reply',
              authorId: testUser._id.toString(),
