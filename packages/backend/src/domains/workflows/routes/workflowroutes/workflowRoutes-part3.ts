'/test',
  authenticate,
  [body('workflow').isObject()],
  catchAsync(workflowController.testWorkflowFromBody);
)

export default router;
