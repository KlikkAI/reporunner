}),
            message: 'Reply added successfully',
          }),
        })
      )

// Verify reply was added to thread
const updatedComment = await Comment.findById(comment._id);
expect(updatedComment?.thread).toHaveLength(1);
expect(updatedComment?.thread[0].content).toBe('This is a reply');
})
})

describe('addReaction', () =>
{
  it('should add reaction to comment successfully', async () => {
    const comment = await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Comment to react to',
      status: 'open',
    });

    mockReq.params = { commentId: comment._id.toString() };
    mockReq.body = { type: '👍' };

    await commentController.addReaction(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          reactions: expect.arrayContaining([
            expect.objectContaining({
              userId: testUser._id.toString(),
              type: '👍',
            }),
          ]),
          message: 'Reaction added successfully',
        }),
      })
    );
  });

  it('should update existing reaction from same user', async () => {
    const comment = await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Comment with existing reaction',
      status: 'open',
      reactions: [
        {
          userId: testUser._id.toString(),
          type: '👍',
          timestamp: new Date(),
        },
      ],
    });

    mockReq.params = { commentId: comment._id.toString() };
    mockReq.body = { type: '❤️' };

    await commentController.addReaction(mockReq as Request, mockRes as Response);

    const updatedComment = await Comment.findById(comment._id);
    expect(updatedComment?.reactions).toHaveLength(1);
    expect(updatedComment?.reactions[0].type).toBe('❤️');
  });
}
)

describe('removeReaction', () =>
{
  it('should remove user reaction successfully', async () => {
    const comment = await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Comment with reaction',
      status: 'open',
      reactions: [
        {
          userId: testUser._id.toString(),
          type: '👍',
          timestamp: new Date(),
        },
      ],
    });

    mockReq.params = { commentId: comment._id.toString() };

    await commentController.removeReaction(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          reactions: [],
          message: 'Reaction removed successfully',
        }),
      })
    );
  });
}
)
