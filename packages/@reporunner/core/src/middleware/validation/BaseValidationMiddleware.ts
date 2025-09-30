import {
  BaseMiddleware,
  type BaseMiddlewareOptions,
  type MiddlewareContext,
} from '../BaseMiddleware';
import { ValidationError } from './errors/ValidationError';
import type { ValidationRule } from './rules/ValidationRule';
import type { ValidationResult } from './types/ValidationResult';

/**
 * Extended context for validation
 */
export interface ValidationContext extends MiddlewareContext {
  validationResult?: ValidationResult;
}

/**
 * Extended options for validation middleware
 */
export interface ValidationMiddlewareOptions extends BaseMiddlewareOptions {
  /**
   * Whether to validate query parameters
   */
  validateQuery?: boolean;

  /**
   * Whether to validate request body
   */
  validateBody?: boolean;

  /**
   * Whether to validate URL parameters
   */
  validateParams?: boolean;

  /**
   * Whether to validate request headers
   */
  validateHeaders?: boolean;

  /**
   * Whether to validate cookies
   */
  validateCookies?: boolean;

  /**
   * Whether to validate files
   */
  validateFiles?: boolean;

  /**
   * Whether to allow unknown fields
   */
  allowUnknown?: boolean;

  /**
   * Whether to strip unknown fields
   */
  stripUnknown?: boolean;

  /**
   * Custom error messages
   */
  messages?: Record<string, string>;
}

/**
 * Base class for validation middleware implementations
 */
export abstract class BaseValidationMiddleware extends BaseMiddleware {
  protected rules: Set<ValidationRule>;
  protected validationOptions: Required<ValidationMiddlewareOptions>;

  constructor(options: ValidationMiddlewareOptions = {}) {
    super(options);

    this.validationOptions = {
      ...this.options,
      validateQuery: false,
      validateBody: true,
      validateParams: false,
      validateHeaders: false,
      validateCookies: false,
      validateFiles: false,
      allowUnknown: false,
      stripUnknown: true,
      messages: {},
      ...options,
    };

    this.rules = new Set();
  }

  /**
   * Main validation implementation
   */
  protected async implementation(context: MiddlewareContext): Promise<void> {
    const validationContext = context as ValidationContext;

    // Run validation rules
    const result = await this.validate(validationContext);

    // Store validation result
    validationContext.validationResult = result;

    // Update request with validated data
    await this.updateRequest(validationContext, result);
  }

  /**
   * Add validation rule
   */
  public addRule(rule: ValidationRule): this {
    this.rules.add(rule);
    return this;
  }

  /**
   * Add multiple validation rules
   */
  public addRules(rules: ValidationRule[]): this {
    rules.forEach((rule) => this.rules.add(rule));
    return this;
  }

  /**
   * Remove validation rule
   */
  public removeRule(rule: ValidationRule): this {
    this.rules.delete(rule);
    return this;
  }

  /**
   * Execute all validation rules
   */
  protected async validate(context: ValidationContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      success: true,
      valid: true,
      errors: [],
    };

    // Track metadata
    const meta = {
      rulesExecuted: 0,
      transformations: 0,
      startTime: Date.now(),
    };

    try {
      // Schema validation
      if (this.hasSchemaValidation()) {
        await this.validateWithSchema(context, result);
      }

      // Custom validation rules
      await this.validateWithRules(context, result);

      // Set metadata
      result.meta = {
        duration: Date.now() - meta.startTime,
        rulesExecuted: meta.rulesExecuted,
        transformations: meta.transformations,
      };

      return result;
    } catch (error) {
      throw this.wrapValidationError(error as Error);
    }
  }

  /**
   * Update request with validated data
   */
  protected async updateRequest(
    context: ValidationContext,
    result: ValidationResult
  ): Promise<void> {
    if (this.validationOptions.validateQuery && result.query) {
      context.req.query = result.query;
    }

    if (this.validationOptions.validateBody && result.body) {
      context.req.body = result.body;
    }

    if (this.validationOptions.validateParams && result.params) {
      context.req.params = result.params;
    }

    if (this.validationOptions.validateHeaders && result.headers) {
      context.req.headers = result.headers;
    }

    if (this.validationOptions.validateCookies && result.cookies) {
      context.req.cookies = result.cookies;
    }
  }

  /**
   * Check if schema validation is needed
   */
  protected abstract hasSchemaValidation(): boolean;

  /**
   * Validate using schema
   */
  protected abstract validateWithSchema(
    context: ValidationContext,
    result: ValidationResult
  ): Promise<void>;

  /**
   * Validate using custom rules
   */
  protected async validateWithRules(
    context: ValidationContext,
    result: ValidationResult
  ): Promise<void> {
    for (const rule of this.rules) {
      try {
        // Check if rule applies
        if (rule.applies && !(await rule.applies(context))) {
          continue;
        }

        // Execute rule
        let ruleResult: any = { errors: [] };
        if (rule.validate) {
          ruleResult = await rule.validate(context, {});
          result.errors?.push(...(ruleResult.errors || []));
        }

        // Handle transforms
        if (ruleResult.transformed) {
          result.transformed = {
            ...result.transformed,
            ...ruleResult.transformed,
          };
        }

        // Stop on first error if configured
        if (!ruleResult.valid && this.validationOptions.abortEarly) {
          break;
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          result.errors?.push(...((error as any).details || []));
          if (this.validationOptions.abortEarly) {
            break;
          }
        } else {
          throw error;
        }
      }
    }

    result.valid = (result.errors?.length || 0) === 0;
  }

  /**
   * Wrap error in ValidationError if needed
   */
  protected wrapValidationError(error: Error): Error {
    if (error instanceof ValidationError) {
      return error;
    }

    return new ValidationError(error.message, [
      {
        path: '',
        message: error.message,
        code: 'VALIDATION_ERROR',
        context: { error },
      },
    ]);
  }
}
