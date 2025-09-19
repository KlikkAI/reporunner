/**
 * Enhanced Workflow Debugging System
 *
 * Provides comprehensive debugging capabilities including breakpoints,
 * step-through execution, variable inspection, and execution replay.
 * Inspired by modern IDE debugging experiences and SIM's workflow debugging.
 */

// import type { WorkflowNodeInstance } from "../nodes/types";
// import type { WorkflowEdge } from "../stores/leanWorkflowStore";

export interface DebugBreakpoint {
  id: string;
  nodeId: string;
  condition?: string; // JavaScript expression to evaluate
  enabled: boolean;
  hitCount: number;
  logs: Array<{
    timestamp: string;
    executionId: string;
    nodeData: any;
    variables: Record<string, any>;
  }>;
}

export interface DebugVariable {
  name: string;
  value: any;
  type: string;
  path: string; // JSONPath to the variable
  nodeId: string;
  scope: "input" | "output" | "parameters" | "context";
}

export interface DebugFrame {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  timestamp: string;
  status: "pending" | "running" | "completed" | "failed" | "paused";
  variables: DebugVariable[];
  inputData?: any;
  outputData?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  performance: {
    startTime: number;
    endTime?: number;
    duration?: number;
    memoryUsage?: number;
  };
}

export interface DebugSession {
  id: string;
  workflowId: string;
  executionId: string;
  startTime: string;
  endTime?: string;
  status: "running" | "paused" | "completed" | "failed" | "stopped";
  mode: "step" | "continue" | "auto";
  currentNodeId?: string;
  frames: DebugFrame[];
  callStack: string[]; // Node IDs in execution order
  breakpoints: DebugBreakpoint[];
  watchedVariables: Array<{
    expression: string;
    value: any;
    error?: string;
  }>;
}

export interface DebugStep {
  type: "step_into" | "step_over" | "step_out" | "continue" | "pause" | "stop";
  targetNodeId?: string;
}

export interface DebugEvent {
  type:
    | "breakpoint_hit"
    | "execution_paused"
    | "variable_changed"
    | "error_occurred";
  sessionId: string;
  nodeId: string;
  timestamp: string;
  data: any;
}

export class WorkflowDebugger {
  private activeSessions = new Map<string, DebugSession>();
  private breakpoints = new Map<string, DebugBreakpoint>();
  private eventListeners = new Set<(event: DebugEvent) => void>();

  /**
   * Start a debug session for a workflow execution
   */
  startDebugSession(
    workflowId: string,
    executionId: string,
    mode: "step" | "continue" | "auto" = "continue",
  ): DebugSession {
    const sessionId = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: DebugSession = {
      id: sessionId,
      workflowId,
      executionId,
      startTime: new Date().toISOString(),
      status: "running",
      mode,
      frames: [],
      callStack: [],
      breakpoints: Array.from(this.breakpoints.values()).filter(
        (bp) => bp.enabled,
      ),
      watchedVariables: [],
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  /**
   * Stop a debug session
   */
  stopDebugSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = "stopped";
      session.endTime = new Date().toISOString();
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Add or update a breakpoint
   */
  setBreakpoint(nodeId: string, condition?: string): DebugBreakpoint {
    const breakpointId = `bp-${nodeId}`;
    const existing = this.breakpoints.get(breakpointId);

    const breakpoint: DebugBreakpoint = {
      id: breakpointId,
      nodeId,
      condition,
      enabled: true,
      hitCount: existing?.hitCount || 0,
      logs: existing?.logs || [],
    };

    this.breakpoints.set(breakpointId, breakpoint);

    // Update breakpoints in active sessions
    this.activeSessions.forEach((session) => {
      const index = session.breakpoints.findIndex((bp) => bp.nodeId === nodeId);
      if (index >= 0) {
        session.breakpoints[index] = breakpoint;
      } else {
        session.breakpoints.push(breakpoint);
      }
    });

    return breakpoint;
  }

  /**
   * Remove a breakpoint
   */
  removeBreakpoint(nodeId: string): boolean {
    const breakpointId = `bp-${nodeId}`;
    const removed = this.breakpoints.delete(breakpointId);

    if (removed) {
      // Remove from active sessions
      this.activeSessions.forEach((session) => {
        session.breakpoints = session.breakpoints.filter(
          (bp) => bp.nodeId !== nodeId,
        );
      });
    }

    return removed;
  }

  /**
   * Toggle breakpoint enabled state
   */
  toggleBreakpoint(nodeId: string): boolean {
    const breakpointId = `bp-${nodeId}`;
    const breakpoint = this.breakpoints.get(breakpointId);

    if (breakpoint) {
      breakpoint.enabled = !breakpoint.enabled;
      return breakpoint.enabled;
    }

    return false;
  }

  /**
   * Execute a debug step
   */
  executeStep(sessionId: string, step: DebugStep): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== "paused") {
      return false;
    }

    switch (step.type) {
      case "step_into":
        session.mode = "step";
        session.status = "running";
        break;

      case "step_over":
        session.mode = "step";
        session.status = "running";
        // TODO: Implement step over logic
        break;

      case "continue":
        session.mode = "continue";
        session.status = "running";
        break;

      case "pause":
        session.status = "paused";
        break;

      case "stop":
        this.stopDebugSession(sessionId);
        break;
    }

    return true;
  }

