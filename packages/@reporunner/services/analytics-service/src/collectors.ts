import type { AnalyticsEvent } from './index';

export interface CollectorConfig {
  enabled: boolean;
  sampleRate: number;
  bufferSize: number;
  flushInterval: number;
}

export abstract class BaseCollector {
  protected config: CollectorConfig;
  protected buffer: AnalyticsEvent[] = [];

  constructor(config: Partial<CollectorConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      bufferSize: 100,
      flushInterval: 5000,
      ...config,
    };
  }

  abstract collect(): Promise<void>;

  protected shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  protected addToBuffer(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    if (!this.shouldSample()) return;

    this.buffer.push({
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
    });

    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  protected flush(): void {
    if (this.buffer.length === 0) return;
    this.buffer = [];
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export class WorkflowExecutionCollector extends BaseCollector {
  async collect(): Promise<void> {
    // TODO: Integrate with workflow execution events
    this.addToBuffer({
      userId: 'user-123',
      organizationId: 'org-456',
      eventType: 'workflow',
      eventName: 'execution_started',
      properties: {
        workflowId: 'workflow-789',
        trigger: 'manual',
      },
    });
  }
}

export class UserActivityCollector extends BaseCollector {
  async collect(): Promise<void> {
    // TODO: Integrate with user activity events
    this.addToBuffer({
      userId: 'user-123',
      organizationId: 'org-456',
      eventType: 'user',
      eventName: 'login',
      properties: {
        method: 'password',
      },
    });
  }
}

export class SystemMetricsCollector extends BaseCollector {
  async collect(): Promise<void> {
    // TODO: Collect system metrics
    this.addToBuffer({
      userId: 'system',
      organizationId: 'system',
      eventType: 'system',
      eventName: 'performance_metric',
      properties: {
        cpuUsage: 0.45,
        memoryUsage: 0.67,
        activeConnections: 150,
      },
    });
  }
}

export class APIUsageCollector extends BaseCollector {
  async collect(): Promise<void> {
    // TODO: Integrate with API middleware
    this.addToBuffer({
      userId: 'user-123',
      organizationId: 'org-456',
      eventType: 'api',
      eventName: 'request',
      properties: {
        endpoint: '/api/workflows',
        method: 'GET',
        statusCode: 200,
        responseTime: 45,
      },
    });
  }
}

export class CollectorManager {
  private collectors: BaseCollector[] = [];
  private intervals: NodeJS.Timeout[] = [];

  addCollector(collector: BaseCollector): void {
    this.collectors.push(collector);
  }

  start(): void {
    this.collectors.forEach((collector) => {
      const interval = setInterval(() => {
        collector.collect().catch(console.error);
      }, collector.config.flushInterval);

      this.intervals.push(interval);
    });
  }

  stop(): void {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];
  }

  getCollectors(): BaseCollector[] {
    return this.collectors;
  }
}
