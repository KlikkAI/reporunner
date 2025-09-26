message: 'Workflow versions retrieved';
})
} catch (error)
{
  next(error);
}
}

  async createVersion(req: Request, res: Response, next: NextFunction): Promise<void>
{
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = (req as any).user?.id;

    const workflow = await this.workflowService.get(id);

    if (!workflow) {
      res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
      return;
    }

    // Create a new version
    const newVersion = this.incrementMajorVersion(workflow.version);
    await this.workflowService.update(id, { version: newVersion }, userId);

    res.json({
      success: true,
      data: { version: newVersion },
      message: 'New version created successfully',
    });
  } catch (error) {
    next(error);
  }
}

async;
getTemplates(req: Request, res: Response, next: NextFunction)
: Promise<void>
{
  try {
    // This would query a templates collection
    const templates = [
      {
        id: 'email-automation',
        name: 'Email Automation',
        description: 'Automate email sending based on triggers',
        category: 'Marketing',
      },
      {
        id: 'data-sync',
        name: 'Data Synchronization',
        description: 'Sync data between multiple systems',
        category: 'Integration',
      },
      {
        id: 'ai-workflow',
        name: 'AI Processing Pipeline',
        description: 'Process data through AI models',
        category: 'AI/ML',
      },
    ];

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
}

async;
createFromTemplate(req: Request, res: Response, next: NextFunction)
: Promise<void>
{
  try {
    const { templateId } = req.params;
    const { name, organizationId } = req.body;
    const userId = (req as any).user?.id;

    // This would fetch the template and create a new workflow
    res.json({
      success: true,
      message: 'Workflow created from template',
      data: { id: 'new-workflow-id' },
    });
  } catch (error) {
    next(error);
  }
}

// Helper methods
private
hasViewPermission(workflow: WorkflowDefinition, userId: string)
: boolean
{
  return (
      workflow.permissions.public ||
      workflow.createdBy === userId ||
      workflow.permissions.sharedWith.includes(userId)
    );
}

private
hasExecutePermission(workflow: WorkflowDefinition, userId: string)
: boolean
{
    return (
      workflow.createdBy === userId ||
      workflow.permissions.roles[userId]?.includes('execute') ||
