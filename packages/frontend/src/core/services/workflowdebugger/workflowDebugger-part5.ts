private
extractVariables(
    nodeId: string,
    data: any,
    scope: 'input' | 'output' | 'parameters' | 'context' = 'input'
  )
: DebugVariable[]
{
  const variables: DebugVariable[] = [];

  if (!data) return variables;

  const extractFromObject = (obj: any, path: string) => {
    if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const variablePath = path ? `${path}.${key}` : key;
        variables.push({
          name: key,
          value,
          type: Array.isArray(value) ? 'array' : typeof value,
          path: variablePath,
          nodeId,
          scope,
        });

        // Recursively extract nested objects (limited depth)
        if (typeof value === 'object' && path.split('.').length < 3) {
          extractFromObject(value, variablePath);
        }
      });
    }
  };

  extractFromObject(data, '');
  return variables;
}

private
evaluateBreakpointCondition(breakpoint: DebugBreakpoint, frame: DebugFrame)
: boolean
{
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
    const func = new Function('context', `with(context) { return ${breakpoint.condition}; }`);
    return !!func(context);
  } catch (_error) {
    return false; // Don't break on condition errors
  }
}

private
hitBreakpoint(sessionId: string, breakpoint: DebugBreakpoint, frame: DebugFrame)
: void
{
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
      {} as Record<string, any>
    ),
  });

  // Pause the session
  session.status = 'paused';
  session.currentNodeId = frame.nodeId;

  // Emit breakpoint event
  this.emitEvent({
    type: 'breakpoint_hit',
    sessionId,
    nodeId: frame.nodeId,
    timestamp: new Date().toISOString(),
    data: { breakpoint, frame },
  });
}

private
evaluateExpression(session: DebugSession, expression: string)
: any
{
    // Get the current frame context
    const currentFrame = session.frames[session.frames.length - 1];
    if (!currentFrame) return null;

    // Create evaluation context
    const context = {
      input: currentFrame.inputData,
      output: currentFrame.outputData,
      variables: currentFrame.variables.reduce(
        (acc, v) => {
