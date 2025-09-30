import { ValidationError, type ValidationErrorDetail } from '../errors/ValidationError';
import type { SchemaDefinition, SchemaType } from '../schema/ValidationSchema';
import type { ValidationResult } from '../types/ValidationResult';
import type { ValidationOptions } from '../ValidationMiddleware';

export class SchemaValidator {
  private options: Required<ValidationOptions>;

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
  }

  /**
   * Validate value against schema
   */
  public async validate(
    schema: Record<string, SchemaDefinition>,
    value: any
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      value: {},
    };

    const errors: ValidationErrorDetail[] = [];
    const validated: Record<string, any> = {};

    // Track metadata
    const meta = {
      rulesExecuted: 0,
      transformations: 0,
      sanitizations: 0,
      startTime: Date.now(),
    };

    try {
      // Validate each field
      for (const [key, definition] of Object.entries(schema)) {
        try {
          const fieldValue = value?.[key];
          const validatedValue = await this.validateField(key, fieldValue, definition, meta);

          if (validatedValue !== undefined) {
            validated[key] = validatedValue;
          }
        } catch (error) {
          if (error instanceof ValidationError) {
            errors.push(...error.details);
            if (this.options.abortEarly) {
              break;
            }
          } else {
            throw error;
          }
        }
      }

      // Check for unknown fields
      if (!this.options.allowUnknown) {
        const unknownFields = Object.keys(value || {}).filter((key) => !schema[key]);

        if (unknownFields.length > 0) {
          if (this.options.stripUnknown) {
            // Remove unknown fields
            unknownFields.forEach((key) => delete validated[key]);
          } else {
            // Add errors for unknown fields
            unknownFields.forEach((key) => {
              errors.push({
                path: key,
                message: `Unknown field: ${key}`,
                code: 'UNKNOWN_FIELD',
              });
            });
          }
        }
      }

      // Set validation result
      result.valid = errors.length === 0;
      result.errors = errors;
      result.value = validated;
      result.meta = {
        duration: Date.now() - meta.startTime,
        rulesExecuted: meta.rulesExecuted,
        transformations: meta.transformations,
        sanitizations: meta.sanitizations,
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

  /**
   * Validate a single field
   */
  private async validateField(
    path: string,
    value: any,
    schema: SchemaDefinition,
    meta: Record<string, number>
  ): Promise<any> {
    // Check if required
    if (schema.required && (value === undefined || value === null)) {
      throw ValidationError.required(path);
    }

    // If value is undefined and not required, return
    if (value === undefined) {
      // Use default value if provided
      return schema.default;
    }

    // Handle null values
    if (value === null) {
      if (!schema.nullable) {
        throw ValidationError.type(path, schema.type.toString(), 'null');
      }
      return null;
    }

    // Validate type
    await this.validateType(path, value, schema);
    meta.rulesExecuted++;

    // Apply sanitization
    let sanitized = value;
    if (schema.sanitize) {
      sanitized = await this.sanitizeValue(value, schema.sanitize);
      meta.sanitizations++;
    }

    // Apply transformation
    let transformed = sanitized;
    if (schema.transform) {
      transformed = await schema.transform(sanitized);
      meta.transformations++;
    }

    // Validate constraints
    await this.validateConstraints(path, transformed, schema);
    meta.rulesExecuted++;

    // Validate with custom function
    if (schema.validate) {
      const isValid = await schema.validate(transformed);
      meta.rulesExecuted++;

      if (!isValid) {
        throw ValidationError.custom(path, schema.message || 'Invalid value', 'CUSTOM_VALIDATION');
      }
    }

    return transformed;
  }

  /**
   * Validate value type
   */
  private async validateType(path: string, value: any, schema: SchemaDefinition): Promise<void> {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];

    const validType = types.some((type) => this.checkType(value, type));

    if (!validType) {
      throw ValidationError.type(path, types.join(' | '), typeof value);
    }
  }

  /**
   * Check value type
   */
  private checkType(value: any, type: SchemaType): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !Number.isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'null':
        return value === null;
      case 'any':
        return true;
      case 'integer':
        return Number.isInteger(value);
      case 'float':
        return typeof value === 'number' && !Number.isNaN(value);
      case 'date':
        return value instanceof Date && !Number.isNaN(value.getTime());
      case 'file':
        return value && typeof value === 'object' && 'size' in value && 'mimetype' in value;
      default:
        return false;
    }
  }

  /**
   * Validate field constraints
   */
  private async validateConstraints(
    path: string,
    value: any,
    schema: SchemaDefinition
  ): Promise<void> {
    // Skip constraint validation for null values
    if (value === null) {
      return;
    }

    // Number constraints
    if (typeof value === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        throw ValidationError.min(path, schema.min, value);
      }
      if (schema.max !== undefined && value > schema.max) {
        throw ValidationError.max(path, schema.max, value);
      }
    }

    // String and array length constraints
    if (typeof value === 'string' || Array.isArray(value)) {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        throw ValidationError.minLength(path, schema.minLength, value.length);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        throw ValidationError.maxLength(path, schema.maxLength, value.length);
      }
    }

    // Pattern constraint (strings only)
    if (typeof value === 'string' && schema.pattern) {
      if (!schema.pattern.test(value)) {
        throw ValidationError.pattern(path, schema.pattern);
      }
    }

    // Enum constraint
    if (schema.enum) {
      if (!schema.enum.includes(value)) {
        throw ValidationError.enum(path, schema.enum);
      }
    }

    // Format constraint
    if (schema.format) {
      if (!this.validateFormat(value, schema.format)) {
        throw ValidationError.format(path, schema.format);
      }
    }

    // Array items
    if (Array.isArray(value) && schema.items) {
      await Promise.all(
        value.map((item, index) => this.validateField(`${path}[${index}]`, item, schema.items!))
      );
    }

    // Object properties
    if (typeof value === 'object' && schema.properties) {
      await Promise.all(
        Object.entries(schema.properties).map(([key, propSchema]) =>
          this.validateField(`${path}.${key}`, value[key], propSchema)
        )
      );
    }
  }

  /**
   * Validate format
   */
  private validateFormat(value: any, format: string): boolean {
    switch (format) {
      case 'email':
        return /^[^@]+@[^@]+\.[^@]+$/.test(value);
      case 'uuid':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value
        );
      case 'date':
        return !Number.isNaN(Date.parse(value));
      case 'time':
        return /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(value);
      case 'date-time':
        return !Number.isNaN(Date.parse(value));
      case 'ipv4':
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
      case 'ipv6':
        return /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i.test(value);
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      default:
        return true;
    }
  }

  /**
   * Sanitize value
   */
  private async sanitizeValue(value: any, options: SchemaDefinition['sanitize']): Promise<any> {
    if (!options || typeof value !== 'string') {
      return value;
    }

    let sanitized = value;

    if (options.trim) {
      sanitized = sanitized.trim();
    }

    if (options.lowercase) {
      sanitized = sanitized.toLowerCase();
    }

    if (options.uppercase) {
      sanitized = sanitized.toUpperCase();
    }

    if (options.escape) {
      sanitized = this.escapeHtml(sanitized);
    }

    if (options.stripInvalid) {
      sanitized = sanitized.replace(/[^\x20-\x7E]/g, '');
    }

    if (options.custom) {
      sanitized = await options.custom(sanitized);
    }

    return sanitized;
  }

  /**
   * Escape HTML
   */
  private escapeHtml(value: string): string {
    const entityMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;',
    };

    return value.replace(/[&<>"'`=/]/g, (s) => entityMap[s]);
  }
}
