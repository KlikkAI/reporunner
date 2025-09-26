})

it('should register custom dependencies', async () =>
{
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
}
)

it('should handle failing dependencies', async () =>
{
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
}
)
})

describe('Integration Tests', () =>
{
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
