performanceMonitor.recordGauge('test_gauge', 99.5, 'percentage');

// Should not throw errors
expect(true).toBe(true);
})

it('should get performance statistics', () =>
{
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
}
)
})

describe('Error Tracker', () =>
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
