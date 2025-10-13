import {
  BaseMiddleware,
  type SchemaDefinition,
  SchemaValidator,
  ValidationError,
} from '@reporunner/core';
import type { Request } from 'express';
import type { ParsedQs } from 'qs';

// Type definitions for Express request components
type ParamsDictionary = Record<string, string>;

export interface ValidationConfig {
  /**
   * Schema to validate request body
   */
  bodySchema?: SchemaDefinition;

  /**
   * Schema to validate request query
   */
  querySchema?: SchemaDefinition;

  /**
   * Schema to validate request params
   */
  paramsSchema?: SchemaDefinition;

  /**
   * Whether to sanitize inputs
   */
  sanitize?: boolean;

  /**
   * Custom validation function
   */
  customValidation?: (req: Request) => Promise<void>;
}

export class ValidationMiddleware extends BaseMiddleware {
  private bodyValidator?: SchemaValidator;
  private queryValidator?: SchemaValidator;
  private paramsValidator?: SchemaValidator;
  private validationConfig: ValidationConfig;

  constructor(config: ValidationConfig) {
    super();
    this.validationConfig = config;

    // Initialize validators
    if (config.bodySchema) {
      this.bodyValidator = new SchemaValidator(config.bodySchema);
    }
    if (config.querySchema) {
      this.queryValidator = new SchemaValidator(config.querySchema);
    }
    if (config.paramsSchema) {
      this.paramsValidator = new SchemaValidator(config.paramsSchema);
    }
  }

  /**
   * Validate with a schema or function and capture errors
   */
  private async validateWithHandler(
    validationFn: () => Promise<void>,
    errorKey: string,
    errors: Record<string, string[]>
  ): Promise<void> {
    try {
      await validationFn();
    } catch (error) {
      if (error instanceof ValidationError) {
        errors[errorKey] = error.details;
      } else {
        errors[errorKey] = [(error as Error).message];
      }
    }
  }

  protected async implementation({ req }: { req: Request }): Promise<void> {
    const errors: Record<string, string[]> = {};

    // Validate body
    if (this.bodyValidator && req.body) {
      await this.validateWithHandler(
        async () => this.bodyValidator!.validate(req.body),
        'body',
        errors
      );
    }

    // Validate query
    if (this.queryValidator && req.query) {
      await this.validateWithHandler(
        async () => this.queryValidator!.validate(req.query),
        'query',
        errors
      );
    }

    // Validate params
    if (this.paramsValidator && req.params) {
      await this.validateWithHandler(
        async () => this.paramsValidator!.validate(req.params),
        'params',
        errors
      );
    }

    // Run custom validation
    if (this.validationConfig.customValidation) {
      await this.validateWithHandler(
        async () => this.validationConfig.customValidation!(req),
        'custom',
        errors
      );
    }

    // If there are any errors, throw a validation error
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Request validation failed', errors);
    }

    // Sanitize inputs if enabled
    if (this.validationConfig.sanitize) {
      this.sanitizeInputs(req);
    }
  }

  private sanitizeInputs(req: Request): void {
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = this.sanitizeObject(req.query) as ParsedQs;
    }
    if (req.params) {
      req.params = this.sanitizeObject(req.params) as ParamsDictionary;
    }
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }
}

// Factory functions for common validation middleware
export function validateBody(schema: SchemaDefinition) {
  return new ValidationMiddleware({ bodySchema: schema });
}

export function validateQuery(schema: SchemaDefinition) {
  return new ValidationMiddleware({ querySchema: schema });
}

export function validateParams(schema: SchemaDefinition) {
  return new ValidationMiddleware({ paramsSchema: schema });
}

export function validateRequest(config: ValidationConfig) {
  return new ValidationMiddleware(config);
}
