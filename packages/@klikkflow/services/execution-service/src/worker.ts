export interface WorkerConfig {
  maxConcurrency: number;
  heartbeatInterval: number;
  shutdownTimeout: number;
}

export interface WorkerStats {
  id: string;
  status: 'idle' | 'busy' | 'shutdown';
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  uptime: number;
}

export class ExecutionWorker {
  private stats: WorkerStats;

  constructor(_config: WorkerConfig, workerId: string) {
    this.stats = {
      id: workerId,
      status: 'idle',
      activeJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      uptime: 0,
    };
  }

  async start(): Promise<void> {
    this.isRunning = true;
    // TODO: Implement worker startup
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    // TODO: Implement worker shutdown
  }

  getStats(): WorkerStats {
    return { ...this.stats };
  }
}
