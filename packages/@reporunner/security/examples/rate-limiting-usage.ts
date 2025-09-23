import express from 'express';
import {
  AdvancedRateLimiter,
  createApiRateLimiter,
  createExecutionRateLimiter,
  createLoginRateLimiter,
  createMultiRateLimiter,
  createPasswordResetRateLimiter,
  createRateLimitMiddleware,
  createTieredRateLimiter,
  createUploadRateLimiter,
} from '../src';

// Initialize Express app
const app = express();

// Initialize rate limiter with Redis support
const rateLimiter = new AdvancedRateLimiter({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  useMemoryFallback: true, // Fall back to memory if Redis fails
  enableDDoSProtection: true, // Enable DDoS detection and mitigation
});

// Apply global API rate limiting
app.use('/api', createApiRateLimiter(rateLimiter));

// Apply login rate limiting to auth endpoints
app.post('/auth/login', createLoginRateLimiter(rateLimiter), async (_req, res) => {
  // Login logic here
  res.json({ success: true });
});

// Apply password reset rate limiting
app.post('/auth/reset-password', createPasswordResetRateLimiter(rateLimiter), async (_req, res) => {
  // Password reset logic
  res.json({ success: true });
});

// Apply execution rate limiting for workflow runs
app.post('/workflows/:id/execute', createExecutionRateLimiter(rateLimiter), async (_req, res) => {
  // Workflow execution logic
  res.json({ success: true, executionId: '123' });
});

// Apply upload rate limiting
app.post('/upload', createUploadRateLimiter(rateLimiter), async (_req, res) => {
  // File upload logic
  res.json({ success: true, fileId: '456' });
});

// Apply tiered rate limiting based on user subscription
app.use(
  '/api/v2',
  createTieredRateLimiter(rateLimiter, {
    free: 10, // 10 requests per minute for free tier
    basic: 50, // 50 requests per minute for basic tier
    pro: 200, // 200 requests per minute for pro tier
    enterprise: 1000, // 1000 requests per minute for enterprise
  })
);

// Apply multiple rate limits to critical endpoints
app.post(
  '/api/critical',
  createMultiRateLimiter(rateLimiter, [
    { type: 'api', points: 1, message: 'API rate limit exceeded' },
    { type: 'execution', points: 1, message: 'Execution rate limit exceeded' },
    { type: 'export', points: 1, message: 'Export rate limit exceeded' },
  ]),
  async (_req, res) => {
    // Critical operation that consumes multiple resources
    res.json({ success: true });
  }
);

// Custom rate limiter for specific use case
const customLimiter = createRateLimitMiddleware(rateLimiter, {
  type: 'custom',
  points: 5,
  message: 'Custom rate limit exceeded',
  keyGenerator: (req) => {
    // Custom key based on API key and user agent
    const apiKey = req.headers['x-api-key'] as string;
    const userAgent = req.headers['user-agent'] as string;
    return `${apiKey}:${userAgent}`;
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  headers: true, // Include rate limit headers in response
  draft_polli_ratelimit_headers: false, // Use X-RateLimit headers
});

app.get('/api/custom', customLimiter, (_req, res) => {
  res.json({ data: 'custom endpoint' });
});

// Whitelist certain IPs (e.g., internal services)
rateLimiter.addToWhitelist('192.168.1.100');
rateLimiter.addToWhitelist('10.0.0.1');

// Manually block suspicious IPs
rateLimiter.addToBlacklist('malicious.ip.address', 86400); // Block for 24 hours

// Create custom rate limiters for specific features
rateLimiter.createLimiter('ai-generation', {
  points: 5, // 5 AI generations
  duration: 3600, // per hour
  blockDuration: 7200, // block for 2 hours if exceeded
});

// Use custom limiter
app.post(
  '/api/ai/generate',
  createRateLimitMiddleware(rateLimiter, {
    type: 'ai-generation',
    points: 1,
    message: 'AI generation limit exceeded. Please try again later.',
  }),
  async (_req, res) => {
    // AI generation logic
    res.json({ success: true, result: 'AI generated content' });
  }
);

// Monitor rate limit metrics
app.get('/admin/metrics/rate-limits', (_req, res) => {
  const metrics = rateLimiter.getMetrics();
  res.json({
    totalRequests: metrics.requestCount,
    blockedRequests: metrics.blockedCount,
    suspiciousIPs: Array.from(metrics.suspiciousIPs),
    attackPatterns: Array.from(metrics.attackPatterns.entries()),
  });
});

// Reset rate limit for a specific user
app.post('/admin/rate-limits/reset', async (req, res) => {
  const { type, identifier } = req.body;
  await rateLimiter.resetLimit(type, identifier);
  res.json({ success: true, message: `Rate limit reset for ${identifier}` });
});

// Get current consumption for monitoring
app.get('/admin/rate-limits/consumption/:type/:identifier', async (req, res) => {
  const { type, identifier } = req.params;
  const consumption = await rateLimiter.getCurrentConsumption(type, identifier);
  res.json({ consumption });
});

// Remove from blacklist
app.delete('/admin/blacklist/:identifier', async (req, res) => {
  const { identifier } = req.params;
  await rateLimiter.removeFromBlacklist(identifier);
  res.json({ success: true, message: `${identifier} removed from blacklist` });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await rateLimiter.cleanup();
  process.exit(0);
});

// Error handling middleware
app.use((_err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {});
