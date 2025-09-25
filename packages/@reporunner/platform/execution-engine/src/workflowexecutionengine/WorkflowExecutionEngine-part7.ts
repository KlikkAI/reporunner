}
}

// Custom error class
export class ExecutionError extends Error {
  constructor(
    message: string,
    public code: number,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ExecutionError';
  }
}

export default WorkflowExecutionEngine;
