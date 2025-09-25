}
if (rule.maxLength !== undefined && length > rule.maxLength) {
  errors.push(`Length must be at most ${rule.maxLength}`);
}
}

// Pattern matching
if (rule.pattern && typeof value === 'string') {
  if (!rule.pattern.test(value)) {
    errors.push(`Value does not match required pattern`);
  }
}

// Enum validation
if (rule.enum && !rule.enum.includes(value)) {
  errors.push(`Value must be one of: ${rule.enum.join(', ')}`);
}

// Custom validation
if (rule.custom) {
  const result = rule.custom(value);
  if (typeof result === 'string') {
    errors.push(result);
  } else if (!result) {
    errors.push('Custom validation failed');
  }
}

return errors;
}

/**
 * Sanitize input based on rules
 */
function sanitizeInput(value: any, rule: ValidationRule): any {
  if (typeof value !== 'string') return value;

  let sanitized = value;

  // Basic sanitization
  if (rule.trim) {
    sanitized = sanitized.trim();
  }

  if (rule.toLowerCase) {
    sanitized = sanitized.toLowerCase();
  }

  if (rule.toUpperCase) {
    sanitized = sanitized.toUpperCase();
  }

  if (rule.escape) {
    sanitized = validator.escape(sanitized);
  }

  if (rule.normalizeEmail && rule.type === 'email') {
    sanitized = validator.normalizeEmail(sanitized) || sanitized;
  }

  // HTML sanitization
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  return sanitized;
}

/**
 * Create SQL injection prevention middleware
 */
export function createSQLInjectionProtection() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const checkValue = (value: any, _field: string): boolean => {
      if (typeof value !== 'string') return true;

      for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(value)) {
          return false;
        }
      }
      return true;
    };

    // Check all input sources
    for (const location of ['body', 'query', 'params']) {
      const source = req[location as keyof Request] as any;
      if (source && typeof source === 'object') {
        for (const [key, value] of Object.entries(source)) {
          if (!checkValue(value, `${location}.${key}`)) {
            res.status(400).json({
              success: false,
              error: {
                code: ERROR_CODES.SECURITY_VIOLATION,
                message: 'Potentially malicious input detected',
              },
            });
            return;
          }
