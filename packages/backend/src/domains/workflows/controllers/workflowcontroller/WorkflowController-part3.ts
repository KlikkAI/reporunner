status: 'success', message;
: 'Execution stopped successfully',
    })
}

/**
 * Get execution statistics
 */
getExecutionStatistics = async (req: Request, res: Response) =>
{
  const userId = this.getUserId(req);
  const { workflowId } = req.query;

  const stats = await this.workflowService.getExecutionStatistics(userId, workflowId as string);

  this.sendSuccess(res, stats);
}

/**
 * Test workflow (dry run) from body
 */
testWorkflowFromBody = async (req: Request, res: Response) => {
  const { workflow } = req.body;
  const validation = await this.workflowService.testWorkflowData(workflow);

  res.json({
    status: 'success',
    data: validation,
  });
};
}
