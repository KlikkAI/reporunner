res.json({
  success: true,
  data: {
    errors,
    stats,
  },
});
})

router.get('/errors/:errorId', (req, res) =>
{
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
}
)

router.get('/errors/patterns', (_req, res) =>
{
  const patterns = errorTracker.getErrorPatterns();

  res.json({
    success: true,
    data: { patterns },
  });
}
)

router.post('/errors/patterns/:fingerprint/resolve', (req, res) =>
{
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
}
)

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
  const session = debugTools.activeSessions.get(sessionId);

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
