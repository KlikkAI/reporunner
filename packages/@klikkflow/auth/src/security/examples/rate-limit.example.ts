import express from 'express';
import {
  createLoginRateLimiter,
  createRateLimitMiddleware,
  createTieredRateLimiter,
} from '../middleware/rate-limit.middleware';
import { AdvancedRateLimiter } from '../rate-limiter';

const app = express();

// Create rate limiter instance
const rateLimiter = new AdvancedRateLimiter();

// Configure basic API rate limiting
rateLimiter.createLimiter('api', {
  points: 100,
  duration: 15 * 60, // 15 minutes
  blockDuration: 60 * 15,
});

// Configure stricter auth rate limiting
rateLimiter.createLimiter('login', {
  points: 5,
  duration: 15 * 60, // 15 minutes
  blockDuration: 60 * 15,
});

// Basic rate limiting middleware
const basicLimiter = createRateLimitMiddleware(rateLimiter, {
  type: 'api',
  points: 1,
  message: 'API rate limit exceeded',
});

// Stricter rate limiting for auth endpoints
const authLimiter = createLoginRateLimiter(rateLimiter);

// Note: API limiter available but not used in this example
// const apiLimiter = createApiRateLimiter(rateLimiter);

// Apply rate limiting to routes
app.use('/api/', basicLimiter); // Basic rate limiting for all API routes
app.use('/api/auth', authLimiter); // Stricter limits for auth endpoints
app.post('/api/login', async (_req, res) => {
  res.json({ message: 'Login successful' });
});

// Different limits for different HTTP methods
// Configure method-specific limits
rateLimiter.createLimiter('get', { points: 1000, duration: 3600, blockDuration: 300 });
rateLimiter.createLimiter('post', { points: 100, duration: 3600, blockDuration: 300 });
rateLimiter.createLimiter('put', { points: 50, duration: 3600, blockDuration: 300 });
rateLimiter.createLimiter('delete', { points: 20, duration: 3600, blockDuration: 300 });

const methodLimiters = {
  get: createRateLimitMiddleware(rateLimiter, { type: 'get', points: 1 }),
  post: createRateLimitMiddleware(rateLimiter, { type: 'post', points: 1 }),
  put: createRateLimitMiddleware(rateLimiter, { type: 'put', points: 1 }),
  delete: createRateLimitMiddleware(rateLimiter, { type: 'delete', points: 1 }),
};

app.use('/api/resources', (req, res, next) => {
  const method = req.method.toLowerCase();
  const limiter = methodLimiters[method as keyof typeof methodLimiters];
  if (limiter) {
    return limiter(req, res, next);
  }
  return next();
});

// Dynamic rate limiting based on user tier
const tierLimits = {
  free: 100,
  basic: 1000,
  premium: 10000,
};

app.use('/api/premium', createTieredRateLimiter(rateLimiter, tierLimits));

export default app;
