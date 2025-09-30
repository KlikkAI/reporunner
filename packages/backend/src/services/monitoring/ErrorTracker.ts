/**
 * Error Tracking and Handling Service
 * Comprehensive error monitoring, reporting, and recovery
 */

import { EventEmitter } from 'node:events';
import { type LogContext, logger } from '../logging/Logger';
import { performanceMonitor } from './PerformanceMonitor';

export interface ErrorInfo {
  id: string;
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
  timestamp: number;
  context?: LogContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint: string;
  occurrences: number;
  firstSeen: number;
  lastSeen: number;
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
  request?: {
    id: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    ip: string;
    userAgent: string;
  };
  environment: {
    nodeVersion: string;
    platform: string;
    hostname: string;
    memory: NodeJS.MemoryUsage;
    uptime: number;
  };
  tags: Record<string, string>;
  metadata: Record<string, any>;
}

export interface ErrorPattern {
  fingerprint: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  severity: string;
  isResolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
}

class ErrorTrackingService extends EventEmitter {
  private errors: Map<string, ErrorInfo> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private errorRateWindows: Map<string, number[]> = new Map();
  private circuitBreakers: Map<string, { isOpen: boolean; failures: number; lastFailure: number }> =
    new Map();

  constructor() {
    super();
    this.setupGlobalErrorHandlers();
    this.startCleanupInterval();
  }

  // Main error tracking methods
  public trackError(
    error: Error,
    context?: LogContext,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    request?: any
  ): string {
    const errorId = this.generateErrorId();
    const fingerprint = this.generateFingerprint(error, context);
    const timestamp = Date.now();

    // Extract request information if available
    const requestInfo = request ? this.extractRequestInfo(request) : undefined;

    // Create error info
    const errorInfo: ErrorInfo = {
      id: errorId,
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      timestamp,
      context,
      severity,
      fingerprint,
      occurrences: 1,
      firstSeen: timestamp,
      lastSeen: timestamp,
      user: context?.userId ? { id: context.userId } : undefined,
      request: requestInfo,
      environment: this.getEnvironmentInfo(),
      tags: this.extractTags(error, context),
      metadata: this.extractMetadata(error, context),
    };

    // Check if this error pattern exists
    this.updateErrorPattern(fingerprint, severity, timestamp);

    // Store error
    this.errors.set(errorId, errorInfo);

    // Update error rate tracking
    this.updateErrorRate(fingerprint, timestamp);

    // Check circuit breaker
    this.updateCircuitBreaker(fingerprint, timestamp);

    // Log error
    logger.error(`Error tracked: ${error.message}`, context, error);

    // Record performance metric
    performanceMonitor.incrementCounter('errors_total', 1, {
      severity,
      fingerprint: fingerprint.substring(0, 8),
      type: error.name,
    });

    // Emit event
    this.emit('error', errorInfo);

    // Handle critical errors
    if (severity === 'critical') {
      this.handleCriticalError(errorInfo);
    }

    return errorId;
  }

  public trackCustomError(
    name: string,
    message: string,
    context?: LogContext,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    _metadata?: Record<string, any>
  ): string {
    const customError = new Error(message);
    customError.name = name;

    return this.trackError(customError, context, severity);
  }

  // Error pattern analysis
  private updateErrorPattern(fingerprint: string, severity: string, timestamp: number): void {
    let pattern = this.patterns.get(fingerprint);

    if (pattern) {
      pattern.count++;
      pattern.lastSeen = timestamp;

      // Upgrade severity if needed
      if (this.compareSeverity(severity, pattern.severity) > 0) {
        pattern.severity = severity;
      }
    } else {
      pattern = {
        fingerprint,
        count: 1,
        firstSeen: timestamp,
        lastSeen: timestamp,
        severity,
        isResolved: false,
      };
    }

    this.patterns.set(fingerprint, pattern);

    // Check for error spikes
    if (pattern.count % 10 === 0) {
      logger.warn(`Error pattern spike detected`, {
        fingerprint: fingerprint.substring(0, 8),
        count: pattern.count,
        severity: pattern.severity,
        component: 'error-tracker',
      });
    }
  }

