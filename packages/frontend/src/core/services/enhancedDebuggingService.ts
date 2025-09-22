/**
 * Enhanced Debugging Service
 *
 * Comprehensive debugging system providing:
 * - Breakpoint management and execution control
 * - Step-through debugging with call stack tracking
 * - Data inspection and variable watching
 * - Execution replay and history
 * - Performance profiling and memory tracking
 */

import type {
  CallStackFrame,
  DataInspector,
  DebugBreakpoint,
  DebugConfiguration,
  DebugEvent,
  DebuggerControls,
  DebugMetrics,
  DebugSession,
  ExecutionReplay,
  ExecutionStep,
  WatchExpression,
} from '@/core/types/debugging';
import { performanceMonitor } from './performanceMonitor';

export class EnhancedDebuggingService implements DebuggerControls {
  private activeSessions = new Map<string, DebugSession>();
  private eventListeners = new Set<(event: DebugEvent) => void>();
  private configuration: DebugConfiguration;
  private executionHistory = new Map<string, ExecutionStep[]>();

  constructor() {
    this.configuration = {
      autoStepDelay: 1000,
      maxCallStackDepth: 50,
      maxVariableHistory: 100,
      enablePerformanceProfiling: true,
      enableMemoryTracking: true,
      logLevel: 'debug',
      breakOnError: true,
      breakOnException: true,
    };
  }

  /**
   * Start debugging session
   */
  async startDebugging(workflowId: string, executionId: string): Promise<void> {
    const sessionId = `debug_${executionId}`;

    if (this.activeSessions.has(sessionId)) {
      throw new Error(`Debug session already active for execution ${executionId}`);
    }

    const session: DebugSession = {
      id: sessionId,
      workflowId,
      executionId,
      status: 'idle',
      breakpoints: new Map(),
      callStack: [],
      variables: new Map(),
      watchExpressions: [],
      executionHistory: [],
      startTime: Date.now(),
      stepCount: 0,
    };

    this.activeSessions.set(sessionId, session);
    this.executionHistory.set(sessionId, []);

    this.emitEvent({
      type: 'session-started',
      sessionId,
      timestamp: Date.now(),
    });

    console.log(`Debug session started: ${sessionId}`);
  }

  /**
   * Stop debugging session
   */
  stopDebugging(): void {
    const activeSession = this.getActiveSession();
    if (!activeSession) return;

    const sessionId = activeSession.id;
    activeSession.status = 'completed';

    this.emitEvent({
      type: 'session-ended',
      sessionId,
      timestamp: Date.now(),
    });

    this.activeSessions.delete(sessionId);
    this.executionHistory.delete(sessionId);

    console.log(`Debug session stopped: ${sessionId}`);
  }

  /**
   * Pause execution
   */
  pauseExecution(): void {
    const session = this.getActiveSession();
    if (!session || session.status !== 'running') return;

    session.status = 'paused';
    session.pauseTime = Date.now();

    console.log('Execution paused');
  }

  /**
   * Resume execution
   */
  resumeExecution(): void {
    const session = this.getActiveSession();
    if (!session || session.status !== 'paused') return;

    session.status = 'running';
    session.pauseTime = undefined;

    console.log('Execution resumed');
  }

  /**
   * Step over current node
   */
  stepOver(): void {
    const session = this.getActiveSession();
    if (!session) return;

    session.status = 'stepping';
    session.stepCount++;

    // Simulate step over - execute current node completely
    this.executeStepOver(session);
  }

  /**
   * Step into current node
   */
  stepInto(): void {
    const session = this.getActiveSession();
    if (!session) return;

    session.status = 'stepping';
    session.stepCount++;

    // Simulate step into - enter node execution
    this.executeStepInto(session);
  }

  /**
   * Step out of current node
   */
  stepOut(): void {
    const session = this.getActiveSession();
    if (!session) return;

    session.status = 'stepping';
    session.stepCount++;

    // Simulate step out - complete current node and return to caller
    this.executeStepOut(session);
  }