  /**
   * Add a debug frame when a node starts executing
   */
  addDebugFrame(
    sessionId: string,
    nodeId: string,
    nodeName: string,
    nodeType: string,
    inputData?: any,
  ): DebugFrame {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    const frameId = `frame-${Date.now()}-${nodeId}`;
    const frame: DebugFrame = {
      id: frameId,
      nodeId,
      nodeName,
      nodeType,
      timestamp: new Date().toISOString(),
      status: "running",
      variables: this.extractVariables(nodeId, inputData),
      inputData,
      performance: {
        startTime: Date.now(),
      },
    };

    session.frames.push(frame);
    session.callStack.push(nodeId);
    session.currentNodeId = nodeId;

    // Check for breakpoints
    const breakpoint = this.breakpoints.get(`bp-${nodeId}`);
    if (breakpoint && breakpoint.enabled) {
      const shouldBreak = this.evaluateBreakpointCondition(breakpoint, frame);
      if (shouldBreak) {
        this.hitBreakpoint(sessionId, breakpoint, frame);
      }
    }

    return frame;
  }

  /**
   * Update debug frame when node completes
   */
  updateDebugFrame(
    sessionId: string,
    nodeId: string,
    status: "completed" | "failed",
    outputData?: any,
    error?: any,
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const frame = session.frames.find(
      (f) => f.nodeId === nodeId && !f.performance.endTime,
    );
    if (frame) {
      frame.status = status;
      frame.outputData = outputData;
      frame.error = error;
      frame.performance.endTime = Date.now();
      frame.performance.duration =
        frame.performance.endTime - frame.performance.startTime;

      // Update variables with output data
      if (outputData) {
        frame.variables.push(
          ...this.extractVariables(nodeId, outputData, "output"),
        );
      }
    }
  }

