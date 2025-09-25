}

// Check if all dependencies are executed
const dependencies = this.getNodeDependencies(node.id, workflow.edges);
const allDependenciesExecuted = dependencies.every((depId) => executedNodes.has(depId));

if (!allDependenciesExecuted) {
  // Re-queue this node
  nodesToExecute.push(node);
  continue;
}

// Get input data
const inputData =
  node.type === NodeType.TRIGGER
    ? triggerData
    : this.getNodeInputData(node, workflow.edges, context.nodeResults);

// Execute node
const result = await this.executeNode(node, context, inputData);

// Store result
context.nodeResults.set(node.id, result);
results[node.id] = result;
executedNodes.add(node.id);

// Add downstream nodes to queue
const downstreamNodes = this.getDownstreamNodes(node.id, workflow.nodes, workflow.edges);
nodesToExecute.push(...downstreamNodes.filter((n) => !executedNodes.has(n.id)));

// Check for conditional branches
if (node.type === NodeType.CONDITIONAL) {
  this.handleConditionalBranching(node, result, workflow.edges, nodesToExecute);
}
}

return results;
}

  /**
   * Execute individual node
   */
  private async executeNode(
    node: INode,
    context: ExecutionContext,
    inputData: any
  ): Promise<INodeExecutionData>
{
  const startTime = Date.now();

  try {
    // Get executor for node type
    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      throw new ExecutionError(
        `No executor found for node type: ${node.type}`,
        ERROR_CODES.WORKFLOW_INVALID
      );
    }

    // Execute with timeout
    const timeout =
      node.properties?.timeout || this.config.maxExecutionTime || SYSTEM.MAX_EXECUTION_TIME;
    const result = await this.executeWithTimeout(
      executor.execute(node, context, inputData),
      timeout
    );

    return {
        startTime,
        executionTime: Date.now() - startTime,
        executionStatus: ExecutionStatus.SUCCESS,
        data: result,
      };
  } catch (error) {
    const shouldContinue = node.continueOnError || false;

    if (!shouldContinue) {
      throw error;
    }

    return {
        startTime,
        executionTime: Date.now() - startTime,
        executionStatus: ExecutionStatus.FAILED,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          node: node.id,
          timestamp: new Date(),
          context: { nodeType: node.type, nodeId: node.id },
        },
      };
  }
}

/**
 * Execute with timeout
 */
private
async;
executeWithTimeout<T>(promise: Promise<T>, timeout: number)
: Promise<T>
{
    return Promise.race([
