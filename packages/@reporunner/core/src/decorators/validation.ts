import { ValidationError } from '../utils/errors';
import { type SchemaDefinition, SchemaValidator, type Validator } from '../utils/validation';

// Validate individual parameter
export function validate(validator: Validator) {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    const originalMethod = target[propertyKey];
    const methodName = propertyKey;

    target[propertyKey] = async function (...args: any[]) {
      try {
        await validator.validate(args[parameterIndex], `${methodName} param ${parameterIndex}`);
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError(`Parameter validation failed`, {
          method: methodName,
          parameter: parameterIndex,
          error: (error as Error).message,
        });
      }
    };
  };
}

// Validate method input schema
export function validateInput(schema: SchemaDefinition) {
  return (_target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const methodName = propertyKey;
    const validator = new SchemaValidator(schema);

    descriptor.value = async function (...args: any[]) {
      try {
        await validator.validate(args[0]);
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError(`Input validation failed`, {
          method: methodName,
          error: (error as Error).message,
        });
      }
    };

    return descriptor;
  };
}

// Validate method output schema
export function validateOutput(schema: SchemaDefinition) {
  return (_target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const methodName = propertyKey;
    const validator = new SchemaValidator(schema);

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      try {
        await validator.validate(result);
        return result;
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError(`Output validation failed`, {
          method: methodName,
          error: (error as Error).message,
        });
      }
    };

    return descriptor;
  };
}

// Register class-level validation rules
export function validatable(constructor: Function) {
  constructor.prototype.validators = new Map<string, Validator>();

  constructor.prototype.addValidator = function (field: string, validator: Validator) {
    this.validators.set(field, validator);
  };

  constructor.prototype.validate = async function () {
    const errors: Record<string, string[]> = {};

    for (const [field, validator] of this.validators) {
      try {
        await validator.validate(this[field], field);
      } catch (error) {
        if (error instanceof ValidationError) {
          errors[field] = error.details.errors;
        } else {
          errors[field] = [(error as Error).message];
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  };
}

// Validate property with rules
export function validateProperty(validator: Validator) {
  return (target: any, propertyKey: string) => {
    const constructor = target.constructor;

    // Ensure the validatable decorator is applied
    if (!constructor.prototype.validators) {
      validatable(constructor);
    }

    // Add validator for this property
    const originalInit = constructor.prototype.init || (() => {});
    constructor.prototype.init = function () {
      this.addValidator(propertyKey, validator);
      originalInit.call(this);
    };
  };
}
