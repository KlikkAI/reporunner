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
