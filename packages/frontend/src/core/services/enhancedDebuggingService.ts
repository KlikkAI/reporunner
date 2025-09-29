/**
 * Enhanced Debugging Service
 * 
 * Provides debugging capabilities for workflow development
 */

export interface DebugSession {
  id: string;
  workflowId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'paused' | 'stopped' | 'completed';
  breakpoints: DebugBreakpoint[];
  currentNode?: string;
  stepMode: 'over' | 'into' | 'out' | 'continue';
}

export interface DebugBreakpoint {
  id: string;
  nodeId: string;
  condition?: string;
  enabled: boolean;
  hitCount: number;
  logMessage?: string;
}

export interface DebugVariable {
  name: string;
  value: any;
  type: string;
  scope: 'local' | 'global' | 'node';
  nodeId?: string;
}

export interface DebugStackFrame {
  nodeId: string;
  nodeName: string;
  position: { x: number; y: number };
  variables: DebugVariable[];
  timestamp: string;
}

export interface DebugLog {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  nodeId?: string;
  message: string;
  data?: any;
}

class EnhancedDebuggingService {
  private sessions = new Map<string, DebugSession>();
  private callStacks = new Map<string, DebugStackFrame[]>();
  private debugLogs = new Map<string, DebugLog[]>();
  private variables = new Map<string, DebugVariable[]>();
  private eventListeners = new Map<string, ((event: any) => void)[]>();

  /**
   * Start a debug session
   */
  startDebugSession(workflowId: string): DebugSession {
    const sessionId = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: DebugSession = {
      id: sessionId,
      workflowId,
      startTime: new Date().toISOString(),
      status: 'active',
      breakpoints: [],
      stepMode: 'continue',
    };

    this.sessions.set(sessionId, session);
    this.callStacks.set(sessionId, []);
    this.debugLogs.set(sessionId, []);
    this.variables.set(sessionId, []);

    this.emitEvent(sessionId, 'session-started', session);

    return session;
  }

  /**
   * Stop debug session
   */
  stopDebugSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'stopped';
      session.endTime = new Date().toISOString();
      this.sessions.set(sessionId, session);
      
