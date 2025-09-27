// Re-export validation extensions using existing types from main index.ts
export type { ValidationError } from '../index';

// Re-export validation middleware from the validation module
export * from '../validation';