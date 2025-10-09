/**
 * Enhanced Debugging Service - Stub
 * This service was removed during consolidation.
 * Minimal types provided for backward compatibility.
 */

import type { CallStackFrame, DebugMetrics, DebugSession } from '../types/debugging';

// Stub service class
class EnhancedDebuggingService {
  private subscribers: Array<(data: any) => void> = [];

  async startDebugSession(_workflowId: string, _executionId: string): Promise<DebugSession> {
    return {
      id: 'stub',
      workflowId: _workflowId,
      executionId: _executionId,
      status: 'idle',
      breakpoints: new Map(),
      callStack: [],
      variables: new Map(),
      watchExpressions: [],
      executionHistory: [],
      startTime: Date.now(),
      stepCount: 0,
    };
  }

  getCurrentSession(): DebugSession | null {
    return null;
  }

  getCallStack(): CallStackFrame[] {
    return [];
  }

  getVariables(): Record<string, any> {
    return {};
  }

  getDebugMetrics(): DebugMetrics {
    return {
      totalSteps: 0,
      breakpointHits: 0,
      errors: 0,
      averageStepTime: 0,
      totalExecutionTime: 0,
      memoryUsage: 0,
      callStackDepth: 0,
    };
  }

  subscribe(callback: (data: any) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  async startDebugging(_workflowId: string, _executionId: string): Promise<void> {
    // Stub implementation
  }

  async stopDebugging(): Promise<void> {
    // Stub implementation
  }

  async pauseExecution(): Promise<void> {
    // Stub implementation
  }

  async resumeExecution(): Promise<void> {
    // Stub implementation
  }

  async stepOver(): Promise<void> {
    // Stub implementation
  }

  async stepInto(): Promise<void> {
    // Stub implementation
  }

  async stepOut(): Promise<void> {
    // Stub implementation
  }

  async addBreakpoint(_nodeId: string, _breakpoint: any): Promise<void> {
    // Stub implementation
  }

  async removeBreakpoint(_nodeId: string, _breakpointId: string): Promise<void> {
    // Stub implementation
  }

  async toggleBreakpoint(_nodeId: string, _breakpointId: string): Promise<void> {
    // Stub implementation
  }

  async addWatchExpression(_expression: string): Promise<void> {
    // Stub implementation
  }

  async removeWatchExpression(_expressionId: string): Promise<void> {
    // Stub implementation
  }
}

export const enhancedDebuggingService = new EnhancedDebuggingService();
