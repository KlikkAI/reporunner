export interface QueueItem {
  id: string;
  workflowId: string;
  priority: number;
  scheduledAt: Date;
  attempts: number;
  data: Record<string, any>;
}

export interface QueueConfig {
  maxSize: number;
  retryDelay: number;
  maxRetries: number;
}

export class ExecutionQueue {
  private queue: QueueItem[] = [];

  async enqueue(_item: Omit<QueueItem, 'id' | 'attempts'>): Promise<string> {
    // TODO: Implement queue enqueue
    return 'placeholder-id';
  }

  async dequeue(): Promise<QueueItem | null> {
    // TODO: Implement queue dequeue
    return null;
  }

  async size(): Promise<number> {
    return this.queue.length;
  }

  async clear(): Promise<void> {
    this.queue = [];
  }
}
