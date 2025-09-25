if (recentErrors.length > 50) {
  // More than 50 errors in an hour
  logger.error(`High error rate detected`, {
    fingerprint: fingerprint.substring(0, 8),
    errorCount: recentErrors.length,
    timeWindow: '1 hour',
    component: 'error-tracker',
  });
}
}

  // Circuit breaker pattern
  private updateCircuitBreaker(fingerprint: string, timestamp: number): void
{
  let breaker = this.circuitBreakers.get(fingerprint);

  if (!breaker) {
    breaker = { isOpen: false, failures: 0, lastFailure: timestamp };
  }

  breaker.failures++;
  breaker.lastFailure = timestamp;

  // Open circuit breaker after 5 failures
  if (breaker.failures >= 5 && !breaker.isOpen) {
    breaker.isOpen = true;
    logger.warn(`Circuit breaker opened for error pattern`, {
      fingerprint: fingerprint.substring(0, 8),
      failures: breaker.failures,
      component: 'error-tracker',
    });
  }

  this.circuitBreakers.set(fingerprint, breaker);
}

// Critical error handling
private
handleCriticalError(errorInfo: ErrorInfo)
: void
{
  // Log to security events
  logger.logSecurityEvent(`Critical error: ${errorInfo.name}`, 'critical', {
    errorId: errorInfo.id,
    fingerprint: errorInfo.fingerprint.substring(0, 8),
    userId: errorInfo.user?.id,
    requestId: errorInfo.request?.id,
  });

  // Could integrate with external alerting systems here
  // e.g., Slack, PagerDuty, email alerts

  this.emit('criticalError', errorInfo);
}

// Utility methods
private
generateErrorId();
: string
{
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

private
generateFingerprint(error: Error, context?: LogContext)
: string
{
  // Create a unique fingerprint for error grouping
  const key = `${error.name}:${error.message}:${context?.component || 'unknown'}`;

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16);
}

private
extractRequestInfo(req: any)
: ErrorInfo['request']
{
  return {
      id: req.id || 'unknown',
      method: req.method,
      url: req.originalUrl || req.url,
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeBody(req.body),
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent') || 'unknown',
    };
}

private
sanitizeHeaders(headers: any)
: Record<string, string>
{
  const sanitized = { ...headers };

  // Remove sensitive headers
  sanitized.authorization = undefined;
  sanitized.cookie = undefined;
  sanitized['x-api-key'] = undefined;

  return sanitized;
}

private
sanitizeBody(body: any)
: any
{
    if (!body) return undefined;

    const sanitized = { ...body };

// Remove sensitive fields
