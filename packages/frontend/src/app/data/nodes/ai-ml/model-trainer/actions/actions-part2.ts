},
{
  name: 'confidence', type;
  : 'number' as
  const,
                required: true,
                description: 'Prediction confidence',
}
,
            ],
            validation:
{
  required: ['prediction', 'confidence'],
}
,
          },
          capabilities: getModelCapabilities(modelConfig.modelType),
        },
        metrics:
{
  accuracy: 0, trainingTime;
  : 0,
          inferenceTime: 50,
          modelSize: 1024 * 1024 * 100, // 100MB initial estimate
          memoryUsage: hardwareConfig.gpuMemoryLimit ? hardwareConfig.gpuMemoryLimit * 1024 : 2048,
          throughput: 10,
          lastEvaluatedAt: new Date(),
          customMetrics:
  {
  }
  ,
}
,
        training:
{
  dataset: {
    id: `dataset_${Date.now()}`, name;
    : 'Training Dataset',
            source: 'upload' as
    const,
            location: 'workflow_input',
            format: 'json'
    as;
    const,
            size: JSON.stringify
    inputData.length, samples;
    : inputData.length,
            features: Object.keys(firstRow).length,
            preprocessingSteps: [
    {
      type: 'tokenize' as const, parameters;
      :
      {
        max_length: dataConfig.maxLength || 512;
      }
      ,
                order: 1,
    }
    ,
            ],
  }
  ,
          augmentation: dataAugmentation.enabled
            ?
  {
    techniques: (dataAugmentation.textAugmentation || dataAugmentation.imageAugmentation || []).map(
      (technique: string) => ({
        type: technique,
        parameters: {},
        weight: 1.0,
      })
    ),
      probability;
    : dataAugmentation.augmentationProbability || 0.3,
                preserveLabels: true,
  }
  : undefined,
          splitRatio:
  {
    train: dataConfig.trainSplit, validation;
    : dataConfig.validationSplit,
            test: dataConfig.testSplit,
  }
  ,
          epochs: trainingConfig.epochs,
          batchSize: trainingConfig.batchSize,
          optimizer:
  {
    type: trainingConfig.optimizer, learningRate;
    : trainingConfig.learningRate,
            weightDecay: trainingConfig.weightDecay,
  }
  ,
          earlyStopping: advancedOptions.enableEarlyStopping
            ?
  {
    metric: 'validation_loss', patience;
    : advancedOptions.earlyStopping?.patience || 3,
                minDelta: advancedOptions.earlyStopping?.minDelta || 0.001,
                mode: 'min' as
    const,
                restoreBestWeights: true,
  }
  : undefined,
          checkpointing:
  {
    saveFrequency: advancedOptions.checkpointFrequency || 1, saveOptimizer;
    : advancedOptions.saveCheckpoints || true,
            maxToKeep: 3,
            saveFormat: 'pytorch' as
    const,
  }
  ,
          distributedTraining: hardwareConfig.distributedTraining
            ?
  {
    strategy: 'data_parallel' as const, nodes;
    : 1,
                gpusPerNode: hardwareConfig.numGpus || 2,
                backend: 'nccl' as
    const,
  }
  : undefined,
}
,
        createdBy: context.userId || 'system',
        tags: [
          modelConfig.modelType,
          trainingConfig.optimizer,
          `$
{
  trainingConfig.epochs;
}
_epochs`,
          'workflow_trained',
        ],
