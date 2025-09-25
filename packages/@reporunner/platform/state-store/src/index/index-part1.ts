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
