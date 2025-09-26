import { ERROR_CODES } from '@reporunner/constants';
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
      // Generate key for this request
      const key = keyGenerator(req);

      // Check whitelist
      if (whitelist.includes(key)) {
        return next();
      }

      // Check rate limit
      const result = await rateLimiter.checkLimit(type, key, points);

      // Add rate limit headers
      if (headers && result.remaining !== undefined) {
        if (draft_polli_ratelimit_headers) {
          res.setHeader('RateLimit-Limit', points.toString());
          res.setHeader('RateLimit-Remaining', result.remaining.toString());
          if (result.retryAfter) {
            res.setHeader('RateLimit-Reset', result.retryAfter);
          }
        } else {
          res.setHeader('X-RateLimit-Limit', points.toString());
          res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
          if (result.retryAfter) {
            res.setHeader('X-RateLimit-Reset', result.retryAfter);
          }
        }
      }

      if (!result.allowed) {
        // Add Retry-After header
        if (result.retryAfter) {
          res.setHeader('Retry-After', result.retryAfter);
        }

        // Send error response
        return res.status(statusCode).json({
          success: false,
          error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message,
            retryAfter: result.retryAfter,
            blocked: result.blocked,
          },
        });
      }

      // Track response for conditional consuming
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = (data: any) => {
          const statusCode = res.statusCode;

          // Refund points based on response status
          if (
            (skipSuccessfulRequests && statusCode < 400) ||
            (skipFailedRequests && statusCode >= 400)
          ) {
            // Reset the limit to refund the points
            rateLimiter.resetLimit(type, key).catch((_err) => {});
          }
