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
  router.use('*', (req, res) => {
    res.status(404).json({ error: 'Debug routes not available' });
  });
} else {
  // Health and Status Routes
  router.get('/health', healthCheck.createHealthEndpoint());
  router.get('/health/ready', healthCheck.createReadinessEndpoint());
  router.get('/health/live', healthCheck.createLivenessEndpoint());

  // System Information Routes
  router.get('/system/info', (req, res) => {
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
    const sinceTimestamp = since ? parseInt(since as string) : Date.now() - 60 * 60 * 1000; // Last hour

    const metrics = performanceMonitor
      .getMetrics(undefined, sinceTimestamp)
      .slice(0, parseInt(limit as string));

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
    const sinceTimestamp = since ? parseInt(since as string) : undefined;

    const errors = errorTracker.getErrors({
      severity: severity as string,
      since: sinceTimestamp,
      limit: parseInt(limit as string),
    });

    const stats = errorTracker.getErrorStats(sinceTimestamp);

    res.json({
      success: true,
      data: {
        errors,
        stats,
      },
    });
  });

  router.get('/errors/:errorId', (req, res) => {
    const { errorId } = req.params;
    const error = errorTracker.getError(errorId);

    if (!error) {
      res.status(404).json({
        success: false,
        message: 'Error not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { error },
    });
  });

  router.get('/errors/patterns', (req, res) => {
    const patterns = errorTracker.getErrorPatterns();

    res.json({
      success: true,
      data: { patterns },
    });
  });

  router.post('/errors/patterns/:fingerprint/resolve', (req, res) => {
    const { fingerprint } = req.params;
    const { resolvedBy = 'unknown' } = req.body;

    const success = errorTracker.resolvePattern(fingerprint, resolvedBy);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Error pattern not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Error pattern resolved',
    });
  });

  // Debug Session Routes
  router.post('/debug/sessions', (req, res) => {
    const { context = {} } = req.body;
    const sessionId = debugTools.startDebugSession(context);

    res.status(201).json({
      success: true,
      data: { sessionId },
    });
  });

  router.get('/debug/sessions/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = debugTools['activeSessions'].get(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Debug session not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { session },
    });
  });

  router.post('/debug/sessions/:sessionId/end', (req, res) => {
    const { sessionId } = req.params;
    const session = debugTools.endDebugSession(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Debug session not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { session },
    });
  });

  router.get('/debug/sessions/:sessionId/export', (req, res) => {
    const { sessionId } = req.params;
    const { format = 'json' } = req.query;

    const exported = debugTools.exportDebugSession(sessionId, format as 'json' | 'csv');

    if (!exported) {
      res.status(404).json({
        success: false,
        message: 'Debug session not found',
      });
      return;
    }

    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `debug-session-${sessionId}.${format}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(exported);
  });

  // Performance Profiling Routes
  router.post('/debug/profiling/start', (req, res) => {
    const { name, sampleInterval, duration } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Profile name is required',
      });
      return;
    }

    const profileId = debugTools.startProfiling(name, {
      sampleInterval: sampleInterval ? parseInt(sampleInterval) : undefined,
      duration: duration ? parseInt(duration) : undefined,
    });

    res.status(201).json({
      success: true,
      data: { profileId },
    });
  });

  router.post('/debug/profiling/:profileId/stop', (req, res) => {
    const { profileId } = req.params;
    const profile = debugTools.stopProfiling(profileId);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { profile },
    });
  });

  // Memory Analysis Routes
  router.post('/debug/memory/snapshot', (req, res) => {
    const { name = 'manual' } = req.body;
    const snapshotId = debugTools.takeMemorySnapshot(name);

    res.status(201).json({
      success: true,
      data: { snapshotId },
    });
  });

  router.post('/debug/memory/leak-detection/start', (req, res) => {
    const { interval = 30000 } = req.body;
    debugTools.startMemoryLeakDetection(interval);

    res.json({
      success: true,
      message: 'Memory leak detection started',
    });
  });

  router.post('/debug/memory/leak-detection/stop', (req, res) => {
    debugTools.stopMemoryLeakDetection();

    res.json({
      success: true,
      message: 'Memory leak detection stopped',
    });
  });

  // Configuration Routes
  router.get('/debug/config', (req, res) => {
    const config = {
      globalDebugMode: debugTools['globalDebugMode'],
      logLevel: logger.getLogLevel(),
      environment: process.env.NODE_ENV,
      debugRoutes: isDebugEnabled,
      activeSessions: debugTools['activeSessions'].size,
      activeProfiles: debugTools['performanceProfiler'].size,
    };

    res.json({
      success: true,
      data: config,
    });
  });

  router.post('/debug/config/debug-mode', (req, res) => {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'enabled field must be boolean',
      });
      return;
    }

    debugTools.setGlobalDebugMode(enabled);

    res.json({
      success: true,
      message: `Debug mode ${enabled ? 'enabled' : 'disabled'}`,
    });
  });

  router.post('/debug/config/log-level', (req, res) => {
    const { level } = req.body;

    const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
    if (!validLevels.includes(level)) {
      res.status(400).json({
        success: false,
        message: `Invalid log level. Valid levels: ${validLevels.join(', ')}`,
      });
      return;
    }

    logger.setLogLevel(level);

    res.json({
      success: true,
      message: `Log level set to ${level}`,
    });
  });

  // State Dump Routes
  router.get('/debug/state', (req, res) => {
    const { sessionId } = req.query;
    const state = debugTools.dumpState(sessionId as string);

    res.json({
      success: true,
      data: state,
    });
  });

  // Test Error Generation (for testing error tracking)
  router.post('/debug/test/error', (req, res) => {
    const { type = 'generic', message = 'Test error', severity = 'medium' } = req.body;

    try {
      if (type === 'throw') {
        throw new Error(message);
      } else if (type === 'async') {
        Promise.reject(new Error(message));
        res.json({ success: true, message: 'Async error triggered' });
      } else {
        const error = new Error(message);
        errorTracker.trackError(
          error,
          {
            component: 'debug-test',
            requestId: (req as any).id,
          },
          severity
        );

        res.json({
          success: true,
          message: 'Test error tracked',
        });
      }
    } catch (error) {
      // This will be caught by the error handler middleware
      throw error;
    }
  });

  // Performance Test Routes
  router.post('/debug/test/performance', (req, res) => {
    const { duration = 100, cpu = false, memory = false } = req.body;

    const startTime = Date.now();

    if (cpu) {
      // CPU intensive task
      const end = Date.now() + duration;
      while (Date.now() < end) {
        Math.random();
      }
    }

    if (memory) {
      // Memory intensive task
      const largeArray = new Array(1000000).fill('test data');
      setTimeout(() => {
        // Release after a moment
        largeArray.length = 0;
      }, 100);
    }

    const actualDuration = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        requestedDuration: duration,
        actualDuration,
        cpuTest: cpu,
        memoryTest: memory,
      },
    });
  });

  // MongoDB Debugging (if using Mongoose)
  router.get('/debug/database/connections', (req, res) => {
    const mongoose = require('mongoose');

    const connectionInfo = {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.connection.models),
    };

    res.json({
      success: true,
      data: connectionInfo,
    });
  });

  // Log recent entries
  router.get('/debug/logs/recent', (req, res) => {
    // This would require storing logs in memory or reading from log files
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        message: 'Recent logs endpoint - would require log storage implementation',
        recommendation: 'Check log files directly or implement log storage',
      },
    });
  });
}

export default router;
