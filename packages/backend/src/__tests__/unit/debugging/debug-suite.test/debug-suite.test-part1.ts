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
