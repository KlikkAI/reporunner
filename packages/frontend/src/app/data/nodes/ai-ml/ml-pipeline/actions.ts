// Define action interfaces locally
type NodeExecutionContext = Record<string, any>;
type NodeActionResult = { success: boolean; data?: any; error?: string };

interface PipelineStage {
  stageName: string;
  stageType: string;
  stageConfig: any;
  dependencies: string[];
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
  timeout: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startTime?: Date;
  endTime?: Date;
  logs: string[];
  metrics: Record<string, any>;
}

interface PipelineExecution {
  id: string;
  pipelineName: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  stages: PipelineStage[];
  overallMetrics: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  artifacts: Record<string, any>;
}

export const mlPipelineActions = {
  async execute(context: NodeExecutionContext): Promise<NodeActionResult> {
    const {
      pipelineConfig,
      stages,
      dataConfig,
      deploymentConfig,
      monitoringConfig,
      experimentTracking,
    } = context.node.parameters;

    try {
      // Validate pipeline configuration
      if (!pipelineConfig.pipelineName) {
        throw new Error("Pipeline name is required");
      }

      if (
        !stages ||
        !Array.isArray(stages.stage) ||
        stages.stage.length === 0
      ) {
        throw new Error("At least one pipeline stage is required");
      }

      // Create pipeline execution
      const pipelineExecution: PipelineExecution = {
        id: generateExecutionId(),
        pipelineName: pipelineConfig.pipelineName,
        status: "running",
        stages: stages.stage.map((stage: any) => ({
          stageName: stage.stageName,
          stageType: stage.stageType,
          stageConfig:
            typeof stage.stageConfig === "string"
              ? JSON.parse(stage.stageConfig)
              : stage.stageConfig,
          dependencies: stage.dependencies
            ? stage.dependencies.split(",").map((d: string) => d.trim())
            : [],
          retryPolicy: {
            maxRetries: stage.retryPolicy?.maxRetries || 3,
            retryDelay: stage.retryPolicy?.retryDelay || 30,
            exponentialBackoff: stage.retryPolicy?.exponentialBackoff !== false,
          },
          timeout: stage.timeout || 60,
          status: "pending",
          logs: [],
          metrics: {},
        })),
        overallMetrics: {},
        startTime: new Date(),
        artifacts: {},
      };

      // Initialize experiment tracking if enabled
      if (experimentTracking.enabled) {
        pipelineExecution.artifacts.experimentId = await initializeExperiment(
          experimentTracking,
          pipelineExecution,
        );
      }

      // Validate input data
      const inputData = context.inputData.main;
      if (
        dataConfig.dataSourceType === "workflow_input" &&
        (!inputData || !Array.isArray(inputData))
      ) {
        throw new Error(
          "Input data is required when using workflow input as data source",
        );
      }

      // Process stages based on execution mode
      let stageResults: Record<string, any> = {};

      switch (pipelineConfig.executionMode) {
        case "sequential":
          stageResults = await executeSequentialPipeline(
            pipelineExecution,
            inputData,
          );
          break;
        case "parallel":
          stageResults = await executeParallelPipeline(
            pipelineExecution,
            inputData,
          );
          break;
        case "conditional":
          stageResults = await executeConditionalPipeline(
            pipelineExecution,
            inputData,
          );
          break;
        case "dag":
          stageResults = await executeDAGPipeline(pipelineExecution, inputData);
          break;
        default:
          throw new Error(
            `Unsupported execution mode: ${pipelineConfig.executionMode}`,
          );
      }

      // Complete pipeline execution
      pipelineExecution.status = "completed";
      pipelineExecution.endTime = new Date();
      pipelineExecution.totalDuration =
        pipelineExecution.endTime.getTime() -
        pipelineExecution.startTime.getTime();

      // Calculate overall metrics
      pipelineExecution.overallMetrics = calculateOverallMetrics(
        pipelineExecution.stages,
      );

      // Handle model deployment if configured
      let deploymentInfo: any = null;
      if (deploymentConfig.autoDeploy && stageResults.trainedModel) {
        deploymentInfo = await deployModel(
          stageResults.trainedModel,
          deploymentConfig,
        );
        pipelineExecution.artifacts.deploymentInfo = deploymentInfo;
      }

      // Setup monitoring if enabled
      let monitoringInfo: any = null;
      if (monitoringConfig.enabled) {
        monitoringInfo = await setupMonitoring(
          pipelineExecution,
          monitoringConfig,
        );
        pipelineExecution.artifacts.monitoringInfo = monitoringInfo;
      }

      // Finalize experiment tracking
      if (
        experimentTracking.enabled &&
        pipelineExecution.artifacts.experimentId
      ) {
        await finalizeExperiment(
          experimentTracking,
          pipelineExecution.artifacts.experimentId,
          pipelineExecution.overallMetrics,
        );
      }

      return {
        success: true,
        data: [
          {
            main: {
              pipelineExecution,
              summary: {
                pipelineName: pipelineExecution.pipelineName,
                status: pipelineExecution.status,
                totalDuration: pipelineExecution.totalDuration,
                stagesCompleted: pipelineExecution.stages.filter(
                  (s) => s.status === "completed",
                ).length,
                totalStages: pipelineExecution.stages.length,
                overallMetrics: pipelineExecution.overallMetrics,
              },
              stageResults,
            },
            ai_model: stageResults.trainedModel || null,
            deployment_info: deploymentInfo,
            pipeline_metrics: {
              executionId: pipelineExecution.id,
              metrics: pipelineExecution.overallMetrics,
              stages: pipelineExecution.stages.map((stage) => ({
                name: stage.stageName,
                status: stage.status,
                metrics: stage.metrics,
                duration:
                  stage.endTime && stage.startTime
                    ? stage.endTime.getTime() - stage.startTime.getTime()
                    : 0,
              })),
            },
          },
        ],
        metadata: {
          executionTime: Date.now() - context.startTime,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Pipeline execution failed",
        data: [
          {
            main: {
              error: error.message,
              pipelineName: pipelineConfig.pipelineName,
              timestamp: new Date().toISOString(),
            },
          },
        ],
        metadata: {
          executionTime: Date.now() - context.startTime,
        },
      };
    }
  },

  async test(context: NodeExecutionContext): Promise<NodeActionResult> {
    const { pipelineConfig, stages, dataConfig } = context.node.parameters;

    // Validate pipeline configuration without executing
    const validation = {
      pipelineConfig: validatePipelineConfig(pipelineConfig),
      stages: validateStages(stages),
      dataConfig: validateDataConfig(dataConfig),
      dependencies: validateStageDependencies(stages),
    };

    const allValid = Object.values(validation).every((v) => v.valid);

    return {
      success: allValid,
      data: [
        {
          main: {
            validation,
            estimatedDuration: estimatePipelineDuration(stages),
            resourceRequirements: estimateResourceRequirements(stages),
            message: allValid
              ? "Pipeline configuration is valid"
              : "Pipeline has validation errors",
          },
        },
      ],
      metadata: {
        executionTime: Date.now() - context.startTime,
      },
    };
  },
};

// Pipeline execution functions
async function executeSequentialPipeline(
  pipeline: PipelineExecution,
  inputData: any,
): Promise<Record<string, any>> {
  const results: Record<string, any> = { inputData };

  for (const stage of pipeline.stages) {
    try {
      stage.status = "running";
      stage.startTime = new Date();
      stage.logs.push(`Starting stage: ${stage.stageName}`);

      const stageResult = await executeStage(stage, results);
      results[stage.stageName] = stageResult;

      stage.status = "completed";
      stage.endTime = new Date();
      stage.logs.push(`Completed stage: ${stage.stageName}`);
    } catch (error: any) {
      stage.status = "failed";
      stage.endTime = new Date();
      stage.logs.push(`Failed stage: ${stage.stageName} - ${error.message}`);

      // Attempt retry if configured
      if (stage.retryPolicy.maxRetries > 0) {
        const retrySuccess = await retryStage(stage, results);
        if (!retrySuccess) {
          throw new Error(
            `Stage ${stage.stageName} failed after ${stage.retryPolicy.maxRetries} retries`,
          );
        }
      } else {
        throw error;
      }
    }
  }

  return results;
}

async function executeParallelPipeline(
  pipeline: PipelineExecution,
  inputData: any,
): Promise<Record<string, any>> {
  const results: Record<string, any> = { inputData };

  // Group stages by dependencies
  const stageGroups = groupStagesByDependencies(pipeline.stages);

  for (const group of stageGroups) {
    const promises = group.map(async (stage) => {
      try {
        stage.status = "running";
        stage.startTime = new Date();
        stage.logs.push(`Starting stage: ${stage.stageName}`);

        const stageResult = await executeStage(stage, results);
        results[stage.stageName] = stageResult;

        stage.status = "completed";
        stage.endTime = new Date();
        stage.logs.push(`Completed stage: ${stage.stageName}`);

        return { stage: stage.stageName, result: stageResult };
      } catch (error: any) {
        stage.status = "failed";
        stage.endTime = new Date();
        stage.logs.push(`Failed stage: ${stage.stageName} - ${error.message}`);
        throw error;
      }
    });

    await Promise.all(promises);
  }

  return results;
}

async function executeConditionalPipeline(
  pipeline: PipelineExecution,
  inputData: any,
): Promise<Record<string, any>> {
  const results: Record<string, any> = { inputData };

  for (const stage of pipeline.stages) {
    // Check if stage should be executed based on conditions
    const shouldExecute = evaluateStageConditions(stage, results);

    if (!shouldExecute) {
      stage.status = "skipped";
      stage.logs.push(`Skipped stage: ${stage.stageName} - condition not met`);
      continue;
    }

    try {
      stage.status = "running";
      stage.startTime = new Date();
      stage.logs.push(`Starting stage: ${stage.stageName}`);

      const stageResult = await executeStage(stage, results);
      results[stage.stageName] = stageResult;

      stage.status = "completed";
      stage.endTime = new Date();
      stage.logs.push(`Completed stage: ${stage.stageName}`);
    } catch (error: any) {
      stage.status = "failed";
      stage.endTime = new Date();
      stage.logs.push(`Failed stage: ${stage.stageName} - ${error.message}`);
      throw error;
    }
  }

  return results;
}

async function executeDAGPipeline(
  pipeline: PipelineExecution,
  inputData: any,
): Promise<Record<string, any>> {
  const results: Record<string, any> = { inputData };
  const executed = new Set<string>();
  const inProgress = new Set<string>();

  // Topological sort of stages
  const sortedStages = topologicalSort(pipeline.stages);

  const executeStageWithDependencies = async (
    stage: PipelineStage,
  ): Promise<void> => {
    if (executed.has(stage.stageName) || inProgress.has(stage.stageName)) {
      return;
    }

    // Wait for dependencies
    for (const depName of stage.dependencies) {
      const depStage = pipeline.stages.find((s) => s.stageName === depName);
      if (depStage && !executed.has(depName)) {
        await executeStageWithDependencies(depStage);
      }
    }

    inProgress.add(stage.stageName);

    try {
      stage.status = "running";
      stage.startTime = new Date();
      stage.logs.push(`Starting stage: ${stage.stageName}`);

      const stageResult = await executeStage(stage, results);
      results[stage.stageName] = stageResult;

      stage.status = "completed";
      stage.endTime = new Date();
      stage.logs.push(`Completed stage: ${stage.stageName}`);

      executed.add(stage.stageName);
      inProgress.delete(stage.stageName);
    } catch (error: any) {
      stage.status = "failed";
      stage.endTime = new Date();
      stage.logs.push(`Failed stage: ${stage.stageName} - ${error.message}`);
      inProgress.delete(stage.stageName);
      throw error;
    }
  };

  // Execute all stages
  await Promise.all(sortedStages.map(executeStageWithDependencies));

  return results;
}

// Stage execution function
async function executeStage(
  stage: PipelineStage,
  _context: Record<string, any>,
): Promise<any> {
  // Simulate stage execution based on stage type
  const delay = Math.random() * 3000 + 1000; // 1-4 seconds

  await new Promise((resolve) => setTimeout(resolve, delay));

  switch (stage.stageType) {
    case "data_preprocessing":
      return executeDataPreprocessing(stage, _context);
    case "feature_engineering":
      return executeFeatureEngineering(stage, _context);
    case "data_validation":
      return executeDataValidation(stage, _context);
    case "model_training":
      return executeModelTraining(stage, _context);
    case "model_evaluation":
      return executeModelEvaluation(stage, _context);
    case "model_validation":
      return executeModelValidation(stage, _context);
    case "model_deployment":
      return executeModelDeployment(stage, _context);
    case "data_drift_detection":
      return executeDataDriftDetection(stage, _context);
    case "model_monitoring":
      return executeModelMonitoring(stage, _context);
    case "ab_testing":
      return executeABTesting(stage, _context);
    case "custom_script":
      return executeCustomScript(stage, _context);
    default:
      throw new Error(`Unknown stage type: ${stage.stageType}`);
  }
}

// Stage-specific execution functions
function executeDataPreprocessing(
  stage: PipelineStage,
  _context: Record<string, any>,
): any {
  stage.metrics.rowsProcessed = Array.isArray(context.inputData)
    ? context.inputData.length
    : 1000;
  stage.metrics.columnsProcessed = 10;
  stage.metrics.processingTime = Math.random() * 1000 + 500;

  return {
    processedData: context.inputData,
    transformations: ["normalize", "encode_categorical", "handle_missing"],
    statistics: { mean: 0.5, std: 0.2, nullCount: 0 },
  };
}

function executeFeatureEngineering(
  stage: PipelineStage,
  _context: Record<string, any>,
): any {
  stage.metrics.featuresCreated = 15;
  stage.metrics.featuresSelected = 10;
  stage.metrics.featureImportance = {
    feature1: 0.3,
    feature2: 0.2,
    feature3: 0.15,
  };

  return {
    features: ["feature1", "feature2", "feature3"],
    featureImportance: stage.metrics.featureImportance,
    engineeringSteps: ["polynomial_features", "interaction_terms", "scaling"],
  };
}

function executeDataValidation(
  stage: PipelineStage,
  _context: Record<string, any>,
): any {
  stage.metrics.validationPassed = true;
  stage.metrics.qualityScore = 0.95;
  stage.metrics.issuesFound = 2;

  return {
    validationResult: "passed",
    qualityScore: stage.metrics.qualityScore,
    issues: ["minor_outliers", "small_data_drift"],
    recommendations: ["monitor_drift", "consider_outlier_treatment"],
  };
}

function executeModelTraining(
  stage: PipelineStage,
  _context: Record<string, any>,
): any {
  stage.metrics.trainingAccuracy = 0.92;
  stage.metrics.validationAccuracy = 0.89;
  stage.metrics.trainingTime = Math.random() * 3600000 + 300000; // 5-65 minutes
  stage.metrics.epochs = 10;

  const trainedModel = {
    id: `model_${Date.now()}`,
    type: "classification",
    accuracy: stage.metrics.validationAccuracy,
    metrics: stage.metrics,
    artifacts: ["model.pkl", "tokenizer.json", "config.json"],
  };

  return trainedModel;
}

function executeModelEvaluation(
  stage: PipelineStage,
  _context: Record<string, any>,
): any {
  stage.metrics.testAccuracy = 0.87;
  stage.metrics.precision = 0.88;
  stage.metrics.recall = 0.86;
  stage.metrics.f1Score = 0.87;

  return {
    evaluationResults: stage.metrics,
    confusionMatrix: [
      [85, 5],
      [8, 82],
    ],
    classificationReport: {
      class0: { precision: 0.91, recall: 0.94, f1: 0.92 },
      class1: { precision: 0.94, recall: 0.91, f1: 0.92 },
    },
  };
}

function executeModelValidation(
  stage: PipelineStage,
  _context: Record<string, any>,
): any {
  stage.metrics.validationPassed = true;
  stage.metrics.biasScore = 0.05;
  stage.metrics.fairnessMetrics = {
    equalizedOdds: 0.95,
    demographicParity: 0.93,
  };

  return {
    validationResult: "passed",
    biasAnalysis: stage.metrics,
    explainabilityScore: 0.8,
    recommendations: ["monitor_performance", "regular_retraining"],
  };
}

function executeModelDeployment(
  stage: PipelineStage,
  _context: Record<string, any>,
): any {
  stage.metrics.deploymentSuccess = true;
  stage.metrics.deploymentTime = Math.random() * 300000 + 60000; // 1-6 minutes

  return {
    deploymentStatus: "success",
    endpoint: "https://api.example.com/predict",
    version: "1.0.0",
    infrastructure: "kubernetes",
    scaling: { minInstances: 2, maxInstances: 10 },
  };
}

function executeDataDriftDetection(
  stage: PipelineStage,
  _context: Record<string, any>,
): any {
  stage.metrics.driftDetected = false;
  stage.metrics.driftScore = 0.02;
  stage.metrics.featuresWithDrift = [];

  return {
    driftAnalysis: {
      detected: stage.metrics.driftDetected,
      score: stage.metrics.driftScore,
      threshold: 0.05,
      affectedFeatures: stage.metrics.featuresWithDrift,
    },
    recommendation: "no_action_needed",
  };
}

function executeModelMonitoring(
  stage: PipelineStage,
  _context: Record<string, any>,
): any {
  stage.metrics.monitoringActive = true;
  stage.metrics.alertsConfigured = 5;
  stage.metrics.dashboardUrl = "https://monitoring.example.com/dashboard";

  return {
    monitoringSetup: {
      active: stage.metrics.monitoringActive,
      dashboardUrl: stage.metrics.dashboardUrl,
      alerts: ["accuracy_drop", "latency_increase", "error_rate_spike"],
      updateFrequency: "5_minutes",
    },
  };
}

function executeABTesting(
  stage: PipelineStage,
  _context: Record<string, any>,
): any {
  stage.metrics.testActive = true;
  stage.metrics.trafficSplit = 0.1;
  stage.metrics.conversionLift = 0.05;

  return {
    abTestSetup: {
      active: stage.metrics.testActive,
      trafficSplit: stage.metrics.trafficSplit,
      variants: ["control", "treatment"],
      metrics: ["conversion_rate", "revenue_per_user"],
      estimatedDuration: "14_days",
    },
  };
}

function executeCustomScript(
  stage: PipelineStage,
  _context: Record<string, any>,
): any {
  stage.metrics.scriptExecuted = true;
  stage.metrics.executionTime = Math.random() * 60000 + 5000; // 5-65 seconds

  return {
    scriptResult: "success",
    output: "Custom script completed successfully",
    artifacts: ["custom_output.json"],
  };
}

// Helper functions
function generateExecutionId(): string {
  return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function retryStage(
  stage: PipelineStage,
  _context: Record<string, any>,
): Promise<boolean> {
  for (let attempt = 1; attempt <= stage.retryPolicy.maxRetries; attempt++) {
    try {
      const delay = stage.retryPolicy.exponentialBackoff
        ? stage.retryPolicy.retryDelay * Math.pow(2, attempt - 1)
        : stage.retryPolicy.retryDelay;

      await new Promise((resolve) => setTimeout(resolve, delay * 1000));

      stage.logs.push(`Retry attempt ${attempt} for stage: ${stage.stageName}`);
      await executeStage(stage, context);

      stage.status = "completed";
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
        !processed.has(stage.stageName) &&
        stage.dependencies.every((dep) => processed.has(dep)),
    );

    if (currentGroup.length === 0) {
      throw new Error("Circular dependency detected in pipeline stages");
    }

    groups.push(currentGroup);
    currentGroup.forEach((stage) => processed.add(stage.stageName));
  }

  return groups;
}

function evaluateStageConditions(
  stage: PipelineStage,
  _context: Record<string, any>,
): boolean {
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
      throw new Error("Circular dependency detected");
    }
    if (visited.has(stage.stageName)) {
      return;
    }

    visiting.add(stage.stageName);

    for (const depName of stage.dependencies) {
      const depStage = stages.find((s) => s.stageName === depName);
      if (depStage) {
        visit(depStage);
      }
    }

    visiting.delete(stage.stageName);
    visited.add(stage.stageName);
    result.push(stage);
  };

  stages.forEach(visit);
  return result;
}

