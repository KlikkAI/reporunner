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

// Stub service class
class WorkflowScheduler {
  async getSchedules(): Promise<ScheduledWorkflow[]> {
    return [];
  }
}

export const workflowScheduler = new WorkflowScheduler();
