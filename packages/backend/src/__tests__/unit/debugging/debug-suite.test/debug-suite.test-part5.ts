const recentMetrics = performanceMonitor.getMetrics('correlation_test_duration');

expect(recentErrors[0]?.context?.requestId).toBe('correlation-test');
expect(recentMetrics[0]?.metadata?.requestId).toBe('correlation-test');
expect(duration).toBeGreaterThan(0);
})
})
})
