if (dataConfig.dataSourceType === 'workflow_input' && (!inputData || !Array.isArray(inputData))) {
  throw new Error('Input data is required when using workflow input as data source');
}

// Process stages based on execution mode
let stageResults: Record<string, any> = {};

switch (pipelineConfig.executionMode) {
  case 'sequential':
    stageResults = await executeSequentialPipeline(pipelineExecution, inputData);
    break;
  case 'parallel':
    stageResults = await executeParallelPipeline(pipelineExecution, inputData);
    break;
  case 'conditional':
    stageResults = await executeConditionalPipeline(pipelineExecution, inputData);
    break;
  case 'dag':
    stageResults = await executeDAGPipeline(pipelineExecution, inputData);
    break;
  default:
    throw new Error(`Unsupported execution mode: ${pipelineConfig.executionMode}`);
}

// Complete pipeline execution
pipelineExecution.status = 'completed';
pipelineExecution.endTime = new Date();
pipelineExecution.totalDuration =
  pipelineExecution.endTime.getTime() - pipelineExecution.startTime.getTime();

// Calculate overall metrics
pipelineExecution.overallMetrics = calculateOverallMetrics(pipelineExecution.stages);

// Handle model deployment if configured
let deploymentInfo: any = null;
if (deploymentConfig.autoDeploy && stageResults.trainedModel) {
  deploymentInfo = await deployModel(stageResults.trainedModel, deploymentConfig);
  pipelineExecution.artifacts.deploymentInfo = deploymentInfo;
}

// Setup monitoring if enabled
let monitoringInfo: any = null;
if (monitoringConfig.enabled) {
  monitoringInfo = await setupMonitoring(pipelineExecution, monitoringConfig);
  pipelineExecution.artifacts.monitoringInfo = monitoringInfo;
}

// Finalize experiment tracking
if (experimentTracking.enabled && pipelineExecution.artifacts.experimentId) {
  await finalizeExperiment(
    experimentTracking,
    pipelineExecution.artifacts.experimentId,
    pipelineExecution.overallMetrics
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
                stagesCompleted: pipelineExecution.stages.filter((s) => s.status === 'completed')
                  .length,
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
} catch (error: any)
{
      return {
        success: false,
