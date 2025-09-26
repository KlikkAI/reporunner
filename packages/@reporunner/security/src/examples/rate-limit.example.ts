import express from 'express';
import { RateLimitMiddleware } from '../middleware/rate-limit/RateLimitMiddleware';

const app = express();

// Basic rate limiting
const basicLimiter = new RateLimitMiddleware({
  max: 100, // 100 requests
  windowMs: 15 * 60 * 1000, // per 15 minutes
  enableLogging: true
});

// Stricter rate limiting for auth endpoints
const authLimiter = new RateLimitMiddleware({
  max: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // per 15 minutes
  headers: {
    remaining: 'X-Auth-Remaining',
    reset: 'X-Auth-Reset'
  },
  // Custom key generator to use username+IP
  keyGenerator: (req) => `${req.body.username}:${req.ip}`,
  // Custom error handler
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Login Attempts',
      message: 'Please try again later'
    });
  }
});

// API rate limiting with Redis
const apiLimiter = new RateLimitMiddleware({
  max: 1000, // 1000 requests
  windowMs: 60 * 60 * 1000, // per hour
  store: {
    type: 'redis',
    redisConfig: {
      host: 'localhost',
      port: 6379
    }
  },
  // Skip rate limiting for admin users
  skip: (req) => req.user?.isAdmin === true,
  // Use API key for rate limit key
  keyGenerator: (req) => req.headers['x-api-key'] as string
});

// Apply rate limiting to routes
app.use('/api/', basicLimiter.handle); // Basic rate limiting for all API routes
app.use('/api/auth', authLimiter.handle); // Stricter limits for auth endpoints
app.post('/api/login', async (req, res) => {
  res.json({ message: 'Login successful' });
});

// Different limits for different HTTP methods
const methodLimiters = {
  get: new RateLimitMiddleware({ max: 1000, windowMs: 60 * 60 * 1000 }), // 1000/hour
  post: new RateLimitMiddleware({ max: 100, windowMs: 60 * 60 * 1000 }), // 100/hour
  put: new RateLimitMiddleware({ max: 50, windowMs: 60 * 60 * 1000 }), // 50/hour
  delete: new RateLimitMiddleware({ max: 20, windowMs: 60 * 60 * 1000 }) // 20/hour
};

app.use('/api/resources', (req, res, next) => {
  const method = req.method.toLowerCase();
  const limiter = methodLimiters[method as keyof typeof methodLimiters];
  if (limiter) {
    return limiter.handle(req, res, next);
  }
  next();
});

// Dynamic rate limiting based on user tier
app.use('/api/premium', async (req, res, next) => {
  const userTier = req.user?.tier || 'free';
  const tierLimits = {
    free: 100,
    basic: 1000,
    premium: 10000
  };

  const limiter = new RateLimitMiddleware({
    max: tierLimits[userTier as keyof typeof tierLimits] || tierLimits.free,
    windowMs: 60 * 60 * 1000,
    keyGenerator: (req) => `${req.user?.id}:${userTier}`
  });

  return limiter.handle(req, res, next);
});

export default app;