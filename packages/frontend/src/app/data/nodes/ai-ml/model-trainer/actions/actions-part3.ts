organizationId: context.organizationId,
}

// Create the model
const model = await aiModelService.createModel(modelData);

// Start training
const trainingJob = await aiModelService.startTraining(model.id);

// Prepare training metadata for output
const trainingMetadata = {
  modelId: model.id,
  trainingJobId: trainingJob.id,
  modelName: model.name,
  modelType: model.type,
  status: trainingJob.status,
  progress: trainingJob.progress,
  epochs: {
    current: trainingJob.currentEpoch,
    total: trainingJob.totalEpochs,
  },
  configuration: {
    batchSize: trainingConfig.batchSize,
    learningRate: trainingConfig.learningRate,
    optimizer: trainingConfig.optimizer,
  },
  dataInfo: {
    totalSamples: inputData.length,
    trainSamples: Math.floor(inputData.length * dataConfig.trainSplit),
    validationSamples: Math.floor(inputData.length * dataConfig.validationSplit),
    testSamples: Math.floor(inputData.length * dataConfig.testSplit),
    features: Object.keys(firstRow).length,
  },
  hardware: {
    useGpu: hardwareConfig.useGpu,
    distributedTraining: hardwareConfig.distributedTraining,
    numGpus: hardwareConfig.numGpus || 1,
  },
  outputPath: outputConfig.modelOutputPath,
  exportFormats: outputConfig.exportFormat,
  startedAt: trainingJob.startedAt,
  estimatedCompletionTime: new Date(Date.now() + trainingConfig.epochs * 5000), // 5 seconds per epoch for demo
};

// Return training job information and model metadata
return {
        success: true,
        data: [
          {
            main: {
              model: {
                id: model.id,
                name: model.name,
                type: model.type,
                status: model.status,
              },
              training: trainingMetadata,
              message: `Training started for model '${model.name}' with job ID: ${trainingJob.id}`,
            },
            ai_model: model,
            training_metrics: {
              jobId: trainingJob.id,
              status: trainingJob.status,
              progress: trainingJob.progress,
              metrics: trainingJob.metrics,
              logs: trainingJob.logs,
            },
          },
        ],
        metadata: {
          executionTime: Date.now() - context.startTime,
        },
      };
} catch (error: any)
{
  return {
        success: false,
        error: error.message || 'Failed to start model training',
        data: [
          {
            main: {
              error: error.message,
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

  async test(context: NodeExecutionContext): Promise<NodeActionResult>
{
    const { modelConfig, trainingConfig, dataConfig } = context.node.parameters;

    // Validate configuration without actually training
    const validation = {
      modelConfig: validateModelConfig(modelConfig),
      trainingConfig: validateTrainingConfig(trainingConfig),
      dataConfig: validateDataConfig(dataConfig),
