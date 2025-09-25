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
