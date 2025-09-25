'medium';
)
}

const patterns = errorTracker.getErrorPatterns();
const patternWithMultiple = patterns.find((p) => p.count >= 3);

expect(patternWithMultiple).toBeDefined();
})
})

describe('Debug Tools', () =>
{
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
    const profile = debugTools.performanceProfiler.get(profileId);
    expect(profile).toBeUndefined(); // Should be cleaned up after stopping
  });
}
)

describe('Health Check Service', () => {
    it('should perform health checks', async () => {
      const health = await healthCheck.performHealthCheck();

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.timestamp).toBeGreaterThan(0);
      expect(health.uptime).toBeGreaterThan(0);
      expect(health.checks).toBeDefined();
      expect(health.metrics).toBeDefined();
