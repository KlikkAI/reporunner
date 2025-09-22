import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { debugTools } from '../../../services/debugging/DebugTools.js';
import { logger } from '../../../services/logging/Logger.js';
import { errorTracker } from '../../../services/monitoring/ErrorTracker.js';
import { healthCheck } from '../../../services/monitoring/HealthCheck.js';
import { performanceMonitor } from '../../../services/monitoring/PerformanceMonitor.js';

describe('Professional Debugging Suite', () => {
  beforeEach(() => {
    // Enable debug mode for testing
    debugTools.setGlobalDebugMode(true);
  });

  afterEach(() => {
    // Clean up after tests
    debugTools.setGlobalDebugMode(false);
  });

  describe('Logger Service', () => {
    it('should log messages with context', () => {
      const context = {
        requestId: 'test-123',
        userId: 'user-456',
        component: 'test',
      };

      // Test different log levels
      logger.debug('Debug message', context);
      logger.info('Info message', context);
      logger.warn('Warning message', context);
      logger.error('Error message', context, new Error('Test error'));

      // Logger should not throw errors
      expect(() => {
        logger.logRequest(
          {
            method: 'GET',
            originalUrl: '/test',
            ip: '127.0.0.1',
            get: () => 'test-agent',
          },
          { statusCode: 200, get: () => '1234' },
          150
        );
      }).not.toThrow();
    });

    it('should create child loggers', () => {
      const childLogger = logger.createChildLogger({
        component: 'test-child',
        module: 'testing',
      });

      expect(childLogger).toBeDefined();
      expect(() => {
        childLogger.info('Child logger test');
      }).not.toThrow();
    });
  });

  describe('Performance Monitor', () => {
    it('should track operation timers', async () => {
      const timerId = performanceMonitor.startTimer('test_operation', {
        testData: 'example',
      });

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 50));

      const duration = performanceMonitor.endTimer(timerId);

      expect(duration).toBeGreaterThan(40);
      expect(duration).toBeLessThan(100);
    });

    it('should measure async operations', async () => {
      const testOperation = async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return 'test result';
      };

      const result = await performanceMonitor.measureOperation('async_test', testOperation, {
        testCase: 'async',
      });

      expect(result).toBe('test result');
    });

    it('should record metrics', () => {
      performanceMonitor.recordMetric({
        name: 'test_metric',
        value: 123,
        unit: 'count',
        timestamp: Date.now(),
        tags: { type: 'test' },
      });

      performanceMonitor.incrementCounter('test_counter', 5, {
        category: 'test',
      });
      performanceMonitor.recordGauge('test_gauge', 99.5, 'percentage');

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should get performance statistics', () => {
      // Record some test metrics
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordMetric({
          name: 'test_stats',
          value: i * 10,
          unit: 'ms',
          timestamp: Date.now(),
        });
      }

      const average = performanceMonitor.getAverageMetric('test_stats');
      const p95 = performanceMonitor.getPercentile('test_stats', 95);

      expect(average).toBeGreaterThan(0);
      expect(p95).toBeGreaterThan(0);
    });
  });

  describe('Error Tracker', () => {
    let errorListener: () => void;

    beforeEach(() => {
      // Add error listener to prevent unhandled error events
      errorListener = () => {}; // Empty handler to absorb events
      errorTracker.on('error', errorListener);
    });

    afterEach(() => {
      // Clean up listener
      errorTracker.off('error', errorListener);
    });

    it('should track errors with context', () => {
      const error = new Error('Test error for tracking');
      const context = {
        requestId: 'test-request',
        component: 'test',
        operation: 'error-tracking-test',
      };

      const errorId = errorTracker.trackError(error, context, 'medium');

      expect(errorId).toBeDefined();
      expect(typeof errorId).toBe('string');

      // Retrieve the error
      const trackedError = errorTracker.getError(errorId);
      expect(trackedError).toBeDefined();
      expect(trackedError?.message).toBe('Test error for tracking');
      expect(trackedError?.context?.component).toBe('test');
    });

    it('should track custom errors', () => {
      const errorId = errorTracker.trackCustomError(
        'TestError',
        'Custom test error message',
        { testCase: 'custom-error' },
        'low'
      );

      expect(errorId).toBeDefined();

      const trackedError = errorTracker.getError(errorId);
      expect(trackedError?.name).toBe('TestError');
      expect(trackedError?.severity).toBe('low');
    });

    it('should provide error statistics', () => {
      // Create some test errors
      for (let i = 0; i < 5; i++) {
        errorTracker.trackCustomError(
          'TestStatError',
          `Test error ${i}`,
          { index: i },
          i % 2 === 0 ? 'low' : 'medium'
        );
      }

      const stats = errorTracker.getErrorStats();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.bySeverity).toBeDefined();
      expect(stats.byPattern).toBeDefined();
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('should group error patterns', () => {
      // Create multiple instances of the same error
      for (let i = 0; i < 3; i++) {
        errorTracker.trackCustomError(
          'PatternTestError',
          'Same error message',
          { component: 'pattern-test' },
          'medium'
        );
      }

      const patterns = errorTracker.getErrorPatterns();
      const patternWithMultiple = patterns.find((p) => p.count >= 3);

      expect(patternWithMultiple).toBeDefined();
    });
  });

  describe('Debug Tools', () => {
    it('should manage debug sessions', () => {
      const sessionId = debugTools.startDebugSession({
        testCase: 'session-management',
        userId: 'test-user',
      });

      expect(sessionId).toBeDefined();

      // Add some debug events
      debugTools.addDebugEvent(sessionId, {
        timestamp: Date.now(),
        type: 'log',
        level: 'debug',
        message: 'Test debug event',
        data: { step: 1 },
      });

      debugTools.addDebugEvent(sessionId, {
        timestamp: Date.now(),
        type: 'performance',
        level: 'info',
        message: 'Performance event',
        data: { duration: 150 },
      });

      const session = debugTools.endDebugSession(sessionId);

      expect(session).toBeDefined();
      expect(session?.events.length).toBeGreaterThanOrEqual(3); // At least start, 2 added, and end events
    });

    it('should export debug sessions', () => {
      const sessionId = debugTools.startDebugSession({ testCase: 'export' });

      debugTools.addDebugEvent(sessionId, {
        timestamp: Date.now(),
        type: 'custom',
        level: 'info',
        message: 'Export test event',
        data: { exported: true },
      });

      const jsonExport = debugTools.exportDebugSession(sessionId, 'json');
      const csvExport = debugTools.exportDebugSession(sessionId, 'csv');

      expect(jsonExport).toBeDefined();
      expect(csvExport).toBeDefined();
      expect(jsonExport).toContain('Export test event');
      expect(csvExport).toContain('Export test event');

      debugTools.endDebugSession(sessionId);
    });

    it('should perform memory snapshots', () => {
      const snapshotId = debugTools.takeMemorySnapshot('test-snapshot');

      expect(snapshotId).toBeDefined();
      expect(typeof snapshotId).toBe('string');
      expect(snapshotId).toContain('test-snapshot');
    });

    it('should profile performance', async () => {
      const profileId = debugTools.startProfiling('test-profile', {
        sampleInterval: 10,
        duration: 100,
      });

      expect(profileId).toBeDefined();

      // Wait for profiling to complete
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Profile should auto-stop
      const profile = debugTools['performanceProfiler'].get(profileId);
      expect(profile).toBeUndefined(); // Should be cleaned up after stopping
    });
  });

  describe('Health Check Service', () => {
    it('should perform health checks', async () => {
      const health = await healthCheck.performHealthCheck();

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.timestamp).toBeGreaterThan(0);
      expect(health.uptime).toBeGreaterThan(0);
      expect(health.checks).toBeDefined();
      expect(health.metrics).toBeDefined();
    });

    it('should register custom dependencies', async () => {
      healthCheck.registerDependency({
        name: 'test-service',
        type: 'external-api',
        critical: false,
        timeout: 1000,
        checkFunction: async () => ({
          status: 'pass',
          message: 'Test service is healthy',
          data: { test: true },
        }),
      });

      const health = await healthCheck.performHealthCheck();
      const testCheck = health.checks.find((check) => check.name === 'test-service');

      expect(testCheck).toBeDefined();
      expect(testCheck?.status).toBe('pass');
      expect(testCheck?.message).toBe('Test service is healthy');

      // Clean up
      healthCheck.unregisterDependency('test-service');
    });

    it('should handle failing dependencies', async () => {
      healthCheck.registerDependency({
        name: 'failing-service',
        type: 'external-api',
        critical: true,
        timeout: 1000,
        checkFunction: async () => {
          throw new Error('Service unavailable');
        },
      });

      const health = await healthCheck.performHealthCheck();
      const failingCheck = health.checks.find((check) => check.name === 'failing-service');

      expect(failingCheck).toBeDefined();
      expect(failingCheck?.status).toBe('fail');
      expect(failingCheck?.message).toContain('Service unavailable');

      // Overall status should be unhealthy due to critical failure
      expect(health.status).toBe('unhealthy');

      // Clean up
      healthCheck.unregisterDependency('failing-service');
    });
  });

  describe('Integration Tests', () => {
    let errorListener: () => void;

    beforeEach(() => {
      // Add error listener to prevent unhandled error events
      errorListener = () => {}; // Empty handler to absorb events
      errorTracker.on('error', errorListener);
    });

    afterEach(() => {
      // Clean up listener
      errorTracker.off('error', errorListener);
    });

    it('should handle errors in monitored operations', async () => {
      const operation = async () => {
        throw new Error('Monitored operation failed');
      };

      try {
        await performanceMonitor.measureOperation('failing_operation', operation);
      } catch (error) {
        expect(error.message).toBe('Monitored operation failed');
      }

      // Should have recorded error metric
      const errorMetrics = performanceMonitor.getMetrics('failing_operation_error');
      expect(errorMetrics.length).toBeGreaterThan(0);
    });

    it('should correlate performance and error data', () => {
      const context = {
        requestId: 'correlation-test',
        operation: 'test-correlation',
      };

      // Start performance tracking
      const timerId = performanceMonitor.startTimer('correlation_test', context);

      // Simulate error during operation
      const error = new Error('Correlation test error');
      errorTracker.trackError(error, context, 'medium');

      // End performance tracking
      const duration = performanceMonitor.endTimer(timerId);

      // Both should have the same context
      const recentErrors = errorTracker.getErrors({ limit: 1 });
      const recentMetrics = performanceMonitor.getMetrics('correlation_test_duration');

      expect(recentErrors[0]?.context?.requestId).toBe('correlation-test');
      expect(recentMetrics[0]?.metadata?.requestId).toBe('correlation-test');
      expect(duration).toBeGreaterThan(0);
    });
  });
});
