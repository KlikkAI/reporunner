import type { NotificationRequest } from './index';

export interface QueueJob {
  id: string;
  request: NotificationRequest;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  createdAt: Date;
}

export interface QueueConfig {
  maxAttempts: number;
  retryDelay: number;
  concurrency: number;
}

export class NotificationQueue {
  private jobs = new Map<string, QueueJob>();
  private processing = false;
  private config: QueueConfig;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      retryDelay: 5000, // 5 seconds
      concurrency: 10,
      ...config,
    };
  }

  async enqueue(request: NotificationRequest): Promise<string> {
    const job: QueueJob = {
      id: this.generateId(),
      request,
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
      scheduledAt: request.scheduledAt || new Date(),
      createdAt: new Date(),
    };

    this.jobs.set(job.id, job);

    if (!this.processing) {
      this.startProcessing();
    }

    return job.id;
  }

  async enqueueBulk(requests: NotificationRequest[]): Promise<string[]> {
    return Promise.all(requests.map((request) => this.enqueue(request)));
  }

  async getJob(id: string): Promise<QueueJob | undefined> {
    return this.jobs.get(id);
  }

  async getJobs(status?: 'pending' | 'processing' | 'completed' | 'failed'): Promise<QueueJob[]> {
    const jobs = Array.from(this.jobs.values());

    if (!status) {
      return jobs;
    }

    // TODO: Implement status filtering based on job state
    return jobs;
  }

  async deleteJob(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async clear(): Promise<void> {
    this.jobs.clear();
  }

  private async startProcessing(): Promise<void> {
    this.processing = true;

    while (this.processing && this.jobs.size > 0) {
      const readyJobs = Array.from(this.jobs.values())
        .filter((job) => job.scheduledAt <= new Date() && job.attempts < job.maxAttempts)
        .slice(0, this.config.concurrency);

      if (readyJobs.length === 0) {
        await this.sleep(1000);
        continue;
      }

      await Promise.all(readyJobs.map((job) => this.processJob(job)));
    }

    this.processing = false;
  }

  private async processJob(job: QueueJob): Promise<void> {
    try {
      job.attempts++;

      // TODO: Integrate with NotificationService to actually send
      // const result = await notificationService.send(job.request);

      // Remove completed job
      this.jobs.delete(job.id);
    } catch (_error) {
      if (job.attempts >= job.maxAttempts) {
        // Mark as failed and remove
        this.jobs.delete(job.id);
      } else {
        // Schedule retry
        job.scheduledAt = new Date(Date.now() + this.config.retryDelay);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  stop(): void {
    this.processing = false;
  }
}
