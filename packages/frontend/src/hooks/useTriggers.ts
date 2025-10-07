/**
 * Frontend Trigger Hooks
 * React hooks for trigger management (calls backend API)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface TriggerConfig {
  id: string;
  type: 'webhook' | 'schedule' | 'event' | 'manual';
  workflowId: string;
  enabled: boolean;
  config: Record<string, any>;
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
    value: any;
  }>;
  metadata?: Record<string, any>;
}

export interface TriggerEvent {
  id: string;
  triggerId: string;
  type: string;
  payload: any;
  timestamp: string;
  processed: boolean;
  processingTime?: number;
  result?: any;
  error?: string;
}

/**
 * Hook to list triggers
 */
export const useTriggers = (workflowId?: string, type?: string) => {
  return useQuery({
    queryKey: ['triggers', { workflowId, type }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workflowId) {
        params.append('workflowId', workflowId);
      }
      if (type) {
        params.append('type', type);
      }

      const response = await fetch(`/api/triggers?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch triggers');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to get a specific trigger
 */
export const useTrigger = (triggerId: string) => {
  return useQuery({
    queryKey: ['triggers', triggerId],
    queryFn: async () => {
      const response = await fetch(`/api/triggers/${triggerId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch trigger');
      }

      return response.json();
    },
    enabled: !!triggerId,
  });
};

/**
 * Hook to create a trigger
 */
export const useCreateTrigger = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trigger: Omit<TriggerConfig, 'id'>) => {
      const response = await fetch('/api/triggers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trigger),
      });

      if (!response.ok) {
        throw new Error('Failed to create trigger');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch triggers
      queryClient.invalidateQueries({ queryKey: ['triggers'] });

      // Add the new trigger to the cache
      queryClient.setQueryData(['triggers', data.data.id], data);
    },
  });
};

/**
 * Hook to update a trigger
 */
export const useUpdateTrigger = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TriggerConfig> }) => {
      const response = await fetch(`/api/triggers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update trigger');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the specific trigger in cache
      queryClient.setQueryData(['triggers', variables.id], data);

      // Invalidate triggers list
      queryClient.invalidateQueries({ queryKey: ['triggers'] });
    },
  });
};

/**
 * Hook to delete a trigger
 */
export const useDeleteTrigger = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (triggerId: string) => {
      const response = await fetch(`/api/triggers/${triggerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trigger');
      }

      return response.json();
    },
    onSuccess: (_, triggerId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['triggers', triggerId] });

      // Invalidate triggers list
      queryClient.invalidateQueries({ queryKey: ['triggers'] });
    },
  });
};

/**
 * Hook to test/manually trigger a workflow
 */
export const useTestTrigger = () => {
  return useMutation({
    mutationFn: async ({ triggerId, payload = {} }: { triggerId: string; payload?: any }) => {
      const response = await fetch(`/api/triggers/${triggerId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payload }),
      });

      if (!response.ok) {
        throw new Error('Failed to test trigger');
      }

      return response.json();
    },
  });
};

/**
 * Hook to get trigger events
 */
export const useTriggerEvents = (triggerId: string) => {
  return useQuery({
    queryKey: ['triggers', triggerId, 'events'],
    queryFn: async () => {
      const response = await fetch(`/api/triggers/${triggerId}/events`);

      if (!response.ok) {
        throw new Error('Failed to fetch trigger events');
      }

      return response.json();
    },
    enabled: !!triggerId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
};

/**
 * Hook to get trigger metrics
 */
export const useTriggerMetrics = (triggerId: string) => {
  return useQuery({
    queryKey: ['triggers', triggerId, 'metrics'],
    queryFn: async () => {
      const response = await fetch(`/api/triggers/${triggerId}/metrics`);

      if (!response.ok) {
        throw new Error('Failed to fetch trigger metrics');
      }

      return response.json();
    },
    enabled: !!triggerId,
    staleTime: 60000, // 1 minute
  });
};
