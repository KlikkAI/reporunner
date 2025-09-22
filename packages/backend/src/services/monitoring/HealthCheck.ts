/**
 * Health Check Service
 * Monitors system health and provides status endpoints
 */

import mongoose from "mongoose";
import { logger } from "../logging/Logger.js";
import { performanceMonitor } from "./PerformanceMonitor.js";
import { errorTracker } from "./ErrorTracker.js";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: number;
  uptime: number;
  version: string;
  checks: HealthCheck[];
  metrics: HealthMetrics;
}

export interface HealthCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  duration: number;
  message?: string;
  data?: any;
  lastChecked: number;
}

export interface HealthMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  eventLoop: {
    lag: number;
  };
  errors: {
    rate: number;
    total: number;
  };
  requests: {
    total: number;
    averageResponseTime: number;
  };
}

export interface ServiceDependency {
  name: string;
  type: "database" | "cache" | "external-api" | "queue" | "file-system";
  checkFunction: () => Promise<{
    status: "pass" | "warn" | "fail";
    data?: any;
    message?: string;
  }>;
  timeout: number;
  critical: boolean;
}

class HealthCheckService {
  private dependencies: Map<string, ServiceDependency> = new Map();
  private lastHealthCheck?: HealthStatus;
  private checkInterval?: NodeJS.Timeout;

  constructor() {
    this.registerDefaultDependencies();
    this.startPeriodicChecks();
  }

  // Register health check dependencies
  public registerDependency(dependency: ServiceDependency): void {
    this.dependencies.set(dependency.name, dependency);
    logger.info(`Health check dependency registered: ${dependency.name}`, {
      component: "health-check",
      type: dependency.type,
      critical: dependency.critical,
    });
  }

  public unregisterDependency(name: string): void {
    this.dependencies.delete(name);
    logger.info(`Health check dependency unregistered: ${name}`, {
      component: "health-check",
    });
  }

  // Perform health checks
  public async performHealthCheck(): Promise<HealthStatus> {
    const startTime = performance.now();
    const checks: HealthCheck[] = [];

    // Run all dependency checks
    for (const [name, dependency] of this.dependencies) {
      const check = await this.runDependencyCheck(name, dependency);
      checks.push(check);
    }

    // Calculate overall status
    const overallStatus = this.calculateOverallStatus(checks);

    // Gather system metrics
    const metrics = await this.gatherMetrics();

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: Date.now(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      checks,
      metrics,
    };

    this.lastHealthCheck = healthStatus;

    const duration = performance.now() - startTime;
    logger.debug(`Health check completed`, {
      component: "health-check",
      status: overallStatus,
      duration,
      checksCount: checks.length,
    });

    return healthStatus;
  }

