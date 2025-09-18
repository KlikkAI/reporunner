/**
 * Performance Monitor Service
 *
 * Real-time performance monitoring and bottleneck detection system
 * that instruments workflow execution to collect detailed metrics.
 * Inspired by APM tools like New Relic and DataDog.
 */

import { analyticsService } from "./analyticsService";
import type {
  ExecutionMetrics,
  NodeMetrics,
  ResourceUsage,
  ExecutionError,
} from "./analyticsService";

export interface PerformanceTrace {
  traceId: string;
  executionId: string;
  workflowId: string;
  startTime: number;
  endTime?: number;
  spans: PerformanceSpan[];
  metadata: Record<string, any>;
}

export interface PerformanceSpan {
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: SpanLog[];
  status: "ok" | "error" | "timeout";
}

export interface SpanLog {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  fields?: Record<string, any>;
}

export interface PerformanceAlert {
  id: string;
  type:
    | "slow_execution"
    | "high_error_rate"
    | "resource_exhaustion"
    | "bottleneck_detected";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  workflowId: string;
  nodeId?: string;
  timestamp: string;
  threshold: number;
  actualValue: number;
  actions: string[];
}

export interface ResourceMonitor {
  nodeId: string;
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    networkIO: number;
    diskIO: number;
    timestamp: number;
  };
}

export class PerformanceMonitorService {
  private activeTraces = new Map<string, PerformanceTrace>();
  private activeSpans = new Map<string, PerformanceSpan>();
  private resourceMonitors = new Map<string, ResourceMonitor>();
  private alertListeners = new Set<(alert: PerformanceAlert) => void>();

  // Configuration thresholds
  private readonly SLOW_EXECUTION_THRESHOLD = 30000; // 30 seconds
  private readonly HIGH_ERROR_RATE_THRESHOLD = 0.1; // 10%
  private readonly MEMORY_USAGE_THRESHOLD = 512; // MB
  // Note: CPU threshold constant reserved for future monitoring features

