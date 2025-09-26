/**
 * Debug Routes
 * REST API endpoints for debugging and monitoring
 */

import { Router } from 'express';
import { debugTools } from '../services/debugging/DebugTools.js';
import { logger } from '../services/logging/Logger.js';
import { errorTracker } from '../services/monitoring/ErrorTracker.js';
import { healthCheck } from '../services/monitoring/HealthCheck.js';
import { performanceMonitor } from '../services/monitoring/PerformanceMonitor.js';

const router: Router = Router();

// Only enable debug routes in development or when explicitly enabled
const isDebugEnabled =
  process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG_ROUTES === 'true';

if (!isDebugEnabled) {
  // Return 404 for all debug routes in production
  router.use('*', (_req, res) => {
    res.status(404).json({ error: 'Debug routes not available' });
  });
} else {
  // Health and Status Routes
  router.get('/health', healthCheck.createHealthEndpoint());
  router.get('/health/ready', healthCheck.createReadinessEndpoint());
  router.get('/health/live', healthCheck.createLivenessEndpoint());

  // System Information Routes
  router.get('/system/info', (_req, res) => {
    const systemInfo = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        pid: process.pid,
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DEBUG_MODE: process.env.DEBUG_MODE,
        LOG_LEVEL: process.env.LOG_LEVEL,
      },
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length,
    };

    res.json({
      success: true,
      data: systemInfo,
    });
  });

  router.get('/system/metrics', (req, res) => {
    const { since, limit = 100 } = req.query;
    const sinceTimestamp = since ? parseInt(since as string, 10) : Date.now() - 60 * 60 * 1000; // Last hour

    const metrics = performanceMonitor
      .getMetrics(undefined, sinceTimestamp)
      .slice(0, parseInt(limit as string, 10));

    const summary = {
      total: metrics.length,
      byType: metrics.reduce(
        (acc, metric) => {
          acc[metric.name] = (acc[metric.name] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      timeRange: {
        start: sinceTimestamp,
        end: Date.now(),
      },
    };

    res.json({
      success: true,
      data: {
        metrics,
        summary,
      },
    });
  });

  // Error Tracking Routes
  router.get('/errors', (req, res) => {
    const { severity, since, limit = 50 } = req.query;
    const sinceTimestamp = since ? parseInt(since as string, 10) : undefined;

    const errors = errorTracker.getErrors({
      severity: severity as string,
      since: sinceTimestamp,
      limit: parseInt(limit as string, 10),
    });

    const stats = errorTracker.getErrorStats(sinceTimestamp);
