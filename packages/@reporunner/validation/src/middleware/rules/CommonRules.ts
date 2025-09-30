import type { ValidationContext } from '../context/ValidationContext';
import { ValidationError } from '../errors/ValidationError';
import type { ValidationResult } from '../types/ValidationResult';
import { BaseValidationRule } from './ValidationRule';

/**
 * Require authenticated user
 */
export class RequireAuthRule extends BaseValidationRule {
  constructor() {
    super('requireAuth', 'Require authenticated user');
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    if (!context.isAuthenticated()) {
      throw new ValidationError([
        {
          path: '',
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      ]);
    }

    return { valid: true, errors: [] };
  }
}

/**
 * Require specific user roles
 */
export class RequireRolesRule extends BaseValidationRule {
  private roles: string[];

  constructor(roles: string | string[]) {
    super('requireRoles', `Require roles: ${Array.isArray(roles) ? roles.join(', ') : roles}`);
    this.roles = Array.isArray(roles) ? roles : [roles];
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const user = context.getUser();
    if (!user) {
      throw new ValidationError([
        {
          path: '',
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      ]);
    }

    const userRoles = user.roles || [];
    const hasRole = this.roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ValidationError([
        {
          path: '',
          message: `Required roles: ${this.roles.join(', ')}`,
          code: 'FORBIDDEN',
        },
      ]);
    }

    return { valid: true, errors: [] };
  }
}

/**
 * Rate limit requests
 */
export class RateLimitRule extends BaseValidationRule {
  private limit: number;
  private window: number;
  private store: Map<string, number[]>;

  constructor(limit: number, window: number) {
    super('rateLimit', `Limit to ${limit} requests per ${window}ms`);
    this.limit = limit;
    this.window = window;
    this.store = new Map();
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const key = this.getKey(context);
    const now = Date.now();

    // Get request timestamps for key
    let timestamps = this.store.get(key) || [];

    // Remove old timestamps
    timestamps = timestamps.filter((time) => now - time < this.window);

    // Check limit
    if (timestamps.length >= this.limit) {
      throw new ValidationError([
        {
          path: '',
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      ]);
    }

    // Add new timestamp
    timestamps.push(now);
    this.store.set(key, timestamps);

    return { valid: true, errors: [] };
  }

  private getKey(context: ValidationContext): string {
    const user = context.getUser();
    if (user?.id) {
      return `user:${user.id}`;
    }
    return `ip:${context.getIP()}`;
  }
}

/**
 * Validate request size
 */
export class RequestSizeRule extends BaseValidationRule {
  private maxSize: number;

  constructor(maxSize: number) {
    super('requestSize', `Maximum request size: ${maxSize} bytes`);
    this.maxSize = maxSize;
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const contentLength = Number.parseInt(context.req.headers['content-length'] || '0', 10);

    if (contentLength > this.maxSize) {
      throw new ValidationError([
        {
          path: '',
          message: `Request too large. Maximum size is ${this.maxSize} bytes`,
          code: 'REQUEST_TOO_LARGE',
        },
      ]);
    }

    return { valid: true, errors: [] };
  }
}

/**
 * Validate content type
 */
export class ContentTypeRule extends BaseValidationRule {
  private allowedTypes: string[];

  constructor(types: string | string[]) {
    super(
      'contentType',
      `Allowed content types: ${Array.isArray(types) ? types.join(', ') : types}`
    );
    this.allowedTypes = Array.isArray(types) ? types : [types];
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const contentType = context.req.headers['content-type'];
    if (!contentType) {
      throw new ValidationError([
        {
          path: '',
          message: 'Content-Type header is required',
          code: 'CONTENT_TYPE_REQUIRED',
        },
      ]);
    }

    const matches = this.allowedTypes.some((type) =>
      contentType.toLowerCase().startsWith(type.toLowerCase())
    );

    if (!matches) {
      throw new ValidationError([
        {
          path: '',
          message: `Content-Type must be one of: ${this.allowedTypes.join(', ')}`,
          code: 'INVALID_CONTENT_TYPE',
        },
      ]);
    }

    return { valid: true, errors: [] };
  }
}

/**
 * Validate request method
 */
export class MethodRule extends BaseValidationRule {
  private allowedMethods: string[];

  constructor(methods: string | string[]) {
    super('method', `Allowed methods: ${Array.isArray(methods) ? methods.join(', ') : methods}`);
    this.allowedMethods = Array.isArray(methods) ? methods : [methods];
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const method = context.getMethod();
    if (!this.allowedMethods.includes(method.toUpperCase())) {
      throw new ValidationError([
        {
          path: '',
          message: `Method must be one of: ${this.allowedMethods.join(', ')}`,
          code: 'METHOD_NOT_ALLOWED',
        },
      ]);
    }

    return { valid: true, errors: [] };
  }
}

/**
 * Cross-Origin Resource Sharing (CORS) validation
 */
export class CORSRule extends BaseValidationRule {
  private options: {
    origins: string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
    maxAge?: number;
  };

