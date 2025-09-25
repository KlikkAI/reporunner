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
          if (Number.isNaN(num) && !options.ignoreConversionErrors) {
            throw new Error(`Cannot convert "${value}" to number`);
          }
          return Number.isNaN(num) ? 0 : num;
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
