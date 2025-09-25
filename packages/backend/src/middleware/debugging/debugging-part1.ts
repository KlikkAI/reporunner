/**
 * Debugging Middleware
 * Integrates all debugging and monitoring services
 */

import type { NextFunction, Request, Response } from 'express';
import { debugTools } from '../services/debugging/DebugTools.js';
import { logger } from '../services/logging/Logger.js';
import { errorTracker } from '../services/monitoring/ErrorTracker.js';
import { performanceMonitor } from '../services/monitoring/PerformanceMonitor.js';

// Extended Request interface for debugging
interface DebuggingRequest extends Request {
  id?: string;
  debugSession?: string;
  startTime?: number;
  performanceTimer?: string;
}

/**
 * Request ID middleware - adds unique ID to each request
 */
export function requestIdMiddleware(
  req: DebuggingRequest,
  res: Response,
  next: NextFunction
): void {
  req.id =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  res.setHeader('X-Request-ID', req.id);
  next();
}

/**
 * Performance monitoring middleware
 */
export function performanceMiddleware(
  req: DebuggingRequest,
  res: Response,
  next: NextFunction
): void {
  req.startTime = Date.now();

  // Start performance timer
  req.performanceTimer = performanceMonitor.startTimer('http_request', {
    method: req.method,
    route: req.route?.path || req.path,
    requestId: req.id,
  });

  // Monitor response
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());

    if (req.performanceTimer) {
      performanceMonitor.endTimer(req.performanceTimer);
    }

    // Record request metrics
    performanceMonitor.recordMetric({
      name: 'http_request_duration',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        method: req.method,
        status: res.statusCode.toString(),
        route: req.route?.path || 'unknown',
      },
      metadata: {
        requestId: req.id,
        contentLength: res.get('Content-Length'),
        userAgent: req.get('User-Agent'),
      },
    });

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        duration,
        statusCode: res.statusCode,
        component: 'performance',
      });
    }
  });

  next();
}

/**
 * Enhanced logging middleware
 */
export function loggingMiddleware(req: DebuggingRequest, res: Response, next: NextFunction): void {
  const startTime = Date.now();
