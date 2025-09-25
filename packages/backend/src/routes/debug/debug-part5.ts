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
})

// MongoDB Debugging (if using Mongoose)
router.get('/debug/database/connections', (_req, res) =>
{
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
}
)

// Log recent entries
router.get('/debug/logs/recent', (_req, res) => {
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
