export interface ValidationRule<T> {
  validate: (value: T) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class Validator {
  static required<T>(value: T): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  static email(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  static minLength(min: number) {
    return (value: string): boolean => value.length >= min;
  }

  static maxLength(max: number) {
    return (value: string): boolean => value.length <= max;
  }

  static range(min: number, max: number) {
    return (value: number): boolean => value >= min && value <= max;
  }

  static pattern(regex: RegExp) {
    return (value: string): boolean => regex.test(value);
  }

  static validate<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
    const errors: string[] = [];

    for (const rule of rules) {
      const result = rule.validate(value);
      if (typeof result === 'string') {
        errors.push(result);
      } else if (!result) {
        errors.push(rule.message || 'Validation failed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static createRule<T>(
    validate: (value: T) => boolean | string,
    message?: string
  ): ValidationRule<T> {
    return { validate, message };
  }
}
