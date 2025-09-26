import { IValidator, ValidationResult } from '../service/base-service.interface';

/**
 * Validation rule definition
 */
export interface ValidationRule<T> {
  validate(value: any, data: Partial<T>): Promise<boolean> | boolean;
  message: string;
  code?: string;
}

/**
 * Field validation definition
 */
export interface FieldValidation<T> {
  field: keyof T;
  rules: ValidationRule<T>[];
}

/**
 * Base validator implementation that can be extended by domain-specific validators
 */
export abstract class BaseValidator<T> implements IValidator<T> {
  protected validations: FieldValidation<T>[] = [];

  /**
   * Add a validation rule for a field
   */
  protected addValidation(field: keyof T, rules: ValidationRule<T>[]): void {
    this.validations.push({ field, rules });
  }

  /**
   * Common validation rules
   */
  protected rules = {
    required: (message = 'Field is required'): ValidationRule<any> => ({
      validate: value => value !== undefined && value !== null && value !== '',
      message,
      code: 'REQUIRED'
    }),

    minLength: (min: number, message = `Minimum length is ${min}`): ValidationRule<any> => ({
      validate: value => !value || String(value).length >= min,
      message,
      code: 'MIN_LENGTH'
    }),

    maxLength: (max: number, message = `Maximum length is ${max}`): ValidationRule<any> => ({
      validate: value => !value || String(value).length <= max,
      message,
      code: 'MAX_LENGTH'
    }),

    pattern: (pattern: RegExp, message = 'Invalid format'): ValidationRule<any> => ({
      validate: value => !value || pattern.test(String(value)),
      message,
      code: 'PATTERN'
    }),

    email: (message = 'Invalid email format'): ValidationRule<any> => ({
      validate: value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
      message,
      code: 'EMAIL'
    }),

    min: (min: number, message = `Minimum value is ${min}`): ValidationRule<any> => ({
      validate: value => !value || Number(value) >= min,
      message,
      code: 'MIN'
    }),

    max: (max: number, message = `Maximum value is ${max}`): ValidationRule<any> => ({
      validate: value => !value || Number(value) <= max,
      message,
      code: 'MAX'
    }),

    custom: (
      validateFn: (value: any, data: Partial<any>) => Promise<boolean> | boolean,
      message: string,
      code?: string
    ): ValidationRule<any> => ({
      validate: validateFn,
      message,
      code
    })
  };

  /**
   * Validate data against all rules
   */
  async validate(data: Partial<T>): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];

    for (const validation of this.validations) {
      const value = data[validation.field];

      for (const rule of validation.rules) {
        const isValid = await rule.validate(value, data);

        if (!isValid) {
          errors.push({
            field: validation.field as string,
            message: rule.message,
            code: rule.code
          });
          break; // Stop on first error for this field
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}