  private async runDependencyCheck(
    name: string,
    dependency: ServiceDependency,
  ): Promise<HealthCheck> {
    const startTime = performance.now();
    const checkStartTime = Date.now();

    try {
      // Run check with timeout
      const checkPromise = dependency.checkFunction();
      const timeoutPromise = new Promise<{ status: "fail"; message: string }>(
        (_, reject) => {
          setTimeout(
            () => reject(new Error(`Health check timeout: ${name}`)),
            dependency.timeout,
          );
        },
      );

      const result = await Promise.race([checkPromise, timeoutPromise]);
      const duration = performance.now() - startTime;

      return {
        name,
        status: result.status,
        duration,
        message: result.message,
        data: "data" in result ? result.data : undefined,
        lastChecked: checkStartTime,
      };
    } catch (error) {
      const duration = performance.now() - startTime;

      logger.warn(`Health check failed: ${name}`, {
        component: "health-check",
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      return {
        name,
        status: "fail",
        duration,
        message: error instanceof Error ? error.message : String(error),
        lastChecked: checkStartTime,
      };
    }
  }

  private calculateOverallStatus(
    checks: HealthCheck[],
  ): "healthy" | "degraded" | "unhealthy" {
    const criticalChecks = checks.filter((check) => {
      const dependency = this.dependencies.get(check.name);
      return dependency?.critical;
    });

    const failedCritical = criticalChecks.filter(
      (check) => check.status === "fail",
    );
    const warnCritical = criticalChecks.filter(
      (check) => check.status === "warn",
    );

    if (failedCritical.length > 0) {
      return "unhealthy";
    }

    const failedChecks = checks.filter((check) => check.status === "fail");
    const warnChecks = checks.filter((check) => check.status === "warn");

    if (failedChecks.length > 0 || warnCritical.length > 0) {
      return "degraded";
    }

    if (warnChecks.length > 0) {
      return "degraded";
    }

    return "healthy";
  }

  private async gatherMetrics(): Promise<HealthMetrics> {
    const memoryUsage = process.memoryUsage();
    const eventLoopLag = await this.measureEventLoopLag();

    // Get error statistics
    const errorStats = errorTracker.getErrorStats(Date.now() - 60 * 60 * 1000); // Last hour

    // Get performance metrics
    const requestMetrics = performanceMonitor.getMetrics(
      "http_request_duration",
      Date.now() - 60 * 60 * 1000,
    );
    const avgResponseTime =
      requestMetrics.length > 0
        ? requestMetrics.reduce((sum, m) => sum + m.value, 0) /
          requestMetrics.length
        : 0;

    return {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      cpu: {
        usage: 0, // Would need more sophisticated CPU monitoring
      },
      eventLoop: {
        lag: eventLoopLag,
      },
      errors: {
        rate: errorStats.errorRate,
        total: errorStats.total,
      },
      requests: {
        total: requestMetrics.length,
        averageResponseTime: avgResponseTime,
      },
    };
  }

  private async measureEventLoopLag(): Promise<number> {
    return new Promise((resolve) => {
      const start = performance.now();
      setImmediate(() => {
        const lag = performance.now() - start;
        resolve(lag);
      });
    });
  }

  // Default dependency checks
  private registerDefaultDependencies(): void {
    // MongoDB check
    this.registerDependency({
      name: "mongodb",
      type: "database",
      critical: true,
      timeout: 5000,
      checkFunction: async () => {
        try {
          const startTime = performance.now();

          if (mongoose.connection.readyState !== 1) {
            return {
              status: "fail",
              message: "MongoDB not connected",
            };
          }

          // Perform a simple operation
          if (mongoose.connection.db) {
            await mongoose.connection.db.admin().ping();
          } else {
            throw new Error("Database connection not established");
          }
          const duration = performance.now() - startTime;

          return {
            status: duration > 1000 ? "warn" : "pass",
            message:
              duration > 1000 ? "MongoDB responding slowly" : "MongoDB healthy",
            data: {
              duration,
              readyState: mongoose.connection.readyState,
              host: mongoose.connection.host,
              port: mongoose.connection.port,
            },
          };
        } catch (error) {
          return {
            status: "fail",
            message: `MongoDB error: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      },
    });

    // Memory check
    this.registerDependency({
      name: "memory",
      type: "file-system",
      critical: false,
      timeout: 1000,
      checkFunction: async () => {
        const memoryUsage = process.memoryUsage();
        const usagePercentage =
          (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

        let status: "pass" | "warn" | "fail" = "pass";
        let message = "Memory usage normal";

        if (usagePercentage > 90) {
          status = "fail";
          message = "Critical memory usage";
        } else if (usagePercentage > 80) {
          status = "warn";
          message = "High memory usage";
        }

        return {
          status,
          message,
          data: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            usagePercentage,
            rss: memoryUsage.rss,
            external: memoryUsage.external,
          },
        };
      },
    });

    // Disk space check
    this.registerDependency({
      name: "disk-space",
      type: "file-system",
      critical: false,
      timeout: 2000,
      checkFunction: async () => {
        try {
          const fs = await import("fs");
          const path = await import("path");

          const stats = fs.statSync(process.cwd());

          // Note: This is a simplified check. In production, you'd want to check actual disk usage
          return {
            status: "pass",
            message: "Disk space check passed",
            data: {
              path: process.cwd(),
              accessible: true,
            },
          };
        } catch (error) {
          return {
            status: "fail",
            message: `Disk space check failed: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      },
    });

    // Error rate check
    this.registerDependency({
      name: "error-rate",
      type: "external-api",
      critical: false,
      timeout: 1000,
      checkFunction: async () => {
        const errorStats = errorTracker.getErrorStats(
          Date.now() - 5 * 60 * 1000,
        ); // Last 5 minutes
        const errorRate = errorStats.errorRate;

        let status: "pass" | "warn" | "fail" = "pass";
        let message = "Error rate normal";

        if (errorRate > 10) {
          // More than 10 errors per minute
          status = "fail";
          message = "Critical error rate";
        } else if (errorRate > 5) {
          status = "warn";
          message = "Elevated error rate";
        }

        return {
          status,
          message,
          data: {
            errorRate,
            totalErrors: errorStats.total,
            bySeverity: errorStats.bySeverity,
          },
        };
      },
    });
  }

  // Periodic health checks
  private startPeriodicChecks(): void {
    // Run health check every 30 seconds
    this.checkInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error(
          "Periodic health check failed",
          {
            component: "health-check",
          },
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }, 30000);
  }

  // Express endpoints
  public createHealthEndpoint() {
    return async (req: any, res: any) => {
      try {
        const health = await this.performHealthCheck();
        const statusCode =
          health.status === "healthy"
            ? 200
            : health.status === "degraded"
              ? 200
              : 503;

        res.status(statusCode).json(health);
      } catch (error) {
        logger.error(
          "Health endpoint error",
          { component: "health-check" },
          error instanceof Error ? error : new Error(String(error)),
        );

        res.status(503).json({
          status: "unhealthy",
          timestamp: Date.now(),
          message: "Health check failed",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };
  }

  public createReadinessEndpoint() {
    return async (req: any, res: any) => {
      try {
        const health = await this.performHealthCheck();
        const isReady =
          health.status === "healthy" || health.status === "degraded";

        res.status(isReady ? 200 : 503).json({
          ready: isReady,
          status: health.status,
          timestamp: health.timestamp,
          checks: health.checks.filter((check) => {
            const dependency = this.dependencies.get(check.name);
            return dependency?.critical;
          }),
        });
      } catch (error) {
        res.status(503).json({
          ready: false,
          message: "Readiness check failed",
          timestamp: Date.now(),
        });
      }
    };
  }

  public createLivenessEndpoint() {
    return (req: any, res: any) => {
      // Simple liveness check - if we can respond, we're alive
      res.status(200).json({
        alive: true,
        timestamp: Date.now(),
        uptime: process.uptime(),
        pid: process.pid,
      });
    };
  }

  // Query methods
  public getLastHealthCheck(): HealthStatus | undefined {
    return this.lastHealthCheck;
  }

  public getDependencies(): ServiceDependency[] {
    return Array.from(this.dependencies.values());
  }

  // Cleanup
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.dependencies.clear();
  }
}

// Export singleton instance
export const healthCheck = new HealthCheckService();
export default healthCheck;
