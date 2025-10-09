// Stub implementation for execution monitoring
export const useExecutionMonitor = (_executionId?: string) => {
  return {
    execution: null,
    executionState: null,
    isConnected: false,
    isLoading: false,
    error: null,
  };
};
