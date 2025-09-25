/**
 * Error Tracking and Handling Service
 * Comprehensive error monitoring, reporting, and recovery
 */

import { EventEmitter } from 'node:events';
import { type LogContext, logger } from '../logging/Logger.js';
import { performanceMonitor } from './PerformanceMonitor.js';

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
