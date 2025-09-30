import type { UploadedFile } from '../types/UploadedFile';

/**
 * Interface for file validators
 */
export interface FileValidator {
  /**
   * Validate a file
   * @throws {UploadError} if validation fails
   */
  validate(file: UploadedFile): Promise<void>;

  /**
   * Add a validation rule
   * @param rule Validation rule function
   */
  addRule(rule: ValidationRule): this;

  /**
   * Remove a validation rule
   * @param rule Validation rule function
   */
  removeRule(rule: ValidationRule): this;
}

/**
 * Validation rule function
 * @throws {UploadError} if validation fails
 */
export type ValidationRule = (file: UploadedFile) => Promise<void>;
