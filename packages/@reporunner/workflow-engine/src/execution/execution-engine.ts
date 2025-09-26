export class ExecutionEngine {
  constructor(config: any) {}
  on(event: string, listener: (...args: any[]) => void): this {
    return this;
  }
  initialize() {}
  shutdown() {}
  cancelExecution(executionId: string): boolean {
    return true;
  }
  getExecution(executionId: string): any {
    return null;
  }
  getWorkflowExecutions(workflowId: string, options: any): any[] {
    return [];
  }
}
