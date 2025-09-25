message: 'Workflow duplicated successfully', data;
:
{
  workflow;
}
,
    })
}

/**
 * Execute workflow
 */
executeWorkflow = async (req: Request, res: Response) =>
{
  const userId = (req as any).user?.id;
  const { id } = req.params;
  const { triggerData } = req.body;

  const executionId = await this.workflowService.executeWorkflow(id, userId, triggerData);

  res.json({
    status: 'success',
    message: 'Workflow execution started',
    data: { executionId },
  });
}

/**
 * Test workflow (dry run)
 */
testWorkflow = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { id } = req.params;

  const validation = await this.workflowService.testWorkflow(id, userId);

  res.json({
    status: 'success',
    data: { validation },
  });
};

/**
 * Get workflow statistics
 */
getWorkflowStatistics = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { id } = req.params;
  const days = parseInt(req.query.days as string, 10) || 30;

  const statistics = await this.workflowService.getWorkflowStatistics(id, userId, days);

  res.json({
    status: 'success',
    data: { statistics },
  });
};

/**
 * Get all executions
 */
getExecutions = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { workflowId, status } = req.query;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;

  const result = await this.workflowService.getExecutions(userId, {
    workflowId: workflowId as string,
    status: status as string,
    page,
    limit,
  });

  res.json({
    status: 'success',
    data: result,
  });
};

/**
 * Get execution by ID
 */
getExecutionById = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { id } = req.params;

  const execution = await this.workflowService.getExecutionById(id, userId);

  res.json({
    status: 'success',
    data: execution,
  });
};

/**
 * Stop execution
 */
stopExecution = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    await this.workflowService.stopExecution(id, userId);

    res.json({
