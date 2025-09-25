globalDebugMode: debugTools.globalDebugMode, logLevel;
: logger.getLogLevel(),
      environment: process.env.NODE_ENV,
      debugRoutes: isDebugEnabled,
      activeSessions: debugTools.activeSessions.size,
      activeProfiles: debugTools.performanceProfiler.size,
    }

res.json(
{
  success: true, data;
  : config,
}
)
})

router.post('/debug/config/debug-mode', (req, res) =>
{
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
}
)

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
});

// Performance Test Routes
router.post('/debug/test/performance', (req, res) => {
    const { duration = 100, cpu = false, memory = false } = req.body;

    const startTime = Date.now();

    if (cpu) {
      // CPU intensive task
      const end = Date.now() + duration;
      while (Date.now() < end) {
