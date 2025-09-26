error: error.message || 'Pipeline execution failed', data;
: [
{
  error: error.message, pipelineName;
  : pipelineConfig.pipelineName,
              timestamp: new Date().toISOString(),
  ,
}
,
        ],
        metadata:
{
  executionTime: Date.now() - context.startTime,
}
,
      }
}
  },

  async test(context: NodeExecutionContext): Promise<NodeActionResult>
{
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
              ? 'Pipeline configuration is valid'
              : 'Pipeline has validation errors',
          },
        },
      ],
      metadata: {
        executionTime: Date.now() - context.startTime,
      },
    };
}
,
}

// Pipeline execution functions
async
function executeSequentialPipeline(
  pipeline: PipelineExecution,
  inputData: any
): Promise<Record<string, any>> {
  const results: Record<string, any> = { inputData };

  for (const stage of pipeline.stages) {
    try {
      stage.status = 'running';
      stage.startTime = new Date();
      stage.logs.push(`Starting stage: ${stage.stageName}`);

      const stageResult = await executeStage(stage, results);
      results[stage.stageName] = stageResult;

      stage.status = 'completed';
      stage.endTime = new Date();
      stage.logs.push(`Completed stage: ${stage.stageName}`);
    } catch (error: any) {
      stage.status = 'failed';
      stage.endTime = new Date();
      stage.logs.push(`Failed stage: ${stage.stageName} - ${error.message}`);

      // Attempt retry if configured
      if (stage.retryPolicy.maxRetries > 0) {
        const retrySuccess = await retryStage(stage, results);
        if (!retrySuccess) {
          throw new Error(
            `Stage ${stage.stageName} failed after ${stage.retryPolicy.maxRetries} retries`
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
  inputData: any
): Promise<Record<string, any>> {
  const results: Record<string, any> = { inputData };

  // Group stages by dependencies
  const stageGroups = groupStagesByDependencies(pipeline.stages);
