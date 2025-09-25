duration: result.duration,
          progress,
},
      })
}
  }

  private async executeNode(
    node: IWorkflowNode,
    context: ExecutionContext,
    nodeOutputs: Map<string, any>,
    execution: IExecution
  ): Promise<NodeExecutionResult>
{
  const startTime = Date.now();

  try {
    // Update node execution status
    await execution.updateNodeExecution(node.id, {
      status: 'running',
      startTime: new Date(),
    });

    // Get node inputs from previous nodes
    const nodeInputs = this.buildNodeInputs(node, nodeOutputs);

    // Execute the node based on its type
    const output = await this.executeNodeByType(node, context, nodeInputs);

    const duration = Date.now() - startTime;

    // Update node execution with success
    await execution.updateNodeExecution(node.id, {
      status: 'success',
      endTime: new Date(),
      duration,
      input: nodeInputs,
      output,
    });

    return {
        success: true,
        output,
        duration,
      };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Update node execution with error
    await execution.updateNodeExecution(node.id, {
      status: 'error',
      endTime: new Date(),
      duration,
      error: {
        message: errorObj.message,
        stack: errorObj.stack,
      },
    });

    return {
        success: false,
        error: errorObj,
        duration,
      };
  }
}

private
buildEdgeMap(edges: IWorkflowEdge[])
: Map<string, IWorkflowEdge[]>
{
  const edgeMap = new Map<string, IWorkflowEdge[]>();

  for (const edge of edges) {
    if (!edgeMap.has(edge.source)) {
      edgeMap.set(edge.source, []);
    }
    edgeMap.get(edge.source)?.push(edge);
  }

  return edgeMap;
}

private
buildNodeInputs(node: IWorkflowNode, nodeOutputs: Map<string, any>)
: Record<string, any>
{
    const inputs: Record<string, any> = {};

    // Add outputs from all previous nodes to inputs
    // This allows condition nodes to access data like llmResponse.output.is_customer_support_request
    for (const [nodeId, output] of nodeOutputs.entries()) {
      // Use the node ID as the key to avoid naming conflicts
      inputs[nodeId] = output;

      // Also flatten common properties to root level for easier access
      if (output && typeof output === 'object') {
        // If output has common properties, make them accessible at root level
        if (output.output !== undefined) inputs.output = output.output;
        if (output.data !== undefined) inputs.data = output.data;
        if (output.result !== undefined) inputs.result = output.result;
        if (output.response !== undefined) inputs.response = output.response;
      }
    }

// Add node configuration as inputs (for backwards compatibility)
