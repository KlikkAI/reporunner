import { ValidationError } from './errors';

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean | Promise<boolean>;
  message: string;
}

export class Validator<T = any> {
  private rules: Array<ValidationRule<T>> = [];

  /**
   * Add a validation rule
   */
  public addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Add a required field validation
   */
  public required(message = 'Field is required'): this {
    return this.addRule({
      validate: value => value !== undefined && value !== null && value !== '',
      message
    });
  }

  /**
   * Add a string type validation
   */
  public string(message = 'Must be a string'): this {
    return this.addRule({
      validate: value => typeof value === 'string',
      message
    });
  }

  /**
   * Add a number type validation
   */
  public number(message = 'Must be a number'): this {
    return this.addRule({
      validate: value => typeof value === 'number' && !isNaN(value),
      message
    });
  }

  /**
   * Add a boolean type validation
   */
  public boolean(message = 'Must be a boolean'): this {
    return this.addRule({
      validate: value => typeof value === 'boolean',
      message
    });
  }

  /**
   * Add a minimum value validation
   */
  public min(min: number, message = `Must be at least ${min}`): this {
    return this.addRule({
      validate: value => typeof value === 'number' && value >= min,
      message
    });
  }

  /**
   * Add a maximum value validation
   */
  public max(max: number, message = `Must be at most ${max}`): this {
    return this.addRule({
      validate: value => typeof value === 'number' && value <= max,
      message
    });
  }

  /**
   * Add a minimum length validation
   */
  public minLength(min: number, message = `Must be at least ${min} characters`): this {
    return this.addRule({
      validate: value => typeof value === 'string' && value.length >= min,
      message
    });
  }

  /**
   * Add a maximum length validation
   */
  public maxLength(max: number, message = `Must be at most ${max} characters`): this {
    return this.addRule({
      validate: value => typeof value === 'string' && value.length <= max,
      message
    });
  }

  /**
   * Add a pattern validation
   */
  public pattern(pattern: RegExp, message = 'Invalid format'): this {
    return this.addRule({
      validate: value => typeof value === 'string' && pattern.test(value),
      message
    });
  }

  /**
   * Add an email validation
   */
  public email(message = 'Invalid email address'): this {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return this.pattern(emailPattern, message);
  }

  /**
   * Add a URL validation
   */
  public url(message = 'Invalid URL'): this {
    const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
    return this.pattern(urlPattern, message);
  }

  /**
   * Add a custom validation function
   */
  public custom(fn: (value: T) => boolean | Promise<boolean>, message: string): this {
    return this.addRule({ validate: fn, message });
  }

  /**
   * Validate the value against all rules
   */
  public async validate(value: T, fieldName = 'value'): Promise<void> {
    const errors: string[] = [];

    for (const rule of this.rules) {
      try {
        const isValid = await rule.validate(value);
        if (!isValid) {
          errors.push(rule.message);
        }
      } catch (error) {
        errors.push(`Validation error: ${(error as Error).message}`);
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(`${fieldName} validation failed`, {
        field: fieldName,
        errors
      });
    }
  }
}

// Schema validation
export interface SchemaDefinition {
  [field: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    validator?: Validator;
  };
}

export class SchemaValidator {
  constructor(private schema: SchemaDefinition) {}

  /**
   * Validate an object against the schema
   */
  public async validate(data: Record<string, any>): Promise<void> {
    const errors: Record<string, string[]> = {};

    for (const [field, def] of Object.entries(this.schema)) {
      if (def.required && !(field in data)) {
        errors[field] = ['Field is required'];
        continue;
      }

      if (field in data) {
        const value = data[field];

        // Type validation
        if (def.type === 'array' && !Array.isArray(value)) {
          errors[field] = ['Must be an array'];
          continue;
        }

        if (def.type !== 'array' && typeof value !== def.type) {
          errors[field] = [`Must be a ${def.type}`];
          continue;
        }

        // Custom validation
        if (def.validator) {
          try {
            await def.validator.validate(value, field);
          } catch (error) {
            if (error instanceof ValidationError) {
              errors[field] = error.details.errors;
            } else {
              errors[field] = [(error as Error).message];
            }
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Schema validation failed', errors);
    }
  }
}