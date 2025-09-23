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

  // Log incoming request
  logger.http(`${req.method} ${req.originalUrl}`, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
  });

  // Intercept response to log completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.logRequest(req, res, duration);

    // Log errors
    if (res.statusCode >= 400) {
      const level = res.statusCode >= 500 ? 'error' : 'warn';
      logger[level](`HTTP ${res.statusCode}`, {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        component: 'http',
      });
    }
  });

  next();
}

/**
 * Debug mode middleware
 */
export function debugMiddleware(req: DebuggingRequest, res: Response, next: NextFunction): void {
  // Only activate in debug mode
  if (!debugTools.globalDebugMode) {
    return next();
  }

  // Start debug session for this request
  req.debugSession = debugTools.startDebugSession({
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
  });

  // Log detailed request information
  debugTools.addDebugEvent(req.debugSession, {
    timestamp: Date.now(),
    type: 'log',
    level: 'debug',
    message: 'Request received',
    data: {
      headers: req.headers,
      query: req.query,
      params: req.params,
      body: req.body,
    },
  });

  // Intercept response
  const originalSend = res.send;
  res.send = function (data: any) {
    if (req.debugSession) {
      debugTools.addDebugEvent(req.debugSession, {
        timestamp: Date.now(),
        type: 'log',
        level: 'debug',
        message: 'Response sent',
        data: {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body: data,
        },
      });

      debugTools.endDebugSession(req.debugSession);
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Error tracking middleware
 */
export function errorTrackingMiddleware(
  error: Error,
  req: DebuggingRequest,
  res: Response,
  _next: NextFunction
): void {
  // Determine error severity
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

  if (error.name === 'ValidationError') {
    severity = 'low';
  } else if (error.name === 'UnauthorizedError') {
    severity = 'medium';
  } else if (error.name === 'DatabaseError' || error.message.includes('ECONNREFUSED')) {
    severity = 'high';
  } else if (error.message.includes('Out of memory') || error.name === 'RangeError') {
    severity = 'critical';
  }

  // Track the error
  const errorId = errorTracker.trackError(
    error,
    {
      requestId: req.id,
      userId: (req as any).user?.id,
      sessionId: (req as any).sessionId,
      component: 'express',
      method: req.method,
      url: req.originalUrl,
    },
    severity,
    req
  );

  // Add to debug session if active
  if (req.debugSession) {
    debugTools.addDebugEvent(req.debugSession, {
      timestamp: Date.now(),
      type: 'error',
      level: 'error',
      message: error.message,
      data: {
        errorId,
        name: error.name,
        stack: error.stack,
        severity,
      },
      stackTrace: error.stack,
    });
  }

  // Format error response
  const statusCode = (error as any).statusCode || (error as any).status || 500;

  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? 'Internal server error' : error.message,
      errorId,
      timestamp: Date.now(),
    });
  } else {
    res.status(statusCode).json({
      success: false,
      message: error.message,
      errorId,
      stack: error.stack,
      name: error.name,
      timestamp: Date.now(),
    });
  }
}

/**
 * Security monitoring middleware
 */
export function securityMiddleware(req: DebuggingRequest, res: Response, next: NextFunction): void {
  // Monitor for suspicious patterns
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i, // Path traversal
    /(script|javascript|vbscript|onload|onerror)/i, // XSS attempts
    /(union|select|insert|delete|drop|create|alter)/i, // SQL injection
    /(eval|exec|system|shell_exec)/i, // Code injection
  ];

  const fullUrl = req.originalUrl + JSON.stringify(req.body);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl)) {
      logger.logSecurityEvent(`Suspicious request pattern detected: ${pattern.source}`, 'medium', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        pattern: pattern.source,
      });

      // Track as security error
      errorTracker.trackCustomError(
        'SecurityThreat',
        `Suspicious pattern detected: ${pattern.source}`,
        {
          requestId: req.id,
          component: 'security',
          ip: req.ip,
          url: req.originalUrl,
        },
        'medium'
      );

      break;
    }
  }

  // Monitor for brute force attempts
  const failedAttempts = res.locals.failedAttempts || 0;
  if (failedAttempts > 5) {
    logger.logSecurityEvent('Potential brute force attack', 'high', {
      requestId: req.id,
      ip: req.ip,
      failedAttempts,
      url: req.originalUrl,
    });
  }

  next();
}

/**
 * Rate limiting middleware
 */
// Simple in-memory rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimitingMiddleware(
  req: DebuggingRequest,
  res: Response,
  next: NextFunction
): void {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  let store = rateLimitStore.get(key);

  if (!store || now > store.resetTime) {
    store = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(key, store);
  } else {
    store.count++;
  }

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store.count));
  res.setHeader('X-RateLimit-Reset', new Date(store.resetTime).toISOString());

  if (store.count > maxRequests) {
    logger.logSecurityEvent('Rate limit exceeded', 'medium', {
      requestId: req.id,
      ip: req.ip,
      count: store.count,
      limit: maxRequests,
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests',
      retryAfter: Math.ceil((store.resetTime - now) / 1000),
    });
    return;
  }

  next();
}

/**
 * Complete debugging middleware stack
 */
export function createDebuggingMiddleware() {
  return [
    requestIdMiddleware,
    performanceMiddleware,
    loggingMiddleware,
    securityMiddleware,
    rateLimitingMiddleware,
    debugMiddleware,
  ];
}

/**
 * Database query monitoring middleware (for Mongoose)
 */
export function setupDatabaseMonitoring(): void {
  const mongoose = require('mongoose');

  // Monitor slow queries
  mongoose.set('debug', (collectionName: string, method: string, query: any, _doc: any) => {
    const startTime = Date.now();

    // This is a simplified implementation
    logger.debug('Database query', {
      collection: collectionName,
      method,
      query: JSON.stringify(query),
      component: 'database',
    });

    // In a real implementation, you'd measure actual query duration
    const duration = Date.now() - startTime;
    if (duration > 100) {
      logger.warn('Slow database query', {
        collection: collectionName,
        method,
        duration,
        query: JSON.stringify(query),
        component: 'database',
      });
    }

    performanceMonitor.recordMetric({
      name: 'database_query_duration',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        collection: collectionName,
        method,
      },
    });
  });
}

/**
 * WebSocket debugging middleware
 */
export function createWebSocketDebugging(io: any): void {
  io.use((socket: any, next: any) => {
    // Add debugging to socket
    socket.debugSession = debugTools.startDebugSession({
      socketId: socket.id,
      component: 'websocket',
      handshake: socket.handshake,
    });

    logger.debug('WebSocket connection established', {
      socketId: socket.id,
      component: 'websocket',
    });

    socket.on('disconnect', () => {
      logger.debug('WebSocket connection closed', {
        socketId: socket.id,
        component: 'websocket',
      });

      if (socket.debugSession) {
        debugTools.endDebugSession(socket.debugSession);
      }
    });

    // Monitor socket events
    const originalEmit = socket.emit;
    socket.emit = function (...args: any[]) {
      if (socket.debugSession) {
        debugTools.addDebugEvent(socket.debugSession, {
          timestamp: Date.now(),
          type: 'log',
          level: 'debug',
          message: 'Socket event emitted',
          data: {
            event: args[0],
            data: args.slice(1),
          },
        });
      }

      return originalEmit.apply(this, args);
    };

    next();
  });
}

export default {
  createDebuggingMiddleware,
  errorTrackingMiddleware,
  setupDatabaseMonitoring,
  createWebSocketDebugging,
};
