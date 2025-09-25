describe('resolveComment', () => {
  it('should resolve comment successfully', async () => {
    const comment = await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Comment to resolve',
      status: 'open',
    });

    mockReq.params = { commentId: comment._id.toString() };
    mockReq.body = { resolution: 'Fixed the issue' };

    await commentController.resolveComment(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          comment: expect.objectContaining({
            status: 'resolved',
            resolvedBy: testUser._id.toString(),
          }),
          message: 'Comment resolved successfully',
        }),
      })
    );
  });

  it('should return error when comment is already resolved', async () => {
    const comment = await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Already resolved comment',
      status: 'resolved',
      resolvedBy: testUser._id,
      resolvedAt: new Date(),
    });

    mockReq.params = { commentId: comment._id.toString() };

    await commentController.resolveComment(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Comment is already resolved',
      })
    );
  });
});

describe('deleteComment', () => {
    it('should delete comment successfully when user is author', async () => {
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: 'Comment to delete',
        status: 'open',
      });

      mockReq.params = { commentId: comment._id.toString() };

      await commentController.deleteComment(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            message: 'Comment deleted successfully',
          }),
        })
      );

      // Verify comment was deleted
      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment).toBeNull();
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

      await commentController.deleteComment(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
