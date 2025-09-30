import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { fileTypeFromFile } from 'file-type';
import { UploadError } from '../errors/UploadError';
import type { UploadedFile } from '../types/UploadedFile';
import type { UploadOptions } from '../types/UploadOptions';
import type { FileValidator, ValidationRule } from './FileValidator';

export class BasicFileValidator implements FileValidator {
  private options: Required<UploadOptions>;
  private rules: Set<ValidationRule>;

  constructor(options: UploadOptions) {
    this.options = {
      maxFileSize: 5 * 1024 * 1024,
      maxFiles: 1,
      allowedTypes: ['image/*', 'application/pdf'],
      preserveOriginal: false,
      generateUniqueName: true,
      validateMimeType: true,
      createDirectory: true,
      overwrite: false,
      hashFiles: false,
      hashAlgorithm: 'sha256',
      virusScan: false,
      ...options,
    };

    this.rules = new Set([this.validateSize.bind(this), this.validateType.bind(this)]);

    // Add optional validations
    if (this.options.hashFiles) {
      this.rules.add(this.validateHash.bind(this));
    }

    if (this.options.virusScan) {
      this.rules.add(this.scanVirus.bind(this));
    }
  }

  /**
   * Validate a file
   */
  public async validate(file: UploadedFile): Promise<void> {
    const errors: string[] = [];

    // Run all validation rules
    for (const rule of this.rules) {
      try {
        await rule(file);
      } catch (error) {
        if (error instanceof UploadError) {
          errors.push(error.message);
        } else {
          errors.push((error as Error).message);
        }
      }
    }

    // If any validations failed, throw error
    if (errors.length > 0) {
      throw UploadError.validationError(file.originalname, errors);
    }

    // Update validation results
    file.validationResults = {
      passed: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Add a validation rule
   */
  public addRule(rule: ValidationRule): this {
    this.rules.add(rule);
    return this;
  }

  /**
   * Remove a validation rule
   */
  public removeRule(rule: ValidationRule): this {
    this.rules.delete(rule);
    return this;
  }

  /**
   * Validate file size
   */
  private async validateSize(file: UploadedFile): Promise<void> {
    const stats = await fs.stat(file.path);

    if (stats.size !== file.size) {
      throw new UploadError(
        'VALIDATION_ERROR',
        `File size mismatch: reported ${file.size}, actual ${stats.size}`
      );
    }

    if (stats.size > this.options.maxFileSize) {
      throw UploadError.fileTooLarge(file.originalname, stats.size, this.options.maxFileSize);
    }
  }

  /**
   * Validate file type
   */
  private async validateType(file: UploadedFile): Promise<void> {
    if (!this.options.validateMimeType) {
      return;
    }

    // Get actual file type
    const fileType = await fileTypeFromFile(file.path);

    if (!fileType) {
      throw new UploadError(
        'VALIDATION_ERROR',
        `Could not determine file type for ${file.originalname}`
      );
    }

    if (fileType.mime !== file.mimetype) {
      throw new UploadError(
        'VALIDATION_ERROR',
        `File type mismatch: reported ${file.mimetype}, actual ${fileType.mime}`
      );
    }

    // Check if type is allowed
    const allowed = this.options.allowedTypes;
    const matches = allowed.some((type) => this.matchMimeType(fileType.mime, type));

    if (!matches) {
      throw UploadError.invalidFileType(file.originalname, fileType.mime);
    }
  }

  /**
   * Validate file hash
   */
  private async validateHash(file: UploadedFile): Promise<void> {
    if (!file.hash) {
      return; // Skip if no hash provided
    }

    const actualHash = await this.computeHash(file.path);

    if (actualHash !== file.hash) {
      throw new UploadError('VALIDATION_ERROR', `File hash mismatch for ${file.originalname}`);
    }
  }

  /**
   * Scan file for viruses
   */
  private async scanVirus(file: UploadedFile): Promise<void> {
    // This is a placeholder for actual virus scanning logic
    // You would typically integrate with ClamAV or another antivirus here
    file.virusScanned = true;
    file.virusScanResult = {
      clean: true,
      timestamp: new Date(),
    };
  }

  /**
   * Match MIME type against pattern
   */
  private matchMimeType(mime: string, pattern: string): boolean {
    if (pattern === '*/*' || pattern === mime) {
      return true;
    }

    if (pattern.endsWith('/*')) {
      const [typePattern] = pattern.split('/');
      const [type] = mime.split('/');
      return typePattern === type;
    }

    return false;
  }

  /**
   * Compute file hash
   */
  private async computeHash(path: string): Promise<string> {
    const content = await fs.readFile(path);
    return createHash(this.options.hashAlgorithm).update(content).digest('hex');
  }
}
