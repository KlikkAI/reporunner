const depStage = stages.find((s) => s.stageName === depName);
if (depStage) {
  visit(depStage);
}
}

    visiting.delete(stage.stageName)
visited.add(stage.stageName)
result.push(stage);
}

stages.forEach(visit)
return result;
}

function calculateOverallMetrics(stages: PipelineStage[]): Record<string, any> {
  const completedStages = stages.filter((s) => s.status === 'completed');
  const failedStages = stages.filter((s) => s.status === 'failed');

  return {
    totalStages: stages.length,
    completedStages: completedStages.length,
    failedStages: failedStages.length,
    successRate: completedStages.length / stages.length,
    avgStageTime:
      completedStages.reduce((sum, stage) => {
        if (stage.startTime && stage.endTime) {
          return sum + (stage.endTime.getTime() - stage.startTime.getTime());
        }
        return sum;
      }, 0) / completedStages.length,
  };
}

async function deployModel(model: any, config: any): Promise<any> {
  // Simulate model deployment
  return {
    deploymentId: `deploy_${Date.now()}`,
    endpoint: `https://api.example.com/models/${model.id}/predict`,
    status: 'deployed',
    target: config.deploymentTarget,
    strategy: config.deploymentStrategy,
    scaling: config.scalingConfig,
  };
}

async function setupMonitoring(pipeline: PipelineExecution, config: any): Promise<any> {
  // Simulate monitoring setup
  return {
    monitoringId: `monitor_${Date.now()}`,
    platform: config.platform,
    dashboardUrl: `https://monitoring.example.com/pipeline/${pipeline.id}`,
    alerts: config.metricsToTrack,
    status: 'active',
  };
}

async function initializeExperiment(_config: any, _pipeline: PipelineExecution): Promise<string> {
  // Simulate experiment initialization
  return `experiment_${Date.now()}`;
}

async function finalizeExperiment(
  _config: any,
  _experimentId: string,
  _metrics: Record<string, any>
): Promise<void> {}

// Validation functions
function validatePipelineConfig(config: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.pipelineName) {
    errors.push('Pipeline name is required');
  }
  if (!config.pipelineType) {
    errors.push('Pipeline type is required');
  }
  if (!config.executionMode) {
    errors.push('Execution mode is required');
  }

  return { valid: errors.length === 0, errors };
}

function validateStages(stages: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!stages || !Array.isArray(stages.stage) || stages.stage.length === 0) {
    errors.push('At least one stage is required');
  } else {
    stages.stage.forEach((stage: any, index: number) => {
      if (!stage.stageName) {
        errors.push(`Stage ${index + 1}: Stage name is required`);
      }
      if (!stage.stageType) {
        errors.push(`Stage ${index + 1}: Stage type is required`);
