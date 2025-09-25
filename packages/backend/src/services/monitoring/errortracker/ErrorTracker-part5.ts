errors = errors.filter((e) => e.fingerprint === filters.fingerprint);
}

    // Sort by timestamp (newest first)
    errors.sort((a, b) => b.timestamp - a.timestamp)

if (filters?.limit) {
  errors = errors.slice(0, filters.limit);
}

return errors;
}

  public getErrorPatterns(): ErrorPattern[]
{
  return Array.from(this.patterns.values()).sort((a, b) => b.count - a.count);
}

public
getErrorStats(since?: number)
:
{
  total: number;
  bySeverity: Record<string, number>;
  byPattern: Array<{ fingerprint: string; count: number }>;
  errorRate: number;
}
{
  const errors = this.getErrors({ since });
  const total = errors.length;

  const bySeverity = errors.reduce(
    (acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const patternCounts = new Map<string, number>();
  errors.forEach((error) => {
    const count = patternCounts.get(error.fingerprint) || 0;
    patternCounts.set(error.fingerprint, count + 1);
  });

  const byPattern = Array.from(patternCounts.entries())
    .map(([fingerprint, count]) => ({
      fingerprint: fingerprint.substring(0, 8),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const timeWindow = since ? Date.now() - since : 60 * 60 * 1000; // 1 hour default
  const errorRate = (total / (timeWindow / 1000)) * 60; // errors per minute

  return {
      total,
      bySeverity,
      byPattern,
      errorRate,
    };
}

// Resolution methods
public
resolvePattern(fingerprint: string, resolvedBy: string)
: boolean
{
  const pattern = this.patterns.get(fingerprint);
  if (!pattern) return false;

  pattern.isResolved = true;
  pattern.resolvedAt = Date.now();
  pattern.resolvedBy = resolvedBy;

  logger.info(`Error pattern resolved`, {
    fingerprint: fingerprint.substring(0, 8),
    resolvedBy,
    component: 'error-tracker',
  });

  return true;
}

// Express middleware
public
createExpressErrorHandler();
{
    return (error: Error, req: any, res: any, _next: any) => {
      const errorId = this.trackError(
        error,
        {
          requestId: req.id,
          userId: req.user?.id,
          component: 'express',
          method: req.method,
          url: req.originalUrl,
        },
        'high',
        req
      );

      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errorId,
        });
