maxCallStackDepth: 50, maxVariableHistory;
: 100,
  enablePerformanceProfiling: true,
  enableMemoryTracking: true,
  logLevel: 'debug',
  breakOnError: true,
  breakOnException: true,
  ...overrides,
})

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
