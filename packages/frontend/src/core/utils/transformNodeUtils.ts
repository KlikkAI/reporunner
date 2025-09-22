/**
 * Transform Node Utilities
 * Helper functions for enhanced Transform node functionality
 */

// Define interfaces locally to avoid circular imports
// interface IFieldAssignment {
//   name: string
//   value: any
//   type?: string
//   removeIfEmpty?: boolean
// }

interface ITransformOptions {
  keepOriginalData?: boolean;
  convertTypes?: boolean;
  ignoreConversionErrors?: boolean;
  removeEmptyFields?: boolean;
  strictMode?: boolean;
}

// Type validation and conversion utilities
class TransformTypeValidator {
  static validateAndConvertType(value: any, type: string, options: ITransformOptions): any {
    try {
      switch (type) {
        case 'stringValue':
          return String(value);

        case 'numberValue': {
          const num = Number(value);
          if (isNaN(num) && !options.ignoreConversionErrors) {
            throw new Error(`Cannot convert "${value}" to number`);
          }
          return isNaN(num) ? 0 : num;
        }

        case 'booleanValue':
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            const lower = value.toLowerCase();
            return lower === 'true' || lower === '1' || lower === 'yes';
          }
          return Boolean(value);

        case 'arrayValue':
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              return Array.isArray(parsed) ? parsed : [value];
            } catch {
              return [value];
            }
          }
          return [value];

        case 'objectValue':
          if (typeof value === 'object' && value !== null) return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return { value };
            }
          }
          return { value };

        default:
          return value;
      }
    } catch (error) {
      if (options.ignoreConversionErrors) {
        return TransformTypeValidator.getDefaultValueForType(type);
      }
      throw error;
    }
  }

  static getDefaultValueForType(type: string): any {
    switch (type) {
      case 'stringValue':
        return '';
      case 'numberValue':
        return 0;
      case 'booleanValue':
        return false;
      case 'arrayValue':
        return [];
      case 'objectValue':
        return {};
      default:
        return null;
    }
  }

  static detectTypeFromValue(value: any): string {
    if (typeof value === 'number') return 'numberValue';
    if (typeof value === 'boolean') return 'booleanValue';
    if (Array.isArray(value)) return 'arrayValue';
    if (typeof value === 'object' && value !== null) return 'objectValue';
    return 'stringValue';
  }
}

// Nested object manipulation utilities
class NestedObjectUtils {
  static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  static getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      current = current[key];
    }

    return current;
  }

  static hasNestedPath(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  static deleteNestedValue(obj: any, path: string): boolean {
    const keys = path.split('.');
    if (keys.length === 1) {
      if (path in obj) {
        delete obj[path];
        return true;
      }
      return false;
    }

    const parentPath = keys.slice(0, -1).join('.');
    const lastKey = keys[keys.length - 1];
    const parent = NestedObjectUtils.getNestedValue(obj, parentPath);

    if (parent && typeof parent === 'object' && lastKey in parent) {
      delete parent[lastKey];
      return true;
    }

    return false;
  }
}

// Input field management utilities
class InputFieldManager {
  static getFieldsFromInputData(inputData: any[]): string[] {
    const fieldNames = new Set<string>();

    inputData.forEach((item) => {
      if (item.json && typeof item.json === 'object') {
        InputFieldManager.extractFieldNames(item.json, '', fieldNames);
      }
    });

    return Array.from(fieldNames).sort();
  }

  private static extractFieldNames(obj: any, prefix: string, fieldNames: Set<string>): void {
    Object.keys(obj).forEach((key) => {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      fieldNames.add(fullPath);

      // Recursively extract nested field names (limited depth to avoid performance issues)
      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key]) &&
        prefix.split('.').length < 3
      ) {
        InputFieldManager.extractFieldNames(obj[key], fullPath, fieldNames);
      }
    });
  }

  static applyInputFieldInclusion(
    inputData: any,
    includeMode: 'all' | 'none' | 'selected' | 'except',
    selectedFields: string[] = []
  ): any {
    switch (includeMode) {
      case 'all':
        return { ...inputData };

      case 'none':
        return {};

      case 'selected': {
        const selectedData: any = {};
        selectedFields.forEach((fieldPath) => {
          if (NestedObjectUtils.hasNestedPath(inputData, fieldPath)) {
            NestedObjectUtils.setNestedValue(
              selectedData,
              fieldPath,
              NestedObjectUtils.getNestedValue(inputData, fieldPath)
            );
          }
        });
        return selectedData;
      }

      case 'except': {
        const exceptData = { ...inputData };
        selectedFields.forEach((fieldPath) => {
          NestedObjectUtils.deleteNestedValue(exceptData, fieldPath);
        });
        return exceptData;
      }

      default:
        return { ...inputData };
    }
  }
}

