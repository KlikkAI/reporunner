await commentController.getWorkflowComments(mockReq as Request, mockRes as Response);

expect(mockRes.json).toHaveBeenCalledWith(
  expect.objectContaining({
    success: true,
    data: expect.objectContaining({
      comments: expect.arrayContaining([
        expect.objectContaining({
          content: 'Open comment',
          status: 'open',
        }),
      ]),
    }),
  })
);

// Should only return 1 comment (open one)
const call = (mockRes.json as any).mock.calls[0][0];
expect(call.data.comments).toHaveLength(1);
})

it('should return error when workflowId is missing', async () =>
{
  mockReq.params = {};

  await commentController.getWorkflowComments(mockReq as Request, mockRes as Response);

  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      message: 'Workflow ID is required',
    })
  );
}
)
})

describe('createComment', () =>
{
    it('should create a new comment successfully', async () => {
      mockReq.body = {
        workflowId: testWorkflowId,
        content: 'New test comment',
        position: { x: 100, y: 200, nodeId: 'node123' },
        visibility: 'public',
        priority: 'medium',
      };

      await commentController.createComment(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            comment: expect.objectContaining({
              content: 'New test comment',
              position: expect.objectContaining({
                x: 100,
                y: 200,
                nodeId: 'node123',
              }),
              status: 'open',
            }),
            message: 'Comment created successfully',
          }),
        })
      );

      // Verify comment exists in database
      const createdComment = await Comment.findOne({
        content: 'New test comment',
      });
      expect(createdComment).toBeTruthy();
      expect(createdComment?.workflowId).toBe(testWorkflowId);
    });

    it('should return error when required fields are missing', async () => {
      mockReq.body = {
        content: 'Missing workflow ID',
      };

      await commentController.createComment(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Workflow ID and content are required',
        })
      );
    });

    it('should return error when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = {
        workflowId: testWorkflowId,
        content: 'Test comment',
      };

      await commentController.createComment(mockReq as Request, mockRes as Response);
