/**
 * Transactional decorator for database transactions
 */
export function Transactional(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const transactionManager = (this as any).transactionManager;
    
    if (transactionManager && typeof transactionManager.runInTransaction === 'function') {
      return transactionManager.runInTransaction(async () => {
        return originalMethod.apply(this, args);
      });
    } else {
      // Fallback to original method if no transaction manager available
      return originalMethod.apply(this, args);
    }
  };

  return descriptor;
}
