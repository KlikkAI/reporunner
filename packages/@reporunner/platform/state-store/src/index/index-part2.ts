updates: Partial<WorkflowState>;
): Promise<boolean>
{
  const state = this.states.get(executionId);
  if (!state) return false;

  // Merge updates
  Object.assign(state, updates);

  // Update execution tracking
  if (
    updates.status === 'completed' ||
    updates.status === 'failed' ||
    updates.status === 'cancelled'
  ) {
    state.endTime = new Date();
    this.stopSnapshotting(executionId);
    await this.createSnapshot(executionId, 'completion');
  }

  return true;
}

async;
updateNodeState(
    executionId: string,
    nodeId: string,
    nodeState: Partial<NodeState>
  )
: Promise<boolean>
{
  const state = this.states.get(executionId);
  if (!state) return false;

  const existingNodeState = state.nodeStates.get(nodeId) || {
    nodeId,
    status: 'pending',
    retryCount: 0,
  };

  const updatedNodeState = { ...existingNodeState, ...nodeState };
  state.nodeStates.set(nodeId, updatedNodeState);

  // Update current node if running
  if (nodeState.status === 'running') {
    state.currentNode = nodeId;
  }

  // Add to executed nodes if completed
  if (nodeState.status === 'completed' && !state.executedNodes.includes(nodeId)) {
    state.executedNodes.push(nodeId);
  }

  return true;
}

async;
getExecutionState(executionId: string)
: Promise<WorkflowState | undefined>
{
  let state = this.states.get(executionId);

  // If not in memory, try to load from persistence layer
  if (!state) {
    state = await this.loadFromPersistence(executionId);
    if (state) {
      this.states.set(executionId, state);
    }
  }

  return state;
}

async;
getNodeState(executionId: string, nodeId: string)
: Promise<NodeState | undefined>
{
  const state = await this.getExecutionState(executionId);
  return state?.nodeStates.get(nodeId);
}

async;
queryStates(query: StateQuery)
: Promise<WorkflowState[]>
{
    let states = Array.from(this.states.values());

    // Apply filters
    if (query.workflowId) {
      states = states.filter((s) => s.workflowId === query.workflowId);
    }

    if (query.organizationId) {
      states = states.filter((s) => s.organizationId === query.organizationId);
    }

    if (query.status) {
      states = states.filter((s) => s.status === query.status);
    }

    if (query.startTime) {
      if (query.startTime.from) {
        states = states.filter((s) => s.startTime >= query.startTime?.from!);
      }
      if (query.startTime.to) {
        states = states.filter((s) => s.startTime <= query.startTime?.to!);
      }
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
