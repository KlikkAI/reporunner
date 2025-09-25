const session = this.activeSessions.get(sessionId);
if (!session || session.status !== 'paused') {
  return false;
}

switch (step.type) {
  case 'step_into':
    session.mode = 'step';
    session.status = 'running';
    break;

  case 'step_over':
    session.mode = 'step';
    session.status = 'running';
    // TODO: Implement step over logic
    break;

  case 'continue':
    session.mode = 'continue';
    session.status = 'running';
    break;

  case 'pause':
    session.status = 'paused';
    break;

  case 'stop':
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
    inputData?: any
  ): DebugFrame
{
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
    status: 'running',
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
  if (breakpoint?.enabled) {
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
    status: 'completed' | 'failed',
    outputData?: any,
    error?: any
  )
: void
{
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const frame = session.frames.find((f) => f.nodeId === nodeId && !f.performance.endTime);
    if (frame) {
      frame.status = status;
      frame.outputData = outputData;
      frame.error = error;
      frame.performance.endTime = Date.now();
      frame.performance.duration = frame.performance.endTime - frame.performance.startTime;
