// Determine error severity
let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

if (error.name === 'ValidationError') {
  severity = 'low';
} else if (error.name === 'UnauthorizedError') {
  severity = 'medium';
} else if (error.name === 'DatabaseError' || error.message.includes('ECONNREFUSED')) {
  severity = 'high';
} else if (error.message.includes('Out of memory') || error.name === 'RangeError') {
  severity = 'critical';
}

// Track the error
const errorId = errorTracker.trackError(
  error,
  {
    requestId: req.id,
    userId: (req as any).user?.id,
    sessionId: (req as any).sessionId,
    component: 'express',
    method: req.method,
    url: req.originalUrl,
  },
  severity,
  req
);

// Add to debug session if active
if (req.debugSession) {
  debugTools.addDebugEvent(req.debugSession, {
    timestamp: Date.now(),
    type: 'error',
    level: 'error',
    message: error.message,
    data: {
      errorId,
      name: error.name,
      stack: error.stack,
      severity,
    },
    stackTrace: error.stack,
  });
}

// Format error response
const statusCode = (error as any).statusCode || (error as any).status || 500;

if (process.env.NODE_ENV === 'production') {
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : error.message,
    errorId,
    timestamp: Date.now(),
  });
} else {
  res.status(statusCode).json({
    success: false,
    message: error.message,
    errorId,
    stack: error.stack,
    name: error.name,
    timestamp: Date.now(),
  });
}
}

/**
 * Security monitoring middleware
 */
export function securityMiddleware(req: DebuggingRequest, res: Response, next: NextFunction): void {
  // Monitor for suspicious patterns
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i, // Path traversal
    /(script|javascript|vbscript|onload|onerror)/i, // XSS attempts
    /(union|select|insert|delete|drop|create|alter)/i, // SQL injection
    /(eval|exec|system|shell_exec)/i, // Code injection
  ];

  const fullUrl = req.originalUrl + JSON.stringify(req.body);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl)) {
      logger.logSecurityEvent(`Suspicious request pattern detected: ${pattern.source}`, 'medium', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        pattern: pattern.source,
      });

      // Track as security error
      errorTracker.trackCustomError(
        'SecurityThreat',
        `Suspicious pattern detected: ${pattern.source}`,
        {
          requestId: req.id,
          component: 'security',
          ip: req.ip,
