while (executeQueue.length > 0) {
      const currentNode = executeQueue.shift()!;

      if (executedNodes.has(currentNode.id)) {
        continue;
      }

      // Check if all dependencies are satisfied
      const incomingEdges = workflow.edges.filter((edge) => edge.target === currentNode.id);
      const dependenciesSatisfied = incomingEdges.every((edge) => executedNodes.has(edge.source));

      if (!dependenciesSatisfied) {
        // Put back in queue and continue
        executeQueue.push(currentNode);
        continue;
      }

      // Execute the node
      io.to(`execution:${context.executionId}`).emit('execution_event', {
        type: 'node_started',
        executionId: context.executionId,
        timestamp: new Date().toISOString(),
        data: { nodeId: currentNode.id, nodeName: currentNode.data?.label },
      });

      const result = await this.executeNode(currentNode, context, nodeOutputs, execution);

      if (!result.success && workflow.settings.errorHandling === 'stop') {
        throw result.error || new Error(`Node execution failed: ${currentNode.id}`);
      }

      executedNodes.add(currentNode.id);
      if (result.output) {
        nodeOutputs.set(currentNode.id, result.output);
      }

      // Add next nodes to queue with conditional routing support
      const outgoingEdges = edgeMap.get(currentNode.id) || [];

      // Handle conditional routing for condition nodes
      if (currentNode.type === 'condition' && result.output?.outputPath) {
        // Only follow the edge that matches the condition result
        const matchingEdge = outgoingEdges.find(
          (edge) =>
            edge.sourceHandle === result.output?.outputPath ||
            edge.sourceHandle === result.output?.matchedRule ||
            edge.sourceHandle === 'default'
        );

        if (matchingEdge) {
          const nextNode = nodeMap.get(matchingEdge.target);
          if (nextNode && !executedNodes.has(nextNode.id)) {
            logger.info(
              `Condition routing: ${currentNode.id} -> ${nextNode.id} via ${result.output.outputPath}`
            );
            executeQueue.push(nextNode);
          }
        } else {
          logger.warn(`No matching edge found for condition output: ${result.output.outputPath}`);
          // Try to find default edge if specific output path not found
          const defaultEdge = outgoingEdges.find(
            (edge) =>
              edge.sourceHandle === 'default' ||
              edge.sourceHandle === result.output?.defaultOutput ||
              !edge.sourceHandle // Fallback for edges without specific handles
          );
          if (defaultEdge) {
            const nextNode = nodeMap.get(defaultEdge.target);
            if (nextNode && !executedNodes.has(nextNode.id)) {
              logger.info(`Using default routing: ${currentNode.id} -> ${nextNode.id}`);
              executeQueue.push(nextNode);
            }
          }
        }
      } else {
        // Standard routing for non-condition nodes
        for (const edge of outgoingEdges) {
          const nextNode = nodeMap.get(edge.target);
          if (nextNode && !executedNodes.has(nextNode.id)) {
            executeQueue.push(nextNode);
          }
        }
      }

      // Emit progress and node completion update
      const progress = (executedNodes.size / workflow.nodes.length) * 100;
      this.emit('execution:progress', {
        executionId: context.executionId,
        nodeId: currentNode.id,
        progress,
      });
      io.to(`execution:${context.executionId}`).emit('execution_event', {
        type: result.success ? 'node_completed' : 'node_failed',
        executionId: context.executionId,
        timestamp: new Date().toISOString(),
        data: {
          nodeId: currentNode.id,
          nodeName: currentNode.data?.label,
          output: result.output,
          error: result.error?.message,
