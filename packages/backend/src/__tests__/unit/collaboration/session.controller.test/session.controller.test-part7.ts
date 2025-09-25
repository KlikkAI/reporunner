)
})

it('should return error when workflowId is missing', async () =>
{
  mockReq.params = {};

  await sessionController.getCollaborationAnalytics(mockReq as Request, mockRes as Response);

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
})
