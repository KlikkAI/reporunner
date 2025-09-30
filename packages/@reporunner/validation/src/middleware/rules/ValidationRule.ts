import type { ValidationContext } from '../context/ValidationContext';
import type { ValidationResult } from '../types/ValidationResult';

/**
 * Interface for validation rules
 */
export interface ValidationRule {
  /**
   * Rule name
   */
  readonly name: string;

  /**
   * Rule description
   */
  readonly description?: string;

  /**
   * Validate request context
   */
  validate(context: ValidationContext): Promise<ValidationResult>;

  /**
   * Check if rule applies to request
   */
  applies?(context: ValidationContext): Promise<boolean>;

  /**
   * Get rule dependencies
   */
  getDependencies?(): ValidationRule[];
}

/**
 * Abstract base class for validation rules
 */
export abstract class BaseValidationRule implements ValidationRule {
  public readonly name: string;
  public readonly description?: string;

  constructor(name: string, description?: string) {
    this.name = name;
    this.description = description;
  }

  /**
   * Validate request context
   */
  public abstract validate(context: ValidationContext): Promise<ValidationResult>;

  /**
   * Check if rule applies to request
   */
  public async applies(_context: ValidationContext): Promise<boolean> {
    return true;
  }

  /**
   * Get rule dependencies
   */
  public getDependencies(): ValidationRule[] {
    return [];
  }
}

/**
 * Function-based validation rule
 */
export class FunctionValidationRule extends BaseValidationRule {
  private validateFn: (context: ValidationContext) => Promise<ValidationResult>;
  private appliesFn?: (context: ValidationContext) => Promise<boolean>;
  private dependencies: ValidationRule[];

  constructor(
    name: string,
    validateFn: (context: ValidationContext) => Promise<ValidationResult>,
    options?: {
      description?: string;
      applies?: (context: ValidationContext) => Promise<boolean>;
      dependencies?: ValidationRule[];
    }
  ) {
    super(name, options?.description);
    this.validateFn = validateFn;
    this.appliesFn = options?.applies;
    this.dependencies = options?.dependencies || [];
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    return this.validateFn(context);
  }

  public async applies(context: ValidationContext): Promise<boolean> {
    if (this.appliesFn) {
      return this.appliesFn(context);
    }
    return super.applies(context);
  }

  public getDependencies(): ValidationRule[] {
    return this.dependencies;
  }
}

/**
 * Composite validation rule
 */
export class CompositeValidationRule extends BaseValidationRule {
  private rules: ValidationRule[];

  constructor(name: string, rules: ValidationRule[], description?: string) {
    super(name, description);
    this.rules = rules;
  }

  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const results: ValidationResult[] = [];

    for (const rule of this.rules) {
      // Create child context for rule
      const childContext = context.createChild(rule.name);

      // Check if rule applies
      if (rule.applies && !(await rule.applies(childContext))) {
        continue;
      }

      // Execute rule
      const result = await rule.validate(childContext);
      results.push(result);

      // Break on first error if configured
      if (!result.valid && context.getState('abortEarly')) {
        break;
      }
    }

    // Merge results
    return this.mergeResults(results);
  }

  public getDependencies(): ValidationRule[] {
    const dependencies = new Set<ValidationRule>();

    for (const rule of this.rules) {
      // Add rule dependencies
      for (const dependency of rule.getDependencies?.() || []) {
        dependencies.add(dependency);
      }

      // Add rule itself
      dependencies.add(rule);
    }

    return Array.from(dependencies);
  }

  private mergeResults(results: ValidationResult[]): ValidationResult {
    const merged: ValidationResult = {
      valid: true,
      errors: [],
      transformed: {},
    };

    for (const result of results) {
      // Merge validation status
      merged.valid = merged.valid && result.valid;

      // Merge errors
      merged.errors.push(...result.errors);

      // Merge transformed data
      if (result.transformed) {
        merged.transformed = {
          ...merged.transformed,
          ...result.transformed,
        };
      }

      // Merge metadata
      if (result.meta) {
        if (!merged.meta) {
          merged.meta = {};
        }

        merged.meta.rulesExecuted =
          (merged.meta.rulesExecuted || 0) + (result.meta.rulesExecuted || 0);

        merged.meta.transformations =
          (merged.meta.transformations || 0) + (result.meta.transformations || 0);

        merged.meta.sanitizations =
          (merged.meta.sanitizations || 0) + (result.meta.sanitizations || 0);

        merged.meta.cacheHits = (merged.meta.cacheHits || 0) + (result.meta.cacheHits || 0);
      }
    }

    return merged;
  }
}

/**
 * Helper functions for creating validation rules
 */

/**
 * Create a function-based validation rule
 */
export function createRule(
  name: string,
  validateFn: (context: ValidationContext) => Promise<ValidationResult>,
  options?: {
    description?: string;
    applies?: (context: ValidationContext) => Promise<boolean>;
    dependencies?: ValidationRule[];
  }
): ValidationRule {
  return new FunctionValidationRule(name, validateFn, options);
}

/**
 * Create a composite validation rule
 */
export function combineRules(
  name: string,
  rules: ValidationRule[],
  description?: string
): ValidationRule {
  return new CompositeValidationRule(name, rules, description);
}

/**
 * Create an async validation rule
 */
export function createAsyncRule(
  name: string,
  validateFn: (context: ValidationContext) => Promise<ValidationResult>,
  options?: {
    description?: string;
    applies?: (context: ValidationContext) => Promise<boolean>;
    dependencies?: ValidationRule[];
    timeout?: number;
    retries?: number;
    backoff?: number;
  }
): ValidationRule {
  return new FunctionValidationRule(
    name,
    async (context) => {
      const timeout = options?.timeout || 5000;
      const retries = options?.retries || 3;
      const backoff = options?.backoff || 1000;

      let lastError: Error | undefined;

      for (let i = 0; i < retries; i++) {
        try {
          // Create promise with timeout
          const result = await Promise.race([
            validateFn(context),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Validation timeout')), timeout)
            ),
          ]);

          return result;
        } catch (error) {
          lastError = error as Error;
          if (i < retries - 1) {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, backoff * 2 ** i));
          }
        }
      }

      throw lastError;
    },
    options
  );
}
