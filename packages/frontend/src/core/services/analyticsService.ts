// Analytics service for tracking user interactions and performance metrics
import { Logger } from '@reporunner/core';

const logger = new Logger('AnalyticsService');

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface WorkflowAnalytics {
  events: AnalyticsEvent[];
  metrics: PerformanceMetric[];
  sessionId: string;
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private subscribers: Set<(analytics: WorkflowAnalytics) => void> = new Set();

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  // Event tracking
  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: new Date(),
      sessionId: this.sessionId,
    };

    this.events.push(event);

    // In development, log event
    if (import.meta.env.DEV) {
      logger.debug('Analytics Event', event);
    }

    // Notify subscribers of analytics update
    this.notifySubscribers({
      events: [...this.events],
      metrics: [...this.metrics],
      sessionId: this.sessionId,
    });

    // TODO: Send to actual analytics service
  }

  // Performance metric tracking
  recordMetric(name: string, value: number, unit = 'ms', tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);

    if (import.meta.env.DEV) {
      logger.debug('Performance Metric', metric);
    }

    // Notify subscribers of analytics update
    this.notifySubscribers({
      events: [...this.events],
      metrics: [...this.metrics],
      sessionId: this.sessionId,
    });

    // TODO: Send to actual metrics service
  }

  // Workflow-specific events
  trackWorkflowEvent(action: string, workflowId?: string, nodeType?: string): void {
    this.track('workflow_action', {
      action,
      workflowId,
      nodeType,
      timestamp: Date.now(),
    });
  }

  // Node interaction events
  trackNodeEvent(action: string, nodeType: string, nodeId?: string): void {
    this.track('node_interaction', {
      action,
      nodeType,
      nodeId,
      timestamp: Date.now(),
    });
  }

  // Performance timing
  startTiming(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms');
    };
  }

  // Get stored events for debugging
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Clear stored data
  clear(): void {
    this.events = [];
    this.metrics = [];
  }

  /**
   * Subscribe to analytics updates
   * Returns an unsubscribe function
   */
  subscribeToAnalytics(callback: (analytics: WorkflowAnalytics) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers with new analytics data
   */
  private notifySubscribers(analytics: WorkflowAnalytics): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(analytics);
      } catch (error) {
        logger.error(
          'Error in analytics subscriber',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const analyticsService = new AnalyticsService();
