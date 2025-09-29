/**
 * Property Evaluator
 * 
 * Reuses the enhanced property evaluator for backward compatibility
 */

export * from './enhancedPropertyEvaluator';

// Re-export the main evaluator with the old name for compatibility
import { enhancedPropertyEvaluator } from './enhancedPropertyEvaluator';
export const propertyEvaluator = enhancedPropertyEvaluator;