function calculateOverallMetrics(stages: PipelineStage[]): Record<string, any> {
  const completedStages = stages.filter((s) => s.status === "completed");
  const failedStages = stages.filter((s) => s.status === "failed");

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
    status: "deployed",
    target: config.deploymentTarget,
    strategy: config.deploymentStrategy,
    scaling: config.scalingConfig,
  };
}

async function setupMonitoring(
  pipeline: PipelineExecution,
  config: any,
): Promise<any> {
  // Simulate monitoring setup
  return {
    monitoringId: `monitor_${Date.now()}`,
    platform: config.platform,
    dashboardUrl: `https://monitoring.example.com/pipeline/${pipeline.id}`,
    alerts: config.metricsToTrack,
    status: "active",
  };
}

async function initializeExperiment(
  _config: any,
  _pipeline: PipelineExecution,
): Promise<string> {
  // Simulate experiment initialization
  return `experiment_${Date.now()}`;
}

async function finalizeExperiment(
  _config: any,
  experimentId: string,
  metrics: Record<string, any>,
): Promise<void> {
  // Simulate experiment finalization
  console.log(`Finalizing experiment ${experimentId} with metrics:`, metrics);
}

// Validation functions
function validatePipelineConfig(config: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.pipelineName) {
    errors.push("Pipeline name is required");
  }
  if (!config.pipelineType) {
    errors.push("Pipeline type is required");
  }
  if (!config.executionMode) {
    errors.push("Execution mode is required");
  }

  return { valid: errors.length === 0, errors };
}

function validateStages(stages: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!stages || !Array.isArray(stages.stage) || stages.stage.length === 0) {
    errors.push("At least one stage is required");
  } else {
    stages.stage.forEach((stage: any, index: number) => {
      if (!stage.stageName) {
        errors.push(`Stage ${index + 1}: Stage name is required`);
      }
      if (!stage.stageType) {
        errors.push(`Stage ${index + 1}: Stage type is required`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

function validateDataConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.dataSourceType) {
    errors.push("Data source type is required");
  }
  if (!config.dataFormat) {
    errors.push("Data format is required");
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
      const deps = stage.dependencies.split(",").map((d: string) => d.trim());
      deps.forEach((dep: string) => {
        if (dep && !stageNames.has(dep)) {
          errors.push(
            `Stage "${stage.stageName}" depends on non-existent stage "${dep}"`,
          );
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
    cpu: "2 cores",
    memory: "8 GB",
    gpu: stages.stage.some((s: any) => s.stageType === "model_training")
      ? "1 GPU"
      : "none",
    storage: "50 GB",
    estimatedCost: "$5-15/hour",
  };
}
