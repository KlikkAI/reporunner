// Log incoming request
logger.http(`${req.method} ${req.originalUrl}`, {
  requestId: req.id,
  method: req.method,
  url: req.originalUrl,
  userAgent: req.get('User-Agent'),
  ip: req.ip,
  userId: (req as any).user?.id,
});

// Intercept response to log completion
res.on('finish', () => {
  const duration = Date.now() - startTime;

  logger.logRequest(req, res, duration);

  // Log errors
  if (res.statusCode >= 400) {
    const level = res.statusCode >= 500 ? 'error' : 'warn';
    logger[level](`HTTP ${res.statusCode}`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      component: 'http',
    });
  }
});

next();
}

/**
 * Debug mode middleware
 */
export function debugMiddleware(req: DebuggingRequest, res: Response, next: NextFunction): void {
  // Only activate in debug mode
  if (!debugTools.globalDebugMode) {
    return next();
  }

  // Start debug session for this request
  req.debugSession = debugTools.startDebugSession({
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
  });

  // Log detailed request information
  debugTools.addDebugEvent(req.debugSession, {
    timestamp: Date.now(),
    type: 'log',
    level: 'debug',
    message: 'Request received',
    data: {
      headers: req.headers,
      query: req.query,
      params: req.params,
      body: req.body,
    },
  });

  // Intercept response
  const originalSend = res.send;
  res.send = function (data: any) {
    if (req.debugSession) {
      debugTools.addDebugEvent(req.debugSession, {
        timestamp: Date.now(),
        type: 'log',
        level: 'debug',
        message: 'Response sent',
        data: {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body: data,
        },
      });

      debugTools.endDebugSession(req.debugSession);
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Error tracking middleware
 */
export function errorTrackingMiddleware(
  error: Error,
  req: DebuggingRequest,
  res: Response,
  _next: NextFunction
): void {
