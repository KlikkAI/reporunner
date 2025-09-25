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
  return async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    const tier = req.user?.tier || 'free';
    const points = tierPoints[tier] || tierPoints.free;

    const middleware = createRateLimitMiddleware(rateLimiter, {
      type: 'api',