  // Error rate monitoring
  private updateErrorRate(fingerprint: string, timestamp: number): void {
    const window = this.errorRateWindows.get(fingerprint) || [];
    window.push(timestamp);

    // Keep only last hour of errors
    const oneHourAgo = timestamp - 60 * 60 * 1000;
    const recentErrors = window.filter((t) => t > oneHourAgo);

    this.errorRateWindows.set(fingerprint, recentErrors);

    // Check error rate threshold
    if (recentErrors.length > 50) {
      // More than 50 errors in an hour
      logger.error(`High error rate detected`, {
        fingerprint: fingerprint.substring(0, 8),
        errorCount: recentErrors.length,
        timeWindow: '1 hour',
        component: 'error-tracker',
      });
    }
  }

  // Circuit breaker pattern
  private updateCircuitBreaker(fingerprint: string, timestamp: number): void {
    let breaker = this.circuitBreakers.get(fingerprint);

    if (!breaker) {
      breaker = { isOpen: false, failures: 0, lastFailure: timestamp };
    }

    breaker.failures++;
    breaker.lastFailure = timestamp;

    // Open circuit breaker after 5 failures
    if (breaker.failures >= 5 && !breaker.isOpen) {
      breaker.isOpen = true;
      logger.warn(`Circuit breaker opened for error pattern`, {
        fingerprint: fingerprint.substring(0, 8),
        failures: breaker.failures,
        component: 'error-tracker',
      });
    }

    this.circuitBreakers.set(fingerprint, breaker);
  }

  // Critical error handling
  private handleCriticalError(errorInfo: ErrorInfo): void {
    // Log to security events
    logger.logSecurityEvent(`Critical error: ${errorInfo.name}`, 'critical', {
      errorId: errorInfo.id,
      fingerprint: errorInfo.fingerprint.substring(0, 8),
      userId: errorInfo.user?.id,
      requestId: errorInfo.request?.id,
    });

    // Could integrate with external alerting systems here
    // e.g., Slack, PagerDuty, email alerts

    this.emit('criticalError', errorInfo);
  }

