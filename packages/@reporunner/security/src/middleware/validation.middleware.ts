import { ERROR_CODES } from '@reporunner/constants';
import type { NextFunction, Request, Response } from 'express';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export interface ValidationRule {
  field: string;
  location?: 'body' | 'query' | 'params' | 'headers';
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'json' | 'array' | 'object';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
  trim?: boolean;
  escape?: boolean;
  normalizeEmail?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  default?: any;
  transform?: (value: any) => any;
}

export interface ValidationSchema {
  rules: ValidationRule[];
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  location?: string;
}

/**
 * SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|ALERT|CONFIRM|PROMPT)\b)/gi,
  /(--|#|\/\*|\*\/|;|\||\\x[0-9a-f]{2}|\\u[0-9a-f]{4})/gi,
  /('|(')|"|(")|(--)|(\|)|(\|\|)|(;))/gi,
  /(UNION\s+SELECT|SELECT\s+\*|DROP\s+TABLE|INSERT\s+INTO)/gi,
];

/**
 * NoSQL injection patterns to detect
 */
const NOSQL_INJECTION_PATTERNS = [
  /(\$where|\$regex|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$exists|\$type)/gi,
  /({|}|\[|\])/g,
  /(\$\w+)/g,
];

/**
 * XSS patterns to detect
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<img[^>]*onerror\s*=/gi,
  /<svg[^>]*onload\s*=/gi,
];

/**
 * Path traversal patterns to detect
 */
const PATH_TRAVERSAL_PATTERNS = [/\.\.\//g, /\.\.\\/, /%2e%2e%2f/gi, /%252e%252e%252f/gi, /\.\./g];

/**
 * Command injection patterns to detect
 */
const COMMAND_INJECTION_PATTERNS = [/[;&|`$()]/g, /\$\(/g, /`[^`]*`/g, /\|\|/g, /&&/g];

/**
 * Create validation middleware
 */
export function createValidationMiddleware(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors: ValidationError[] = [];
    const validatedData: any = {};

    // Process each rule
    for (const rule of schema.rules) {
      const location = rule.location || 'body';
      const source = req[location as keyof Request] as any;
      let value = source?.[rule.field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: rule.field,
          message: `${rule.field} is required`,
          location,
        });

        if (schema.abortEarly) {
          break;
        }
        continue;
      }

      // Apply default value if not present
      if (value === undefined && rule.default !== undefined) {
        value = typeof rule.default === 'function' ? rule.default() : rule.default;
      }

      // Skip validation if value is not present and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Sanitize value first if requested
      if (rule.sanitize) {
        value = sanitizeInput(value, rule);
      }

      // Validate type
      const typeError = validateType(value, rule.type);
      if (typeError) {
        errors.push({
          field: rule.field,
          message: typeError,
          value,
          location,
        });

        if (schema.abortEarly) {
          break;
        }
        continue;
      }

      // Validate constraints
      const constraintErrors = validateConstraints(value, rule);
      if (constraintErrors.length > 0) {
        errors.push(
          ...constraintErrors.map((error) => ({
            field: rule.field,
            message: error,
            value,
            location,
          }))
        );

        if (schema.abortEarly) {
          break;
        }
        continue;
      }

      // Apply transformation
      if (rule.transform) {
        value = rule.transform(value);
      }

      // Store validated value
      validatedData[rule.field] = value;
    }

    // Handle unknown fields
    if (schema.stripUnknown) {
      for (const location of ['body', 'query', 'params']) {
        const source = req[location as keyof Request] as any;
        if (source && typeof source === 'object') {
          const knownFields = schema.rules
            .filter((r) => (r.location || 'body') === location)
            .map((r) => r.field);

          for (const key of Object.keys(source)) {
            if (!knownFields.includes(key)) {
              if (!schema.allowUnknown) {
                errors.push({
                  field: key,
                  message: `Unknown field: ${key}`,
                  location,
                });
              }
              delete source[key];
            }
          }
        }
      }
    }

    // Return errors if any
    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: errors,
        },
      });
      return;
    }

    // Attach validated data to request
    (req as any).validated = validatedData;
    next();
  };
}

/**
 * Validate type of value
 */
function validateType(value: any, type?: string): string | null {
  if (!type) return null;

  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return `Expected string, got ${typeof value}`;
      }
      break;

    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return `Expected number, got ${typeof value}`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return `Expected boolean, got ${typeof value}`;
      }
      break;

    case 'email':
      if (!validator.isEmail(value)) {
        return 'Invalid email address';
      }
      break;

    case 'url':
      if (!validator.isURL(value)) {
        return 'Invalid URL';
      }
      break;

    case 'uuid':
      if (!validator.isUUID(value)) {
        return 'Invalid UUID';
      }
      break;

    case 'json':
      try {
        JSON.parse(value);
      } catch {
        return 'Invalid JSON';
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return 'Expected array';
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        return 'Expected object';
      }
      break;
  }

  return null;
}

/**
 * Validate constraints
 */
function validateConstraints(value: any, rule: ValidationRule): string[] {
  const errors: string[] = [];

  // Min/Max for numbers
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`Value must be at least ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`Value must be at most ${rule.max}`);
    }
  }

  // Length for strings and arrays
  if (typeof value === 'string' || Array.isArray(value)) {
    const length = value.length;
    if (rule.minLength !== undefined && length < rule.minLength) {
      errors.push(`Length must be at least ${rule.minLength}`);
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
        }
      }
    }

    next();
  };
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
      return true;
    };

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
  };
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
  }

  if (options.enablePathTraversalProtection !== false) {
    middlewares.push(createPathTraversalProtection());
  }

  if (options.enableCommandInjectionProtection !== false) {
    middlewares.push(createCommandInjectionProtection());
  }

  return middlewares;
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  login: {
    rules: [
      {
        field: 'email',
        type: 'email',
        required: true,
        normalizeEmail: true,
        toLowerCase: true,
        sanitize: true,
      },
      {
        field: 'password',
        type: 'string',
        required: true,
        minLength: 8,
        maxLength: 128,
      },
    ],
  },

  registration: {
    rules: [
      {
        field: 'email',
        type: 'email',
        required: true,
        normalizeEmail: true,
        toLowerCase: true,
        sanitize: true,
      },
      {
        field: 'password',
        type: 'string',
        required: true,
        minLength: 8,
        maxLength: 128,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      },
      {
        field: 'name',
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        sanitize: true,
        trim: true,
      },
    ],
  },

  pagination: {
    rules: [
      {
        field: 'page',
        location: 'query',
        type: 'number',
        min: 1,
        default: 1,
        transform: (v: any) => parseInt(v, 10),
      },
      {
        field: 'limit',
        location: 'query',
        type: 'number',
        min: 1,
        max: 100,
        default: 20,
        transform: (v: any) => parseInt(v, 10),
      },
      {
        field: 'sort',
        location: 'query',
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc',
        toLowerCase: true,
      },
    ],
  },
};
