export interface WorkflowState {
  executionId: string;
  workflowId: string;
  organizationId: string;
  status: 'initializing' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentNode: string;
  executedNodes: string[];
  nodeStates: Map<string, NodeState>;
  variables: Record<string, any>;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  error?: string;
  metadata: {
    triggeredBy: string;
    triggerType: 'manual' | 'webhook' | 'schedule' | 'api';
    version: string;
    retryCount: number;
  };
}

export interface NodeState {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  retryCount: number;
  executionTime?: number;
}

export interface StateSnapshot {
  id: string;
  executionId: string;
  timestamp: Date;
  state: WorkflowState;
  checkpointType: 'auto' | 'manual' | 'error' | 'completion';
  size: number;
  compressed: boolean;
}

export interface StateQuery {
  executionId?: string;
  workflowId?: string;
  organizationId?: string;
  status?: WorkflowState['status'];
  startTime?: { from?: Date; to?: Date };
  limit?: number;
  offset?: number;
}

export interface StateStoreConfig {
  compressionEnabled: boolean;
  maxSnapshotsPerExecution: number;
  snapshotInterval: number; // milliseconds
  retentionDays: number;
  persistenceLayer: 'memory' | 'redis' | 'database';
}

export class WorkflowStateStore {
  private states = new Map<string, WorkflowState>();
  private snapshots = new Map<string, StateSnapshot[]>();
  private config: StateStoreConfig;
  private snapshotIntervals = new Map<string, NodeJS.Timeout>();

  constructor(config: Partial<StateStoreConfig> = {}) {
    this.config = {
      compressionEnabled: true,
      maxSnapshotsPerExecution: 50,
      snapshotInterval: 30000, // 30 seconds
      retentionDays: 30,
      persistenceLayer: 'memory',
      ...config,
    };
  }

  async initializeExecution(
    state: Omit<WorkflowState, 'nodeStates' | 'executedNodes'>
  ): Promise<void> {
    const workflowState: WorkflowState = {
      ...state,
      nodeStates: new Map(),
      executedNodes: [],
    };

    this.states.set(state.executionId, workflowState);
    this.snapshots.set(state.executionId, []);

    // Start automatic snapshotting
    this.startSnapshotting(state.executionId);

    // Create initial snapshot
    await this.createSnapshot(state.executionId, 'auto');
  }

  async updateExecutionState(
    executionId: string,
    updates: Partial<WorkflowState>
  ): Promise<boolean> {
    const state = this.states.get(executionId);
    if (!state) {
      return false;
    }

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

  async updateNodeState(
    executionId: string,
    nodeId: string,
    nodeState: Partial<NodeState>
  ): Promise<boolean> {
    const state = this.states.get(executionId);
    if (!state) {
      return false;
    }

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

  async getExecutionState(executionId: string): Promise<WorkflowState | undefined> {
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

  async getNodeState(executionId: string, nodeId: string): Promise<NodeState | undefined> {
    const state = await this.getExecutionState(executionId);
    return state?.nodeStates.get(nodeId);
  }

  async queryStates(query: StateQuery): Promise<WorkflowState[]> {
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

    return states.slice(offset, offset + limit);
  }

  async createSnapshot(
    executionId: string,
    type: StateSnapshot['checkpointType']
  ): Promise<string> {
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

  async restoreFromSnapshot(snapshotId: string): Promise<boolean> {
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

    if (!(targetSnapshot && executionId)) {
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

  async getSnapshots(executionId: string): Promise<StateSnapshot[]> {
    return this.snapshots.get(executionId) || [];
  }

  async deleteExecution(executionId: string): Promise<boolean> {
    this.stopSnapshotting(executionId);
    const stateDeleted = this.states.delete(executionId);
    const snapshotsDeleted = this.snapshots.delete(executionId);

    // Clean up from persistence layer
    await this.deleteFromPersistence(executionId);

    return stateDeleted || snapshotsDeleted;
  }

  async getExecutionMetrics(executionId: string): Promise<
    | {
        totalNodes: number;
        completedNodes: number;
        failedNodes: number;
        averageNodeTime: number;
        totalExecutionTime: number;
      }
    | undefined
  > {
    const state = await this.getExecutionState(executionId);
    if (!state) {
      return undefined;
    }

    const nodeStates = Array.from(state.nodeStates.values());
    const completedNodes = nodeStates.filter((n) => n.status === 'completed');
    const failedNodes = nodeStates.filter((n) => n.status === 'failed');

    const totalExecutionTime = state.endTime
      ? state.endTime.getTime() - state.startTime.getTime()
      : 0;

    const averageNodeTime =
      completedNodes.length > 0
        ? completedNodes.reduce((sum, node) => sum + (node.executionTime || 0), 0) /
          completedNodes.length
        : 0;

    return {
      totalNodes: nodeStates.length,
      completedNodes: completedNodes.length,
      failedNodes: failedNodes.length,
      averageNodeTime,
      totalExecutionTime,
    };
  }

  private startSnapshotting(executionId: string): void {
    const interval = setInterval(async () => {
      await this.createSnapshot(executionId, 'auto');
    }, this.config.snapshotInterval);

    this.snapshotIntervals.set(executionId, interval);
  }

  private stopSnapshotting(executionId: string): void {
    const interval = this.snapshotIntervals.get(executionId);
    if (interval) {
      clearInterval(interval);
      this.snapshotIntervals.delete(executionId);
    }
  }

  private serializeState(state: WorkflowState): WorkflowState {
    // Convert Map to object for serialization
    return {
      ...state,
      nodeStates: Object.fromEntries(state.nodeStates) as any,
    };
  }

  private deserializeState(serializedState: any): WorkflowState {
    // Convert object back to Map
    return {
      ...serializedState,
      nodeStates: new Map(Object.entries(serializedState.nodeStates)),
      startTime: new Date(serializedState.startTime),
      endTime: serializedState.endTime ? new Date(serializedState.endTime) : undefined,
    };
  }

  private async compressData(_data: string): Promise<string> {
    // TODO: Implement compression using zstd-codec or similar
    // For now, return as-is
    return _data;
  }

  private async loadFromPersistence(_executionId: string): Promise<WorkflowState | undefined> {
    // TODO: Implement persistence layer loading
    return undefined;
  }

  private async persistSnapshot(_snapshot: StateSnapshot): Promise<void> {
    // TODO: Implement persistence layer storage
    // This could be Redis, database, or file system
  }

  private async deleteFromPersistence(_executionId: string): Promise<void> {
    // TODO: Implement persistence layer cleanup
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export * from './persistence';
export * from './recovery';
