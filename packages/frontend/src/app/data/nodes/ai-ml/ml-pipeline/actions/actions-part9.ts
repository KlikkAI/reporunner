}
    })
}

return { valid: errors.length === 0, errors };
}

function validateDataConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.dataSourceType) {
    errors.push('Data source type is required');
  }
  if (!config.dataFormat) {
    errors.push('Data format is required');
  }

  return { valid: errors.length === 0, errors };
}

function validateStageDependencies(stages: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!stages || !Array.isArray(stages.stage)) {
    return { valid: true, errors };
  }

  const stageNames = new Set(stages.stage.map((s: any) => s.stageName));

  stages.stage.forEach((stage: any) => {
    if (stage.dependencies) {
      const deps = stage.dependencies.split(',').map((d: string) => d.trim());
      deps.forEach((dep: string) => {
        if (dep && !stageNames.has(dep)) {
          errors.push(`Stage "${stage.stageName}" depends on non-existent stage "${dep}"`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
}

function estimatePipelineDuration(stages: any): number {
  if (!stages || !Array.isArray(stages.stage)) {
    return 0;
  }

  // Estimate based on stage types and typical durations
  const stageTypeDurations: Record<string, number> = {
    data_preprocessing: 300000, // 5 minutes
    feature_engineering: 600000, // 10 minutes
    data_validation: 180000, // 3 minutes
    model_training: 3600000, // 1 hour
    model_evaluation: 300000, // 5 minutes
    model_validation: 600000, // 10 minutes
    model_deployment: 900000, // 15 minutes
    data_drift_detection: 300000, // 5 minutes
    model_monitoring: 120000, // 2 minutes
    ab_testing: 300000, // 5 minutes
    custom_script: 600000, // 10 minutes
  };

  return stages.stage.reduce((total: number, stage: any) => {
    return total + (stageTypeDurations[stage.stageType] || 600000);
  }, 0);
}

function estimateResourceRequirements(stages: any): Record<string, any> {
  if (!stages || !Array.isArray(stages.stage)) {
    return {};
  }

  return {
    cpu: '2 cores',
    memory: '8 GB',
    gpu: stages.stage.some((s: any) => s.stageType === 'model_training') ? '1 GPU' : 'none',
    storage: '50 GB',
    estimatedCost: '$5-15/hour',
  };
}
