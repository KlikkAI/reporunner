/**
 * Container Execution Service
 *
 * Handles the complex execution logic for container nodes including
 * loops, parallel processing, conditionals, try-catch, and batch operations.
 */

import { performanceMonitor } from './performanceMonitor';
import type {
  ContainerNodeConfig,
  ContainerExecutionState,
  ContainerMetrics,
} from '@/core/types/containerNodes';

export interface ContainerExecutionContext {
  containerId: string;
  workflowId: string;
  executionId: string;
  inputData: any;
  globalVariables: Record<string, any>;
}

export interface ContainerExecutionResult {
  success: boolean;
  outputData: any;
  executionTime: number;
  iterations?: number;
  errors?: Error[];
  metrics: ContainerMetrics;
}

export class ContainerExecutionService {
  private activeExecutions = new Map<string, ContainerExecutionState>();
  private executionListeners = new Set<(state: ContainerExecutionState) => void>();

  /**
   * Execute a container node based on its type and configuration
   */
  async executeContainer(
    config: ContainerNodeConfig,
    context: ContainerExecutionContext,
    childExecutor: (nodeId: string, inputData: any) => Promise<any>
  ): Promise<ContainerExecutionResult> {
    const startTime = performance.now();
    const traceId = performanceMonitor.startTrace(
      context.executionId,
      context.workflowId,
      { containerType: config.type, containerId: config.id }
    );

    try {
      // Initialize execution state
      const state: ContainerExecutionState = {
        containerId: config.id,
        status: 'running',
        activeChildren: [],
        completedChildren: [],
        failedChildren: [],
        startTime,
        metrics: {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          averageExecutionTime: 0,
          totalExecutionTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
        },
      };

      this.activeExecutions.set(config.id, state);
      this.notifyListeners(state);

      let result: ContainerExecutionResult;

      // Execute based on container type
      switch (config.type) {
        case 'loop':
          result = await this.executeLoopContainer(config, context, childExecutor, state);
          break;
        case 'parallel':
          result = await this.executeParallelContainer(config, context, childExecutor, state);
          break;
        case 'conditional':
          result = await this.executeConditionalContainer(config, context, childExecutor, state);
          break;
        case 'try-catch':
          result = await this.executeTryCatchContainer(config, context, childExecutor, state);
          break;
        case 'batch':
          result = await this.executeBatchContainer(config, context, childExecutor, state);
          break;
        default:
          throw new Error(`Unsupported container type: ${config.type}`);
      }

      // Update final state
      state.status = result.success ? 'completed' : 'failed';
      state.endTime = performance.now();
      state.metrics = result.metrics;

      this.activeExecutions.set(config.id, state);
      this.notifyListeners(state);

      // End performance trace
      performanceMonitor.endTrace(context.executionId, result.success ? 'completed' : 'failed');

      return result;
    } catch (error) {
      const state = this.activeExecutions.get(config.id);
      if (state) {
        state.status = 'failed';
        state.error = error as Error;
        state.endTime = performance.now();
        this.notifyListeners(state);
      }

      performanceMonitor.endTrace(context.executionId, 'failed');
      throw error;
    }
  }

  /**
   * Execute loop container
   */
  private async executeLoopContainer(
    config: ContainerNodeConfig,
    context: ContainerExecutionContext,
    childExecutor: (nodeId: string, inputData: any) => Promise<any>,
    state: ContainerExecutionState
  ): Promise<ContainerExecutionResult> {
    const { loopType, loopLimit, loopDelay } = config.executionConfig;
    const results: any[] = [];
    const errors: Error[] = [];
    let currentIteration = 0;

    state.currentIteration = 0;
    state.totalIterations = loopLimit || Infinity;

    try {
      while (currentIteration < (loopLimit || Infinity)) {
        currentIteration++;
        state.currentIteration = currentIteration;
        this.notifyListeners(state);

        // Execute all child nodes
        const iterationResults = await this.executeChildNodes(
          config.children,
          context,
          childExecutor,
          state
        );

        results.push(...iterationResults.results);
        errors.push(...iterationResults.errors);

        // Check loop condition for while loops
        if (loopType === 'while' && !this.evaluateCondition(config.executionConfig.loopCondition, context)) {
          break;
        }

        // Add delay between iterations
        if (loopDelay && currentIteration < (loopLimit || Infinity)) {
          await this.delay(loopDelay);
        }
      }

      return {
        success: errors.length === 0,
        outputData: results,
        executionTime: performance.now() - (state.startTime || 0),
        iterations: currentIteration,
        errors,
        metrics: this.calculateMetrics(state),
      };
    } catch (error) {
      return {
        success: false,
        outputData: results,
        executionTime: performance.now() - (state.startTime || 0),
        iterations: currentIteration,
        errors: [...errors, error as Error],
        metrics: this.calculateMetrics(state),
      };
    }
  }

