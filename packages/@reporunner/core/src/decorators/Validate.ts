/**
 * Validate decorator for input validation
 */
export function Validate(validator: (args: any[]) => boolean | string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const result = validator(args);
      
      if (typeof result === 'string') {
        throw new Error(`Validation failed in ${target.constructor.name}.${propertyKey}: ${result}`);
      }
      
      if (!result) {
        throw new Error(`Validation failed in ${target.constructor.name}.${propertyKey}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Validate parameter decorator
 */
export function ValidateParam(paramIndex: number, validator: (value: any) => boolean | string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      if (args.length > paramIndex) {
        const result = validator(args[paramIndex]);
        
        if (typeof result === 'string') {
          throw new Error(`Parameter validation failed in ${target.constructor.name}.${propertyKey}: ${result}`);
        }
        
        if (!result) {
          throw new Error(`Parameter validation failed in ${target.constructor.name}.${propertyKey}`);
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