  // Utility methods
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: Error, context?: LogContext): string {
    // Create a unique fingerprint for error grouping
    const key = `${error.name}:${error.message}:${context?.component || 'unknown'}`;

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  private extractRequestInfo(req: any): ErrorInfo['request'] {
    return {
      id: req.id || 'unknown',
      method: req.method,
      url: req.originalUrl || req.url,
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeBody(req.body),
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent') || 'unknown',
    };
  }

  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized = { ...headers };

    // Remove sensitive headers
    sanitized.authorization = undefined;
    sanitized.cookie = undefined;
    sanitized['x-api-key'] = undefined;

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;

    const sanitized = { ...body };

    // Remove sensitive fields
    sanitized.password = undefined;
    sanitized.token = undefined;
    sanitized.secret = undefined;
    sanitized.apiKey = undefined;

    return sanitized;
  }

  private getEnvironmentInfo(): ErrorInfo['environment'] {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      hostname: require('node:os').hostname(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  private extractTags(error: Error, context?: LogContext): Record<string, string> {
    return {
      errorType: error.name,
      component: context?.component || 'unknown',
      module: context?.module || 'unknown',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  private extractMetadata(error: Error, context?: LogContext): Record<string, any> {
    return {
      hasStack: !!error.stack,
      stackLines: error.stack?.split('\n').length || 0,
      errorCode: (error as any).code,
      context: context || {},
    };
  }

  private compareSeverity(a: string, b: string): number {
    const levels: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    return (levels[a] || 0) - (levels[b] || 0);
  }

  // Global error handlers
  private setupGlobalErrorHandlers(): void {
    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.trackError(error, { component: 'global' }, 'critical');
      logger.error('Uncaught exception', { component: 'global' }, error);

      // Give time to log before exiting
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.trackError(error, { component: 'global', promise: promise.toString() }, 'high');
      logger.error('Unhandled rejection', { component: 'global' }, error);
    });

    // Warning events
    process.on('warning', (warning) => {
      this.trackCustomError(
        'NodeWarning',
        warning.message,
        { component: 'global', warningName: warning.name },
        'low',
        { stack: warning.stack }
      );
    });
  }

  // Query methods
  public getError(errorId: string): ErrorInfo | undefined {
    return this.errors.get(errorId);
  }

  public getErrors(filters?: {
    severity?: string;
    since?: number;
    fingerprint?: string;
    limit?: number;
  }): ErrorInfo[] {
    let errors = Array.from(this.errors.values());

    if (filters?.severity) {
      errors = errors.filter((e) => e.severity === filters.severity);
    }

    if (filters?.since) {
      errors = errors.filter((e) => e.timestamp >= filters.since!);
    }

    if (filters?.fingerprint) {
      errors = errors.filter((e) => e.fingerprint === filters.fingerprint);
    }

    // Sort by timestamp (newest first)
    errors.sort((a, b) => b.timestamp - a.timestamp);

    if (filters?.limit) {
      errors = errors.slice(0, filters.limit);
    }

    return errors;
  }

  public getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values()).sort((a, b) => b.count - a.count);
  }

  public getErrorStats(since?: number): {
    total: number;
    bySeverity: Record<string, number>;
    byPattern: Array<{ fingerprint: string; count: number }>;
    errorRate: number;
  } {
    const errors = this.getErrors({ since });
    const total = errors.length;

    const bySeverity = errors.reduce(
      (acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const patternCounts = new Map<string, number>();
    errors.forEach((error) => {
      const count = patternCounts.get(error.fingerprint) || 0;
      patternCounts.set(error.fingerprint, count + 1);
    });

    const byPattern = Array.from(patternCounts.entries())
      .map(([fingerprint, count]) => ({
        fingerprint: fingerprint.substring(0, 8),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const timeWindow = since ? Date.now() - since : 60 * 60 * 1000; // 1 hour default
    const errorRate = (total / (timeWindow / 1000)) * 60; // errors per minute

    return {
      total,
      bySeverity,
      byPattern,
      errorRate,
    };
  }

  // Resolution methods
  public resolvePattern(fingerprint: string, resolvedBy: string): boolean {
    const pattern = this.patterns.get(fingerprint);
    if (!pattern) return false;

    pattern.isResolved = true;
    pattern.resolvedAt = Date.now();
    pattern.resolvedBy = resolvedBy;

    logger.info(`Error pattern resolved`, {
      fingerprint: fingerprint.substring(0, 8),
      resolvedBy,
      component: 'error-tracker',
    });

    return true;
  }

  // Express middleware
  public createExpressErrorHandler() {
    return (error: Error, req: any, res: any, _next: any) => {
      const errorId = this.trackError(
        error,
        {
          requestId: req.id,
          userId: req.user?.id,
          component: 'express',
          method: req.method,
          url: req.originalUrl,
        },
        'high',
        req
      );

      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errorId,
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
          errorId,
          stack: error.stack,
        });
      }
    };
  }

  // Cleanup
  private startCleanupInterval(): void {
    // Clean old errors every hour
    setInterval(
      () => {
        this.cleanupOldErrors();
      },
      60 * 60 * 1000
    );
  }

  private cleanupOldErrors(): void {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const [errorId, error] of this.errors) {
      if (error.timestamp < oneWeekAgo) {
        this.errors.delete(errorId);
      }
    }

    logger.debug('Cleaned up old errors', {
      component: 'error-tracker',
      remainingErrors: this.errors.size,
    });
  }

  public stop(): void {
    this.errors.clear();
    this.patterns.clear();
    this.errorRateWindows.clear();
    this.circuitBreakers.clear();
  }
}

// Export singleton instance
export const errorTracker = new ErrorTrackingService();
export default errorTracker;
