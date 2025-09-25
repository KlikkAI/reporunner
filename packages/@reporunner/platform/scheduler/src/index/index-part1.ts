export interface ScheduleDefinition {
  id: string;
  name: string;
  description?: string;
  workflowId: string;
  organizationId: string;
  type: 'cron' | 'interval' | 'once' | 'webhook';
  schedule: {
    cron?: string;
    interval?: number; // milliseconds
    runAt?: Date;
    timezone?: string;
  };
  enabled: boolean;
  maxRuns?: number;
  currentRuns: number;
  lastRun?: Date;
  nextRun?: Date;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
  notifications: {
    onSuccess?: string[];
    onFailure?: string[];
    onMaxRetries?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  workflowId: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  attempts: number;
  nextRetryAt?: Date;
}

export interface SchedulerConfig {
  maxConcurrentJobs: number;
  defaultTimezone: string;
  cleanupInterval: number; // hours
  retentionDays: number;
}

export class WorkflowScheduler {
  private schedules = new Map<string, ScheduleDefinition>();
  private executions = new Map<string, ScheduleExecution>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private config: SchedulerConfig;
  private running = false;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = {
      maxConcurrentJobs: 10,
      defaultTimezone: 'UTC',
      cleanupInterval: 24,
      retentionDays: 30,
      ...config,
    };
  }

  async start(): Promise<void> {
    if (this.running) return;

    this.running = true;

    // Start all enabled schedules
    for (const schedule of this.schedules.values()) {
      if (schedule.enabled) {
        await this.startSchedule(schedule.id);
      }
    }

    // Start cleanup interval
    setInterval(
      () => {
        this.cleanupOldExecutions();
      },
      this.config.cleanupInterval * 60 * 60 * 1000
    );
  }

  async stop(): Promise<void> {
    this.running = false;

    // Clear all intervals
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }
