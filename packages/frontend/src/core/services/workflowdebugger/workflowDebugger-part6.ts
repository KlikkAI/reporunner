acc[v.name] = v.value;
return acc;
},
{
}
as;
Record<string, any>;
),
    }

try {
  // Simple evaluation - in production, use a safer evaluation method
  const func = new Function('context', `with(context) { return ${expression}; }`);
  return func(context);
} catch (error) {
  throw new Error(
    `Expression evaluation failed: ${error instanceof Error ? error.message : String(error)}`
  );
}
}

  private generateExecutionFlow(session: DebugSession): any
{
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
        {} as Record<string, number>
      ),
    };
}

private
analyzePerformance(session: DebugSession)
: any
{
  const completedFrames = session.frames.filter((f) => f.performance.duration);

  if (completedFrames.length === 0) {
    return { message: 'No completed nodes to analyze' };
  }

  const durations = completedFrames.map((f) => f.performance.duration!);
  const totalTime = durations.reduce((sum, d) => sum + d, 0);

  return {
      totalExecutionTime: totalTime,
      averageNodeTime: totalTime / durations.length,
      slowestNode: completedFrames.reduce((slowest, frame) =>
        frame.performance.duration! > (slowest?.performance.duration || 0) ? frame : slowest
      ),
      fastestNode: completedFrames.reduce((fastest, frame) =>
        frame.performance.duration! < (fastest?.performance.duration || Infinity) ? frame : fastest
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

private
generateVariableHistory(session: DebugSession)
: any
{
  const variableChanges = new Map<string, any[]>();

  session.frames.forEach((frame) => {
    frame.variables.forEach((variable) => {
      const key = `${variable.nodeId}.${variable.name}`;
      if (!variableChanges.has(key)) {
        variableChanges.set(key, []);
      }
      variableChanges.get(key)?.push({
        timestamp: frame.timestamp,
        value: variable.value,
        scope: variable.scope,
      });
    });
  });

  return Object.fromEntries(variableChanges);
}

private
emitEvent(event: DebugEvent)
: void
{
  this.eventListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (_error) {}
  });
}
}

// Export singleton instance
export const workflowDebugger = new WorkflowDebugger();
