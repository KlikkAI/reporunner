mode: 'step' | 'continue' | 'auto' = 'continue';
): DebugSession
{
  const sessionId = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const session: DebugSession = {
    id: sessionId,
    workflowId,
    executionId,
    startTime: new Date().toISOString(),
    status: 'running',
    mode,
    frames: [],
    callStack: [],
    breakpoints: Array.from(this.breakpoints.values()).filter((bp) => bp.enabled),
    watchedVariables: [],
  };

  this.activeSessions.set(sessionId, session);
  return session;
}

/**
 * Stop a debug session
 */
stopDebugSession(sessionId: string)
: void
{
  const session = this.activeSessions.get(sessionId);
  if (session) {
    session.status = 'stopped';
    session.endTime = new Date().toISOString();
    this.activeSessions.delete(sessionId);
  }
}

/**
 * Add or update a breakpoint
 */
setBreakpoint(nodeId: string, condition?: string)
: DebugBreakpoint
{
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
removeBreakpoint(nodeId: string)
: boolean
{
  const breakpointId = `bp-${nodeId}`;
  const removed = this.breakpoints.delete(breakpointId);

  if (removed) {
    // Remove from active sessions
    this.activeSessions.forEach((session) => {
      session.breakpoints = session.breakpoints.filter((bp) => bp.nodeId !== nodeId);
    });
  }

  return removed;
}

/**
 * Toggle breakpoint enabled state
 */
toggleBreakpoint(nodeId: string)
: boolean
{
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
executeStep(sessionId: string, step: DebugStep)
: boolean
{
