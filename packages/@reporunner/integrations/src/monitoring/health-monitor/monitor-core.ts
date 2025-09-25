import { EventEmitter } from 'node:events';

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthStatus>;
  interval?: number; // milliseconds
  timeout?: number; // milliseconds
  critical?: boolean;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, any>;
  timestamp?: Date;
  responseTime?: number;
}

export interface IntegrationHealth {
  integrationName: string;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, HealthStatus>;
  lastChecked: Date;
  uptime: number;
  metrics?: IntegrationMetrics;
}

export interface IntegrationMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  successRate: number;
  lastError?: {
    message: string;
    timestamp: Date;
  };
}

export class IntegrationHealthMonitor extends EventEmitter {
  private healthChecks: Map<string, Map<string, HealthCheck>> = new Map();
  private healthStatuses: Map<string, IntegrationHealth> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private metrics: Map<string, IntegrationMetrics> = new Map();
  private startTimes: Map<string, Date> = new Map();
  private globalInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.startGlobalHealthCheck();
  }

  /**
   * Register health checks for an integration
   */
  registerHealthChecks(integrationName: string, checks: HealthCheck[]): void {
    if (!this.healthChecks.has(integrationName)) {
      this.healthChecks.set(integrationName, new Map());
      this.startTimes.set(integrationName, new Date());
      this.initializeMetrics(integrationName);
    }

    const integrationChecks = this.healthChecks.get(integrationName)!;

    for (const check of checks) {
      integrationChecks.set(check.name, check);

      // Start individual check interval if specified
      if (check.interval) {
        this.startCheckInterval(integrationName, check);
      }
    }

    this.emit('checks:registered', {
      integrationName,
      checkCount: checks.length,
    });
  }

  /**
   * Initialize metrics for integration
   */
  private initializeMetrics(integrationName: string): void {
    this.metrics.set(integrationName, {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      successRate: 100,
    });
  }

  /**
   * Start interval for specific check
   */
  private startCheckInterval(integrationName: string, check: HealthCheck): void {
    const intervalKey = `${integrationName}:${check.name}`;

    // Clear existing interval if any
    const existingInterval = this.checkIntervals.get(intervalKey);
    if (existingInterval) {
      clearInterval(existingInterval);
