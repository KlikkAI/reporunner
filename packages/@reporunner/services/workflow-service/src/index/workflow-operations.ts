} catch (error)
{
  logger.error('Failed to create workflow', error);
  throw error;
}
}

  async get(id: string): Promise<WorkflowDefinition | null>
{
  try {
    // Check cache first
    const cached = await this.getCachedWorkflow(id);
    if (cached) return cached;

    // Fetch from database
    const workflow = await this.workflows.findOne({ id });

    if (workflow) {
      // Cache for future requests
      await this.cacheWorkflow(workflow);
    }

    return workflow;
  } catch (error) {
    logger.error(`Failed to get workflow ${id}`, error);
    throw error;
  }
}

async;
update(
    id: string,
    updates: Partial<WorkflowDefinition>,
    userId: string
  )
: Promise<WorkflowDefinition>
{
  try {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Workflow ${id} not found`);
    }

    // Check permissions
    if (!this.hasEditPermission(existing, userId)) {
      throw new Error('Insufficient permissions to edit workflow');
    }

    const updated: WorkflowDefinition = {
      ...existing,
      ...updates,
      id, // Preserve original ID
      version: this.incrementVersion(existing.version),
      updatedAt: new Date(),
    };

    // Validate updated workflow
    this.validateWorkflow(updated);

    // Save version history
    await this.saveVersionHistory(existing);

    // Update in database
    await this.workflows.replaceOne({ id }, updated);

    // Invalidate cache
    await this.invalidateCache(id);

    // Emit update event
    this.emit('workflow.updated', {
      workflowId: id,
      userId,
      changes: updates,
    });

    logger.info(`Workflow updated: ${id}`);
    return updated;
  } catch (error) {
    logger.error(`Failed to update workflow ${id}`, error);
    throw error;
  }
}

async;
delete(id
: string, userId: string): Promise<boolean>
{
    try {
      const workflow = await this.get(id);
      if (!workflow) {
        return false;
      }
      
      // Check permissions
      if (!this.hasDeletePermission(workflow, userId)) {
        throw new Error('Insufficient permissions to delete workflow');
      }
      
      // Soft delete by updating status
      await this.workflows.updateOne(
        { id },
        { 
          $set: { 
            status: 'archived',
            archivedAt: new Date(),
            archivedBy: userId
          }
        }
