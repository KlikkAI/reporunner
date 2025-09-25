}
      }
    }

    next()
}
}

/**
 * Create NoSQL injection prevention middleware
 */
export function createNoSQLInjectionProtection() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const checkValue = (value: any): boolean => {
      const valueStr = JSON.stringify(value);

      for (const pattern of NOSQL_INJECTION_PATTERNS) {
        if (pattern.test(valueStr)) {
          return false;
        }
      }

      // Check for operator injection
      if (typeof value === 'object' && value !== null) {
        for (const key of Object.keys(value)) {
          if (key.startsWith('$')) {
            return false;
          }
        }
      }

      return true;
    };

    // Check body for NoSQL injection
    if (req.body && !checkValue(req.body)) {
      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.SECURITY_VIOLATION,
          message: 'Invalid input detected',
        },
      });
      return;
    }

    next();
  };
}

/**
 * Create XSS prevention middleware
 */
export function createXSSProtection() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        // Check for XSS patterns
        for (const pattern of XSS_PATTERNS) {
          if (pattern.test(value)) {
          }
        }

        // Sanitize HTML
        return DOMPurify.sanitize(value, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
          ALLOWED_ATTR: ['href'],
        });
      } else if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      } else if (value && typeof value === 'object') {
        const sanitized: any = {};
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeValue(val);
        }
        return sanitized;
      }
      return value;
    };

    // Sanitize all input
    if (req.body) {
      req.body = sanitizeValue(req.body);
    }

    next();
  };
}

/**
 * Create path traversal prevention middleware
 */
export function createPathTraversalProtection() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const checkPath = (value: string): boolean => {
      for (const pattern of PATH_TRAVERSAL_PATTERNS) {
        if (pattern.test(value)) {
          return false;
        }
      }
