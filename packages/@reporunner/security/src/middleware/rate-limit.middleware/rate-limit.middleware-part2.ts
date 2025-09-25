return originalSend.call(this, data);
}
}

      next()
} catch (_error)
{
  // Fail open - allow request if rate limiting fails
  next();
}
}
}

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(req: Request): string {
  // Try various headers that might contain the real IP
  const ip =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip;

  if (typeof ip === 'string') {
    // Handle comma-separated IPs (from x-forwarded-for)
    return ip.split(',')[0].trim();
  }

  if (Array.isArray(ip)) {
    return ip[0];
  }

  return 'unknown';
}

/**
 * User-based key generator
 */
export function userKeyGenerator(req: Request & { user?: any }): string {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  return defaultKeyGenerator(req);
}

/**
 * API key-based key generator
 */
export function apiKeyGenerator(req: Request): string {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (apiKey) {
    return `api:${apiKey}`;
  }
  return defaultKeyGenerator(req);
}

/**
 * Combined key generator (user + IP)
 */
export function combinedKeyGenerator(req: Request & { user?: any }): string {
  const ip = defaultKeyGenerator(req);
  if (req.user?.id) {
    return `user:${req.user.id}:${ip}`;
  }
  return ip;
}

/**
 * Endpoint-specific key generator
 */
export function endpointKeyGenerator(req: Request): string {
  const base = defaultKeyGenerator(req);
  const endpoint = `${req.method}:${req.path}`;
  return `${base}:${endpoint}`;
}

/**
 * Create login rate limiter
 */
export function createLoginRateLimiter(rateLimiter: AdvancedRateLimiter) {
  return createRateLimitMiddleware(rateLimiter, {
    type: 'login',
    points: 1,
    message: 'Too many login attempts. Please try again later.',
    statusCode: 429,
    keyGenerator: (req) => {
      // Use email/username if provided, otherwise IP
      const identifier = req.body?.email || req.body?.username;
      if (identifier) {
        return `login:${identifier}`;
      }
      return `login:${defaultKeyGenerator(req)}`;
    },
  });
}

/**
 * Create API rate limiter
 */
