import type { Request, Response, NextFunction } from 'express';

export interface ValidationRule {
  field: string;
  location: 'body' | 'query' | 'params' | 'headers';
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  pattern?: RegExp;
  min?: number;
  max?: number;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export function validate(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = (req as any)[rule.location][rule.field];

      // Check required
      if (rule.required && value === undefined) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip if not required and not present
      if (!rule.required && value === undefined) {
        continue;
      }

      // Type validation
      if (rule.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rule.type) {
          errors.push(`${rule.field} must be of type ${rule.type}`);
          continue;
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`${rule.field} has invalid format`);
      }

      // Min/Max validation
      if (rule.min !== undefined) {
        if (typeof value === 'string' && value.length < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min} characters`);
        } else if (typeof value === 'number' && value < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min}`);
        }
      }

      if (rule.max !== undefined) {
        if (typeof value === 'string' && value.length > rule.max) {
          errors.push(`${rule.field} must be at most ${rule.max} characters`);
        } else if (typeof value === 'number' && value > rule.max) {
          errors.push(`${rule.field} must be at most ${rule.max}`);
        }
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${rule.field} must be one of: ${rule.enum.join(', ')}`);
      }

      // Custom validation
      if (rule.custom) {
        const result = rule.custom(value);
        if (typeof result === 'string') {
          errors.push(result);
        } else if (!result) {
          errors.push(`${rule.field} failed custom validation`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors }) as any;
    }

    next();
  };
}

// Default validation middleware that does nothing
export function validationMiddleware(req: Request, res: Response, next: NextFunction): void {
  next();
}