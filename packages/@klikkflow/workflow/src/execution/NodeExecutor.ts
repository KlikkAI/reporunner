// Node executor reusing patterns from workflow-engine
import { NodeExecutionError } from '../types/error-types';
import { ExecutionContext, NodeExecutionContext } from './ExecutionContext';

export interface NodeExecutorOptions {
  logger?: any;
  timeout?: number;
  retryAttempts?: number;
}

export class NodeExecutor {
  private options: Required<NodeExecutorOptions>;
  private logger: any;

  constructor(options: NodeExecutorOptions = {}) {
    this.options = {
      logger: options.logger || console,
      timeout: options.timeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      ...options,
    };
    this.logger = this.options.logger;
  }

  // Alias for executeNode to match WorkflowEngine expectations
  async execute(node: any, inputData?: any, context?: NodeExecutionContext): Promise<any> {
    const execContext =
      context ||
      new NodeExecutionContext(
        new ExecutionContext({
          executionId: 'temp',
          workflowId: 'temp',
          environment: 'development',
        }),
        node.id
      );
    return this.executeNode(node, execContext, inputData);
  }

  async executeNode(node: any, context: NodeExecutionContext, inputData?: any): Promise<any> {
    this.logger.info(`Executing node: ${node.id} (${node.type})`);

    try {
      // Validate node
      this.validateNode(node);

      // Check timeout
      if (context.isTimedOut()) {
        throw new NodeExecutionError('Execution timeout', node.id, node.type, { timeout: true });
      }

      // Execute based on node type
      const result = await this.executeByType(node, context, inputData);

      // Store result in context
      context.setNodeResult(result);

      this.logger.info(`Node execution completed: ${node.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Node execution failed: ${node.id}`, error);

      if (error instanceof NodeExecutionError) {
        throw error;
      }

      throw new NodeExecutionError(
        error instanceof Error ? error.message : 'Unknown error',
        node.id,
        node.type,
        { originalError: error }
      );
    }
  }

  private validateNode(node: any): void {
    if (!node) {
      throw new Error('Node is required');
    }

    if (!node.id) {
      throw new Error('Node ID is required');
    }

    if (!node.type) {
      throw new Error('Node type is required');
    }
  }

  private async executeByType(
    node: any,
    context: NodeExecutionContext,
    inputData?: any
  ): Promise<any> {
    // Placeholder implementation based on node type
    switch (node.type) {
      case 'start':
        return this.executeStartNode(node, context, inputData);
      case 'end':
        return this.executeEndNode(node, context, inputData);
      case 'transform':
        return this.executeTransformNode(node, context, inputData);
      case 'condition':
        return this.executeConditionNode(node, context, inputData);
      default:
        return this.executeGenericNode(node, context, inputData);
    }
  }

  private async executeStartNode(
    node: any,
    _context: NodeExecutionContext,
    inputData?: any
  ): Promise<any> {
    return {
      success: true,
      data: inputData || {},
      nodeId: node.id,
      timestamp: new Date(),
    };
  }

  private async executeEndNode(
    node: any,
    _context: NodeExecutionContext,
    inputData?: any
  ): Promise<any> {
    return {
      success: true,
      finalData: inputData,
      nodeId: node.id,
      timestamp: new Date(),
    };
  }

  private async executeTransformNode(
    node: any,
    _context: NodeExecutionContext,
    inputData?: any
  ): Promise<any> {
    // Simple transformation placeholder
    return {
      success: true,
      data: {
        ...inputData,
        transformed: true,
        nodeId: node.id,
        transformedAt: new Date(),
      },
      timestamp: new Date(),
    };
  }

  private async executeConditionNode(
    node: any,
    _context: NodeExecutionContext,
    _inputData?: any
  ): Promise<any> {
    // Simple condition evaluation placeholder
    const condition = true;

    return {
      success: true,
      result: condition,
      branch: condition ? 'true' : 'false',
      nodeId: node.id,
      timestamp: new Date(),
    };
  }

  private async executeGenericNode(
    node: any,
    _context: NodeExecutionContext,
    inputData?: any
  ): Promise<any> {
    // Generic node execution placeholder
    return {
      success: true,
      data: inputData || {},
      nodeId: node.id,
      nodeType: node.type,
      timestamp: new Date(),
    };
  }
}
