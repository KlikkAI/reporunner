import { ERROR_CODES } from '@reporunner/shared';
import type { NextFunction, Request, Response } from 'express';
import type { AdvancedRateLimiter } from '../rate-limiter';

export interface RateLimitOptions {
  type?: string;
  points?: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  whitelist?: string[];
  message?: string;
  statusCode?: number;
  headers?: boolean;
  draft_polli_ratelimit_headers?: boolean;
}

/**
 * Check if the key is whitelisted
 */
function isWhitelisted(key: string, whitelist: string[]): boolean {
  return whitelist.includes(key);
}

/**
 * Set rate limit headers on the response
 */
function setRateLimitHeaders(
  res: Response,
  points: number,
  remaining: number | undefined,
  retryAfter: number | undefined,
  useDraftHeaders: boolean
): void {
  if (remaining === undefined) {
    return;
  }

  if (useDraftHeaders) {
    res.setHeader('RateLimit-Limit', points.toString());
    res.setHeader('RateLimit-Remaining', remaining.toString());
    if (retryAfter) {
      res.setHeader('RateLimit-Reset', retryAfter);
    }
  } else {
    res.setHeader('X-RateLimit-Limit', points.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    if (retryAfter) {
      res.setHeader('X-RateLimit-Reset', retryAfter);
    }
  }
}

/**
 * Handle rate limit exceeded response
 */
function handleRateLimitExceeded(
  res: Response,
  statusCode: number,
  message: string,
  retryAfter: number | undefined,
  blocked: boolean | undefined
): void {
  if (retryAfter) {
    res.setHeader('Retry-After', retryAfter);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message,
      retryAfter,
      blocked,
    },
  });
}

/**
 * Check if points should be refunded based on response status
 */
function shouldRefundPoints(
  statusCode: number,
  skipSuccessfulRequests: boolean,
  skipFailedRequests: boolean
): boolean {
  return (skipSuccessfulRequests && statusCode < 400) || (skipFailedRequests && statusCode >= 400);
}

/**
 * Wrap response.send to refund points on certain status codes
 */
