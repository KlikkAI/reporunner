// Error types reusing patterns from workflow-engine
export class WorkflowEngineError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'WorkflowEngineError';
  }
}

export class NodeExecutionError extends WorkflowEngineError {
  constructor(
    message: string,
    public nodeId: string,
    public nodeType: string,
    context?: Record<string, any>
  ) {
    super(message, 'NODE_EXECUTION_ERROR', { nodeId, nodeType, ...context });
    this.name = 'NodeExecutionError';
  }
}

export class WorkflowValidationError extends WorkflowEngineError {
  constructor(message: string, public validationErrors: string[]) {
    super(message, 'WORKFLOW_VALIDATION_ERROR', { validationErrors });
    this.name = 'WorkflowValidationError';
  }
}

export class ExecutionTimeoutError extends WorkflowEngineError {
  constructor(message: string, public executionId: string) {
    super(message, 'EXECUTION_TIMEOUT', { executionId });
    this.name = 'ExecutionTimeoutError';
  }
}

export interface ErrorContext {
  executionId?: string;
  workflowId?: string;
  nodeId?: string;
  userId?: string;
  timestamp: Date;
  stack?: string;
  metadata?: Record<string, any>;
}