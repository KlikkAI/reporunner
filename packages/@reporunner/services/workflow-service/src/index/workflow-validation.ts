// Detect cycles
if (this.hasCycles(workflow)) {
  throw new Error('Workflow contains cycles');
}
}

  private hasCycles(workflow: WorkflowDefinition): boolean
{
  const adjacencyList = new Map<string, string[]>();

  // Build adjacency list
  for (const node of workflow.nodes) {
    adjacencyList.set(node.id, []);
  }

  for (const edge of workflow.edges) {
    adjacencyList.get(edge.source)?.push(edge.target);
  }

  // DFS to detect cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycleDFS = (nodeId: string): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const nodeId of adjacencyList.keys()) {
    if (!visited.has(nodeId)) {
      if (hasCycleDFS(nodeId)) return true;
    }
  }

  return false;
}

private
hasEditPermission(workflow: WorkflowDefinition, userId: string)
: boolean
{
  return (
      workflow.createdBy === userId ||
      workflow.permissions.sharedWith.includes(userId) ||
      (workflow.permissions.roles[userId]?.includes('editor'))
    );
}

private
hasDeletePermission(workflow: WorkflowDefinition, userId: string)
: boolean
{
  return (
      workflow.createdBy === userId ||
      (workflow.permissions.roles[userId]?.includes('admin'))
    );
}

private
incrementVersion(version: string)
: string
{
  const parts = version.split('.');
  const patch = parseInt(parts[2]) + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
}

private
async;
saveVersionHistory(workflow: WorkflowDefinition)
: Promise<void>
{
  const history = this.db.collection('workflow_history');
  await history.insertOne({
    ...workflow,
    archivedAt: new Date(),
    _id: undefined,
  });
}

private
async;
cacheWorkflow(workflow: WorkflowDefinition)
: Promise<void>
{
  const key = `workflow:${workflow.id}`;
  await this.cache.setex(key, this.CACHE_TTL, JSON.stringify(workflow));
}

private
async;
getCachedWorkflow(id: string)
: Promise<WorkflowDefinition | null>
{
  const key = `workflow:${id}`;
  const cached = await this.cache.get(key);
  return cached ? JSON.parse(cached) : null;
}

private
async;
invalidateCache(id: string)
: Promise<void>
{
  const key = `workflow:${id}`;
  await this.cache.del(key);
}

private
async;
cancelScheduledExecutions(workflowId: string)
: Promise<void>
{
