// Base node implementation reusing patterns from workflow-engine
import { NodeExecutionContext } from '../execution/ExecutionContext';

export interface BaseNodeOptions {
  id: string;
  type: string;
  name: string;
  parameters?: Record<string, any>;
  credentials?: string[];
}

export abstract class BaseNode {
  public readonly id: string;
  public readonly type: string;
  public readonly name: string;
  public readonly parameters: Record<string, any>;
  public readonly credentials: string[];

  constructor(options: BaseNodeOptions) {
    this.id = options.id;
    this.type = options.type;
    this.name = options.name;
    this.parameters = options.parameters || {};
    this.credentials = options.credentials || [];
  }

  abstract execute(context: NodeExecutionContext, inputData?: any): Promise<any>;

  protected validateInput(inputData: any, requiredFields: string[] = []): void {
    for (const field of requiredFields) {
      if (!inputData || !(field in inputData)) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
  }

  protected getParameter(key: string, defaultValue?: any): any {
    return this.parameters[key] ?? defaultValue;
  }

  protected hasCredentials(): boolean {
    return this.credentials.length > 0;
  }

  protected createSuccessResult(data: any): any {
    return {
      success: true,
      data,
      nodeId: this.id,
      timestamp: new Date(),
    };
  }

  protected createErrorResult(error: string | Error): any {
    return {
      success: false,
      error: error instanceof Error ? error.message : error,
      nodeId: this.id,
      timestamp: new Date(),
    };
  }
}

// Example concrete implementations
export class StartNode extends BaseNode {
  async execute(_context: NodeExecutionContext, inputData?: any): Promise<any> {
    return this.createSuccessResult(inputData || {});
  }
}

export class EndNode extends BaseNode {
  async execute(context: NodeExecutionContext, inputData?: any): Promise<any> {
    return this.createSuccessResult({
      finalResult: inputData,
      executionTime: context.getElapsedTime(),
    });
  }
}

export class TransformNode extends BaseNode {
  async execute(_context: NodeExecutionContext, inputData?: any): Promise<any> {
    const transformation = this.getParameter('transformation', {});

    // Simple transformation logic
    const transformedData = {
      ...inputData,
      ...transformation,
      transformed: true,
    };

    return this.createSuccessResult(transformedData);
  }
}