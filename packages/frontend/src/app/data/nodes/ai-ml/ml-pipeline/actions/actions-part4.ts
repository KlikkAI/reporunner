for (const group of stageGroups) {
  const promises = group.map(async (stage) => {
    try {
      stage.status = 'running';
      stage.startTime = new Date();
      stage.logs.push(`Starting stage: ${stage.stageName}`);

      const stageResult = await executeStage(stage, results);
      results[stage.stageName] = stageResult;

      stage.status = 'completed';
      stage.endTime = new Date();
      stage.logs.push(`Completed stage: ${stage.stageName}`);

      return { stage: stage.stageName, result: stageResult };
    } catch (error: any) {
      stage.status = 'failed';
      stage.endTime = new Date();
      stage.logs.push(`Failed stage: ${stage.stageName} - ${error.message}`);
      throw error;
    }
  });

  await Promise.all(promises);
}

return results;
}

async
function executeConditionalPipeline(
  pipeline: PipelineExecution,
  inputData: any
): Promise<Record<string, any>> {
  const results: Record<string, any> = { inputData };

  for (const stage of pipeline.stages) {
    // Check if stage should be executed based on conditions
    const shouldExecute = evaluateStageConditions(stage, results);

    if (!shouldExecute) {
      stage.status = 'skipped';
      stage.logs.push(`Skipped stage: ${stage.stageName} - condition not met`);
      continue;
    }

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
      throw error;
    }
  }

  return results;
}

async function executeDAGPipeline(
  pipeline: PipelineExecution,
  inputData: any
): Promise<Record<string, any>> {
  const results: Record<string, any> = { inputData };
  const executed = new Set<string>();
  const inProgress = new Set<string>();

  // Topological sort of stages
  const sortedStages = topologicalSort(pipeline.stages);

  const executeStageWithDependencies = async (stage: PipelineStage): Promise<void> => {
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
      stage.status = 'running';
      stage.startTime = new Date();
      stage.logs.push(`Starting stage: ${stage.stageName}`);

      const stageResult = await executeStage(stage, results);
