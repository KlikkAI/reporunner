stage.metrics.trafficSplit = 0.1;
stage.metrics.conversionLift = 0.05;

return {
    abTestSetup: {
      active: stage.metrics.testActive,
      trafficSplit: stage.metrics.trafficSplit,
      variants: ['control', 'treatment'],
      metrics: ['conversion_rate', 'revenue_per_user'],
      estimatedDuration: '14_days',
    },
  };
}

function executeCustomScript(stage: PipelineStage, _context: Record<string, any>): any {
  stage.metrics.scriptExecuted = true;
  stage.metrics.executionTime = Math.random() * 60000 + 5000; // 5-65 seconds

  return {
    scriptResult: 'success',
    output: 'Custom script completed successfully',
    artifacts: ['custom_output.json'],
  };
}

// Helper functions
function generateExecutionId(): string {
  return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function retryStage(stage: PipelineStage, _context: Record<string, any>): Promise<boolean> {
  for (let attempt = 1; attempt <= stage.retryPolicy.maxRetries; attempt++) {
    try {
      const delay = stage.retryPolicy.exponentialBackoff
        ? stage.retryPolicy.retryDelay * 2 ** (attempt - 1)
        : stage.retryPolicy.retryDelay;

      await new Promise((resolve) => setTimeout(resolve, delay * 1000));

      stage.logs.push(`Retry attempt ${attempt} for stage: ${stage.stageName}`);
      await executeStage(stage, _context);

      stage.status = 'completed';
      stage.endTime = new Date();
      stage.logs.push(`Retry successful for stage: ${stage.stageName}`);
      return true;
    } catch (error: any) {
      stage.logs.push(`Retry attempt ${attempt} failed: ${error.message}`);
    }
  }

  return false;
}

function groupStagesByDependencies(stages: PipelineStage[]): PipelineStage[][] {
  const groups: PipelineStage[][] = [];
  const processed = new Set<string>();

  while (processed.size < stages.length) {
    const currentGroup = stages.filter(
      (stage) =>
        !processed.has(stage.stageName) && stage.dependencies.every((dep) => processed.has(dep))
    );

    if (currentGroup.length === 0) {
      throw new Error('Circular dependency detected in pipeline stages');
    }

    groups.push(currentGroup);
    currentGroup.forEach((stage) => processed.add(stage.stageName));
  }

  return groups;
}

function evaluateStageConditions(stage: PipelineStage, _context: Record<string, any>): boolean {
  // Simple condition evaluation - in real implementation would be more sophisticated
  if (stage.stageConfig.condition) {
    // Evaluate condition based on previous stage results
    return true; // Simplified for demo
  }
  return true;
}

function topologicalSort(stages: PipelineStage[]): PipelineStage[] {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: PipelineStage[] = [];

  const visit = (stage: PipelineStage) => {
    if (visiting.has(stage.stageName)) {
      throw new Error('Circular dependency detected');
    }
    if (visited.has(stage.stageName)) {
      return;
    }

    visiting.add(stage.stageName);

    for (const depName of stage.dependencies) {