  /**
   * Execute parallel container
   */
  private async executeParallelContainer(
    config: ContainerNodeConfig,
    context: ContainerExecutionContext,
    childExecutor: (nodeId: string, inputData: any) => Promise<any>,
    state: ContainerExecutionState
  ): Promise<ContainerExecutionResult> {
    const { maxConcurrency, parallelStrategy } = config.executionConfig;
    const startTime = performance.now();

    try {
      // Execute child nodes in parallel with concurrency control
      const results = await this.executeWithConcurrency(
        config.children,
        context,
        childExecutor,
        maxConcurrency || 5,
        state
      );

      // Apply parallel strategy
      let finalResults: any[];
      switch (parallelStrategy) {
        case 'race':
          // Return first successful result
          finalResults = results.filter(r => r.success).slice(0, 1);
          break;
        case 'any':
          // Return any successful result
          finalResults = results.filter(r => r.success);
          break;
        case 'all':
        default:
          // Return all results
          finalResults = results;
          break;
      }

      const errors = results.filter(r => !r.success).map(r => r.error).filter(Boolean);

      return {
        success: errors.length === 0,
        outputData: finalResults,
        executionTime: performance.now() - startTime,
        errors,
        metrics: this.calculateMetrics(state),
      };
    } catch (error) {
      return {
        success: false,
        outputData: [],
        executionTime: performance.now() - startTime,
        errors: [error as Error],
        metrics: this.calculateMetrics(state),
      };
    }
  }

  /**
   * Execute conditional container
   */
  private async executeConditionalContainer(
    config: ContainerNodeConfig,
    context: ContainerExecutionContext,
    childExecutor: (nodeId: string, inputData: any) => Promise<any>,
    state: ContainerExecutionState
  ): Promise<ContainerExecutionResult> {
    const startTime = performance.now();

    try {
      // Evaluate condition
      const conditionMet = this.evaluateCondition(config.executionConfig.conditionExpression, context);

      if (conditionMet) {
        // Execute child nodes
        const results = await this.executeChildNodes(
          config.children,
          context,
          childExecutor,
          state
        );

        return {
          success: results.errors.length === 0,
          outputData: results.results,
          executionTime: performance.now() - startTime,
          errors: results.errors,
          metrics: this.calculateMetrics(state),
        };
      } else {
        // Skip execution
        return {
          success: true,
          outputData: [],
          executionTime: performance.now() - startTime,
          metrics: this.calculateMetrics(state),
        };
      }
    } catch (error) {
      return {
        success: false,
        outputData: [],
        executionTime: performance.now() - startTime,
        errors: [error as Error],
        metrics: this.calculateMetrics(state),
      };
    }
  }

  /**
   * Execute try-catch container
   */
  private async executeTryCatchContainer(
    config: ContainerNodeConfig,
    context: ContainerExecutionContext,
    childExecutor: (nodeId: string, inputData: any) => Promise<any>,
    state: ContainerExecutionState
  ): Promise<ContainerExecutionResult> {
    const { retryAttempts, retryDelay, errorHandling } = config.executionConfig;
    const startTime = performance.now();
    let lastError: Error | null = null;

    try {
      // Try to execute child nodes
      const results = await this.executeChildNodes(
        config.children,
        context,
        childExecutor,
        state
      );

      if (results.errors.length === 0) {
        return {
          success: true,
          outputData: results.results,
          executionTime: performance.now() - startTime,
          metrics: this.calculateMetrics(state),
        };
      }

      // Handle errors based on configuration
      lastError = results.errors[0];

      switch (errorHandling) {
        case 'retry':
          // Retry logic would be implemented here
          break;
        case 'continue':
          // Continue with partial results
          return {
            success: true,
            outputData: results.results,
            executionTime: performance.now() - startTime,
            errors: results.errors,
            metrics: this.calculateMetrics(state),
          };
        case 'stop':
        default:
          // Stop execution
          throw lastError;
      }

      return {
        success: false,
        outputData: results.results,
        executionTime: performance.now() - startTime,
        errors: results.errors,
        metrics: this.calculateMetrics(state),
      };
    } catch (error) {
      return {
        success: false,
        outputData: [],
        executionTime: performance.now() - startTime,
        errors: [error as Error],
        metrics: this.calculateMetrics(state),
      };
    }
  }

  /**
   * Execute batch container
   */
  private async executeBatchContainer(
    config: ContainerNodeConfig,
    context: ContainerExecutionContext,
    childExecutor: (nodeId: string, inputData: any) => Promise<any>,
    state: ContainerExecutionState
  ): Promise<ContainerExecutionResult> {
    const { batchSize, batchDelay, batchStrategy } = config.executionConfig;
    const startTime = performance.now();

    try {
      // Process input data in batches
      const inputData = Array.isArray(context.inputData) ? context.inputData : [context.inputData];
      const batches = this.createBatches(inputData, batchSize || 10);
      const results: any[] = [];
      const errors: Error[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        // Create batch context
        const batchContext = {
          ...context,
          inputData: batch,
          globalVariables: {
            ...context.globalVariables,
            batchIndex: i,
            batchSize: batch.length,
            totalBatches: batches.length,
          },
        };

        // Execute child nodes for this batch
        const batchResults = await this.executeChildNodes(
          config.children,
          batchContext,
          childExecutor,
          state
        );

        results.push(...batchResults.results);
        errors.push(...batchResults.errors);

        // Add delay between batches
        if (batchDelay && i < batches.length - 1) {
          await this.delay(batchDelay);
        }
      }

      return {
        success: errors.length === 0,
        outputData: results,
        executionTime: performance.now() - startTime,
        errors,
        metrics: this.calculateMetrics(state),
      };
    } catch (error) {
      return {
        success: false,
        outputData: [],
        executionTime: performance.now() - startTime,
        errors: [error as Error],
        metrics: this.calculateMetrics(state),
      };
    }
  }