  constructor(options: {
    origins: string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
    maxAge?: number;
  }) {
    super('cors', 'CORS validation');
    this.options = options;
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const origin = context.req.headers.origin;
    if (!origin) {
      return { valid: true, errors: [] };
    }

    // Check origin
    const allowedOrigin = this.options.origins.includes('*')
      ? '*'
      : this.options.origins.find((o) => o === origin);

    if (!allowedOrigin) {
      throw new ValidationError([
        {
          path: '',
          message: 'CORS origin not allowed',
          code: 'CORS_ORIGIN_NOT_ALLOWED',
        },
      ]);
    }

    // Set CORS headers
    context.res.setHeader('Access-Control-Allow-Origin', allowedOrigin);

    if (this.options.credentials) {
      context.res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (this.options.headers) {
      context.res.setHeader('Access-Control-Allow-Headers', this.options.headers.join(', '));
    }

    if (this.options.methods) {
      context.res.setHeader('Access-Control-Allow-Methods', this.options.methods.join(', '));
    }

    if (this.options.maxAge) {
      context.res.setHeader('Access-Control-Max-Age', this.options.maxAge.toString());
    }

    // Handle preflight request
    if (context.getMethod() === 'OPTIONS') {
      context.res.status(204).end();
      return { valid: false, errors: [] }; // Stop further processing
    }

    return { valid: true, errors: [] };
  }
}

/**
 * Conditional validation rule
 */
export class ConditionalRule extends BaseValidationRule {
  private condition: (context: ValidationContext) => Promise<boolean>;
  private rule: BaseValidationRule;

  constructor(
    condition: (context: ValidationContext) => Promise<boolean>,
    rule: BaseValidationRule,
    name = 'conditional'
  ) {
    super(name, `Conditional: ${rule.name}`);
    this.condition = condition;
    this.rule = rule;
  }

  public async applies(context: ValidationContext): Promise<boolean> {
    return this.condition(context);
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    return this.rule.validate(context);
  }
}

/**
 * Cache validation results
 */
export class CachedRule extends BaseValidationRule {
  private rule: BaseValidationRule;
  private cache: Map<string, { result: ValidationResult; expires: number }>;
  private ttl: number;

  constructor(rule: BaseValidationRule, ttl: number) {
    super(`cached:${rule.name}`, `Cached: ${rule.description}`);
    this.rule = rule;
    this.cache = new Map();
    this.ttl = ttl;
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const key = this.getCacheKey(context);
    const now = Date.now();

    // Check cache
    const cached = this.cache.get(key);
    if (cached && cached.expires > now) {
      return {
        ...cached.result,
        meta: {
          ...cached.result.meta,
          cacheHits: (cached.result.meta?.cacheHits || 0) + 1,
        },
      };
    }

    // Execute rule
    const result = await this.rule.validate(context);

    // Cache result
    this.cache.set(key, {
      result,
      expires: now + this.ttl,
    });

    return result;
  }

  private getCacheKey(context: ValidationContext): string {
    const parts = [
      context.getMethod(),
      context.getRequestPath(),
      JSON.stringify(context.getQuery()),
      JSON.stringify(context.getBody()),
    ];

    return parts.join(':');
  }
}

/**
 * Sequential validation rule
 */
export class SequentialRule extends BaseValidationRule {
  private rules: BaseValidationRule[];

  constructor(rules: BaseValidationRule[]) {
    super('sequential', 'Sequential validation');
    this.rules = rules;
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    let lastResult: ValidationResult = { valid: true, errors: [] };

    for (const rule of this.rules) {
      const result = await rule.validate(context);
      if (!result.valid) {
        return result;
      }
      lastResult = result;
    }

    return lastResult;
  }
}

/**
 * Parallel validation rule
 */
export class ParallelRule extends BaseValidationRule {
  private rules: BaseValidationRule[];

  constructor(rules: BaseValidationRule[]) {
    super('parallel', 'Parallel validation');
    this.rules = rules;
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const results = await Promise.all(
      this.rules.map((rule) => {
        const childContext = context.fork();
        return rule.validate(childContext);
      })
    );

    return this.mergeResults(results);
  }

  private mergeResults(results: ValidationResult[]): ValidationResult {
    const merged: ValidationResult = {
      valid: true,
      errors: [],
      transformed: {},
    };

    for (const result of results) {
      merged.valid = merged.valid && result.valid;
      merged.errors.push(...result.errors);

      if (result.transformed) {
        merged.transformed = {
          ...merged.transformed,
          ...result.transformed,
        };
      }
    }

    return merged;
  }
}
