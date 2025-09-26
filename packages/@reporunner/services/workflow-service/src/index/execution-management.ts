)

// Invalidate cache
await this.invalidateCache(id)

// Cancel any scheduled executions
await this.cancelScheduledExecutions(id)

// Emit deletion event
this.emit('workflow.deleted',
{
  workflowId: id,
  userId,
}
)

logger.info(`Workflow deleted: ${id}`);
return true;
} catch (error)
{
  logger.error(`Failed to delete workflow ${id}`, error);
  throw error;
}
}

  async list(
    filters:
{
  organizationId?: string;
  userId?: string;
  status?: string;
  tags?: string[];
  search?: string;
}
,
    pagination:
{
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}
): Promise<
{
  workflows: WorkflowDefinition[];
  total: number;
}
>
{
  try {
    const query: any = {};

    if (filters.organizationId) {
      query.organizationId = filters.organizationId;
    }

    if (filters.userId) {
      query.$or = [{ createdBy: filters.userId }, { 'permissions.sharedWith': filters.userId }];
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const sort = pagination.sort || { createdAt: -1 };

    const [workflows, total] = await Promise.all([
      this.workflows.find(query).sort(sort).skip(skip).limit(pagination.limit).toArray(),
      this.workflows.countDocuments(query),
    ]);

    return { workflows, total };
  } catch (error) {
    logger.error('Failed to list workflows', error);
    throw error;
  }
}

private
validateWorkflow(workflow: WorkflowDefinition)
: void
{
    // Validate workflow has at least one node
    if (!workflow.nodes || workflow.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }
    
    // Validate node IDs are unique
    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    if (nodeIds.size !== workflow.nodes.length) {
      throw new Error('Duplicate node IDs found');
    }
    
    // Validate edges reference existing nodes
    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new Error(`Edge references non-existent node: ${edge.id}`);
      }
    }
