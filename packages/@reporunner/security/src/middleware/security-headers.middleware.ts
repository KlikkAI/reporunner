import { Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";

export interface SecurityHeadersConfig {
  cors?: CorsConfig;
  csp?: CSPConfig;
  additionalHeaders?: Record<string, string>;
}

export interface CorsConfig {
  enabled?: boolean;
  origins?: string[] | "*";
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
  dynamicOrigin?: (
    origin: string,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => void;
}

export interface CSPConfig {
  enabled?: boolean;
  directives?: CSPDirectives;
  reportOnly?: boolean;
  reportUri?: string;
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

export interface CSPDirectives {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  mediaSrc?: string[];
  frameSrc?: string[];
  frameAncestors?: string[];
  formAction?: string[];
  baseUri?: string[];
  workerSrc?: string[];
  manifestSrc?: string[];
  prefetchSrc?: string[];
  navigateTo?: string[];
  reportUri?: string[];
  reportTo?: string[];
  requireSriFor?: string[];
  requireTrustedTypesFor?: string[];
  sandbox?: string[];
  trustedTypes?: string[];
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

/**
 * Default CSP directives for maximum security
 */
const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // May need adjustment based on app
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  baseUri: ["'self'"],
  workerSrc: ["'self'"],
  manifestSrc: ["'self'"],
};

/**
 * Create CORS middleware with security best practices
 */
export function createCorsMiddleware(config: CorsConfig = {}): any {
  const {
    enabled = true,
    origins = ["http://localhost:3000"],
    credentials = true,
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders = [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-API-Key",
    ],
    exposedHeaders = [
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge = 86400, // 24 hours
    preflightContinue = false,
    optionsSuccessStatus = 204,
    dynamicOrigin,
  } = config;

  if (!enabled) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  const corsOptions: CorsOptions = {
    credentials,
    methods,
    allowedHeaders,
    exposedHeaders,
    maxAge,
    preflightContinue,
    optionsSuccessStatus,
  };

  // Configure origin
  if (dynamicOrigin) {
    corsOptions.origin = dynamicOrigin as any;
  } else if (origins === "*") {
    corsOptions.origin = true; // Allow all origins
  } else if (Array.isArray(origins)) {
    corsOptions.origin = (origin, callback) => {
      if (!origin) {
        // Allow requests with no origin (e.g., mobile apps, Postman)
        return callback(null, true);
      }

      if (origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    };
  }

  return cors(corsOptions);
}

/**
 * Create Content Security Policy middleware
 */
export function createCSPMiddleware(
  config: CSPConfig = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    enabled = true,
    directives = DEFAULT_CSP_DIRECTIVES,
    reportOnly = false,
    reportUri,
    upgradeInsecureRequests = true,
    blockAllMixedContent = true,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    if (!enabled) {
      return next();
    }

    // Build CSP header
    const policyDirectives: string[] = [];

    // Add directives
    const mergedDirectives = { ...DEFAULT_CSP_DIRECTIVES, ...directives };

    for (const [key, value] of Object.entries(mergedDirectives)) {
      if (value === undefined || value === null) continue;

      const directiveName = key.replace(/([A-Z])/g, "-$1").toLowerCase();

      if (typeof value === "boolean") {
        if (value) {
          policyDirectives.push(directiveName);
        }
      } else if (Array.isArray(value) && value.length > 0) {
        policyDirectives.push(`${directiveName} ${value.join(" ")}`);
      }
    }

    // Add upgrade-insecure-requests
    if (upgradeInsecureRequests) {
      policyDirectives.push("upgrade-insecure-requests");
    }

    // Add block-all-mixed-content
    if (blockAllMixedContent) {
      policyDirectives.push("block-all-mixed-content");
    }

    // Add report-uri if specified
    if (reportUri) {
      policyDirectives.push(`report-uri ${reportUri}`);
    }

    const policy = policyDirectives.join("; ");
    const headerName = reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy";

    res.setHeader(headerName, policy);
    next();
  };
}

/**
 * Create comprehensive security headers middleware
 */
export function createSecurityHeadersMiddleware(
  config: SecurityHeadersConfig = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const { additionalHeaders = {} } = config;

  // Default security headers
  const defaultHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    ...additionalHeaders,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    // Apply security headers
    for (const [header, value] of Object.entries(defaultHeaders)) {
      res.setHeader(header, value);
    }

    // Remove potentially dangerous headers
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");

    next();
  };
}

/**
 * Create a combined security middleware with CORS, CSP, and other security headers
 */
export function createCombinedSecurityMiddleware(
  config: SecurityHeadersConfig = {},
) {
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
      origins: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
      ],
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
      origins: ["https://staging.reporunner.com"],
      credentials: true,
    },
    csp: {
      enabled: true,
      reportOnly: true,
      reportUri: "/api/security/csp-report",
    },
  },
  production: {
    cors: {
      enabled: true,
      origins: ["https://reporunner.com", "https://www.reporunner.com"],
      credentials: true,
      maxAge: 86400,
    },
    csp: {
      enabled: true,
      reportOnly: false,
      reportUri: "/api/security/csp-report",
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'sha256-...'"], // Add specific script hashes
        styleSrc: ["'self'", "'sha256-...'"], // Add specific style hashes
        imgSrc: ["'self'", "https:", "data:"],
        connectSrc: ["'self'", "https://api.reporunner.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: true,
      },
    },
    additionalHeaders: {
      "Strict-Transport-Security":
        "max-age=63072000; includeSubDomains; preload",
      "X-Frame-Options": "DENY",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  },
};

/**
 * Get security configuration based on environment
 */
export function getEnvironmentConfig(
  env: string = process.env.NODE_ENV || "development",
): SecurityHeadersConfig {
  return (
    SECURITY_CONFIGS[env as keyof typeof SECURITY_CONFIGS] ||
    SECURITY_CONFIGS.development
  );
}

/**
 * CSP violation report handler
 */
export function createCSPReportHandler() {
  return async (req: Request, res: Response) => {
    const report = req.body;

    // Log CSP violation
    console.error("CSP Violation:", {
      documentUri: report["document-uri"],
      violatedDirective: report["violated-directive"],
      blockedUri: report["blocked-uri"],
      lineNumber: report["line-number"],
      columnNumber: report["column-number"],
      sourceFile: report["source-file"],
      timestamp: new Date().toISOString(),
    });

    // You could also send this to a monitoring service
    // await sendToMonitoring(report);

    res.status(204).end();
  };
}

/**
 * Nonce generator for inline scripts/styles
 */
export function generateNonce(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(16).toString("base64");
}

/**
 * Middleware to add nonce to res.locals for CSP
 */
export function createNonceMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
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
      console.warn(
        "No nonce found in res.locals. Use createNonceMiddleware() before this middleware.",
      );
      return next();
    }

    // Update script-src and style-src with nonce
    const updatedConfig = {
      ...config,
      directives: {
        ...config.directives,
        scriptSrc: [
          ...(config.directives?.scriptSrc || ["'self'"]),
          `'nonce-${nonce}'`,
        ],
        styleSrc: [
          ...(config.directives?.styleSrc || ["'self'"]),
          `'nonce-${nonce}'`,
        ],
      },
    };

    const cspMiddleware = createCSPMiddleware(updatedConfig);
    cspMiddleware(req, res, next);
  };
}
