// Execution context reusing patterns from workflow-engine
export interface ExecutionContextOptions {
  executionId: string;
  workflowId: string;
  userId?: string;
  environment: string;
  variables?: Record<string, any>;
  timeout?: number;
}

export class ExecutionContext {
  public readonly executionId: string;
  public readonly workflowId: string;
  public readonly userId?: string;
  public readonly environment: string;
  public readonly startTime: Date;
  private variables: Record<string, any>;
  private nodeResults: Map<string, any>;
  private timeout?: number;

  constructor(options: ExecutionContextOptions) {
    this.executionId = options.executionId;
    this.workflowId = options.workflowId;
    this.userId = options.userId;
    this.environment = options.environment;
    this.variables = options.variables || {};
    this.nodeResults = new Map();
    this.timeout = options.timeout;
    this.startTime = new Date();
  }

  getVariable(key: string): any {
    return this.variables[key];
  }

  setVariable(key: string, value: any): void {
    this.variables[key] = value;
  }

  getAllVariables(): Record<string, any> {
    return { ...this.variables };
  }

  setNodeResult(nodeId: string, result: any): void {
    this.nodeResults.set(nodeId, result);
  }

  getNodeResult(nodeId: string): any {
    return this.nodeResults.get(nodeId);
  }

  getAllNodeResults(): Record<string, any> {
    return Object.fromEntries(this.nodeResults);
  }

  isTimedOut(): boolean {
    if (!this.timeout) {
      return false;
    }

    const elapsed = Date.now() - this.startTime.getTime();
    return elapsed > this.timeout;
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime.getTime();
  }

  createChildContext(nodeId: string): NodeExecutionContext {
    return new NodeExecutionContext(this, nodeId);
  }
}

export class NodeExecutionContext {
  constructor(
    public readonly parentContext: ExecutionContext,
    public readonly nodeId: string,
    public readonly startTime: Date = new Date()
  ) {}

  get executionId(): string {
    return this.parentContext.executionId;
  }

  get workflowId(): string {
    return this.parentContext.workflowId;
  }

  get userId(): string | undefined {
    return this.parentContext.userId;
  }

  getVariable(key: string): any {
    return this.parentContext.getVariable(key);
  }

  setVariable(key: string, value: any): void {
    this.parentContext.setVariable(key, value);
  }

  getNodeResult(nodeId: string): any {
    return this.parentContext.getNodeResult(nodeId);
  }

  setNodeResult(result: any): void {
    this.parentContext.setNodeResult(this.nodeId, result);
  }

  isTimedOut(): boolean {
    return this.parentContext.isTimedOut();
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime.getTime();
  }
}