  // Monitoring intervals
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.startGlobalResourceMonitoring();
  }

  /**
   * Start performance trace for workflow execution
   */
  startTrace(
    executionId: string,
    workflowId: string,
    metadata?: Record<string, any>,
  ): PerformanceTrace {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const trace: PerformanceTrace = {
      traceId,
      executionId,
      workflowId,
      startTime: performance.now(),
      spans: [],
      metadata: metadata || {},
    };

    this.activeTraces.set(executionId, trace);
    return trace;
  }

  /**
   * End performance trace and submit metrics
   */
  endTrace(
    executionId: string,
    status: "completed" | "failed" | "cancelled",
  ): void {
    const trace = this.activeTraces.get(executionId);
    if (!trace) return;

    trace.endTime = performance.now();
    const totalDuration = trace.endTime - trace.startTime;

    // Generate execution metrics
    const executionMetrics: ExecutionMetrics = {
      executionId,
      workflowId: trace.workflowId,
      startTime: new Date(Date.now() - totalDuration).toISOString(),
      endTime: new Date().toISOString(),
      status,
      totalDuration,
      nodeMetrics: this.generateNodeMetrics(trace),
      resourceUsage: this.calculateResourceUsage(trace),
      errorDetails: this.extractErrors(trace),
    };

    // Submit to analytics service
    analyticsService.recordExecutionMetrics(executionMetrics);

    // Check for performance alerts
    this.checkPerformanceAlerts(executionMetrics);

    // Cleanup
    this.activeTraces.delete(executionId);
  }

  /**
   * Start performance span for node execution
   */
  startSpan(
    executionId: string,
    nodeId: string,
    operationName: string,
    parentSpanId?: string,
    tags?: Record<string, any>,
  ): PerformanceSpan {
    const spanId = `span_${Date.now()}_${nodeId}`;

    const span: PerformanceSpan = {
      spanId,
      parentSpanId,
      operationName,
      startTime: performance.now(),
      tags: tags || {},
      logs: [],
      status: "ok",
    };

    this.activeSpans.set(spanId, span);

    // Add to trace
    const trace = this.activeTraces.get(executionId);
    if (trace) {
      trace.spans.push(span);
    }

    // Start resource monitoring for this node
    this.startResourceMonitoring(nodeId);

    return span;
  }

  /**
   * End performance span
   */
  endSpan(
    spanId: string,
    status: "ok" | "error" | "timeout" = "ok",
    error?: Error,
  ): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    if (error) {
      span.logs.push({
        timestamp: performance.now(),
        level: "error",
        message: error.message,
        fields: {
          stack: error.stack,
          name: error.name,
        },
      });
    }

    // Stop resource monitoring
    this.stopResourceMonitoring(span.tags.nodeId as string);

    this.activeSpans.delete(spanId);
  }

  /**
   * Add log to active span
   */
  logToSpan(
    spanId: string,
    level: "debug" | "info" | "warn" | "error",
    message: string,
    fields?: Record<string, any>,
  ): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: performance.now(),
        level,
        message,
        fields,
      });
    }
  }

  /**
   * Add tags to active span
   */
  addTagsToSpan(spanId: string, tags: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags = { ...span.tags, ...tags };
    }
  }

  /**
   * Measure function execution time
   */
  measure<T>(
    name: string,
    fn: () => T | Promise<T>,
    tags?: Record<string, any>,
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now();
      // Unique measurement identifier reserved for detailed performance tracking

      try {
        const result = await fn();
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Log performance measurement
        console.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`, {
          name,
          duration,
          tags,
        });

        resolve(result);
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        console.error(
          `Performance: ${name} failed after ${duration.toFixed(2)}ms`,
          {
            name,
            duration,
            error,
            tags,
          },
        );

        reject(error);
      }
    });
  }

  /**
   * Start resource monitoring for a node
   */
  startResourceMonitoring(nodeId: string): void {
    const monitor: ResourceMonitor = {
      nodeId,
      metrics: {
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: 0, // Would require more sophisticated measurement
        networkIO: 0,
        diskIO: 0,
        timestamp: Date.now(),
      },
    };

    this.resourceMonitors.set(nodeId, monitor);
  }

  /**
   * Stop resource monitoring for a node
   */
  stopResourceMonitoring(nodeId: string): void {
    this.resourceMonitors.delete(nodeId);
  }

  /**
   * Get current resource usage
   */
  getCurrentResourceUsage(): ResourceUsage {
    const memoryUsage = this.getMemoryUsage();

    return {
      totalMemoryMB: memoryUsage,
      peakMemoryMB: memoryUsage,
      totalCpuMs: 0,
      networkBytesIn: 0,
      networkBytesOut: 0,
      storageReads: 0,
      storageWrites: 0,
      apiCalls: 0,
    };
  }

  /**
   * Subscribe to performance alerts
   */
  subscribeToAlerts(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertListeners.add(callback);
    return () => this.alertListeners.delete(callback);
  }

  /**
   * Get active traces for debugging
   */
  getActiveTraces(): PerformanceTrace[] {
    return Array.from(this.activeTraces.values());
  }

  /**
   * Get active spans for debugging
   */
  getActiveSpans(): PerformanceSpan[] {
    return Array.from(this.activeSpans.values());
  }

  // Private helper methods

  private generateNodeMetrics(trace: PerformanceTrace): NodeMetrics[] {
    return trace.spans.map((span): NodeMetrics => {
      const nodeId = span.tags.nodeId || span.spanId;
      const nodeType = span.tags.nodeType || "unknown";
      const nodeName = span.tags.nodeName || span.operationName;

      return {
        nodeId,
        nodeType,
        nodeName,
        startTime: new Date(
          Date.now() - (performance.now() - span.startTime),
        ).toISOString(),
        endTime: span.endTime
          ? new Date(
              Date.now() - (performance.now() - span.endTime),
            ).toISOString()
          : undefined,
        duration: span.duration,
        status: this.mapSpanStatusToNodeStatus(span.status),
        inputSize: span.tags.inputSize,
        outputSize: span.tags.outputSize,
        memoryUsage: span.tags.memoryUsage,
        cpuUsage: span.tags.cpuUsage,
        networkRequests: span.tags.networkRequests,
        errorCount: span.logs.filter((log) => log.level === "error").length,
        retryCount: span.tags.retryCount || 0,
      };
    });
  }

  private calculateResourceUsage(trace: PerformanceTrace): ResourceUsage {
    let totalMemory = 0;
    let peakMemory = 0;
    let totalCpu = 0;
    let networkIn = 0;
    let networkOut = 0;
    let apiCalls = 0;

    trace.spans.forEach((span) => {
      if (span.tags.memoryUsage) {
        totalMemory += span.tags.memoryUsage;
        peakMemory = Math.max(peakMemory, span.tags.memoryUsage);
      }
      if (span.tags.cpuUsage) totalCpu += span.tags.cpuUsage;
      if (span.tags.networkBytesIn) networkIn += span.tags.networkBytesIn;
      if (span.tags.networkBytesOut) networkOut += span.tags.networkBytesOut;
      if (span.tags.networkRequests) apiCalls += span.tags.networkRequests;
    });

    const estimatedCost = this.calculateEstimatedCost(
      totalMemory,
      totalCpu,
      networkIn + networkOut,
      apiCalls,
    );

    return {
      totalMemoryMB: totalMemory,
      peakMemoryMB: peakMemory,
      totalCpuMs: totalCpu,
      networkBytesIn: networkIn,
      networkBytesOut: networkOut,
      storageReads: 0,
      storageWrites: 0,
      apiCalls,
      cost: estimatedCost,
    };
  }

  private extractErrors(trace: PerformanceTrace): ExecutionError[] {
    const errors: ExecutionError[] = [];

    trace.spans.forEach((span) => {
      span.logs
        .filter((log) => log.level === "error")
        .forEach((errorLog) => {
          errors.push({
            nodeId: span.tags.nodeId || span.spanId,
            timestamp: new Date(
              Date.now() - (performance.now() - errorLog.timestamp),
            ).toISOString(),
            type: this.classifyErrorType(errorLog.message),
            message: errorLog.message,
            stack: errorLog.fields?.stack,
            retry: span.tags.retryAttempt
              ? {
                  attempt: span.tags.retryAttempt,
                  maxAttempts: span.tags.maxRetryAttempts || 3,
                }
              : undefined,
          });
        });
    });

    return errors;
  }

  private checkPerformanceAlerts(
    metrics: ExecutionMetrics,
  ): void {
    // Check for slow execution
    if (
      metrics.totalDuration &&
      metrics.totalDuration > this.SLOW_EXECUTION_THRESHOLD
    ) {
      this.emitAlert({
        id: `slow_execution_${metrics.executionId}`,
        type: "slow_execution",
        severity: "high",
        title: "Slow Workflow Execution Detected",
        description: `Workflow execution took ${(metrics.totalDuration / 1000).toFixed(1)}s, exceeding the ${this.SLOW_EXECUTION_THRESHOLD / 1000}s threshold`,
        workflowId: metrics.workflowId,
        timestamp: new Date().toISOString(),
        threshold: this.SLOW_EXECUTION_THRESHOLD,
        actualValue: metrics.totalDuration,
        actions: [
          "Analyze bottleneck nodes",
          "Review node configurations",
          "Consider parallel processing",
          "Optimize data processing logic",
        ],
      });
    }

    // Check for high memory usage
    if (metrics.resourceUsage.peakMemoryMB > this.MEMORY_USAGE_THRESHOLD) {
      this.emitAlert({
        id: `high_memory_${metrics.executionId}`,
        type: "resource_exhaustion",
        severity: "medium",
        title: "High Memory Usage Detected",
        description: `Peak memory usage was ${metrics.resourceUsage.peakMemoryMB}MB, exceeding the ${this.MEMORY_USAGE_THRESHOLD}MB threshold`,
        workflowId: metrics.workflowId,
        timestamp: new Date().toISOString(),
        threshold: this.MEMORY_USAGE_THRESHOLD,
        actualValue: metrics.resourceUsage.peakMemoryMB,
        actions: [
          "Review data processing efficiency",
          "Implement data streaming",
          "Optimize memory usage in nodes",
          "Consider data pagination",
        ],
      });
    }

    // Check for high error rate
    const errorCount = metrics.errorDetails?.length || 0;
    const nodeCount = metrics.nodeMetrics.length;
    const errorRate = nodeCount > 0 ? errorCount / nodeCount : 0;

    if (errorRate > this.HIGH_ERROR_RATE_THRESHOLD) {
      this.emitAlert({
        id: `high_error_rate_${metrics.executionId}`,
        type: "high_error_rate",
        severity: "high",
        title: "High Error Rate Detected",
        description: `Error rate is ${(errorRate * 100).toFixed(1)}%, exceeding the ${(this.HIGH_ERROR_RATE_THRESHOLD * 100).toFixed(1)}% threshold`,
        workflowId: metrics.workflowId,
        timestamp: new Date().toISOString(),
        threshold: this.HIGH_ERROR_RATE_THRESHOLD * 100,
        actualValue: errorRate * 100,
        actions: [
          "Review error patterns",
          "Implement retry logic",
          "Check API rate limits",
          "Validate input data",
        ],
      });
    }
  }

  private mapSpanStatusToNodeStatus(spanStatus: string): NodeMetrics["status"] {
    switch (spanStatus) {
      case "ok":
        return "completed";
      case "error":
        return "failed";
      case "timeout":
        return "failed";
      default:
        return "running";
    }
  }

  private classifyErrorType(message: string): ExecutionError["type"] {
    if (message.includes("timeout") || message.includes("timed out"))
      return "timeout";
    if (message.includes("network") || message.includes("connection"))
      return "network";
    if (message.includes("auth") || message.includes("unauthorized"))
      return "auth";
    if (message.includes("validation") || message.includes("invalid"))
      return "validation";
    return "runtime";
  }

  private calculateEstimatedCost(
    memoryMB: number,
    cpuMs: number,
    networkBytes: number,
    apiCalls: number,
  ) {
    // Simplified cost calculation - in production, this would be more sophisticated
    const computeCost = (cpuMs / 1000) * 0.0001; // $0.0001 per CPU second
    const memoryCost = (memoryMB / 1024) * 0.00001; // $0.00001 per GB
    const networkCost = (networkBytes / 1073741824) * 0.01; // $0.01 per GB
    const apiCost = apiCalls * 0.001; // $0.001 per API call

    return {
      compute: computeCost,
      storage: memoryCost,
      network: networkCost,
      apis: apiCost,
      total: computeCost + memoryCost + networkCost + apiCost,
    };
  }

  private getMemoryUsage(): number {
    if (typeof performance !== "undefined" && (performance as any).memory) {
      // Chrome/Edge memory API
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }

    // Fallback estimation
    return 64; // Assume 64MB baseline
  }

  private emitAlert(alert: PerformanceAlert): void {
    this.alertListeners.forEach((listener) => {
      try {
        listener(alert);
      } catch (error) {
        console.error("Error in performance alert listener:", error);
      }
    });
  }

  private startGlobalResourceMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.resourceMonitors.forEach((monitor, nodeId) => {
        monitor.metrics = {
          memoryUsage: this.getMemoryUsage(),
          cpuUsage: 0, // Would need more sophisticated measurement
          networkIO: 0,
          diskIO: 0,
          timestamp: Date.now(),
        };
      });
    }, this.MONITORING_INTERVAL);
  }

  /**
   * Stop all monitoring
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.activeTraces.clear();
    this.activeSpans.clear();
    this.resourceMonitors.clear();
    this.alertListeners.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitorService();