  /**
   * Execute child nodes
   */
  private async executeChildNodes(
    childIds: string[],
    context: ContainerExecutionContext,
    childExecutor: (nodeId: string, inputData: any) => Promise<any>,
    state: ContainerExecutionState
  ): Promise<{ results: any[]; errors: Error[] }> {
    const results: any[] = [];
    const errors: Error[] = [];

    for (const childId of childIds) {
      try {
        state.activeChildren.push(childId);
        this.notifyListeners(state);

        const result = await childExecutor(childId, context.inputData);
        results.push(result);

        state.activeChildren = state.activeChildren.filter(id => id !== childId);
        state.completedChildren.push(childId);
        state.metrics.successfulExecutions++;
      } catch (error) {
        state.activeChildren = state.activeChildren.filter(id => id !== childId);
        state.failedChildren.push(childId);
        state.metrics.failedExecutions++;
        errors.push(error as Error);
      }

      state.metrics.totalExecutions++;
      this.notifyListeners(state);
    }

    return { results, errors };
  }

  /**
   * Execute with concurrency control
   */
  private async executeWithConcurrency(
    childIds: string[],
    context: ContainerExecutionContext,
    childExecutor: (nodeId: string, inputData: any) => Promise<any>,
    maxConcurrency: number,
    state: ContainerExecutionState
  ): Promise<Array<{ success: boolean; result?: any; error?: Error }>> {
    const results: Array<{ success: boolean; result?: any; error?: Error }> = [];
    const executing = new Set<string>();

    const executeNext = async (): Promise<void> => {
      if (executing.size >= maxConcurrency || childIds.length === 0) {
        return;
      }

      const childId = childIds.shift()!;
      executing.add(childId);
      state.activeChildren.push(childId);
      this.notifyListeners(state);

      try {
        const result = await childExecutor(childId, context.inputData);
        results.push({ success: true, result });
        state.completedChildren.push(childId);
        state.metrics.successfulExecutions++;
      } catch (error) {
        results.push({ success: false, error: error as Error });
        state.failedChildren.push(childId);
        state.metrics.failedExecutions++;
      } finally {
        executing.delete(childId);
        state.activeChildren = state.activeChildren.filter(id => id !== childId);
        state.metrics.totalExecutions++;
        this.notifyListeners(state);

        // Execute next if available
        if (childIds.length > 0) {
          await executeNext();
        }
      }
    };

    // Start initial executions
    const promises = Array.from({ length: Math.min(maxConcurrency, childIds.length) }, () => executeNext());
    await Promise.all(promises);

    return results;
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(expression: string | undefined, context: ContainerExecutionContext): boolean {
    if (!expression) return true;

    try {
      // Simple expression evaluation - in production, use a proper expression parser
      const func = new Function('$input', '$context', `return ${expression}`);
      return func(context.inputData, context.globalVariables);
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Calculate execution metrics
   */
  private calculateMetrics(state: ContainerExecutionState): ContainerMetrics {
    const totalTime = (state.endTime || performance.now()) - (state.startTime || 0);
    
    return {
      ...state.metrics,
      averageExecutionTime: state.metrics.totalExecutions > 0 
        ? state.metrics.totalExecutionTime / state.metrics.totalExecutions 
        : 0,
      totalExecutionTime: totalTime,
      memoryUsage: performanceMonitor.getCurrentResourceUsage().totalMemoryMB,
      cpuUsage: 0, // Would need more sophisticated measurement
    };
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Subscribe to execution state changes
   */
  subscribe(listener: (state: ContainerExecutionState) => void): () => void {
    this.executionListeners.add(listener);
    return () => this.executionListeners.delete(listener);
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(state: ContainerExecutionState): void {
    this.executionListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in execution listener:', error);
      }
    });
  }

  /**
   * Get current execution state
   */
  getExecutionState(containerId: string): ContainerExecutionState | undefined {
    return this.activeExecutions.get(containerId);
  }

  /**
   * Stop execution
   */
  stopExecution(containerId: string): void {
    const state = this.activeExecutions.get(containerId);
    if (state && state.status === 'running') {
      state.status = 'paused';
      this.notifyListeners(state);
    }
  }

  /**
   * Clear execution state
   */
  clearExecution(containerId: string): void {
    this.activeExecutions.delete(containerId);
  }
}

// Export singleton instance
export const containerExecutionService = new ContainerExecutionService();