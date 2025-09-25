/**
 * Enhanced Workflow Debugging System
 *
 * Provides comprehensive debugging capabilities including breakpoints,
 * step-through execution, variable inspection, and execution replay.
 * Inspired by modern IDE debugging experiences and SIM's workflow debugging.
 */

// import type { WorkflowNodeInstance } from "../nodes/types";
// import type { WorkflowEdge } from "../stores/leanWorkflowStore";

export interface DebugBreakpoint {
  id: string;
  nodeId: string;
  condition?: string; // JavaScript expression to evaluate
  enabled: boolean;
  hitCount: number;
  logs: Array<{
    timestamp: string;
    executionId: string;
    nodeData: any;
    variables: Record<string, any>;
  }>;
}

export interface DebugVariable {
  name: string;
  value: any;
  type: string;
  path: string; // JSONPath to the variable
  nodeId: string;
  scope: 'input' | 'output' | 'parameters' | 'context';
}

export interface DebugFrame {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  timestamp: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  variables: DebugVariable[];
  inputData?: any;
  outputData?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  performance: {
    startTime: number;
    endTime?: number;
    duration?: number;
    memoryUsage?: number;
  };
}

export interface DebugSession {
  id: string;
  workflowId: string;
  executionId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'stopped';
  mode: 'step' | 'continue' | 'auto';
  currentNodeId?: string;
  frames: DebugFrame[];
  callStack: string[]; // Node IDs in execution order
  breakpoints: DebugBreakpoint[];
  watchedVariables: Array<{
    expression: string;
    value: any;
    error?: string;
  }>;
}

export interface DebugStep {
  type: 'step_into' | 'step_over' | 'step_out' | 'continue' | 'pause' | 'stop';
  targetNodeId?: string;
}

export interface DebugEvent {
  type: 'breakpoint_hit' | 'execution_paused' | 'variable_changed' | 'error_occurred';
  sessionId: string;
  nodeId: string;
  timestamp: string;
  data: any;
}

export class WorkflowDebugger {
  private activeSessions = new Map<string, DebugSession>();
  private breakpoints = new Map<string, DebugBreakpoint>();
  private eventListeners = new Set<(event: DebugEvent) => void>();

  /**
   * Start a debug session for a workflow execution
   */
  startDebugSession(
    workflowId: string,
    executionId: string,
