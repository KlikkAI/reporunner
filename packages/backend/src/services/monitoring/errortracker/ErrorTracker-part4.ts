sanitized.password = undefined;
sanitized.token = undefined;
sanitized.secret = undefined;
sanitized.apiKey = undefined;

return sanitized;
}

  private getEnvironmentInfo(): ErrorInfo['environment']
{
  return {
      nodeVersion: process.version,
      platform: process.platform,
      hostname: require('node:os').hostname(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };
}

private
extractTags(error: Error, context?: LogContext)
: Record<string, string>
{
  return {
      errorType: error.name,
      component: context?.component || 'unknown',
      module: context?.module || 'unknown',
      environment: process.env.NODE_ENV || 'development',
    };
}

private
extractMetadata(error: Error, context?: LogContext)
: Record<string, any>
{
  return {
      hasStack: !!error.stack,
      stackLines: error.stack?.split('\n').length || 0,
      errorCode: (error as any).code,
      context: context || {},
    };
}

private
compareSeverity(a: string, b: string)
: number
{
  const levels: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return (levels[a] || 0) - (levels[b] || 0);
}

// Global error handlers
private
setupGlobalErrorHandlers();
: void
{
  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    this.trackError(error, { component: 'global' }, 'critical');
    logger.error('Uncaught exception', { component: 'global' }, error);

    // Give time to log before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    this.trackError(error, { component: 'global', promise: promise.toString() }, 'high');
    logger.error('Unhandled rejection', { component: 'global' }, error);
  });

  // Warning events
  process.on('warning', (warning) => {
    this.trackCustomError(
      'NodeWarning',
      warning.message,
      { component: 'global', warningName: warning.name },
      'low',
      { stack: warning.stack }
    );
  });
}

// Query methods
public
getError(errorId: string)
: ErrorInfo | undefined
{
  return this.errors.get(errorId);
}

public
getErrors(filters?: {
    severity?: string;
since?: number;
fingerprint?: string;
limit?: number;
}): ErrorInfo[]
{
    let errors = Array.from(this.errors.values());

    if (filters?.severity) {
      errors = errors.filter((e) => e.severity === filters.severity);
    }

    if (filters?.since) {
      errors = errors.filter((e) => e.timestamp >= filters.since!);
    }

    if (filters?.fingerprint) {
