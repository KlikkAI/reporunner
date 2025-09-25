const pagination = {
  page: validated.page,
  limit: validated.limit,
  sort: validated.sortBy
    ? ({
        [validated.sortBy]: validated.sortOrder === 'asc' ? 1 : -1,
      } as Record<string, 1 | -1>)
    : undefined,
};

const result = await this.workflowService.list(filters, pagination);

res.json({
  success: true,
  data: result.workflows,
  pagination: {
    page: validated.page,
    limit: validated.limit,
    total: result.total,
    totalPages: Math.ceil(result.total / validated.limit),
  },
});
} catch (error)
{
  if (error instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      errors: error.errors,
      message: 'Validation failed',
    });
  } else {
    next(error);
  }
}
}

  async getById(req: Request, res: Response, next: NextFunction): Promise<void>
{
  try {
    const { id } = req.params;

    const workflow = await this.workflowService.get(id);

    if (!workflow) {
      res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
      return;
    }

    // Check permissions
    const userId = (req as any).user?.id;
    if (!this.hasViewPermission(workflow, userId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    next(error);
  }
}

async;
update(req: Request, res: Response, next: NextFunction)
: Promise<void>
{
    try {
      const { id } = req.params;
      const validated = UpdateWorkflowSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const workflow = await this.workflowService.update(id, validated, userId);

      res.json({
        success: true,
        data: workflow,
        message: 'Workflow updated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
          message: 'Validation failed'
        });
      } else if ((error as any).message?.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Workflow not found'
        });
      } else if ((error as any).message?.includes('permissions')) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      } else {
        next(error);
      }
