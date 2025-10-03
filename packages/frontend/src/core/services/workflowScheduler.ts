/**
 * Workflow Scheduler - Stub
 * This service was removed during consolidation.
 * Minimal types provided for backward compatibility.
 */

export interface ScheduledWorkflow {
  id: string;
  workflowId: string;
  schedule: string;
  enabled: boolean;
}

export interface ScheduleConfiguration {
  type: 'cron' | 'interval' | 'once';
  cronExpression?: string;
  interval?: number;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
}

export interface ScheduledExecution {
  id: string;
  workflowId: string;
  scheduledTime: Date;
  executionTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
}

export interface ScheduleAnalytics {
  totalSchedules: number;
  activeSchedules: number;
  executionCount: number;
  successRate: number;
  upcomingExecutions: ScheduledExecution[];
}

// Stub service class
class WorkflowScheduler {
  async getSchedules(): Promise<ScheduledWorkflow[]> {
    return [];
  }
}

export const workflowScheduler = new WorkflowScheduler();
