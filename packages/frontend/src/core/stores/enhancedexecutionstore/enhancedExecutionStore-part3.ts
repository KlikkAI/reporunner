}))
},

    subscribeToExecution: async (executionId: string) =>
{
      const state = get();

      if (state.subscriptions.has(executionId)) {
        return; // Already subscribed
      }

      const handleExecutionEvent: ExecutionEventHandler = (event: ExecutionEvent) => {
        const currentState = get();

        switch (event.type) {
          case 'execution_started':
            set({
              currentExecution: currentState.currentExecution
                ? {
                    ...currentState.currentExecution,
                    status: 'running',
                    startTime: event.timestamp,
                  }
                : null,
              lastUpdateTimestamp: event.timestamp,
            });
            break;

          case 'execution_completed':
            set({
              currentExecution: currentState.currentExecution
                ? {
                    ...currentState.currentExecution,
                    status: 'completed',
                    endTime: event.timestamp,
                    duration: event.data.duration,
                  }
                : null,
              lastUpdateTimestamp: event.timestamp,
            });

            if (currentState.currentExecution) {
              get().addExecutionToHistory(currentState.currentExecution);
            }
            break;

          case 'execution_failed':
            set({
              currentExecution: currentState.currentExecution
                ? {
                    ...currentState.currentExecution,
                    status: 'failed',
                    endTime: event.timestamp,
                    error: event.data.error,
                    duration: event.data.duration,
                  }
                : null,
              lastUpdateTimestamp: event.timestamp,
            });

            if (currentState.currentExecution) {
              get().addExecutionToHistory(currentState.currentExecution);
            }
            break;

          case 'node_started':
            get().updateNodeState(event.data.nodeId, {
              status: 'running',
              startTime: event.timestamp,
              inputData: event.data.inputData,
            });

            set((state) => ({
              activeNodes: new Set([...state.activeNodes, event.data.nodeId]),
              pendingNodes: new Set(
                [...state.pendingNodes].filter((id) => id !== event.data.nodeId)
              ),
              progress: {
                ...state.progress!,
                currentNodeId: event.data.nodeId,
              },
            }));
            break;

          case 'node_completed': {
            const completionTime = Date.now();
            const nodeState = currentState.nodeStates.get(event.data.nodeId);
            const executionTime = nodeState?.startTime
              ? completionTime - new Date(nodeState.startTime).getTime()
              : 0;

            get().updateNodeState(event.data.nodeId, {
              status: 'completed',
              endTime: event.timestamp,
              duration: executionTime,
              outputData: event.data.outputData,
            });

            set((state) => {
              const newActiveNodes = new Set(state.activeNodes);
              newActiveNodes.delete(event.data.nodeId);
