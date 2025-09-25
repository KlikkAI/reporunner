credentials,
    methods,
    allowedHeaders,
    exposedHeaders,
    maxAge,
    preflightContinue,
    optionsSuccessStatus,
}

// Configure origin
if (dynamicOrigin) {
  corsOptions.origin = dynamicOrigin as any;
} else if (origins === '*') {
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
      callback(new Error('Not allowed by CORS'));
    }
  };
}

return cors(corsOptions);
}

/**
 * Create Content Security Policy middleware
 */
export function createCSPMiddleware(
  config: CSPConfig = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    enabled = true,
    directives = DEFAULT_CSP_DIRECTIVES,
    reportOnly = false,
    reportUri,
    upgradeInsecureRequests = true,
    blockAllMixedContent = true,
  } = config;

  return (_req: Request, res: Response, next: NextFunction) => {
    if (!enabled) {
      return next();
    }

    // Build CSP header
    const policyDirectives: string[] = [];

    // Add directives
    const mergedDirectives = { ...DEFAULT_CSP_DIRECTIVES, ...directives };

    for (const [key, value] of Object.entries(mergedDirectives)) {
      if (value === undefined || value === null) continue;

      const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase();

      if (typeof value === 'boolean') {
        if (value) {
          policyDirectives.push(directiveName);
        }
      } else if (Array.isArray(value) && value.length > 0) {
        policyDirectives.push(`${directiveName} ${value.join(' ')}`);
      }
    }

    // Add upgrade-insecure-requests
    if (upgradeInsecureRequests) {
      policyDirectives.push('upgrade-insecure-requests');
    }

    // Add block-all-mixed-content
    if (blockAllMixedContent) {
      policyDirectives.push('block-all-mixed-content');
    }

    // Add report-uri if specified
    if (reportUri) {
      policyDirectives.push(`report-uri ${reportUri}`);
    }

    const policy = policyDirectives.join('; ');
    const headerName = reportOnly
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';

    res.setHeader(headerName, policy);
    next();
  };
}

/**
 * Create comprehensive security headers middleware
 */
