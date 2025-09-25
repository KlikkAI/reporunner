export function createSecurityHeadersMiddleware(
  config: SecurityHeadersConfig = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const { additionalHeaders = {} } = config;

  // Default security headers
  const defaultHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    ...additionalHeaders,
  };

  return (_req: Request, res: Response, next: NextFunction) => {
    // Apply security headers
    for (const [header, value] of Object.entries(defaultHeaders)) {
      res.setHeader(header, value);
    }

    // Remove potentially dangerous headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
  };
}

/**
 * Create a combined security middleware with CORS, CSP, and other security headers
 */
export function createCombinedSecurityMiddleware(config: SecurityHeadersConfig = {}) {
  const corsMiddleware = createCorsMiddleware(config.cors);
  const cspMiddleware = createCSPMiddleware(config.csp);
  const securityHeadersMiddleware = createSecurityHeadersMiddleware(config);

  return [corsMiddleware, cspMiddleware, securityHeadersMiddleware];
}

/**
 * Environment-specific configurations
 */
export const SECURITY_CONFIGS = {
  development: {
    cors: {
      enabled: true,
      origins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
      credentials: true,
    },
    csp: {
      enabled: false, // Often disabled in development for hot reload
      reportOnly: true,
    },
  },
  staging: {
    cors: {
      enabled: true,
      origins: ['https://staging.reporunner.com'],
      credentials: true,
    },
    csp: {
      enabled: true,
      reportOnly: true,
      reportUri: '/api/security/csp-report',
    },
  },
  production: {
    cors: {
      enabled: true,
      origins: ['https://reporunner.com', 'https://www.reporunner.com'],
      credentials: true,
      maxAge: 86400,
    },
    csp: {
      enabled: true,
      reportOnly: false,
      reportUri: '/api/security/csp-report',
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'sha256-...'"], // Add specific script hashes
        styleSrc: ["'self'", "'sha256-...'"], // Add specific style hashes
        imgSrc: ["'self'", 'https:', 'data:'],
        connectSrc: ["'self'", 'https://api.reporunner.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: true,
      },
    },
    additionalHeaders: {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Frame-Options': 'DENY',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  },
};
