points: 1, // Consume 1 point per request
  message;
: `Rate limit exceeded
for ${tier} tier.`,
      keyGenerator: userKeyGenerator,
    });

    // Dynamically update the limiter for this tier if needed
    rateLimiter.createLimiter(`api:$
{
  tier;
}
`, {
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
