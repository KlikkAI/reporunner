import { UploadedFile } from '../types/UploadedFile';
import { ValidationRule } from './ValidationRule';

/**
 * Interface for file validators
 */
export interface FileValidator {
  /**
   * Validate a file
   */
  validate(file: UploadedFile): Promise<void>;

  /**
   * Add validation rule
   */
  addRule(rule: ValidationRule): this;

  /**
   * Remove validation rule
   */
  removeRule(rule: ValidationRule): this;
}

/**
 * File validation rule
 */
export interface ValidationRule {
  /**
   * Rule name
   */
  name: string;

  /**
   * Rule description
   */
  description?: string;

  /**
   * Validate file
   */
  validate(file: UploadedFile): Promise<ValidationResult>;

  /**
   * Check if rule applies
   */
  applies?(file: UploadedFile): Promise<boolean>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /**
   * Whether validation passed
   */
  valid: boolean;

  /**
   * Validation errors
   */
  errors: ValidationError[];

  /**
   * Validation metadata
   */
  meta?: Record<string, unknown>;
}

/**
 * Validation error
 */
export interface ValidationError {
  /**
   * Error code
   */
  code: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Field that caused the error
   */
  field?: string;

  /**
   * Error details
   */
  details?: Record<string, unknown>;

  /**
   * Validation rule that failed
   */
  rule?: string;

  /**
   * Expected value
   */
  expected?: any;

  /**
   * Actual value
   */
  actual?: any;
}

/**
 * Common validation rules
 */
export class CommonValidationRules {
  /**
   * Maximum file size
   */
  public static maxSize(maxBytes: number): ValidationRule {
    return {
      name: 'maxSize',
      description: `Maximum file size: ${maxBytes} bytes`,
      validate: async (file) => {
        const valid = file.size <= maxBytes;
        return {
          valid,
          errors: valid ? [] : [{
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds maximum of ${maxBytes} bytes`,
            field: 'size',
            rule: 'maxSize',
            expected: maxBytes,
            actual: file.size
          }]
        };
      }
    };
  }

  /**
   * Allowed MIME types
   */
  public static allowedTypes(types: string[]): ValidationRule {
    return {
      name: 'allowedTypes',
      description: `Allowed types: ${types.join(', ')}`,
      validate: async (file) => {
        const valid = types.some(type => {
          if (type.endsWith('/*')) {
            const prefix = type.slice(0, -2);
            return file.mimetype.startsWith(prefix);
          }
          return file.mimetype === type;
        });

        return {
          valid,
          errors: valid ? [] : [{
            code: 'INVALID_FILE_TYPE',
            message: `File type ${file.mimetype} not allowed`,
            field: 'mimetype',
            rule: 'allowedTypes',
            expected: types,
            actual: file.mimetype
          }]
        };
      }
    };
  }

  /**
   * Image dimensions
   */
  public static imageDimensions(options: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  }): ValidationRule {
    return {
      name: 'imageDimensions',
      description: 'Image dimensions validation',
      applies: async (file) => file.mimetype.startsWith('image/'),
      validate: async (file) => {
        const { width, height } = file.mediaMetadata?.image || {};
        if (!width || !height) {
          return {
            valid: false,
            errors: [{
              code: 'INVALID_IMAGE',
              message: 'Could not get image dimensions',
              field: 'mediaMetadata'
            }]
          };
        }

        const errors: ValidationError[] = [];

        if (options.minWidth && width < options.minWidth) {
          errors.push({
            code: 'IMAGE_TOO_SMALL',
            message: `Image width must be at least ${options.minWidth}px`,
            field: 'width',
            expected: options.minWidth,
            actual: width
          });
        }

        if (options.maxWidth && width > options.maxWidth) {
          errors.push({
            code: 'IMAGE_TOO_LARGE',
            message: `Image width must be at most ${options.maxWidth}px`,
            field: 'width',
            expected: options.maxWidth,
            actual: width
          });
        }

        if (options.minHeight && height < options.minHeight) {
          errors.push({
            code: 'IMAGE_TOO_SMALL',
            message: `Image height must be at least ${options.minHeight}px`,
            field: 'height',
            expected: options.minHeight,
            actual: height
          });
        }

        if (options.maxHeight && height > options.maxHeight) {
          errors.push({
            code: 'IMAGE_TOO_LARGE',
            message: `Image height must be at most ${options.maxHeight}px`,
            field: 'height',
            expected: options.maxHeight,
            actual: height
          });
        }

        return {
          valid: errors.length === 0,
          errors
        };
      }
    };
  }

  /**
   * Video duration
   */
  public static videoDuration(options: {
    minDuration?: number;
    maxDuration?: number;
  }): ValidationRule {
    return {
      name: 'videoDuration',
      description: 'Video duration validation',
      applies: async (file) => file.mimetype.startsWith('video/'),
      validate: async (file) => {
        const { duration } = file.mediaMetadata?.video || {};
        if (!duration) {
          return {
            valid: false,
            errors: [{
              code: 'INVALID_VIDEO',
              message: 'Could not get video duration',
              field: 'mediaMetadata'
            }]
          };
        }

        const errors: ValidationError[] = [];

        if (options.minDuration && duration < options.minDuration) {
          errors.push({
            code: 'VIDEO_TOO_SHORT',
            message: `Video must be at least ${options.minDuration}s`,
            field: 'duration',
            expected: options.minDuration,
            actual: duration
          });
        }

        if (options.maxDuration && duration > options.maxDuration) {
          errors.push({
            code: 'VIDEO_TOO_LONG',
            message: `Video must be at most ${options.maxDuration}s`,
            field: 'duration',
            expected: options.maxDuration,
            actual: duration
          });
        }

        return {
          valid: errors.length === 0,
          errors
        };
      }
    };
  }
}