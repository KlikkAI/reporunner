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
