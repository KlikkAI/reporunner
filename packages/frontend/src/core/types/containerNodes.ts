/**
 * Container Node Types
 *
 * Advanced container nodes for complex workflow structures including
 * loops, parallel processing, and conditional branches.
 */

export interface ContainerNodeConfig {
  id: string;
  type: 'loop' | 'parallel' | 'conditional' | 'try-catch' | 'batch';
  name: string;
  description?: string;
  children: string[]; // Node IDs contained within this container
  position: {
    x: number;
    y: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
  style: ContainerStyle;
  executionConfig: ContainerExecutionConfig;
}

export interface ContainerStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  opacity: number;
  zIndex: number;
}

export interface ContainerExecutionConfig {
  // Loop configuration
  loopType?: 'for' | 'while' | 'foreach';
  loopCondition?: string; // JavaScript expression
  loopLimit?: number; // Maximum iterations
  loopDelay?: number; // Delay between iterations (ms)

  // Parallel configuration
  maxConcurrency?: number; // Maximum parallel executions
  parallelStrategy?: 'all' | 'race' | 'any'; // Wait for all, first to complete, or any to complete

  // Conditional configuration
  conditionExpression?: string; // JavaScript expression for branching

  // Try-catch configuration
  retryAttempts?: number;
  retryDelay?: number;
  errorHandling?: 'stop' | 'continue' | 'retry';

  // Batch configuration
  batchSize?: number;
  batchDelay?: number;
  batchStrategy?: 'sequential' | 'parallel';
}

export interface ContainerExecutionState {
  containerId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  currentIteration?: number;
  totalIterations?: number;
  activeChildren: string[];
  completedChildren: string[];
  failedChildren: string[];
  startTime?: number;
  endTime?: number;
  error?: Error;
  metrics: ContainerMetrics;
}

export interface ContainerMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ContainerNodeData {
  config: ContainerNodeConfig;
  state: ContainerExecutionState;
  children: ContainerChildNode[];
}

export interface ContainerChildNode {
  id: string;
  type: string;
  name: string;
  position: {
    x: number;
    y: number;
  };
  parameters: Record<string, any>;
  state: 'idle' | 'running' | 'completed' | 'failed';
}

export interface ContainerResizeEvent {
  containerId: string;
  newDimensions: {
    width: number;
    height: number;
  };
  childrenPositions: Array<{
    nodeId: string;
    position: { x: number; y: number };
  }>;
}

export interface ContainerDropEvent {
  containerId: string;
  nodeId: string;
  position: { x: number; y: number };
}

export interface ContainerConnectionEvent {
  containerId: string;
  sourceNodeId: string;
  targetNodeId: string;
  connectionType: 'internal' | 'external';
}

// Container node factory functions
export const createLoopContainer = (
  id: string,
  name: string,
  position: { x: number; y: number },
  config: Partial<ContainerExecutionConfig> = {}
): ContainerNodeConfig => ({
  id,
  type: 'loop',
  name,
  children: [],
  position,
  dimensions: { width: 400, height: 300 },
  style: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
    borderWidth: 2,
    borderRadius: 8,
    opacity: 0.8,
    zIndex: 1,
  },
  executionConfig: {
    loopType: 'for',
    loopLimit: 10,
    loopDelay: 1000,
    ...config,
  },
});

export const createParallelContainer = (
  id: string,
  name: string,
  position: { x: number; y: number },
  config: Partial<ContainerExecutionConfig> = {}
): ContainerNodeConfig => ({
  id,
  type: 'parallel',
  name,
  children: [],
  position,
  dimensions: { width: 500, height: 400 },
  style: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
    borderWidth: 2,
    borderRadius: 8,
    opacity: 0.8,
    zIndex: 1,
  },
  executionConfig: {
    maxConcurrency: 5,
    parallelStrategy: 'all',
    ...config,
  },
});

export const createConditionalContainer = (
  id: string,
  name: string,
  position: { x: number; y: number },
  config: Partial<ContainerExecutionConfig> = {}
): ContainerNodeConfig => ({
  id,
  type: 'conditional',
  name,
  children: [],
  position,
  dimensions: { width: 350, height: 250 },
  style: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
    borderWidth: 2,
    borderRadius: 8,
    opacity: 0.8,
    zIndex: 1,
  },
  executionConfig: {
    conditionExpression: 'true',
    ...config,
  },
});

export const createTryCatchContainer = (
  id: string,
  name: string,
  position: { x: number; y: number },
  config: Partial<ContainerExecutionConfig> = {}
): ContainerNodeConfig => ({
  id,
  type: 'try-catch',
  name,
  children: [],
  position,
  dimensions: { width: 400, height: 300 },
  style: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    borderWidth: 2,
    borderRadius: 8,
    opacity: 0.8,
    zIndex: 1,
  },
  executionConfig: {
    retryAttempts: 3,
    retryDelay: 1000,
    errorHandling: 'retry',
    ...config,
  },
});

export const createBatchContainer = (
  id: string,
  name: string,
  position: { x: number; y: number },
  config: Partial<ContainerExecutionConfig> = {}
): ContainerNodeConfig => ({
  id,
  type: 'batch',
  name,
  children: [],
  position,
  dimensions: { width: 450, height: 350 },
  style: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: '#a855f7',
    borderWidth: 2,
    borderRadius: 8,
    opacity: 0.8,
    zIndex: 1,
  },
  executionConfig: {
    batchSize: 10,
    batchDelay: 500,
    batchStrategy: 'sequential',
    ...config,
  },
});