// Expression evaluation utilities (placeholder for future implementation)
class TransformExpressionEvaluator {
  static evaluateExpression(expression: string, _context: any): any {
    // Placeholder for expression evaluation
    // In a full implementation, this would parse and evaluate expressions like:
    // "{{ $json.field1 + $json.field2 }}"
    // "{{ $json.name.toUpperCase() }}"

    // For now, return the expression as-is
    // TODO: Implement proper expression evaluation
    return expression;
  }

  static isExpression(value: string): boolean {
    return typeof value === 'string' && value.includes('{{') && value.includes('}}');
  }

  static extractExpressionVariables(expression: string): string[] {
    // Extract variable references from expressions
    const matches = expression.match(/\{\{\s*\$json\.([a-zA-Z0-9_.]+)\s*\}\}/g);
    if (!matches) return [];

    return matches.map((match) => {
      const variable = match.replace(/\{\{\s*\$json\./, '').replace(/\s*\}\}/, '');
      return variable;
    });
  }
}

// Configuration validation utilities
class ConfigurationValidator {
  static validateTransformConfiguration(parameters: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const mode = parameters.mode || 'manual';

    if (mode === 'manual') {
      // Validate assignments
      const assignments = parameters.assignments?.values || [];
      assignments.forEach((assignment: any, index: number) => {
        if (!assignment.name?.trim()) {
          errors.push(`Assignment ${index + 1}: Field name is required`);
        }

        if (assignment.name?.includes('..')) {
          errors.push(`Assignment ${index + 1}: Invalid dot notation syntax`);
        }

        if (!assignment.type) {
          errors.push(`Assignment ${index + 1}: Field type is required`);
        }
      });

      // Check for duplicate field names
      const fieldNames = assignments.map((a: any) => a.name).filter((name: string) => name?.trim());
      const uniqueNames = new Set(fieldNames);
      if (fieldNames.length !== uniqueNames.size) {
        errors.push('Duplicate field names are not allowed');
      }

      // Validate selected fields if needed
      const includeInputFields = parameters.includeInputFields;
      const selectedInputFields = parameters.selectedInputFields;
      if (
        (includeInputFields === 'selected' || includeInputFields === 'except') &&
        !selectedInputFields?.trim()
      ) {
        errors.push('Selected input fields list is required for this inclusion mode');
      }
    } else if (mode === 'json') {
      // Validate JSON syntax
      const jsonObject = parameters.jsonObject;
      if (jsonObject) {
        try {
          JSON.parse(jsonObject);
        } catch (e) {
          errors.push('Invalid JSON syntax in JSON Object');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Performance optimization utilities
class TransformPerformanceUtils {
  static shouldUseBulkProcessing(itemCount: number): boolean {
    return itemCount > 1000;
  }

  static chunkArray<T>(array: T[], chunkSize: number = 100): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  static async processInChunks<T, R>(
    items: T[],
    processor: (item: T, index: number) => R,
    chunkSize: number = 100
  ): Promise<R[]> {
    const chunks = TransformPerformanceUtils.chunkArray(items, chunkSize);
    const results: R[] = [];

    for (const chunk of chunks) {
      const chunkResults = chunk.map(processor);
      results.push(...chunkResults);

      // Allow other tasks to run between chunks
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return results;
  }
}

// Export all utilities
export {
  TransformTypeValidator,
  NestedObjectUtils,
  InputFieldManager,
  TransformExpressionEvaluator,
  ConfigurationValidator,
  TransformPerformanceUtils,
};
