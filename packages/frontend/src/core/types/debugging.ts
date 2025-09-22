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
  endTime: number;
  status: 'completed' | 'failed' | 'cancelled';
  metadata: Record<string, any>;
}

export interface DebugConfiguration {
  autoStepDelay: number; // ms between auto-steps
  maxCallStackDepth: number;
  maxVariableHistory: number;
  enablePerformanceProfiling: boolean;
  enableMemoryTracking: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  breakOnError: boolean;
  breakOnException: boolean;
}

export interface DebugEvent {
  type:
    | 'breakpoint-hit'
    | 'step-completed'
    | 'variable-changed'
    | 'error-occurred'
    | 'session-started'
    | 'session-ended';
  sessionId: string;
  nodeId?: string;
  timestamp: number;
  data?: any;
}

export interface DebugMetrics {
  totalSteps: number;
  breakpointHits: number;
  errors: number;
  averageStepTime: number;
  totalExecutionTime: number;
  memoryUsage: number;
  callStackDepth: number;
}

// Debugging utility types
export interface DebuggerState {
  session?: DebugSession;
  isDebugging: boolean;
  isPaused: boolean;
  isStepping: boolean;
  currentStep?: ExecutionStep;
  breakpoints: Map<string, DebugBreakpoint[]>;
  watchExpressions: WatchExpression[];
  configuration: DebugConfiguration;
}

export interface DebuggerControls {
  startDebugging: (workflowId: string, executionId: string) => Promise<void>;
  stopDebugging: () => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  stepOver: () => void;
  stepInto: () => void;
  stepOut: () => void;
  addBreakpoint: (nodeId: string, breakpoint: Omit<DebugBreakpoint, 'id'>) => void;
  removeBreakpoint: (nodeId: string, breakpointId: string) => void;
  toggleBreakpoint: (nodeId: string, breakpointId: string) => void;
  addWatchExpression: (expression: string) => void;
  removeWatchExpression: (id: string) => void;
  evaluateExpression: (expression: string, context?: Record<string, any>) => any;
  getCallStack: () => CallStackFrame[];
  getVariables: () => Record<string, any>;
  inspectData: (nodeId: string, type: DataInspector['type']) => DataInspector;
  replayExecution: (sessionId: string) => Promise<ExecutionReplay>;
}

// Factory functions for creating debug objects
export const createDebugBreakpoint = (
  nodeId: string,
  options: Partial<DebugBreakpoint> = {}
): DebugBreakpoint => ({
  id: `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  nodeId,
  enabled: true,
  hitCount: 0,
  actions: [{ type: 'pause' }],
  createdAt: Date.now(),
  ...options,
});

export const createWatchExpression = (
  expression: string,
  options: Partial<WatchExpression> = {}
): WatchExpression => ({
  id: `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  expression,
  enabled: true,
  ...options,
});

export const createDebugConfiguration = (
  overrides: Partial<DebugConfiguration> = {}
): DebugConfiguration => ({
  autoStepDelay: 1000,
  maxCallStackDepth: 50,
  maxVariableHistory: 100,
  enablePerformanceProfiling: true,
  enableMemoryTracking: true,
  logLevel: 'debug',
  breakOnError: true,
  breakOnException: true,
  ...overrides,
});

export const createExecutionStep = (
  nodeId: string,
  action: ExecutionStep['action'],
  options: Partial<ExecutionStep> = {}
): ExecutionStep => ({
  id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  nodeId,
  timestamp: Date.now(),
  action,
  ...options,
});
