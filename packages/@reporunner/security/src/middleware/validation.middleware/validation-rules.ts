return true;
}

// Check URL path
if (!checkPath(req.path)) {
  res.status(400).json({
    success: false,
    error: {
      code: ERROR_CODES.SECURITY_VIOLATION,
      message: 'Invalid path',
    },
  });
  return;
}

// Check query parameters that might be file paths
for (const [key, value] of Object.entries(req.query)) {
  if (typeof value === 'string' && (key.includes('path') || key.includes('file'))) {
    if (!checkPath(value)) {
      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.SECURITY_VIOLATION,
          message: 'Invalid file path',
        },
      });
      return;
    }
  }
}

next();
}
}

/**
 * Create command injection prevention middleware
 */
export function createCommandInjectionProtection() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const checkValue = (value: any): boolean => {
      if (typeof value !== 'string') return true;

      for (const pattern of COMMAND_INJECTION_PATTERNS) {
        if (pattern.test(value)) {
          return false;
        }
      }
      return true;
    };

    // Check all input that might be used in commands
    for (const location of ['body', 'query', 'params']) {
      const source = req[location as keyof Request] as any;
      if (source && typeof source === 'object') {
        for (const [key, value] of Object.entries(source)) {
          if (key.includes('cmd') || key.includes('command') || key.includes('exec')) {
            if (!checkValue(value)) {
              res.status(400).json({
                success: false,
                error: {
                  code: ERROR_CODES.SECURITY_VIOLATION,
                  message: 'Invalid command',
                },
              });
              return;
            }
          }
        }
      }
    }

    next();
  };
}

/**
 * Create comprehensive security validation middleware
 */
export function createSecurityValidationMiddleware(
  options: {
    enableSQLProtection?: boolean;
    enableNoSQLProtection?: boolean;
    enableXSSProtection?: boolean;
    enablePathTraversalProtection?: boolean;
    enableCommandInjectionProtection?: boolean;
  } = {}
) {
  const middlewares: any[] = [];

  if (options.enableSQLProtection !== false) {
    middlewares.push(createSQLInjectionProtection());
  }

  if (options.enableNoSQLProtection !== false) {
    middlewares.push(createNoSQLInjectionProtection());
  }

  if (options.enableXSSProtection !== false) {
    middlewares.push(createXSSProtection());
