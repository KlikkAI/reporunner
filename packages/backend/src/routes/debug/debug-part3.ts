data: {
  session;
}
,
    })
})

router.get('/debug/sessions/:sessionId/export', (req, res) =>
{
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
}
)

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
    sampleInterval: sampleInterval ? parseInt(sampleInterval, 10) : undefined,
    duration: duration ? parseInt(duration, 10) : undefined,
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

router.post('/debug/memory/leak-detection/stop', (_req, res) => {
  debugTools.stopMemoryLeakDetection();

  res.json({
    success: true,
    message: 'Memory leak detection stopped',
  });
});

// Configuration Routes
router.get('/debug/config', (_req, res) => {
    const config = {
