/**
 * Enhanced Debugging Types
 *
 * Comprehensive debugging system with breakpoints, step-through execution,
 * data inspection, variable watching, and execution replay functionality.
 */

export interface DebugBreakpoint {
  id: string;
  nodeId: string;
  enabled: boolean;
  condition?: string; // JavaScript expression
  hitCount: number;
  hitLimit?: number; // Stop after N hits
  logMessage?: string;
  actions: BreakpointAction[];
  createdAt: number;
  lastHit?: number;
}

export interface BreakpointAction {
  type: 'log' | 'pause' | 'continue' | 'step' | 'evaluate';
  expression?: string; // For evaluate action
  message?: string; // For log action
}

export interface DebugSession {
  id: string;
  workflowId: string;
  executionId: string;
  status: 'idle' | 'running' | 'paused' | 'stepping' | 'completed' | 'failed';
  currentNodeId?: string;
  breakpoints: Map<string, DebugBreakpoint[]>;
  callStack: CallStackFrame[];
  variables: Map<string, any>;
  watchExpressions: WatchExpression[];
  executionHistory: ExecutionStep[];
  startTime: number;
  pauseTime?: number;
  stepCount: number;
}

export interface CallStackFrame {
  nodeId: string;
  nodeType: string;
  nodeName: string;
  timestamp: number;
  inputData?: any;
  outputData?: any;
  variables: Record<string, any>;
  error?: Error;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value?: any;
  type?: string;
  error?: string;
  enabled: boolean;
}

export interface ExecutionStep {
  id: string;
  nodeId: string;
  timestamp: number;
  action: 'start' | 'end' | 'error' | 'breakpoint' | 'step';
  inputData?: any;
  outputData?: any;
  variables?: Record<string, any>;
  error?: Error;
  duration?: number;
}

export interface DebugControls {
  play: () => void;
  pause: () => void;
  stepOver: () => void;
  stepInto: () => void;
  stepOut: () => void;
  stop: () => void;
  restart: () => void;
}

export interface DataInspector {
  nodeId: string;
  data: any;
  type: 'input' | 'output' | 'variable' | 'intermediate';
  timestamp: number;
  path?: string; // JSONPath for nested data
  size: number; // Data size in bytes
  preview: string; // Truncated preview
}

export interface ExecutionReplay {
  sessionId: string;
  workflowId: string;
  steps: ExecutionStep[];
  duration: number;
  startTime: number;
