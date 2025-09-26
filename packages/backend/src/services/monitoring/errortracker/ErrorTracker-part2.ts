request: requestInfo, environment;
: this.getEnvironmentInfo(),
      tags: this.extractTags(error, context),
      metadata: this.extractMetadata(error, context),
    }

// Check if this error pattern exists
this.updateErrorPattern(fingerprint, severity, timestamp)

// Store error
this.errors.set(errorId, errorInfo)

// Update error rate tracking
this.updateErrorRate(fingerprint, timestamp)

// Check circuit breaker
this.updateCircuitBreaker(fingerprint, timestamp);

// Log error
logger.error(`Error tracked: ${error.message}`, context, error);

// Record performance metric
performanceMonitor.incrementCounter('errors_total', 1, {
  severity,
  fingerprint: fingerprint.substring(0, 8),
  type: error.name,
});

// Emit event
this.emit('error', errorInfo);

// Handle critical errors
if (severity === 'critical') {
  this.handleCriticalError(errorInfo);
}

return errorId;
}

  public trackCustomError(
    name: string,
    message: string,
    context?: LogContext,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    _metadata?: Record<string, any>
  ): string
{
  const customError = new Error(message);
  customError.name = name;

  return this.trackError(customError, context, severity);
}

// Error pattern analysis
private
updateErrorPattern(fingerprint: string, severity: string, timestamp: number)
: void
{
  let pattern = this.patterns.get(fingerprint);

  if (pattern) {
    pattern.count++;
    pattern.lastSeen = timestamp;

    // Upgrade severity if needed
    if (this.compareSeverity(severity, pattern.severity) > 0) {
      pattern.severity = severity;
    }
  } else {
    pattern = {
      fingerprint,
      count: 1,
      firstSeen: timestamp,
      lastSeen: timestamp,
      severity,
      isResolved: false,
    };
  }

  this.patterns.set(fingerprint, pattern);

  // Check for error spikes
  if (pattern.count % 10 === 0) {
    logger.warn(`Error pattern spike detected`, {
      fingerprint: fingerprint.substring(0, 8),
      count: pattern.count,
      severity: pattern.severity,
      component: 'error-tracker',
    });
  }
}

// Error rate monitoring
private
updateErrorRate(fingerprint: string, timestamp: number)
: void
{
    const window = this.errorRateWindows.get(fingerprint) || [];
    window.push(timestamp);

    // Keep only last hour of errors
    const oneHourAgo = timestamp - 60 * 60 * 1000;
    const recentErrors = window.filter((t) => t > oneHourAgo);

    this.errorRateWindows.set(fingerprint, recentErrors);

// Check error rate threshold
