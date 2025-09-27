/**
 * Log decorator for automatic method logging
 */
export function Log(level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const logger = (this as any).logger;
      if (logger) {
        logger[level](`Calling method: ${target.constructor.name}.${propertyKey}`, {
          args: args.length > 0 ? args : undefined,
        });
      }

      try {
        const result = originalMethod.apply(this, args);

        if (result instanceof Promise) {
          return result
            .then((value: any) => {
              if (logger) {
                logger[level](`Method completed: ${target.constructor.name}.${propertyKey}`);
              }
              return value;
            })
            .catch((error: any) => {
              if (logger) {
                logger.error(`Method failed: ${target.constructor.name}.${propertyKey}`, { error });
              }
              throw error;
            });
        } else {
          if (logger) {
            logger[level](`Method completed: ${target.constructor.name}.${propertyKey}`);
          }
          return result;
        }
      } catch (error) {
        if (logger) {
          logger.error(`Method failed: ${target.constructor.name}.${propertyKey}`, { error });
        }
        throw error;
      }
    };

    return descriptor;
  };
}
