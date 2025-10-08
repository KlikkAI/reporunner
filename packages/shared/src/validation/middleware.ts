/**
 * Validation Middleware
 * Consolidated from @reporunner/validation
 */

import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';

export interface ValidationOptions {
  /**
   * Whether to validate query parameters
   * @default false
   */
  validateQuery?: boolean;

  /**
   * Whether to validate request body
   * @default true
   */
  validateBody?: boolean;

  /**
   * Whether to validate URL parameters
   * @default false
   */
  validateParams?: boolean;

  /**
   * Whether to validate request headers
   * @default false
   */
  validateHeaders?: boolean;

  /**
   * Whether to validate cookies
   * @default false
   */
  validateCookies?: boolean;

  /**
   * Whether to validate files
   * @default false
   */
  validateFiles?: boolean;

  /**
   * Whether to allow unknown fields
   * @default false
   */
  allowUnknown?: boolean;

  /**
   * Whether to strip unknown fields
   * @default true
   */
  stripUnknown?: boolean;

  /**
   * Whether to abort early on first error
   * @default true
   */
  abortEarly?: boolean;

  /**
   * Custom error messages
   */
  messages?: Record<string, string>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  cookies?: Record<string, unknown>;
  files?: Record<string, unknown>;
}

export interface ValidationSchema {
  query?: z.ZodSchema<unknown>;
  body?: z.ZodSchema<unknown>;
  params?: z.ZodSchema<unknown>;
  headers?: z.ZodSchema<unknown>;
  cookies?: z.ZodSchema<unknown>;
  files?: z.ZodSchema<unknown>;
}

export class ValidationMiddleware {
  private schema: ValidationSchema;
  private options: Required<ValidationOptions>;

  constructor(schema: ValidationSchema, options: ValidationOptions = {}) {
    this.schema = schema;
    this.options = {
      validateQuery: false,
      validateBody: true,
      validateParams: false,
      validateHeaders: false,
      validateCookies: false,
      validateFiles: false,
      allowUnknown: false,
      stripUnknown: true,
      abortEarly: true,
      messages: {},
      ...options,
    };
  }

  /**
   * The main middleware handler
   */
  public handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.validate(req);

      // Update request with validated data
      if (this.options.validateQuery && result.query) {
        req.query = result.query as unknown as Request['query'];
      }
      if (this.options.validateBody && result.body) {
        req.body = result.body as unknown as Request['body'];
      }
      if (this.options.validateParams && result.params) {
        req.params = result.params as unknown as Request['params'];
      }

      // Store validation result in request for downstream middleware
      (req as unknown as Request & { validationResult: ValidationResult }).validationResult =
        result;

      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: error instanceof Error ? error.message : 'Unknown validation error',
        },
      });
    }
  };

  /**
   * Validate request data
   */
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Request validation requires checking multiple fields (query, body, params, headers, cookies, files) with individual error handling
  private async validate(req: Request): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
    };

    // Basic validation - in a real implementation, this would use Zod or similar
    if (this.options.validateBody && this.schema.body) {
      try {
        result.body = this.schema.body.parse(req.body) as Record<string, unknown>;
      } catch (error) {
        result.valid = false;
        result.errors.push({
          field: 'body',
          message: error instanceof Error ? error.message : 'Body validation failed',
        });
      }
    }

    if (this.options.validateQuery && this.schema.query) {
      try {
        result.query = this.schema.query.parse(req.query) as Record<string, unknown>;
      } catch (error) {
        result.valid = false;
        result.errors.push({
          field: 'query',
          message: error instanceof Error ? error.message : 'Query validation failed',
        });
      }
    }

    if (this.options.validateParams && this.schema.params) {
      try {
        result.params = this.schema.params.parse(req.params) as Record<string, unknown>;
      } catch (error) {
        result.valid = false;
        result.errors.push({
          field: 'params',
          message: error instanceof Error ? error.message : 'Params validation failed',
        });
      }
    }

    if (result.errors.length > 0) {
      throw new Error(`Validation failed: ${result.errors.map((e) => e.message).join(', ')}`);
    }

    return result;
  }
}
