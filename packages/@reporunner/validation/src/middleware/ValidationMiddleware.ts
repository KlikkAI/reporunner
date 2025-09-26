import { Request, Response, NextFunction } from 'express';
import { ValidationSchema } from './schema/ValidationSchema';
import { ValidationRule } from './rules/ValidationRule';
import { ValidationError } from './errors/ValidationError';
import { ValidationResult } from './types/ValidationResult';
import { ValidationContext } from './context/ValidationContext';
import { SchemaValidator } from './validators/SchemaValidator';
import { CustomValidator } from './validators/CustomValidator';

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

  /**
   * Custom error handler
   */
  onError?: (error: ValidationError, ctx: ValidationContext) => void | Promise<void>;

  /**
   * Custom success handler
   */
  onSuccess?: (result: ValidationResult, ctx: ValidationContext) => void | Promise<void>;
}

export class ValidationMiddleware {
  private schema: ValidationSchema;
  private options: Required<ValidationOptions>;
  private schemaValidator: SchemaValidator;
  private customValidator: CustomValidator;

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
      onError: options.onError || this.defaultErrorHandler.bind(this),
      onSuccess: options.onSuccess || this.defaultSuccessHandler.bind(this)
    };

    this.schemaValidator = new SchemaValidator(this.options);
    this.customValidator = new CustomValidator(this.options);
  }

  /**
   * The main middleware handler
   */
  public handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = new ValidationContext(req, res);
      const result = await this.validate(context);

      // Update request with validated data
      if (this.options.validateQuery) {
        req.query = result.query || {};
      }
      if (this.options.validateBody) {
        req.body = result.body || {};
      }
      if (this.options.validateParams) {
        req.params = result.params || {};
      }
      if (this.options.validateHeaders) {
        req.headers = result.headers || {};
      }
      if (this.options.validateCookies) {
        req.cookies = result.cookies || {};
      }

      // Store validation result in request for downstream middleware
      req.validationResult = result;

      await this.options.onSuccess(result, context);
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        await this.options.onError(error, new ValidationContext(req, res));
        next(error);
      } else {
        next(error);
      }
    }
  };

  /**
   * Validate request data
   */
  private async validate(context: ValidationContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: []
    };

    // Schema validation
    if (this.schema) {
      await this.validateWithSchema(context, result);
    }

    // Custom validation
    await this.validateWithCustomRules(context, result);

    // If there are any errors, validation failed
    if (result.errors.length > 0) {
      result.valid = false;
      throw new ValidationError(result.errors);
    }

    return result;
  }

  /**
   * Validate with schema
   */
  private async validateWithSchema(
    context: ValidationContext,
    result: ValidationResult
  ): Promise<void> {
    if (this.options.validateQuery && this.schema.query) {
      const queryResult = await this.schemaValidator.validate(
        this.schema.query,
        context.req.query
      );
      result.query = queryResult.value;
      result.errors.push(...queryResult.errors);
    }

    if (this.options.validateBody && this.schema.body) {
      const bodyResult = await this.schemaValidator.validate(
        this.schema.body,
        context.req.body
      );
      result.body = bodyResult.value;
      result.errors.push(...bodyResult.errors);
    }

    if (this.options.validateParams && this.schema.params) {
      const paramsResult = await this.schemaValidator.validate(
        this.schema.params,
        context.req.params
      );
      result.params = paramsResult.value;
      result.errors.push(...paramsResult.errors);
    }

    if (this.options.validateHeaders && this.schema.headers) {
      const headersResult = await this.schemaValidator.validate(
        this.schema.headers,
        context.req.headers
      );
      result.headers = headersResult.value;
      result.errors.push(...headersResult.errors);
    }

    if (this.options.validateCookies && this.schema.cookies) {
      const cookiesResult = await this.schemaValidator.validate(
        this.schema.cookies,
        context.req.cookies
      );
      result.cookies = cookiesResult.value;
      result.errors.push(...cookiesResult.errors);
    }

    if (this.options.validateFiles && this.schema.files) {
      const filesResult = await this.schemaValidator.validate(
        this.schema.files,
        context.req.files
      );
      result.files = filesResult.value;
      result.errors.push(...filesResult.errors);
    }
  }

  /**
   * Validate with custom rules
   */
  private async validateWithCustomRules(
    context: ValidationContext,
    result: ValidationResult
  ): Promise<void> {
    const customResults = await this.customValidator.validate(context);
    result.errors.push(...customResults.errors);

    if (customResults.query) {
      result.query = { ...result.query, ...customResults.query };
    }
    if (customResults.body) {
      result.body = { ...result.body, ...customResults.body };
    }
    if (customResults.params) {
      result.params = { ...result.params, ...customResults.params };
    }
    if (customResults.headers) {
      result.headers = { ...result.headers, ...customResults.headers };
    }
    if (customResults.cookies) {
      result.cookies = { ...result.cookies, ...customResults.cookies };
    }
    if (customResults.files) {
      result.files = { ...result.files, ...customResults.files };
    }
  }

  /**
   * Add a custom validation rule
   */
  public addRule(rule: ValidationRule): this {
    this.customValidator.addRule(rule);
    return this;
  }

  /**
   * Add multiple custom validation rules
   */
  public addRules(rules: ValidationRule[]): this {
    rules.forEach(rule => this.customValidator.addRule(rule));
    return this;
  }

  /**
   * Remove a custom validation rule
   */
  public removeRule(rule: ValidationRule): this {
    this.customValidator.removeRule(rule);
    return this;
  }

  /**
   * Default error handler
   */
  private async defaultErrorHandler(
    error: ValidationError,
    context: ValidationContext
  ): Promise<void> {
    context.res.status(400).json({
      error: {
        message: 'Validation failed',
        details: error.details
      }
    });
  }

  /**
   * Default success handler
   */
  private async defaultSuccessHandler(
    result: ValidationResult,
    context: ValidationContext
  ): Promise<void> {
    // Do nothing by default
  }
}