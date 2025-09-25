/**
 * Comprehensive Type Validation and Conversion Pipeline
 * Based on n8n's sophisticated type handling system
 */

// import type { NodeParameterValue } from '../nodes/types'
import { ExpressionEvaluator, type IExpressionContext } from './expressionEvaluator';

// Use the existing IExpressionContext from ExpressionEvaluator

// Define IAssignmentValue locally to avoid circular imports
interface IAssignmentValue {
  id: string;
  name: string;
  value: any;
  type?: string;
  removeIfEmpty?: boolean;
}

// Type Validation Result Interface
export interface ITypeValidationResult {
  valid: boolean;
  value: any;
  originalValue: any;
  type: string;
  error?: string;
  warnings?: string[];
}

// Type Conversion Options
export interface ITypeConversionOptions {
  ignoreConversionErrors: boolean;
  strictMode: boolean;
  timezone?: string;
  dateFormat?: string;
  numberFormat?: {
    decimal?: string;
    thousands?: string;
  };
}

// Field Type Definitions
enum FieldType {
  STRING = 'stringValue',
  NUMBER = 'numberValue',
  BOOLEAN = 'booleanValue',
  ARRAY = 'arrayValue',
  OBJECT = 'objectValue',
  DATE = 'dateValue',
  NULL = 'nullValue',
  UNDEFINED = 'undefinedValue',
  BINARY = 'binaryValue',
  FUNCTION = 'functionValue',
}

// Type Inference Engine
class TypeInferenceEngine {
  static inferType(value: any): FieldType {
    if (value === null) return FieldType.NULL;
    if (value === undefined) return FieldType.UNDEFINED;

    const type = typeof value;

    switch (type) {
      case 'string':
        // Check for date strings
        if (TypeInferenceEngine.isDateString(value)) {
          return FieldType.DATE;
        }
        return FieldType.STRING;

      case 'number':
        return FieldType.NUMBER;

      case 'boolean':
        return FieldType.BOOLEAN;

      case 'function':
        return FieldType.FUNCTION;

      case 'object':
        if (Array.isArray(value)) {
          return FieldType.ARRAY;
        }
        if (value instanceof Date) {
          return FieldType.DATE;
        }
        if (value instanceof Buffer || value?.constructor?.name === 'Buffer') {
          return FieldType.BINARY;
        }
        return FieldType.OBJECT;

      default:
        return FieldType.STRING;
    }
  }

  static isDateString(value: string): boolean {
    if (typeof value !== 'string') return false;
