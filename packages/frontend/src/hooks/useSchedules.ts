/**
 * Frontend Schedule Hooks
 * React hooks for workflow scheduling (calls backend API)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ScheduledWorkflow {
  id: string;
  workflowId: string;
  schedule: string;
  enabled: boolean;
  timezone?: string;
  nextRun?: string;
  lastRun?: string;
  metadata?: Record<string, any>;
}

export interface ScheduleConfiguration {
  type: 'cron' | 'interval' | 'once';
  cronExpression?: string;
  interval?: number;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  maxRuns?: number;
}

export interface ScheduledExecution {
  id: string;
  workflowId: string;
  scheduledTime: string;
  executionTime?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
}

/**
 * Hook to list workflow schedules
 */
export const useSchedules = (workflowId?: string) => {
  return useQuery({
    queryKey: ['schedules', { workflowId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workflowId) params.append('workflowId', workflowId);

      const response = await fetch(`/api/schedules?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to get a specific schedule
 */
export const useSchedule = (scheduleId: string) => {
  return useQuery({
    queryKey: ['schedules', scheduleId],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/${scheduleId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      return response.json();
    },
    enabled: !!scheduleId,
  });
};

/**
 * Hook to create a schedule
 */
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: {
      workflowId: string;
      config: ScheduleConfiguration;
      metadata?: Record<string, any>;
    }) => {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedule),
      });

      if (!response.ok) {
        throw new Error('Failed to create schedule');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch schedules
      queryClient.invalidateQueries({ queryKey: ['schedules'] });

      // Add the new schedule to the cache
      queryClient.setQueryData(['schedules', data.data.id], data);
    },
  });
};

/**
 * Hook to update a schedule
 */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: Partial<ScheduledWorkflow>
    }) => {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the specific schedule in cache
      queryClient.setQueryData(['schedules', variables.id], data);

      // Invalidate schedules list
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

/**
 * Hook to delete a schedule
 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      return response.json();
    },
    onSuccess: (_, scheduleId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['schedules', scheduleId] });

      // Invalidate schedules list
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

/**
 * Hook to toggle schedule (enable/disable)
 */
export const useToggleSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduleId, enabled }: { scheduleId: string; enabled: boolean }) => {
      const response = await fetch(`/api/schedules/${scheduleId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle schedule');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific schedule and schedules list
      queryClient.invalidateQueries({ queryKey: ['schedules', variables.scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

/**
 * Hook to manually trigger a scheduled workflow
 */
export const useTriggerSchedule = () => {
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await fetch(`/api/schedules/${scheduleId}/trigger`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to trigger schedule');
      }

      return response.json();
    },
  });
};

/**
 * Hook to get scheduled executions
 */
export const useScheduledExecutions = (workflowId?: string) => {
  return useQuery({
    queryKey: ['schedules', 'executions', { workflowId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workflowId) params.append('workflowId', workflowId);

      const response = await fetch(`/api/schedules/executions?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch scheduled executions');
      }

      return response.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });
};

/**
 * Hook to get schedule analytics
 */
export const useScheduleAnalytics = () => {
  return useQuery({
    queryKey: ['schedules', 'analytics'],
    queryFn: async () => {
      const response = await fetch('/api/schedules/analytics');

      if (!response.ok) {
        throw new Error('Failed to fetch schedule analytics');
      }

      return response.json();
    },
    staleTime: 60000, // 1 minute
  });
};
