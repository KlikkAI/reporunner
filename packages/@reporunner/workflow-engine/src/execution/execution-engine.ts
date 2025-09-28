export class ExecutionEngine {
  constructor(_config: any) {}
  on(_event: string, _listener: (...args: any[]) => void): this {
    return this;
  }
  initialize() {}
  shutdown() {}
  cancelExecution(_executionId: string): boolean {
    return true;
  }
  getExecution(_executionId: string): any {
    return null;
  }
  getWorkflowExecutions(_workflowId: string, _options: any): any[] {
    return [];
  }
}
