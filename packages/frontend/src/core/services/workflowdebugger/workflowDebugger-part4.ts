// Update variables with output data
if (outputData) {
  frame.variables.push(...this.extractVariables(nodeId, outputData, 'output'));
}
}
  }

  /**
   * Add a watched variable expression
   */
  addWatchExpression(sessionId: string, expression: string): boolean
{
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
removeWatchExpression(sessionId: string, expression: string)
: boolean
{
  const session = this.activeSessions.get(sessionId);
  if (!session) return false;

  const index = session.watchedVariables.findIndex((w) => w.expression === expression);
  if (index >= 0) {
    session.watchedVariables.splice(index, 1);
    return true;
  }

  return false;
}

/**
 * Get current debug session
 */
getDebugSession(sessionId: string)
: DebugSession | null
{
  return this.activeSessions.get(sessionId) || null;
}

/**
 * Get all active sessions
 */
getActiveSessions();
: DebugSession[]
{
  return Array.from(this.activeSessions.values());
}

/**
 * Get all breakpoints
 */
getBreakpoints();
: DebugBreakpoint[]
{
  return Array.from(this.breakpoints.values());
}

/**
 * Subscribe to debug events
 */
addEventListener(listener: (event: DebugEvent) => void)
: void
{
  this.eventListeners.add(listener);
}

/**
 * Unsubscribe from debug events
 */
removeEventListener(listener: (event: DebugEvent) => void)
: void
{
  this.eventListeners.delete(listener);
}

/**
 * Export debug session for analysis
 */
exportDebugSession(sessionId: string)
: any
{
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
