import { useCallback, useEffect, useState } from 'react';

export interface UseAsyncState<T> {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: T | null;
}

export interface UseAsyncOptions {
  immediate?: boolean;
}

/**
 * Hook that manages state for an async operation
 */
export function useAsync<T>(asyncFunction: () => Promise<T>, options: UseAsyncOptions = {}) {
  const [state, setState] = useState<UseAsyncState<T>>({
    isLoading: false,
    isError: false,
    error: null,
    data: null,
  });

  const execute = useCallback(async () => {
    setState({
      isLoading: true,
      isError: false,
      error: null,
      data: null,
    });

    try {
      const response = await asyncFunction();
      setState({
        isLoading: false,
        isError: false,
        error: null,
        data: response,
      });
      return response;
    } catch (error) {
      setState({
        isLoading: false,
        isError: true,
        error: error as Error,
        data: null,
      });
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [execute, options.immediate]);

  return {
    ...state,
    execute,
  };
}
