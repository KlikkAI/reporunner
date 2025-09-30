/**
 * Type Validation Utils
 *
 * Utilities for validating and checking data types
 */

export type DataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'
  | 'undefined'
  | 'date'
  | 'function';

export interface ValidationRule {
  type: DataType;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class TypeValidation {
  /**
   * Get the type of a value
   */
  getType(value: any): DataType {
    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }
    if (Array.isArray(value)) {
      return 'array';
    }
    if (value instanceof Date) {
      return 'date';
    }

    const type = typeof value;
    return type as DataType;
  }

  /**
   * Validate a value against a rule
   */
  validate(value: any, rule: ValidationRule): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required check
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push('Value is required');
      return { isValid: false, errors, warnings };
    }

    // Skip further validation if value is null/undefined and not required
    if (value === null || value === undefined) {
      return { isValid: true, errors, warnings };
    }

    // Type check
    const actualType = this.getType(value);
    if (actualType !== rule.type) {
      errors.push(`Expected type ${rule.type}, got ${actualType}`);
    }

    // Type-specific validations
    switch (rule.type) {
      case 'string':
        this.validateString(value, rule, errors, warnings);
        break;

      case 'number':
        this.validateNumber(value, rule, errors, warnings);
        break;

      case 'array':
        this.validateArray(value, rule, errors, warnings);
        break;

      case 'object':
        this.validateObject(value, rule, errors, warnings);
        break;
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`Value must be one of: ${rule.enum.join(', ')}`);
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult === false) {
        errors.push('Custom validation failed');
      } else if (typeof customResult === 'string') {
        errors.push(customResult);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate string value
   */
  private validateString(
    value: any,
    rule: ValidationRule,
    errors: string[],
    _warnings: string[]
  ): void {
    if (typeof value !== 'string') {
      return;
    }

    if (rule.min !== undefined && value.length < rule.min) {
      errors.push(`String must be at least ${rule.min} characters long`);
    }

    if (rule.max !== undefined && value.length > rule.max) {
      errors.push(`String must be no more than ${rule.max} characters long`);
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push('String does not match required pattern');
    }
  }

  /**
   * Validate number value
   */
  private validateNumber(
    value: any,
    rule: ValidationRule,
    errors: string[],
    warnings: string[]
  ): void {
    if (typeof value !== 'number') {
      return;
    }

    if (Number.isNaN(value)) {
      errors.push('Number value is NaN');
      return;
    }

    if (rule.min !== undefined && value < rule.min) {
      errors.push(`Number must be at least ${rule.min}`);
    }

    if (rule.max !== undefined && value > rule.max) {
      errors.push(`Number must be no more than ${rule.max}`);
    }

    if (!Number.isFinite(value)) {
      warnings.push('Number is infinite');
    }
  }

  /**
   * Validate array value
   */
  private validateArray(
    value: any,
    rule: ValidationRule,
    errors: string[],
    _warnings: string[]
  ): void {
    if (!Array.isArray(value)) {
      return;
    }

    if (rule.min !== undefined && value.length < rule.min) {
      errors.push(`Array must have at least ${rule.min} items`);
    }

    if (rule.max !== undefined && value.length > rule.max) {
      errors.push(`Array must have no more than ${rule.max} items`);
    }
  }

  /**
   * Validate object value
   */
  private validateObject(
    value: any,
    rule: ValidationRule,
    errors: string[],
    _warnings: string[]
  ): void {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return;
    }

    const keys = Object.keys(value);

    if (rule.min !== undefined && keys.length < rule.min) {
      errors.push(`Object must have at least ${rule.min} properties`);
    }

    if (rule.max !== undefined && keys.length > rule.max) {
      errors.push(`Object must have no more than ${rule.max} properties`);
    }
  }

  /**
   * Validate multiple values against rules
   */
  validateObject(
    obj: Record<string, any>,
    rules: Record<string, ValidationRule>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [key, rule] of Object.entries(rules)) {
      const result = this.validate(obj[key], rule);

      if (!result.isValid) {
        errors.push(...result.errors.map((error) => `${key}: ${error}`));
      }

      warnings.push(...result.warnings.map((warning) => `${key}: ${warning}`));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Try to convert value to specified type
   */
  coerce(value: any, targetType: DataType): any {
    if (value === null || value === undefined) {
      return value;
    }

    const currentType = this.getType(value);

    if (currentType === targetType) {
      return value;
    }

    switch (targetType) {
      case 'string':
        return String(value);

      case 'number': {
        const num = Number(value);
        return Number.isNaN(num) ? value : num;
      }

      case 'boolean':
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (lower === 'true' || lower === '1' || lower === 'yes') {
            return true;
          }
          if (lower === 'false' || lower === '0' || lower === 'no') {
            return false;
          }
        }
        return Boolean(value);

      case 'array':
        return Array.isArray(value) ? value : [value];

      case 'date':
        return new Date(value);

      default:
        return value;
    }
  }

  /**
   * Check if value is of specified type
   */
  isType(value: any, type: DataType): boolean {
    return this.getType(value) === type;
  }
}

export const typeValidation = new TypeValidation();
export { TypeValidation };