      this.emitEvent(sessionId, 'session-stopped', session);
    }
  }

  /**
   * Add breakpoint
   */
  addBreakpoint(sessionId: string, nodeId: string, condition?: string): DebugBreakpoint {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session not found: ${sessionId}`);
    }

    const breakpoint: DebugBreakpoint = {
      id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      nodeId,
      condition,
      enabled: true,
      hitCount: 0,
    };

    session.breakpoints.push(breakpoint);
    this.sessions.set(sessionId, session);

    this.emitEvent(sessionId, 'breakpoint-added', breakpoint);

    return breakpoint;
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(sessionId: string, breakpointId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.breakpoints = session.breakpoints.filter(bp => bp.id !== breakpointId);
      this.sessions.set(sessionId, session);
      
      this.emitEvent(sessionId, 'breakpoint-removed', { breakpointId });
    }
  }

  /**
   * Toggle breakpoint enabled state
   */
  toggleBreakpoint(sessionId: string, breakpointId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const breakpoint = session.breakpoints.find(bp => bp.id === breakpointId);
      if (breakpoint) {
        breakpoint.enabled = !breakpoint.enabled;
        this.sessions.set(sessionId, session);
        
        this.emitEvent(sessionId, 'breakpoint-toggled', breakpoint);
      }
    }
  }

  /**
   * Step over current node
   */
  stepOver(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.stepMode = 'over';
      session.status = 'active';
      this.sessions.set(sessionId, session);
      
      this.emitEvent(sessionId, 'step-over', session);
    }
  }

  /**
   * Step into current node
   */
  stepInto(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.stepMode = 'into';
      session.status = 'active';
      this.sessions.set(sessionId, session);
      
      this.emitEvent(sessionId, 'step-into', session);
    }
  }

  /**
   * Continue execution
   */
  continue(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.stepMode = 'continue';
      session.status = 'active';
      this.sessions.set(sessionId, session);
      
      this.emitEvent(sessionId, 'continue', session);
    }
  }

  /**
   * Pause execution
   */
  pause(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      this.sessions.set(sessionId, session);
      
      this.emitEvent(sessionId, 'paused', session);
    }
  }

  /**
   * Add debug log entry
   */
  addDebugLog(
    sessionId: string, 
    level: DebugLog['level'], 
    message: string, 
    nodeId?: string, 
    data?: any
  ): void {
    const logs = this.debugLogs.get(sessionId) || [];
    
    const logEntry: DebugLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      level,
      nodeId,
      message,
      data,
    };

    logs.push(logEntry);
    this.debugLogs.set(sessionId, logs);

    this.emitEvent(sessionId, 'debug-log', logEntry);
  }

  /**
   * Update variables for current context
   */
  updateVariables(sessionId: string, variables: DebugVariable[]): void {
    this.variables.set(sessionId, variables);
    this.emitEvent(sessionId, 'variables-updated', variables);
  }

  /**
   * Get current call stack
   */
  getCallStack(sessionId: string): DebugStackFrame[] {
    return this.callStacks.get(sessionId) || [];
  }

  /**
   * Push frame to call stack
   */
  pushCallFrame(sessionId: string, frame: DebugStackFrame): void {
    const stack = this.callStacks.get(sessionId) || [];
    stack.push(frame);
    this.callStacks.set(sessionId, stack);
    
    this.emitEvent(sessionId, 'call-frame-pushed', frame);
  }

  /**
   * Pop frame from call stack
   */
  popCallFrame(sessionId: string): DebugStackFrame | undefined {
    const stack = this.callStacks.get(sessionId) || [];
    const frame = stack.pop();
    this.callStacks.set(sessionId, stack);
    
    if (frame) {
      this.emitEvent(sessionId, 'call-frame-popped', frame);
    }
    
    return frame;
  }

  /**
   * Get debug logs
   */
  getDebugLogs(sessionId: string, level?: DebugLog['level']): DebugLog[] {
    const logs = this.debugLogs.get(sessionId) || [];
    
    if (level) {
      return logs.filter(log => log.level === level);
    }
    
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Get current variables
   */
  getVariables(sessionId: string, scope?: DebugVariable['scope']): DebugVariable[] {
    const variables = this.variables.get(sessionId) || [];
    
    if (scope) {
      return variables.filter(variable => variable.scope === scope);
    }
    
    return variables;
  }

  /**
   * Evaluate expression in current context
   */
  evaluateExpression(sessionId: string, expression: string): any {
    const variables = this.getVariables(sessionId);
    const context: Record<string, any> = {};
    
    // Build evaluation context from variables
    variables.forEach(variable => {
      context[variable.name] = variable.value;
    });

    try {
      // Simple evaluation - in production, use a safe evaluator
      const func = new Function(...Object.keys(context), `return ${expression}`);
      return func(...Object.values(context));
    } catch (error) {
      this.addDebugLog(
        sessionId, 
        'error', 
        `Expression evaluation failed: ${expression}`,
        undefined,
        { expression, error: error instanceof Error ? error.message : error }
      );
      return undefined;
    }
  }

  /**
   * Subscribe to debug events
   */
  onDebugEvent(sessionId: string, callback: (event: any) => void): () => void {
    const listeners = this.eventListeners.get(sessionId) || [];
    listeners.push(callback);
    this.eventListeners.set(sessionId, listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = this.eventListeners.get(sessionId) || [];
      const index = currentListeners.indexOf(callback);
      if (index > -1) {
        currentListeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit debug event
   */
  private emitEvent(sessionId: string, eventType: string, data: any): void {
    const listeners = this.eventListeners.get(sessionId) || [];
    const event = { type: eventType, data, timestamp: new Date().toISOString() };
    
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Debug event listener error:', error);
      }
    });
  }

  /**
   * Get active debug sessions
   */
  getActiveSessions(): DebugSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.status === 'active' || session.status === 'paused');
  }

  /**
   * Get debug session
   */
  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Clear debug data for session
   */
  clearDebugData(sessionId: string): void {
    this.callStacks.delete(sessionId);
    this.debugLogs.delete(sessionId);
    this.variables.delete(sessionId);
    this.eventListeners.delete(sessionId);
  }
}

export const enhancedDebuggingService = new EnhancedDebuggingService();
export { EnhancedDebuggingService };