import { EventEmitter } from "events";

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthStatus>;
  interval?: number; // milliseconds
  timeout?: number; // milliseconds
  critical?: boolean;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  message?: string;
  details?: Record<string, any>;
  timestamp?: Date;
  responseTime?: number;
}

export interface IntegrationHealth {
  integrationName: string;
  overallStatus: "healthy" | "degraded" | "unhealthy";
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

    this.emit("checks:registered", {
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
  private startCheckInterval(
    integrationName: string,
    check: HealthCheck,
  ): void {
    const intervalKey = `${integrationName}:${check.name}`;

    // Clear existing interval if any
    const existingInterval = this.checkIntervals.get(intervalKey);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(async () => {
      await this.performSingleCheck(integrationName, check);
    }, check.interval!);

    this.checkIntervals.set(intervalKey, interval);
  }

  /**
   * Perform single health check
   */
  private async performSingleCheck(
    integrationName: string,
    check: HealthCheck,
  ): Promise<HealthStatus> {
    const startTime = Date.now();
    const timeout = check.timeout || 5000;

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<HealthStatus>((_, reject) => {
        setTimeout(() => reject(new Error("Health check timeout")), timeout);
      });

      // Race between check and timeout
      const status = await Promise.race([check.check(), timeoutPromise]);

      status.timestamp = new Date();
      status.responseTime = Date.now() - startTime;

      // Update health status
      this.updateHealthStatus(integrationName, check.name, status);

      return status;
    } catch (error: any) {
      const status: HealthStatus = {
        status: "unhealthy",
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };

      this.updateHealthStatus(integrationName, check.name, status);

      if (check.critical) {
        this.emit("critical:unhealthy", {
          integrationName,
          checkName: check.name,
          error: error.message,
        });
      }

      return status;
    }
  }

  /**
   * Update health status
   */
  private updateHealthStatus(
    integrationName: string,
    checkName: string,
    status: HealthStatus,
  ): void {
    let health = this.healthStatuses.get(integrationName);

    if (!health) {
      health = {
        integrationName,
        overallStatus: "healthy",
        checks: {},
        lastChecked: new Date(),
        uptime: 0,
      };
      this.healthStatuses.set(integrationName, health);
    }

    health.checks[checkName] = status;
    health.lastChecked = new Date();

    // Calculate uptime
    const startTime = this.startTimes.get(integrationName);
    if (startTime) {
      health.uptime = Date.now() - startTime.getTime();
    }

    // Update overall status
    health.overallStatus = this.calculateOverallStatus(health.checks);

    // Attach metrics
    health.metrics = this.metrics.get(integrationName);

    this.emit("status:updated", {
      integrationName,
      checkName,
      status: status.status,
      overallStatus: health.overallStatus,
    });
  }

  /**
   * Calculate overall status
   */
  private calculateOverallStatus(
    checks: Record<string, HealthStatus>,
  ): "healthy" | "degraded" | "unhealthy" {
    const statuses = Object.values(checks);

    if (statuses.some((s) => s.status === "unhealthy")) {
      return "unhealthy";
    }

    if (statuses.some((s) => s.status === "degraded")) {
      return "degraded";
    }

    return "healthy";
  }

  /**
   * Perform health check for integration
   */
  async checkHealth(integrationName: string): Promise<IntegrationHealth> {
    const checks = this.healthChecks.get(integrationName);

    if (!checks) {
      throw new Error(`No health checks registered for ${integrationName}`);
    }

    const checkPromises: Promise<void>[] = [];

    for (const [_, check] of checks) {
      checkPromises.push(
        this.performSingleCheck(integrationName, check).then(() => {}),
      );
    }

    await Promise.all(checkPromises);

    const health = this.healthStatuses.get(integrationName)!;

    this.emit("health:checked", {
      integrationName,
      status: health.overallStatus,
    });

    return health;
  }

  /**
   * Get health status
   */
  getHealthStatus(
    integrationName?: string,
  ): IntegrationHealth | IntegrationHealth[] | null {
    if (integrationName) {
      return this.healthStatuses.get(integrationName) || null;
    }

    return Array.from(this.healthStatuses.values());
  }

  /**
   * Record metric
   */
  recordMetric(
    integrationName: string,
    type: "request" | "error" | "response_time",
    value?: number,
  ): void {
    let metrics = this.metrics.get(integrationName);

    if (!metrics) {
      this.initializeMetrics(integrationName);
      metrics = this.metrics.get(integrationName)!;
    }

    switch (type) {
      case "request":
        metrics.requestCount++;
        break;
      case "error":
        metrics.errorCount++;
        metrics.lastError = {
          message: `Error at ${new Date().toISOString()}`,
          timestamp: new Date(),
        };
        break;
      case "response_time":
        if (value !== undefined) {
          // Calculate rolling average
          const currentAvg = metrics.averageResponseTime;
          const count = metrics.requestCount || 1;
          metrics.averageResponseTime =
            (currentAvg * (count - 1) + value) / count;
        }
        break;
    }

    // Update success rate
    if (metrics.requestCount > 0) {
      metrics.successRate =
        ((metrics.requestCount - metrics.errorCount) / metrics.requestCount) *
        100;
    }

    this.emit("metric:recorded", {
      integrationName,
      type,
      value,
      metrics,
    });
  }

  /**
   * Start global health check
   */
  private startGlobalHealthCheck(): void {
    this.globalInterval = setInterval(async () => {
      for (const [integrationName, checks] of this.healthChecks) {
        for (const [_, check] of checks) {
          // Only run checks that don't have their own interval
          if (!check.interval) {
            await this.performSingleCheck(integrationName, check);
          }
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Get unhealthy integrations
   */
  getUnhealthyIntegrations(): IntegrationHealth[] {
    return Array.from(this.healthStatuses.values()).filter(
      (health) => health.overallStatus === "unhealthy",
    );
  }

  /**
   * Get degraded integrations
   */
  getDegradedIntegrations(): IntegrationHealth[] {
    return Array.from(this.healthStatuses.values()).filter(
      (health) => health.overallStatus === "degraded",
    );
  }

  /**
   * Reset metrics for integration
   */
  resetMetrics(integrationName: string): void {
    this.initializeMetrics(integrationName);

    this.emit("metrics:reset", { integrationName });
  }

  /**
   * Remove health checks for integration
   */
  removeHealthChecks(integrationName: string): boolean {
    // Clear intervals
    for (const [key, interval] of this.checkIntervals) {
      if (key.startsWith(integrationName)) {
        clearInterval(interval);
        this.checkIntervals.delete(key);
      }
    }

    // Remove data
    const existed = this.healthChecks.delete(integrationName);
    this.healthStatuses.delete(integrationName);
    this.metrics.delete(integrationName);
    this.startTimes.delete(integrationName);

    if (existed) {
      this.emit("checks:removed", { integrationName });
    }

    return existed;
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalIntegrations: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    averageUptime: number;
    overallSuccessRate: number;
  } {
    const healths = Array.from(this.healthStatuses.values());
    const allMetrics = Array.from(this.metrics.values());

    const summary = {
      totalIntegrations: healths.length,
      healthy: healths.filter((h) => h.overallStatus === "healthy").length,
      degraded: healths.filter((h) => h.overallStatus === "degraded").length,
      unhealthy: healths.filter((h) => h.overallStatus === "unhealthy").length,
      averageUptime: 0,
      overallSuccessRate: 0,
    };

    if (healths.length > 0) {
      summary.averageUptime =
        healths.reduce((sum, h) => sum + h.uptime, 0) / healths.length;
    }

    if (allMetrics.length > 0) {
      const totalRequests = allMetrics.reduce(
        (sum, m) => sum + m.requestCount,
        0,
      );
      const totalErrors = allMetrics.reduce((sum, m) => sum + m.errorCount, 0);

      if (totalRequests > 0) {
        summary.overallSuccessRate =
          ((totalRequests - totalErrors) / totalRequests) * 100;
      }
    }

    return summary;
  }

  /**
   * Export health report
   */
  exportReport(): {
    timestamp: Date;
    summary: ReturnType<typeof this.getSummary>;
    integrations: IntegrationHealth[];
  } {
    return {
      timestamp: new Date(),
      summary: this.getSummary(),
      integrations: Array.from(this.healthStatuses.values()),
    };
  }

  /**
   * Clear all
   */
  clearAll(): void {
    // Clear all intervals
    for (const interval of this.checkIntervals.values()) {
      clearInterval(interval);
    }

    if (this.globalInterval) {
      clearInterval(this.globalInterval);
    }

    this.healthChecks.clear();
    this.healthStatuses.clear();
    this.checkIntervals.clear();
    this.metrics.clear();
    this.startTimes.clear();
    this.removeAllListeners();
  }
}

// Singleton instance
export const healthMonitor = new IntegrationHealthMonitor();

export default IntegrationHealthMonitor;