function wrapResponseForConditionalConsume(
  res: Response,
  rateLimiter: AdvancedRateLimiter,
  type: string,
  key: string,
  skipSuccessfulRequests: boolean,
  skipFailedRequests: boolean
): void {
  const originalSend = res.send;
  res.send = function (data: unknown) {
    const statusCode = res.statusCode;

    if (shouldRefundPoints(statusCode, skipSuccessfulRequests, skipFailedRequests)) {
      rateLimiter.resetLimit(type, key).catch((_err) => {
        // Ignore reset errors
      });
    }

    return originalSend.call(this, data);
  };
}

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(
  rateLimiter: AdvancedRateLimiter,
  options: RateLimitOptions = {}
) {
  const {
    type = 'api',
    points = 1,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    whitelist = [],
    message = 'Too many requests',
    statusCode = 429,
    headers = true,
    draft_polli_ratelimit_headers = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);

      // Check whitelist
      if (isWhitelisted(key, whitelist)) {
        return next();
      }

      // Check rate limit
      const result = await rateLimiter.checkLimit(type, key, points);

      // Add rate limit headers
      if (headers) {
        setRateLimitHeaders(
          res,
          points,
          result.remaining,
          result.retryAfter,
          draft_polli_ratelimit_headers
        );
      }

      // Handle rate limit exceeded
      if (!result.allowed) {
        handleRateLimitExceeded(res, statusCode, message, result.retryAfter, result.blocked);
        return;
      }

      // Track response for conditional consuming
      if (skipSuccessfulRequests || skipFailedRequests) {
        wrapResponseForConditionalConsume(
          res,
          rateLimiter,
          type,
          key,
          skipSuccessfulRequests,
          skipFailedRequests
        );
      }

      next();
    } catch (_error) {
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
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
export function userKeyGenerator(req: Request & { user?: { id: string } }): string {
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
export function combinedKeyGenerator(req: Request & { user?: { id: string } }): string {
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
export function createApiRateLimiter(rateLimiter: AdvancedRateLimiter) {
  return createRateLimitMiddleware(rateLimiter, {
    type: 'api',
    points: 1,
    message: 'API rate limit exceeded.',
    keyGenerator: userKeyGenerator,
  });
}

/**
 * Create execution rate limiter
 */
export function createExecutionRateLimiter(rateLimiter: AdvancedRateLimiter) {
  return createRateLimitMiddleware(rateLimiter, {
    type: 'execution',
    points: 1,
    message: 'Workflow execution rate limit exceeded. Please wait before executing more workflows.',
    keyGenerator: userKeyGenerator,
  });
}

/**
 * Create upload rate limiter
 */
export function createUploadRateLimiter(rateLimiter: AdvancedRateLimiter) {
  return createRateLimitMiddleware(rateLimiter, {
    type: 'upload',
    points: 1,
    message: 'File upload rate limit exceeded.',
    keyGenerator: userKeyGenerator,
  });
}

/**
 * Create password reset rate limiter
 */
export function createPasswordResetRateLimiter(rateLimiter: AdvancedRateLimiter) {
  return createRateLimitMiddleware(rateLimiter, {
    type: 'password-reset',
    points: 1,
    message: 'Too many password reset requests. Please try again later.',
    keyGenerator: (req) => {
      const email = req.body?.email;
      if (email) {
        return `reset:${email}`;
      }
      return `reset:${defaultKeyGenerator(req)}`;
    },
  });
}

/**
 * Create webhook rate limiter
 */
export function createWebhookRateLimiter(rateLimiter: AdvancedRateLimiter) {
  return createRateLimitMiddleware(rateLimiter, {
    type: 'webhook',
    points: 1,
    message: 'Webhook rate limit exceeded.',
    keyGenerator: (req) => {
      // Use webhook ID if available
      const webhookId = req.params?.webhookId || req.headers['x-webhook-id'];
      if (webhookId) {
        return `webhook:${webhookId}`;
      }
      return `webhook:${defaultKeyGenerator(req)}`;
    },
  });
}

/**
 * Create export rate limiter
 */
export function createExportRateLimiter(rateLimiter: AdvancedRateLimiter) {
  return createRateLimitMiddleware(rateLimiter, {
    type: 'export',
    points: 1,
    message: 'Export rate limit exceeded. Please wait before exporting more data.',
    keyGenerator: userKeyGenerator,
  });
}

/**
 * Create dynamic rate limiter that adjusts based on user tier
 */
export function createTieredRateLimiter(
  rateLimiter: AdvancedRateLimiter,
  tierPoints: Record<string, number> = {
    free: 10,
    basic: 50,
    pro: 200,
    enterprise: 1000,
  }
) {
  return async (req: Request & { user?: { tier?: string } }, res: Response, next: NextFunction) => {
    const tier = req.user?.tier || 'free';
    const points = tierPoints[tier] || tierPoints.free;

    const middleware = createRateLimitMiddleware(rateLimiter, {
      type: 'api',
      points: 1, // Consume 1 point per request
      message: `Rate limit exceeded for ${tier} tier.`,
      keyGenerator: userKeyGenerator,
    });

    // Dynamically update the limiter for this tier if needed
    rateLimiter.createLimiter(`api:${tier}`, {
      points,
      duration: 60,
      blockDuration: 300,
    });

    return middleware(req, res, next);
  };
}

/**
 * Create rate limit middleware for multiple limits
 */
export function createMultiRateLimiter(
  rateLimiter: AdvancedRateLimiter,
  limits: Array<{ type: string; points?: number; message?: string }>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = defaultKeyGenerator(req);
      const result = await rateLimiter.checkMultipleLimits(
        limits.map((l) => ({ type: l.type, points: l.points })),
        key
      );

      if (!result.allowed && result.failedLimit) {
        const failedLimitConfig = limits.find((l) => l.type === result.failedLimit);
        res.status(429).json({
          success: false,
          error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: failedLimitConfig?.message || 'Rate limit exceeded',
            limitType: result.failedLimit,
          },
        });
        return;
      }

      next();
    } catch (_error) {
      next();
    }
  };
}
