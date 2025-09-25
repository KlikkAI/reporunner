} else
{
  res.status(500).json({
    success: false,
    message: error.message,
    errorId,
    stack: error.stack,
  });
}
}
}

  // Cleanup
  private startCleanupInterval(): void
{
  // Clean old errors every hour
  setInterval(
    () => {
      this.cleanupOldErrors();
    },
    60 * 60 * 1000
  );
}

private
cleanupOldErrors();
: void
{
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const [errorId, error] of this.errors) {
    if (error.timestamp < oneWeekAgo) {
      this.errors.delete(errorId);
    }
  }

  logger.debug('Cleaned up old errors', {
    component: 'error-tracker',
    remainingErrors: this.errors.size,
  });
}

public
stop();
: void
{
  this.errors.clear();
  this.patterns.clear();
  this.errorRateWindows.clear();
  this.circuitBreakers.clear();
}
}

// Export singleton instance
export const errorTracker = new ErrorTrackingService();
export default errorTracker;
