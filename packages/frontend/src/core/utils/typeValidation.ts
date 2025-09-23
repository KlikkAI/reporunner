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

    // Common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, // ISO datetime
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, // ISO with Z
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    ];

    return datePatterns.some((pattern) => pattern.test(value)) && !Number.isNaN(Date.parse(value));
  }

  static inferFromContext(value: any, context?: IExpressionContext): FieldType {
    const basicType = TypeInferenceEngine.inferType(value);

    // If we have context, we can make smarter inferences
    if (context) {
      // Check if value looks like an expression
      if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
        // Try to evaluate and infer from result
        try {
          const evaluator = new ExpressionEvaluator(context);
          const evaluated = evaluator.evaluate(value);
          return TypeInferenceEngine.inferType(evaluated);
        } catch {
          return basicType;
        }
      }
    }

    return basicType;
  }

  static getCompatibleTypes(primaryType: FieldType): FieldType[] {
    const compatibilityMap: Record<FieldType, FieldType[]> = {
      [FieldType.STRING]: [FieldType.STRING, FieldType.NUMBER, FieldType.BOOLEAN, FieldType.DATE],
      [FieldType.NUMBER]: [FieldType.NUMBER, FieldType.STRING, FieldType.BOOLEAN],
      [FieldType.BOOLEAN]: [FieldType.BOOLEAN, FieldType.STRING, FieldType.NUMBER],
      [FieldType.ARRAY]: [FieldType.ARRAY, FieldType.STRING],
      [FieldType.OBJECT]: [FieldType.OBJECT, FieldType.STRING],
      [FieldType.DATE]: [FieldType.DATE, FieldType.STRING, FieldType.NUMBER],
      [FieldType.NULL]: [FieldType.NULL, FieldType.STRING],
      [FieldType.UNDEFINED]: [FieldType.UNDEFINED, FieldType.STRING],
      [FieldType.BINARY]: [FieldType.BINARY, FieldType.STRING],
      [FieldType.FUNCTION]: [FieldType.FUNCTION, FieldType.STRING],
    };

    return compatibilityMap[primaryType] || [primaryType];
  }
}

// Advanced Type Validator
class AdvancedTypeValidator {
  private options: ITypeConversionOptions;

  constructor(
    options: ITypeConversionOptions = {
      ignoreConversionErrors: false,
      strictMode: false,
    }
  ) {
    this.options = options;
  }

  validate(value: any, targetType: string, context?: IExpressionContext): ITypeValidationResult {
    const originalValue = value;
    let processedValue = value;

    // Handle expressions first
    if (context && typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
      try {
        const evaluator = new ExpressionEvaluator(context);
        processedValue = evaluator.evaluate(value);
      } catch (error) {
        if (!this.options.ignoreConversionErrors) {
          return {
            valid: false,
            value: originalValue,
            originalValue,
            type: targetType,
            error: `Expression evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      }
    }

    try {
      const convertedValue = this.convertToType(processedValue, targetType);
      const validationResult = this.validateConvertedValue(convertedValue, targetType);

      return {
        valid: validationResult.valid,
        value: convertedValue,
        originalValue,
        type: targetType,
        error: validationResult.error,
        warnings: validationResult.warnings,
      };
    } catch (error) {
      if (this.options.ignoreConversionErrors) {
        return {
          valid: true,
          value: this.getDefaultValue(targetType),
          originalValue,
          type: targetType,
          warnings: [
            `Conversion failed, using default value: ${error instanceof Error ? error.message : String(error)}`,
          ],
        };
      }

      return {
        valid: false,
        value: originalValue,
        originalValue,
        type: targetType,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  convertToType(value: any, targetType: string): any {
    switch (targetType) {
      case FieldType.STRING:
        return this.convertToString(value);

      case FieldType.NUMBER:
        return this.convertToNumber(value);

      case FieldType.BOOLEAN:
        return this.convertToBoolean(value);

      case FieldType.ARRAY:
        return this.convertToArray(value);

      case FieldType.OBJECT:
        return this.convertToObject(value);

      case FieldType.DATE:
        return this.convertToDate(value);

      case FieldType.NULL:
        return null;

      case FieldType.UNDEFINED:
        return undefined;

      default:
        return value;
    }
  }

  private convertToString(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private convertToNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'string') {
      // Handle different number formats
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);

      if (Number.isNaN(parsed)) {
        throw new Error(`Cannot convert "${value}" to number`);
      }

      return parsed;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Cannot convert "${value}" to number`);
    }

    return parsed;
  }

  private convertToBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      const truthyStrings = ['true', '1', 'yes', 'on', 'enabled'];
      const falsyStrings = ['false', '0', 'no', 'off', 'disabled', ''];

      if (truthyStrings.includes(lower)) return true;
      if (falsyStrings.includes(lower)) return false;

      // For other strings, check if empty
      return lower !== '';
    }

    return Boolean(value);
  }

