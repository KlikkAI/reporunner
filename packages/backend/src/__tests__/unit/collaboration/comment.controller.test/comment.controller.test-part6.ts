message: 'Not authorized to delete this comment',
})
      )
})
})

describe('getCommentAnalytics', () =>
{
  it('should return comment analytics for workflow', async () => {
    // Create test comments with different statuses
    await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Open comment 1',
      status: 'open',
    });

    await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Open comment 2',
      status: 'open',
    });

    await Comment.create({
      workflowId: testWorkflowId,
      authorId: testUser._id,
      content: 'Resolved comment',
      status: 'resolved',
      thread: [
        { authorId: testUser._id, content: 'Reply 1', timestamp: new Date() },
        { authorId: testUser._id, content: 'Reply 2', timestamp: new Date() },
      ],
      reactions: [
        {
          userId: testUser._id.toString(),
          type: '👍',
          timestamp: new Date(),
        },
      ],
    });

    mockReq.params = { workflowId: testWorkflowId };
    mockReq.query = { dateRange: '7' };

    await commentController.getCommentAnalytics(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          dateRange: 7,
          summary: expect.objectContaining({
            totalComments: 3,
            openComments: 2,
            resolvedComments: 1,
            totalReplies: 2,
            totalReactions: 1,
          }),
          dailyActivity: expect.any(Array),
          topCommenters: expect.any(Array),
        }),
      })
    );
  });
}
)
})
