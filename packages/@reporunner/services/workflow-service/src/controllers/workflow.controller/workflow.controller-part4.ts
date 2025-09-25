}
      })
} catch (error)
{
  next(error);
}
}

  async share(req: Request, res: Response, next: NextFunction): Promise<void>
{
  try {
    const { id } = req.params;
    const validated = ShareWorkflowSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const workflow = await this.workflowService.get(id);

    if (!workflow) {
      res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
      return;
    }

    if (!this.hasSharePermission(workflow, userId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // Update workflow permissions
    const updatedPermissions = {
      ...workflow.permissions,
      sharedWith: [...new Set([...workflow.permissions.sharedWith, ...validated.userIds])],
    };

    await this.workflowService.update(id, { permissions: updatedPermissions }, userId);

    res.json({
      success: true,
      message: 'Workflow shared successfully',
    });
  } catch (error) {
    next(error);
  }
}

async;
duplicate(req: Request, res: Response, next: NextFunction)
: Promise<void>
{
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { name } = req.body;

    const workflow = await this.workflowService.get(id);

    if (!workflow) {
      res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
      return;
    }

    if (!this.hasViewPermission(workflow, userId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // Create a copy
    const duplicated = await this.workflowService.create(
      {
        ...workflow,
        name: name || `${workflow.name} (Copy)`,
        id: undefined as any,
        version: undefined as any,
        createdAt: undefined as any,
        updatedAt: undefined as any,
      },
      userId
    );

    res.json({
      success: true,
      data: duplicated,
      message: 'Workflow duplicated successfully',
    });
  } catch (error) {
    next(error);
  }
}

async;
getVersions(req: Request, res: Response, next: NextFunction)
: Promise<void>
{
    try {
      const { id } = req.params;
      
      // This would query the workflow_history collection
      res.json({
        success: true,
        data: [],
