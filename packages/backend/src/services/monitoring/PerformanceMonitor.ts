/**
 * Performance Monitoring Service
 * Tracks application performance metrics and provides insights
 */

import { EventEmitter } from 'node:events';
import { logger } from '../logging/Logger.js';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface OperationTimer {
  start: number;
  name: string;
  context?: Record<string, any>;
}

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

export interface SystemMetrics {
  cpu: {
    user: number;
    system: number;
  };
  memory: MemorySnapshot;
  eventLoop: {
    delay: number;
    utilization: number;
  };
  gc?: {
    collections: number;
    duration: number;
  };
}

class PerformanceMonitorService extends EventEmitter {
  private timers: Map<string, OperationTimer> = new Map();
  private metrics: PerformanceMetric[] = [];
  private systemMetricsInterval?: NodeJS.Timeout;
  private memoryLeakDetection: Map<string, number> = new Map();
  private gcStats: { collections: number; duration: number } = {
    collections: 0,
    duration: 0,
  };

  constructor() {
    super();
    this.startSystemMonitoring();
    this.setupGCMonitoring();
  }

  // Timer operations
  public startTimer(name: string, context?: Record<string, any>): string {
    const timerId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.timers.set(timerId, {
      start: performance.now(),
      name,
      context,
    });

    return timerId;
  }

  public endTimer(timerId: string): number | null {
    const timer = this.timers.get(timerId);
    if (!timer) {
      logger.warn('Timer not found', { timerId });
      return null;
    }

    const duration = performance.now() - timer.start;
    this.timers.delete(timerId);

    // Record metric
    this.recordMetric({
      name: `${timer.name}_duration`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: timer.context,
    });

    // Log if duration is significant
    if (duration > 100) {
      logger.debug(`Operation ${timer.name} completed`, {
        duration,
        context: timer.context,
        component: 'performance',
      });
    }

    return duration;
  }

  public measureOperation<T>(
    name: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timerId = this.startTimer(name, context);
      const startMemory = process.memoryUsage();

      try {
        const result = await operation();
        const duration = this.endTimer(timerId);
        const endMemory = process.memoryUsage();

        // Track memory usage
        this.recordMetric({
          name: `${name}_memory_delta`,
          value: endMemory.heapUsed - startMemory.heapUsed,
          unit: 'bytes',
          timestamp: Date.now(),
          metadata: { ...context, duration },
        });

        resolve(result);
      } catch (error) {
        this.endTimer(timerId);
        this.recordMetric({
          name: `${name}_error`,
          value: 1,
          unit: 'count',
          timestamp: Date.now(),
          metadata: {
            ...context,
            error: error instanceof Error ? error.message : String(error),
          },
        });
        reject(error);
      }
    });
  }

  // Metric recording
  public recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    this.emit('metric', metric);

    // Log performance metrics to specialized logger
    logger.logPerformanceMetrics(
      metric.name,
      {
        duration: metric.value,
        timestamp: metric.timestamp,
      },
      {
        component: 'performance',
        unit: metric.unit,
        tags: metric.tags,
        ...metric.metadata,
      }
    );

    // Keep metrics buffer manageable
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  public incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      unit: 'count',
      timestamp: Date.now(),
      tags,
    });
  }

  public recordGauge(
    name: string,
    value: number,
    unit: string = 'units',
    tags?: Record<string, string>
  ): void {
    this.recordMetric({
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    });
  }

  // System monitoring
  private startSystemMonitoring(): void {
    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  private collectSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Memory metrics
    this.recordGauge('system_memory_heap_used', memoryUsage.heapUsed, 'bytes');
    this.recordGauge('system_memory_heap_total', memoryUsage.heapTotal, 'bytes');
    this.recordGauge('system_memory_rss', memoryUsage.rss, 'bytes');
    this.recordGauge('system_memory_external', memoryUsage.external, 'bytes');

    // CPU metrics
    this.recordGauge('system_cpu_user', cpuUsage.user, 'microseconds');
    this.recordGauge('system_cpu_system', cpuUsage.system, 'microseconds');

    // Event loop lag
    this.measureEventLoopLag().then((lag) => {
      this.recordGauge('system_event_loop_lag', lag, 'ms');
    });

    // Check for memory leaks
    this.detectMemoryLeaks();
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

  private detectMemoryLeaks(): void {
    const memoryUsage = process.memoryUsage();
    const currentHeapUsed = memoryUsage.heapUsed;
    const timestamp = Date.now();

    // Store memory usage
    this.memoryLeakDetection.set(timestamp.toString(), currentHeapUsed);

    // Keep only last 10 minutes of data
    const tenMinutesAgo = timestamp - 10 * 60 * 1000;
    for (const [key, _] of this.memoryLeakDetection) {
      if (parseInt(key, 10) < tenMinutesAgo) {
        this.memoryLeakDetection.delete(key);
      }
    }

    // Check for consistent memory growth
    const samples = Array.from(this.memoryLeakDetection.values());
    if (samples.length >= 10) {
      const trend = this.calculateMemoryTrend(samples);
      if (trend > 0.8) {
        // 80% of samples show growth
        logger.warn('Potential memory leak detected', {
          component: 'performance',
          memoryTrend: trend,
          currentHeapUsed: currentHeapUsed,
          samples: samples.length,
        });
      }
    }
  }

  private calculateMemoryTrend(samples: number[]): number {
    let increases = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i] > samples[i - 1]) {
        increases++;
      }
    }
    return increases / (samples.length - 1);
  }

  private setupGCMonitoring(): void {
    // Note: In production, you might want to use more sophisticated GC monitoring
    // This is a basic implementation
    if (global.gc) {
      const originalGC = global.gc;
      global.gc = async () => {
        const start = performance.now();
        await originalGC();
        const duration = performance.now() - start;

        this.gcStats.collections++;
        this.gcStats.duration += duration;

        this.recordMetric({
          name: 'gc_collection_duration',
          value: duration,
          unit: 'ms',
          timestamp: Date.now(),
        });
      };
    }
  }

  // Query and analysis methods
  public getMetrics(name?: string, since?: number): PerformanceMetric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter((m) => m.name.includes(name));
    }

    if (since) {
      filtered = filtered.filter((m) => m.timestamp >= since);
    }

    return filtered;
  }

  public getAverageMetric(name: string, since?: number): number {
    const metrics = this.getMetrics(name, since);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  public getPercentile(name: string, percentile: number, since?: number): number {
    const metrics = this.getMetrics(name, since);
    if (metrics.length === 0) return 0;

    const sorted = metrics.map((m) => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  public getCurrentSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      memory: {
        timestamp: Date.now(),
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
      eventLoop: {
        delay: 0, // Would be filled by measureEventLoopLag
        utilization: 0, // Would need additional measurement
      },
      gc: this.gcStats,
    };
  }

  // Middleware for Express
  public createExpressMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();

      // Add request ID for tracking
      req.id = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      res.on('finish', () => {
        const duration = performance.now() - startTime;
        const endMemory = process.memoryUsage();

        // Record request metrics
        this.recordMetric({
          name: 'http_request_duration',
          value: duration,
          unit: 'ms',
          timestamp: Date.now(),
          tags: {
            method: req.method,
            route: req.route?.path || req.path,
            status: res.statusCode.toString(),
          },
          metadata: {
            requestId: req.id,
            userAgent: req.get('User-Agent'),
            contentLength: res.get('Content-Length'),
            memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
          },
        });

        // Log request performance
        logger.logRequest(req, res, duration);
      });

      next();
    };
  }

  // Cleanup
  public stop(): void {
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
    }
    this.timers.clear();
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitorService();
export default performanceMonitor;