  private convertToArray(value: any): any[] {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // If JSON parsing fails, split by comma
        return value.split(',').map((item) => item.trim());
      }
    }

    if (value === null || value === undefined) {
      return [];
    }

    // Wrap single values in array
    return [value];
  }

  private convertToObject(value: any): object {
    if (value === null || value === undefined) {
      return {};
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // If parsing fails, create object with value property
        return { value };
      }
    }

    // For other types, wrap in object
    return { value };
  }

  private convertToDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      return new Date(value);
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Cannot convert "${value}" to date`);
      }
      return parsed;
    }

    throw new Error(`Cannot convert ${typeof value} to date`);
  }

  private validateConvertedValue(
    value: any,
    targetType: string
  ): { valid: boolean; error?: string; warnings?: string[] } {
    const warnings: string[] = [];

    switch (targetType) {
      case FieldType.NUMBER:
        if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
          return { valid: false, error: 'Invalid number value' };
        }
        break;

      case FieldType.DATE:
        if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
          return { valid: false, error: 'Invalid date value' };
        }
        break;

      case FieldType.ARRAY:
        if (!Array.isArray(value)) {
          return { valid: false, error: 'Value is not an array' };
        }
        break;

      case FieldType.OBJECT:
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return { valid: false, error: 'Value is not an object' };
        }
        break;
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  getDefaultValue(targetType: string): any {
    const defaults: Record<string, any> = {
      [FieldType.STRING]: '',
      [FieldType.NUMBER]: 0,
      [FieldType.BOOLEAN]: false,
      [FieldType.ARRAY]: [],
      [FieldType.OBJECT]: {},
      [FieldType.DATE]: new Date(),
      [FieldType.NULL]: null,
      [FieldType.UNDEFINED]: undefined,
      [FieldType.BINARY]: Buffer.alloc(0),
      [FieldType.FUNCTION]: () => {},
    };

    return defaults[targetType] ?? null;
  }
}

// Assignment Value Validator
class AssignmentValidator {
  private typeValidator: AdvancedTypeValidator;

  constructor(options?: ITypeConversionOptions) {
    this.typeValidator = new AdvancedTypeValidator(options);
  }

  validateAssignment(
    assignment: IAssignmentValue,
    context?: IExpressionContext
  ): ITypeValidationResult {
    // Extract the appropriate value based on type
    const value = this.extractAssignmentValue(assignment);

    // Validate and convert
    return this.typeValidator.validate(value, assignment.type || 'auto', context);
  }

  validateAssignments(
    assignments: IAssignmentValue[],
    context?: IExpressionContext
  ): {
    valid: boolean;
    results: Array<ITypeValidationResult & { fieldName: string }>;
    errors: string[];
  } {
    const results: Array<ITypeValidationResult & { fieldName: string }> = [];
    const errors: string[] = [];
    let allValid = true;

    for (const assignment of assignments) {
      const result = this.validateAssignment(assignment, context);

      results.push({
        ...result,
        fieldName: assignment.name,
      });

      if (!result.valid) {
        allValid = false;
        errors.push(`Field "${assignment.name}": ${result.error}`);
      }
    }

    return {
      valid: allValid,
      results,
      errors,
    };
  }

  private extractAssignmentValue(assignment: IAssignmentValue): any {
    // For backward compatibility with the enhanced assignment structure
    switch (assignment.type) {
      case 'stringValue':
        return assignment.value;
      case 'numberValue':
        return assignment.value;
      case 'booleanValue':
        return assignment.value;
      case 'arrayValue':
        return assignment.value;
      case 'objectValue':
        return assignment.value;
      default:
        return assignment.value;
    }
  }
}

// Batch Validation for Performance
class BatchTypeValidator {
  private typeValidator: AdvancedTypeValidator;

  constructor(options?: ITypeConversionOptions) {
    this.typeValidator = new AdvancedTypeValidator(options);
  }

  async validateBatch(
    items: Array<{ value: any; type: string; id: string }>,
    context?: IExpressionContext,
    batchSize: number = 100
  ): Promise<Map<string, ITypeValidationResult>> {
    const results = new Map<string, ITypeValidationResult>();

    // Process in batches to avoid blocking UI
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const batchResults = batch.map((item) => ({
        id: item.id,
        result: this.typeValidator.validate(item.value, item.type, context),
      }));

      batchResults.forEach(({ id, result }) => {
        results.set(id, result);
      });

      // Yield control to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return results;
  }
}

// Type Compatibility Checker
class TypeCompatibilityChecker {
  static isCompatible(sourceType: string, targetType: string): boolean {
    if (sourceType === targetType) return true;

    const compatibilityMatrix: Record<string, string[]> = {
      [FieldType.STRING]: [FieldType.NUMBER, FieldType.BOOLEAN, FieldType.DATE],
      [FieldType.NUMBER]: [FieldType.STRING, FieldType.BOOLEAN],
      [FieldType.BOOLEAN]: [FieldType.STRING, FieldType.NUMBER],
      [FieldType.DATE]: [FieldType.STRING, FieldType.NUMBER],
      [FieldType.ARRAY]: [FieldType.STRING],
      [FieldType.OBJECT]: [FieldType.STRING],
      [FieldType.NULL]: [FieldType.STRING],
      [FieldType.UNDEFINED]: [FieldType.STRING],
    };

    return compatibilityMatrix[sourceType]?.includes(targetType) ?? false;
  }

  static getConversionRisk(sourceType: string, targetType: string): 'low' | 'medium' | 'high' {
    if (sourceType === targetType) return 'low';

    const lowRiskConversions = [
      [FieldType.STRING, FieldType.NUMBER],
      [FieldType.NUMBER, FieldType.STRING],
      [FieldType.BOOLEAN, FieldType.STRING],
    ];

    const mediumRiskConversions = [
      [FieldType.STRING, FieldType.BOOLEAN],
      [FieldType.STRING, FieldType.DATE],
      [FieldType.ARRAY, FieldType.STRING],
      [FieldType.OBJECT, FieldType.STRING],
    ];

    // Conversion key for future extensibility
    // const _conversionKey = [sourceType, targetType];

    if (lowRiskConversions.some(([s, t]) => s === sourceType && t === targetType)) {
      return 'low';
    }

    if (mediumRiskConversions.some(([s, t]) => s === sourceType && t === targetType)) {
      return 'medium';
    }

    return 'high';
  }
}

// Export all classes and interfaces
export {
  TypeInferenceEngine,
  AdvancedTypeValidator,
  AssignmentValidator,
  BatchTypeValidator,
  TypeCompatibilityChecker,
  FieldType,
};
