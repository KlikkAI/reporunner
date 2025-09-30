/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  /**
   * Error path
   */
  path: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Error code
   */
  code: string;

  /**
   * Error context
   */
  context?: Record<string, any>;

  /**
   * Field type
   */
  type?: string;

  /**
   * Validation rule that failed
   */
  rule?: string;

  /**
   * Expected value
   */
  expected?: any;

  /**
   * Actual value
   */
  actual?: any;

  /**
   * Suggestion for fixing the error
   */
  suggestion?: string;

  /**
   * Link to documentation
   */
  docs?: string;
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
  public readonly details: ValidationErrorDetail[];
  public readonly status: number;

  constructor(details: ValidationErrorDetail[]) {
    const message = ValidationError.formatMessage(details);
    super(message);

    this.name = 'ValidationError';
    this.details = details;
    this.status = 400;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Format error message
   */
  private static formatMessage(details: ValidationErrorDetail[]): string {
    if (details.length === 0) {
      return 'Validation failed';
    }

    if (details.length === 1) {
      return details[0].message;
    }

    return `Validation failed with ${details.length} errors`;
  }

  /**
   * Convert to JSON for response
   */
  public toJSON(): Record<string, any> {
    return {
      error: {
        name: this.name,
        message: this.message,
        status: this.status,
        details: this.details,
      },
    };
  }

  /**
   * Factory methods for common validation errors
   */

  public static required(path: string): ValidationError {
    return new ValidationError([
      {
        path,
        message: `${path} is required`,
        code: 'REQUIRED',
      },
    ]);
  }

  public static type(path: string, expected: string, actual: string): ValidationError {
    return new ValidationError([
      {
        path,
        message: `${path} must be of type ${expected}`,
        code: 'TYPE_ERROR',
        type: actual,
        expected,
        actual,
      },
    ]);
  }

  public static format(path: string, format: string): ValidationError {
    return new ValidationError([
      {
        path,
        message: `${path} must be a valid ${format}`,
        code: 'FORMAT_ERROR',
        rule: format,
      },
    ]);
  }

  public static min(path: string, min: number, actual: number): ValidationError {
    return new ValidationError([
      {
        path,
        message: `${path} must be greater than or equal to ${min}`,
        code: 'MIN_ERROR',
        rule: 'min',
        expected: min,
        actual,
      },
    ]);
  }

  public static max(path: string, max: number, actual: number): ValidationError {
    return new ValidationError([
      {
        path,
        message: `${path} must be less than or equal to ${max}`,
        code: 'MAX_ERROR',
        rule: 'max',
        expected: max,
        actual,
      },
    ]);
  }

  public static minLength(path: string, min: number, actual: number): ValidationError {
    return new ValidationError([
      {
        path,
        message: `${path} must be at least ${min} characters long`,
        code: 'MIN_LENGTH_ERROR',
        rule: 'minLength',
        expected: min,
        actual,
      },
    ]);
  }

  public static maxLength(path: string, max: number, actual: number): ValidationError {
    return new ValidationError([
      {
        path,
        message: `${path} must be at most ${max} characters long`,
        code: 'MAX_LENGTH_ERROR',
        rule: 'maxLength',
        expected: max,
        actual,
      },
    ]);
  }

  public static pattern(path: string, pattern: RegExp): ValidationError {
    return new ValidationError([
      {
        path,
        message: `${path} must match pattern ${pattern}`,
        code: 'PATTERN_ERROR',
        rule: 'pattern',
        expected: pattern.toString(),
      },
    ]);
  }

  public static enum(path: string, allowed: any[]): ValidationError {
    return new ValidationError([
      {
        path,
        message: `${path} must be one of: ${allowed.join(', ')}`,
        code: 'ENUM_ERROR',
        rule: 'enum',
        expected: allowed,
      },
    ]);
  }

  public static custom(path: string, message: string, code = 'CUSTOM_ERROR'): ValidationError {
    return new ValidationError([
      {
        path,
        message,
        code,
      },
    ]);
  }

  public static multiple(errors: ValidationError[]): ValidationError {
    const details: ValidationErrorDetail[] = [];
    for (const error of errors) {
      details.push(...error.details);
    }
    return new ValidationError(details);
  }

  public static fromObject(obj: Record<string, string[]>): ValidationError {
    const details: ValidationErrorDetail[] = [];
    for (const [path, messages] of Object.entries(obj)) {
      for (const message of messages) {
        details.push({
          path,
          message,
          code: 'VALIDATION_ERROR',
        });
      }
    }
    return new ValidationError(details);
  }

  /**
   * Helper methods
   */

  public hasPath(path: string): boolean {
    return this.details.some((detail) => detail.path === path);
  }

  public getErrorsForPath(path: string): ValidationErrorDetail[] {
    return this.details.filter((detail) => detail.path === path);
  }

  public toObject(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const detail of this.details) {
      if (!result[detail.path]) {
        result[detail.path] = [];
      }
      result[detail.path].push(detail.message);
    }
    return result;
  }

  public toString(): string {
    return this.details.map((detail) => `${detail.path}: ${detail.message}`).join('\n');
  }
}