  /**
   * Add breakpoint to node
   */
  addBreakpoint(nodeId: string, breakpoint: Omit<DebugBreakpoint, 'id'>): void {
    const session = this.getActiveSession();
    if (!session) return;

    const bp: DebugBreakpoint = {
      id: `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...breakpoint,
    };

    if (!session.breakpoints.has(nodeId)) {
      session.breakpoints.set(nodeId, []);
    }
    session.breakpoints.get(nodeId)!.push(bp);

    console.log(`Breakpoint added to node ${nodeId}:`, bp);
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(nodeId: string, breakpointId: string): void {
    const session = this.getActiveSession();
    if (!session) return;

    const breakpoints = session.breakpoints.get(nodeId);
    if (breakpoints) {
      const index = breakpoints.findIndex((bp) => bp.id === breakpointId);
      if (index !== -1) {
        breakpoints.splice(index, 1);
        console.log(`Breakpoint removed from node ${nodeId}: ${breakpointId}`);
      }
    }
  }

  /**
   * Toggle breakpoint enabled state
   */
  toggleBreakpoint(nodeId: string, breakpointId: string): void {
    const session = this.getActiveSession();
    if (!session) return;

    const breakpoints = session.breakpoints.get(nodeId);
    if (breakpoints) {
      const breakpoint = breakpoints.find((bp) => bp.id === breakpointId);
      if (breakpoint) {
        breakpoint.enabled = !breakpoint.enabled;
        console.log(`Breakpoint ${breakpointId} ${breakpoint.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }

  /**
   * Add watch expression
   */
  addWatchExpression(expression: string): void {
    const session = this.getActiveSession();
    if (!session) return;

    const watch: WatchExpression = {
      id: `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expression,
      enabled: true,
    };

    // Evaluate expression
    try {
      watch.value = this.evaluateExpression(expression, this.getVariables());
      watch.type = typeof watch.value;
    } catch (error) {
      watch.error = (error as Error).message;
    }

    session.watchExpressions.push(watch);
    console.log(`Watch expression added: ${expression}`);
  }

  /**
   * Remove watch expression
   */
  removeWatchExpression(id: string): void {
    const session = this.getActiveSession();
    if (!session) return;

    const index = session.watchExpressions.findIndex((watch) => watch.id === id);
    if (index !== -1) {
      session.watchExpressions.splice(index, 1);
      console.log(`Watch expression removed: ${id}`);
    }
  }

  /**
   * Evaluate expression in current context
   */
  evaluateExpression(expression: string, context: Record<string, any> = {}): any {
    try {
      // Create evaluation context with current variables
      const evalContext = {
        ...context,
        ...this.getVariables(),
        $input: context.inputData,
        $output: context.outputData,
        $variables: this.getVariables(),
      };

      // Simple expression evaluation - in production, use a proper expression parser
      const func = new Function(...Object.keys(evalContext), `return ${expression}`);
      return func(...Object.values(evalContext));
    } catch (error) {
      throw new Error(`Expression evaluation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get current call stack
   */
  getCallStack(): CallStackFrame[] {
    const session = this.getActiveSession();
    return session ? [...session.callStack] : [];
  }

  /**
   * Get current variables
   */
  getVariables(): Record<string, any> {
    const session = this.getActiveSession();
    if (!session) return {};

    const variables: Record<string, any> = {};
    session.variables.forEach((value, key) => {
      variables[key] = value;
    });

    return variables;
  }

  /**
   * Inspect data at specific node
   */
  inspectData(nodeId: string, type: DataInspector['type']): DataInspector {
    const session = this.getActiveSession();
    if (!session) return this.createEmptyInspector(nodeId, type);

    const data = this.getDataForInspection(nodeId, type);
    const serialized = JSON.stringify(data);

    return {
      nodeId,
      data,
      type,
      timestamp: Date.now(),
      size: new Blob([serialized]).size,
      preview: this.createDataPreview(data),
    };
  }

  /**
   * Replay execution from session
   */
  async replayExecution(sessionId: string): Promise<ExecutionReplay> {
    const steps = this.executionHistory.get(sessionId);
    if (!steps) {
      throw new Error(`No execution history found for session ${sessionId}`);
    }

    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      sessionId,
      workflowId: session.workflowId,
      steps: [...steps],
      duration: steps.length > 0 ? steps[steps.length - 1].timestamp - steps[0].timestamp : 0,
      startTime: steps[0]?.timestamp || 0,
      endTime: steps[steps.length - 1]?.timestamp || 0,
      status: session.status === 'completed' ? 'completed' : 'failed',
      metadata: {
        stepCount: steps.length,
        breakpointHits: steps.filter((s) => s.action === 'breakpoint').length,
        errors: steps.filter((s) => s.action === 'error').length,
      },
    };
  }

  /**
   * Subscribe to debug events
   */
  subscribe(listener: (event: DebugEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /**
   * Get debug metrics for current session
   */
  getDebugMetrics(): DebugMetrics | null {
    const session = this.getActiveSession();
    if (!session) return null;

    const steps = this.executionHistory.get(session.id) || [];
    const totalTime = Date.now() - session.startTime;
    const averageStepTime = steps.length > 0 ? totalTime / steps.length : 0;

    return {
      totalSteps: steps.length,
      breakpointHits: steps.filter((s) => s.action === 'breakpoint').length,
      errors: steps.filter((s) => s.action === 'error').length,
      averageStepTime,
      totalExecutionTime: totalTime,
      memoryUsage: performanceMonitor.getCurrentResourceUsage().totalMemoryMB,
      callStackDepth: session.callStack.length,
    };
  }

  /**
   * Update debug configuration
   */
  updateConfiguration(config: Partial<DebugConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
    console.log('Debug configuration updated:', this.configuration);
  }

  /**
   * Get current debug session
   */
  getCurrentSession(): DebugSession | null {
    return this.getActiveSession();
  }

  /**
   * Check if debugging is active
   */
  isDebugging(): boolean {
    return this.activeSessions.size > 0;
  }

  /**
   * Check if execution is paused
   */
  isPaused(): boolean {
    const session = this.getActiveSession();
    return session?.status === 'paused' || false;
  }

  // Private helper methods

  private getActiveSession(): DebugSession | null {
    // Return the first active session (in a real implementation, you might want to track the current session)
    for (const session of this.activeSessions.values()) {
      if (session.status !== 'completed' && session.status !== 'failed') {
        return session;
      }
    }
    return null;
  }

  private emitEvent(event: DebugEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in debug event listener:', error);
      }
    });
  }

  private executeStepOver(session: DebugSession): void {
    // Simulate step over execution
    const currentNodeId = session.currentNodeId || 'unknown';

    const step: ExecutionStep = {
      id: `step_${Date.now()}`,
      nodeId: currentNodeId,
      timestamp: Date.now(),
      action: 'start',
    };

    session.executionHistory.push(step);
    this.executionHistory.get(session.id)?.push(step);

    // Simulate node execution completion
    setTimeout(() => {
      const endStep: ExecutionStep = {
        id: `step_${Date.now()}`,
        nodeId: currentNodeId,
        timestamp: Date.now(),
        action: 'end',
        duration: 100, // Simulated duration
      };

      session.executionHistory.push(endStep);
      this.executionHistory.get(session.id)?.push(endStep);

      this.emitEvent({
        type: 'step-completed',
        sessionId: session.id,
        nodeId: currentNodeId,
        timestamp: Date.now(),
        data: endStep,
      });

      session.status = 'paused';
    }, this.configuration.autoStepDelay);
  }

  private executeStepInto(session: DebugSession): void {
    // Simulate step into execution
    const currentNodeId = session.currentNodeId || 'unknown';

    const step: ExecutionStep = {
      id: `step_${Date.now()}`,
      nodeId: currentNodeId,
      timestamp: Date.now(),
      action: 'start',
    };

    session.executionHistory.push(step);
    this.executionHistory.get(session.id)?.push(step);

    // Add to call stack
    const frame: CallStackFrame = {
      nodeId: currentNodeId,
      nodeType: 'action', // Simulated
      nodeName: `Node ${currentNodeId}`,
      timestamp: Date.now(),
      variables: this.getVariables(),
    };

    session.callStack.push(frame);

    this.emitEvent({
      type: 'step-completed',
      sessionId: session.id,
      nodeId: currentNodeId,
      timestamp: Date.now(),
      data: step,
    });

    session.status = 'paused';
  }

  private executeStepOut(session: DebugSession): void {
    // Simulate step out execution
    if (session.callStack.length > 0) {
      session.callStack.pop();
    }

    const currentNodeId = session.currentNodeId || 'unknown';

    const step: ExecutionStep = {
      id: `step_${Date.now()}`,
      nodeId: currentNodeId,
      timestamp: Date.now(),
      action: 'end',
    };

    session.executionHistory.push(step);
    this.executionHistory.get(session.id)?.push(step);

    this.emitEvent({
      type: 'step-completed',
      sessionId: session.id,
      nodeId: currentNodeId,
      timestamp: Date.now(),
      data: step,
    });

    session.status = 'paused';
  }

  private getDataForInspection(_nodeId: string, type: DataInspector['type']): any {
    const session = this.getActiveSession();
    if (!session) return null;

    // Simulate data retrieval based on type
    switch (type) {
      case 'input':
        return { message: 'Input data for node', timestamp: Date.now() };
      case 'output':
        return { result: 'Output data from node', processed: true };
      case 'variable':
        return this.getVariables();
      case 'intermediate':
        return { intermediate: 'Intermediate processing data' };
      default:
        return null;
    }
  }

  private createDataPreview(data: any): string {
    if (data === null || data === undefined) return 'null';
    if (typeof data === 'string') return data.length > 100 ? data.substring(0, 100) + '...' : data;
    if (typeof data === 'object') {
      const json = JSON.stringify(data);
      return json.length > 100 ? json.substring(0, 100) + '...' : json;
    }
    return String(data);
  }

  private createEmptyInspector(nodeId: string, type: DataInspector['type']): DataInspector {
    return {
      nodeId,
      data: null,
      type,
      timestamp: Date.now(),
      size: 0,
      preview: 'No data available',
    };
  }
}

// Export singleton instance
export const enhancedDebuggingService = new EnhancedDebuggingService();
