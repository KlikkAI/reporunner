import { Logger } from '../utils/logger';

// Method logging decorator
export function log(logger?: Logger) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      const methodLogger = logger || new Logger(`${className}:${propertyKey}`);
      
      try {
        methodLogger.debug('Method call', { args });
        const result = await originalMethod.apply(this, args);
        methodLogger.debug('Method complete', { result });
        return result;
      } catch (error) {
        methodLogger.error('Method error', error);
        throw error;
      }
    };

    return descriptor;
  };
}

// Method timing decorator
export function timer(logger?: Logger) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      const methodLogger = logger || new Logger(`${className}:${propertyKey}`);
      const start = process.hrtime();
      
      try {
        const result = await originalMethod.apply(this, args);
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        
        methodLogger.debug('Method timing', { duration: `${duration.toFixed(3)}ms` });
        return result;
      } catch (error) {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        
        methodLogger.error('Method error timing', {
          duration: `${duration.toFixed(3)}ms`,
          error
        });
        throw error;
      }
    };

    return descriptor;
  };
}

// Retry decorator with exponential backoff
export function retry(maxAttempts = 3, baseDelay = 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const logger = new Logger(`${className}:${propertyKey}`);

    descriptor.value = async function (...args: any[]) {
      let lastError: Error;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < maxAttempts) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
              error: lastError,
              attempt,
              nextDelay: delay
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      logger.error(`All ${maxAttempts} attempts failed`, lastError);
      throw lastError;
    };

    return descriptor;
  };
}

// Cache decorator
export function cache(ttlMs = 60000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cacheKey = `${target.constructor.name}:${propertyKey}`;
    const cacheMap = new Map<string, { value: any; timestamp: number }>();

    descriptor.value = async function (...args: any[]) {
      const argKey = JSON.stringify(args);
      const key = `${cacheKey}:${argKey}`;
      const now = Date.now();

      const cached = cacheMap.get(key);
      if (cached && (now - cached.timestamp) < ttlMs) {
        return cached.value;
      }

      const result = await originalMethod.apply(this, args);
      cacheMap.set(key, { value: result, timestamp: now });
      return result;
    };

    return descriptor;
  };
}