import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: ValidationError[];
}

export interface ValidationOptions {
  skipValidation?: boolean;
  allowExtraFields?: boolean;
  stripExtraFields?: boolean;
  customErrorMessages?: Record<string, string>;
  onValidationError?: (errors: ValidationError[]) => void;
}

/**
 * Base validation middleware that eliminates duplication across validation middlewares.
 * Provides consistent error formatting, flexible validation options, and comprehensive logging.
 */
export class BaseValidationMiddleware {
  /**
   * Create a validation middleware for request body
   */
  static validateBody(schema: ZodSchema, options: ValidationOptions = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      const result = this.validateData(req.body, schema, options);

      if (!result.success) {
        return this.sendValidationError(res, result.errors || [], 'body');
      }

      req.body = result.data;
      next();
    };
  }

  /**
   * Create a validation middleware for query parameters
   */
  static validateQuery(schema: ZodSchema, options: ValidationOptions = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      const result = this.validateData(req.query, schema, options);

      if (!result.success) {
        return this.sendValidationError(res, result.errors || [], 'query');
      }

      req.query = result.data;
      next();
    };
  }

  /**
   * Create a validation middleware for request parameters
   */
  static validateParams(schema: ZodSchema, options: ValidationOptions = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      const result = this.validateData(req.params, schema, options);

      if (!result.success) {
        return this.sendValidationError(res, result.errors || [], 'params');
      }

      req.params = result.data;
      next();
    };
  }

  /**
   * Create a validation middleware for request headers
   */
  static validateHeaders(schema: ZodSchema, options: ValidationOptions = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      const result = this.validateData(req.headers, schema, options);

      if (!result.success) {
        return this.sendValidationError(res, result.errors || [], 'headers');
      }

      // Don't override headers, just validate them
      next();
    };
  }

  /**
   * Comprehensive validation middleware that validates multiple parts of the request
   */
  static validateRequest(schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
    headers?: ZodSchema;
  }, options: ValidationOptions = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      const allErrors: ValidationError[] = [];

      // Validate each part of the request
      for (const [part, schema] of Object.entries(schemas)) {
        if (!schema) continue;

        const data = (req as any)[part];
        const result = this.validateData(data, schema, options);

        if (!result.success) {
          allErrors.push(...(result.errors || []).map(error => ({
            ...error,
            field: `${part}.${error.field}`,
          })));
        } else {
          // Update the request with validated data
          if (part !== 'headers') {
            (req as any)[part] = result.data;
          }
        }
      }

      if (allErrors.length > 0) {
        return this.sendValidationError(res, allErrors, 'request');
      }

      next();
    };
  }

  /**
   * Validate data against a Zod schema
   */
  static validateData(
    data: any,
    schema: ZodSchema,
    options: ValidationOptions = {}
  ): ValidationResult {
    if (options.skipValidation) {
      return { success: true, data };
    }

    try {
      // Configure schema based on options
      let processedSchema = schema;

      if (options.stripExtraFields) {
        processedSchema = schema.strict();
      } else if (!options.allowExtraFields) {
        processedSchema = schema.strict();
      }

      const validatedData = processedSchema.parse(data);

      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = this.formatZodErrors(error, options.customErrorMessages);

        if (options.onValidationError) {
          options.onValidationError(validationErrors);
        }

        return {
          success: false,
          errors: validationErrors,
        };
      }

      // Handle non-Zod errors
      return {
        success: false,
        errors: [{
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          code: 'UNKNOWN_ERROR',
        }],
      };
    }
  }

  /**
   * Format Zod errors into consistent ValidationError format
   */
  private static formatZodErrors(
    zodError: ZodError,
    customMessages?: Record<string, string>
  ): ValidationError[] {
    return zodError.errors.map(error => {
      const field = error.path.join('.');
      const code = error.code;

      // Use custom message if available
      const customMessage = customMessages?.[field] || customMessages?.[code];

      let message = customMessage || error.message;

      // Enhance error messages based on error type
      switch (error.code) {
        case 'invalid_type':
          message = `Expected ${error.expected}, received ${error.received}`;
          break;
        case 'too_small':
          if (error.type === 'string') {
            message = `Must be at least ${error.minimum} characters`;
          } else if (error.type === 'number') {
            message = `Must be at least ${error.minimum}`;
          } else if (error.type === 'array') {
            message = `Must contain at least ${error.minimum} items`;
          }
          break;
        case 'too_big':
          if (error.type === 'string') {
            message = `Must be at most ${error.maximum} characters`;
          } else if (error.type === 'number') {
            message = `Must be at most ${error.maximum}`;
          } else if (error.type === 'array') {
            message = `Must contain at most ${error.maximum} items`;
          }
          break;
        case 'invalid_string':
          if (error.validation === 'email') {
            message = 'Must be a valid email address';
          } else if (error.validation === 'url') {
            message = 'Must be a valid URL';
          } else if (error.validation === 'uuid') {
            message = 'Must be a valid UUID';
          }
          break;
        case 'invalid_enum_value':
          message = `Must be one of: ${error.options.join(', ')}`;
          break;
      }

      return {
        field,
        message,
        code,
        value: error.received,
      };
    });
  }

  /**
   * Send validation error response
   */
  private static sendValidationError(
    res: Response,
    errors: ValidationError[],
    source: string
  ): Response {
    const errorResponse = {
      success: false,
      message: `Validation failed for ${source}`,
      errors: errors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {} as Record<string, string>),
      details: errors,
      timestamp: new Date().toISOString(),
    };

    return res.status(400).json(errorResponse);
  }

  /**
   * Create a reusable validator function
   */
  static createValidator(schema: ZodSchema, options: ValidationOptions = {}) {
    return (data: any): ValidationResult => {
      return this.validateData(data, schema, options);
    };
  }

  /**
   * Async validation for complex scenarios
   */
  static async validateAsync<T>(
    data: any,
    validator: (data: any) => Promise<T>,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    try {
      const validatedData = await validator(data);
      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      const validationErrors: ValidationError[] = [{
        field: 'async_validation',
        message: error instanceof Error ? error.message : 'Async validation failed',
        code: 'ASYNC_VALIDATION_ERROR',
      }];

      if (options.onValidationError) {
        options.onValidationError(validationErrors);
      }

      return {
        success: false,
        errors: validationErrors,
      };
    }
  }

  /**
   * Combine multiple validation results
   */
  static combineValidationResults(results: ValidationResult[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const validData: any[] = [];

    for (const result of results) {
      if (result.success) {
        validData.push(result.data);
      } else {
        allErrors.push(...(result.errors || []));
      }
    }

    if (allErrors.length > 0) {
      return {
        success: false,
        errors: allErrors,
      };
    }

    return {
      success: true,
      data: validData,
    };
  }
}

export default BaseValidationMiddleware;