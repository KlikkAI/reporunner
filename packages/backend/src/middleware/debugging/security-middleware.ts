url: req.originalUrl,
},
        'medium'
      )

break;
}
  }

// Monitor for brute force attempts
const failedAttempts = res.locals.failedAttempts || 0;
if (failedAttempts > 5) {
  logger.logSecurityEvent('Potential brute force attack', 'high', {
    requestId: req.id,
    ip: req.ip,
    failedAttempts,
    url: req.originalUrl,
  });
}

next();
}

/**
 * Rate limiting middleware
 */
// Simple in-memory rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimitingMiddleware(
  req: DebuggingRequest,
  res: Response,
  next: NextFunction
): void {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  let store = rateLimitStore.get(key);

  if (!store || now > store.resetTime) {
    store = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(key, store);
  } else {
    store.count++;
  }

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store.count));
  res.setHeader('X-RateLimit-Reset', new Date(store.resetTime).toISOString());

  if (store.count > maxRequests) {
    logger.logSecurityEvent('Rate limit exceeded', 'medium', {
      requestId: req.id,
      ip: req.ip,
      count: store.count,
      limit: maxRequests,
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests',
      retryAfter: Math.ceil((store.resetTime - now) / 1000),
    });
    return;
  }

  next();
}

/**
 * Complete debugging middleware stack
 */
export function createDebuggingMiddleware() {
  return [
    requestIdMiddleware,
    performanceMiddleware,
    loggingMiddleware,
    securityMiddleware,
    rateLimitingMiddleware,
    debugMiddleware,
  ];
}

/**
 * Database query monitoring middleware (for Mongoose)
 */
export function setupDatabaseMonitoring(): void {
  const mongoose = require('mongoose');

  // Monitor slow queries
  mongoose.set('debug', (collectionName: string, method: string, query: any, _doc: any) => {
    const startTime = Date.now();

    // This is a simplified implementation
    logger.debug('Database query', {
      collection: collectionName,
      method,
