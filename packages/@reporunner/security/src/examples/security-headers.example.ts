import express from 'express';
import { SecurityHeadersMiddleware } from '../middleware/security-headers/SecurityHeadersMiddleware';

const app = express();

// Basic security headers (defaults)
const basicHeaders = new SecurityHeadersMiddleware({
  enableLogging: true,
});

// Development headers (less strict)
const devHeaders = new SecurityHeadersMiddleware({
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'font-src': ["'self'", 'data:'],
      'connect-src': ["'self'", 'http://localhost:*', 'ws://localhost:*'],
    },
  },
  hsts: {
    enabled: false,
  },
  frameProtection: {
    enabled: true,
    action: 'SAMEORIGIN',
  },
});

// Production headers (strict)
const prodHeaders = new SecurityHeadersMiddleware({
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'"],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': [],
    },
    reportUri: '/csp-report',
  },
  hsts: {
    enabled: true,
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameProtection: {
    enabled: true,
    action: 'DENY',
  },
});

// Headers for API routes
const apiHeaders = new SecurityHeadersMiddleware({
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'none'"],
      'connect-src': ["'self'"],
    },
  },
  frameProtection: {
    enabled: true,
    action: 'DENY',
  },
  cors: {
    enabled: true,
    origins: ['https://api.example.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    headers: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

// Headers for static content
const staticHeaders = new SecurityHeadersMiddleware({
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:'],
      'font-src': ["'self'", 'data:'],
    },
  },
  frameProtection: {
    enabled: true,
    action: 'SAMEORIGIN',
  },
  // Cache control headers can be set manually if needed
});

// Apply headers based on environment
if (process.env.NODE_ENV === 'production') {
  app.use(prodHeaders.handle);
} else {
  app.use(devHeaders.handle);
}

// Apply different headers for different routes
app.use('/api', apiHeaders.handle);
app.use('/static', staticHeaders.handle);
app.use('/admin', prodHeaders.handle);

// Example of dynamic headers based on request
app.use((req, res, next) => {
  // Create new middleware instance for each request
  const headers = new SecurityHeadersMiddleware({
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          // Add nonce for inline scripts
          `'nonce-${res.locals.nonce}'`,
        ],
        'connect-src': [
          "'self'",
          // Add dynamic API origin
          req.headers.origin || '',
        ],
      },
    },
  });

  return headers.handle(req, res, next);
});

// Example of conditional headers
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    // API headers
    return apiHeaders.handle(req, res, next);
  } else if (req.path.startsWith('/static')) {
    // Static content headers
    return staticHeaders.handle(req, res, next);
  } else if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
    // AJAX request headers
    const ajaxHeaders = new SecurityHeadersMiddleware({
      csp: {
        enabled: true,
        directives: {
          'default-src': ["'none'"],
          'connect-src': ["'self'"],
        },
      },
    });
    return ajaxHeaders.handle(req, res, next);
  }

  // Default headers
  return basicHeaders.handle(req, res, next);
});

// Handle CSP reports
app.post('/csp-report', express.json({ type: 'application/csp-report' }), (_req, res) => {
  res.status(204).end();
});

export default app;
