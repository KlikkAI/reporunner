// Define action interfaces locally
type NodeExecutionContext = Record<string, any>;
type NodeActionResult = {
  success: boolean;
  data?: any[];
  error?: string | { message: string; code?: string; details?: any };
  metadata?: Record<string, any>;
};

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
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  logs: string[];
  metrics: Record<string, any>;
}

interface PipelineExecution {
  id: string;
  pipelineName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
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
        throw new Error('Pipeline name is required');
      }

      if (!stages || !Array.isArray(stages.stage) || stages.stage.length === 0) {
        throw new Error('At least one pipeline stage is required');
      }

      // Create pipeline execution
      const pipelineExecution: PipelineExecution = {
        id: generateExecutionId(),
        pipelineName: pipelineConfig.pipelineName,
        status: 'running',
        stages: stages.stage.map((stage: any) => ({
          stageName: stage.stageName,
          stageType: stage.stageType,
          stageConfig:
            typeof stage.stageConfig === 'string'
              ? JSON.parse(stage.stageConfig)
              : stage.stageConfig,
          dependencies: stage.dependencies
            ? stage.dependencies.split(',').map((d: string) => d.trim())
            : [],
          retryPolicy: {
            maxRetries: stage.retryPolicy?.maxRetries || 3,
            retryDelay: stage.retryPolicy?.retryDelay || 30,
            exponentialBackoff: stage.retryPolicy?.exponentialBackoff !== false,
          },
          timeout: stage.timeout || 60,
          status: 'pending',
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
          pipelineExecution
        );
      }

      // Validate input data
      const inputData = context.inputData.main;
