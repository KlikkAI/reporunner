/**
 * Get security configuration based on environment
 */
export function getEnvironmentConfig(
  env: string = process.env.NODE_ENV || 'development'
): SecurityHeadersConfig {
  return SECURITY_CONFIGS[env as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
}

/**
 * CSP violation report handler
 */
export function createCSPReportHandler() {
  return async (req: Request, res: Response) => {
    const _report = req.body;

    // You could also send this to a monitoring service
    // await sendToMonitoring(report);

    res.status(204).end();
  };
}

/**
 * Nonce generator for inline scripts/styles
 */
export function generateNonce(): string {
  const crypto = require('node:crypto');
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Middleware to add nonce to res.locals for CSP
 */
export function createNonceMiddleware() {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.locals.nonce = generateNonce();
    next();
  };
}

/**
 * Create CSP middleware with nonce support
 */
export function createCSPWithNonce(config: CSPConfig = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const nonce = res.locals.nonce;

    if (!nonce) {
      return next();
    }

    // Update script-src and style-src with nonce
    const updatedConfig = {
      ...config,
      directives: {
        ...config.directives,
        scriptSrc: [...(config.directives?.scriptSrc || ["'self'"]), `'nonce-${nonce}'`],
        styleSrc: [...(config.directives?.styleSrc || ["'self'"]), `'nonce-${nonce}'`],
      },
    };

    const cspMiddleware = createCSPMiddleware(updatedConfig);
    cspMiddleware(req, res, next);
  };
}
