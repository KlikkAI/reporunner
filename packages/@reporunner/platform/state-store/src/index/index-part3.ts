return states.slice(offset, offset + limit);
}

  async createSnapshot(
    executionId: string,
type: StateSnapshot['checkpointType'];
): Promise<string>
{
  const state = this.states.get(executionId);
  if (!state) {
    throw new Error(`Execution not found: ${executionId}`);
  }

  // Create serializable state copy
  const serializedState = this.serializeState(state);
  let data = JSON.stringify(serializedState);
  let compressed = false;

  // Compress if enabled
  if (this.config.compressionEnabled) {
    data = await this.compressData(data);
    compressed = true;
  }

  const snapshot: StateSnapshot = {
    id: this.generateId(),
    executionId,
    timestamp: new Date(),
    state: serializedState,
    checkpointType: type,
    size: data.length,
    compressed,
  };

  // Get or create snapshots array
  let executionSnapshots = this.snapshots.get(executionId) || [];

  // Limit snapshots per execution
  if (executionSnapshots.length >= this.config.maxSnapshotsPerExecution) {
    executionSnapshots = executionSnapshots.slice(-this.config.maxSnapshotsPerExecution + 1);
  }

  executionSnapshots.push(snapshot);
  this.snapshots.set(executionId, executionSnapshots);

  // Persist if configured
  await this.persistSnapshot(snapshot);

  return snapshot.id;
}

async;
restoreFromSnapshot(snapshotId: string)
: Promise<boolean>
{
  // Find snapshot across all executions
  let targetSnapshot: StateSnapshot | undefined;
  let executionId: string | undefined;

  for (const [execId, snapshots] of this.snapshots.entries()) {
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (snapshot) {
      targetSnapshot = snapshot;
      executionId = execId;
      break;
    }
  }

  if (!targetSnapshot || !executionId) {
    return false;
  }

  // Restore state
  const restoredState = this.deserializeState(targetSnapshot.state);
  this.states.set(executionId, restoredState);

  // Restart snapshotting if execution is still active
  if (['initializing', 'running', 'paused'].includes(restoredState.status)) {
    this.startSnapshotting(executionId);
  }

  return true;
}

async;
getSnapshots(executionId: string)
: Promise<StateSnapshot[]>
{
  return this.snapshots.get(executionId) || [];
}

async;
deleteExecution(executionId: string)
: Promise<boolean>
{
  this.stopSnapshotting(executionId);
  const stateDeleted = this.states.delete(executionId);
  const snapshotsDeleted = this.snapshots.delete(executionId);

  // Clean up from persistence layer
  await this.deleteFromPersistence(executionId);

  return stateDeleted || snapshotsDeleted;
}

async;
getExecutionMetrics(executionId: string)
: Promise<
    |
{
        totalNodes: number;
        completedNodes: number;
        failedNodes: number;