  /**
   * Add a watched variable expression
   */
  addWatchExpression(sessionId: string, expression: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    // Evaluate the expression
    try {
      const value = this.evaluateExpression(session, expression);
      session.watchedVariables.push({
        expression,
        value,
      });
      return true;
    } catch (error) {
      session.watchedVariables.push({
        expression,
        value: null,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Remove a watched variable
   */
  removeWatchExpression(sessionId: string, expression: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const index = session.watchedVariables.findIndex(
      (w) => w.expression === expression,
    );
    if (index >= 0) {
      session.watchedVariables.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get current debug session
   */
  getDebugSession(sessionId: string): DebugSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): DebugSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get all breakpoints
   */
  getBreakpoints(): DebugBreakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  /**
   * Subscribe to debug events
   */
  addEventListener(listener: (event: DebugEvent) => void): void {
    this.eventListeners.add(listener);
  }

  /**
   * Unsubscribe from debug events
   */
  removeEventListener(listener: (event: DebugEvent) => void): void {
    this.eventListeners.delete(listener);
  }

  /**
   * Export debug session for analysis
   */
  exportDebugSession(sessionId: string): any {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return {
      session,
      executionFlow: this.generateExecutionFlow(session),
      performanceAnalysis: this.analyzePerformance(session),
      variableHistory: this.generateVariableHistory(session),
    };
  }

  // Private helper methods

  private extractVariables(
    nodeId: string,
    data: any,
    scope: "input" | "output" | "parameters" | "context" = "input",
  ): DebugVariable[] {
    const variables: DebugVariable[] = [];

    if (!data) return variables;

    const extractFromObject = (obj: any, path: string) => {
      if (typeof obj === "object" && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          const variablePath = path ? `${path}.${key}` : key;
          variables.push({
            name: key,
            value,
            type: Array.isArray(value) ? "array" : typeof value,
            path: variablePath,
            nodeId,
            scope,
          });

          // Recursively extract nested objects (limited depth)
          if (typeof value === "object" && path.split(".").length < 3) {
            extractFromObject(value, variablePath);
          }
        });
      }
    };

    extractFromObject(data, "");
    return variables;
  }

  private evaluateBreakpointCondition(
    breakpoint: DebugBreakpoint,
    frame: DebugFrame,
  ): boolean {
    if (!breakpoint.condition) return true;

    try {
      // Create a context object for condition evaluation
      const context = {
        input: frame.inputData,
        output: frame.outputData,
        nodeId: frame.nodeId,
        nodeType: frame.nodeType,
        timestamp: frame.timestamp,
      };

      // Simple evaluation - in production, use a safer evaluation method
      const func = new Function(
        "context",
        `with(context) { return ${breakpoint.condition}; }`,
      );
      return !!func(context);
    } catch (error) {
      console.warn("Breakpoint condition evaluation failed:", error);
      return false; // Don't break on condition errors
    }
  }

  private hitBreakpoint(
    sessionId: string,
    breakpoint: DebugBreakpoint,
    frame: DebugFrame,
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Update breakpoint hit count and log
    breakpoint.hitCount++;
    breakpoint.logs.push({
      timestamp: frame.timestamp,
      executionId: session.executionId,
      nodeData: frame,
      variables: frame.variables.reduce(
        (acc, v) => {
          acc[v.name] = v.value;
          return acc;
        },
        {} as Record<string, any>,
      ),
    });

    // Pause the session
    session.status = "paused";
    session.currentNodeId = frame.nodeId;

    // Emit breakpoint event
    this.emitEvent({
      type: "breakpoint_hit",
      sessionId,
      nodeId: frame.nodeId,
      timestamp: new Date().toISOString(),
      data: { breakpoint, frame },
    });
  }

  private evaluateExpression(session: DebugSession, expression: string): any {
    // Get the current frame context
    const currentFrame = session.frames[session.frames.length - 1];
    if (!currentFrame) return null;

    // Create evaluation context
    const context = {
      input: currentFrame.inputData,
      output: currentFrame.outputData,
      variables: currentFrame.variables.reduce(
        (acc, v) => {
          acc[v.name] = v.value;
          return acc;
        },
        {} as Record<string, any>,
      ),
    };

    try {
      // Simple evaluation - in production, use a safer evaluation method
      const func = new Function(
        "context",
        `with(context) { return ${expression}; }`,
      );
      return func(context);
    } catch (error) {
      throw new Error(
        `Expression evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private generateExecutionFlow(session: DebugSession): any {
    return {
      totalNodes: session.frames.length,
      executionPath: session.callStack,
      executionTime: session.frames.reduce((total, frame) => {
        return total + (frame.performance.duration || 0);
      }, 0),
      nodeStats: session.frames.reduce(
        (stats, frame) => {
          stats[frame.nodeType] = (stats[frame.nodeType] || 0) + 1;
          return stats;
        },
        {} as Record<string, number>,
      ),
    };
  }

  private analyzePerformance(session: DebugSession): any {
    const completedFrames = session.frames.filter(
      (f) => f.performance.duration,
    );

    if (completedFrames.length === 0) {
      return { message: "No completed nodes to analyze" };
    }

    const durations = completedFrames.map((f) => f.performance.duration!);
    const totalTime = durations.reduce((sum, d) => sum + d, 0);

    return {
      totalExecutionTime: totalTime,
      averageNodeTime: totalTime / durations.length,
      slowestNode: completedFrames.reduce((slowest, frame) =>
        frame.performance.duration! > (slowest?.performance.duration || 0)
          ? frame
          : slowest,
      ),
      fastestNode: completedFrames.reduce((fastest, frame) =>
        frame.performance.duration! <
        (fastest?.performance.duration || Infinity)
          ? frame
          : fastest,
      ),
      nodePerformance: completedFrames
        .map((f) => ({
          nodeId: f.nodeId,
          nodeName: f.nodeName,
          duration: f.performance.duration,
          percentage: (f.performance.duration! / totalTime) * 100,
        }))
        .sort((a, b) => b.duration! - a.duration!),
    };
  }

  private generateVariableHistory(session: DebugSession): any {
    const variableChanges = new Map<string, any[]>();

    session.frames.forEach((frame) => {
      frame.variables.forEach((variable) => {
        const key = `${variable.nodeId}.${variable.name}`;
        if (!variableChanges.has(key)) {
          variableChanges.set(key, []);
        }
        variableChanges.get(key)!.push({
          timestamp: frame.timestamp,
          value: variable.value,
          scope: variable.scope,
        });
      });
    });

    return Object.fromEntries(variableChanges);
  }

  private emitEvent(event: DebugEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Debug event listener error:", error);
      }
    });
  }
}

// Export singleton instance
export const workflowDebugger = new WorkflowDebugger();
