import type { ValidationContext } from '../context/ValidationContext';
import { ValidationError } from '../errors/ValidationError';
import type { ValidationRule } from '../rules/ValidationRule';
import type { ValidationResult } from '../types/ValidationResult';
import type { ValidationOptions } from '../ValidationMiddleware';

export class CustomValidator {
  private options: Required<ValidationOptions>;
  private rules: Set<ValidationRule>;

  constructor(options: ValidationOptions) {
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
      onError: options.onError || (() => {}),
      onSuccess: options.onSuccess || (() => {}),
    };

    this.rules = new Set();
  }

  /**
   * Add validation rule
   */
  public addRule(rule: ValidationRule): this {
    this.rules.add(rule);
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
   * Validate request context
   */
  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      transformed: {},
    };

    // Track metadata
    const meta = {
      rulesExecuted: 0,
      transformations: 0,
      startTime: Date.now(),
    };

    try {
      // Run all validation rules
      for (const rule of this.rules) {
        try {
          // Create child context for rule
          const childContext = context.createChild(rule.name);

          // Execute rule
          const ruleResult = await rule.validate(childContext);
          meta.rulesExecuted++;

          // Merge any transformations
          if (ruleResult.transformed) {
            result.transformed = {
              ...result.transformed,
              ...ruleResult.transformed,
            };
            meta.transformations++;
          }

          // Handle errors
          if (!ruleResult.valid) {
            result.errors.push(...ruleResult.errors);
            if (this.options.abortEarly) {
              break;
            }
          }
        } catch (error) {
          if (error instanceof ValidationError) {
            result.errors.push(...error.details);
            if (this.options.abortEarly) {
              break;
            }
          } else {
            throw error;
          }
        }
      }

      // Set final validation result
      result.valid = result.errors.length === 0;
      result.meta = {
        duration: Date.now() - meta.startTime,
        rulesExecuted: meta.rulesExecuted,
        transformations: meta.transformations,
      };

      return result;
    } catch (error) {
      throw new ValidationError([
        {
          path: '',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          context: { error },
        },
      ]);
    }
  }
}
