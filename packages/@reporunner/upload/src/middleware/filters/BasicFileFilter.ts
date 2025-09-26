import { FileFilter } from './FileFilter';
import { UploadedFile } from '../types/UploadedFile';
import { UploadOptions } from '../types/UploadOptions';
import { UploadError } from '../errors/UploadError';

export class BasicFileFilter implements FileFilter {
  private options: Required<UploadOptions>;

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
      ...options
    };
  }

  /**
   * Check if a file should be accepted
   */
  public async shouldAccept(file: UploadedFile): Promise<boolean> {
    // Check file size
    if (file.size > this.options.maxFileSize) {
      throw UploadError.fileTooLarge(
        file.originalname,
        file.size,
        this.options.maxFileSize
      );
    }

    // Check file type
    if (this.options.validateMimeType) {
      await this.validateMimeType(file);
    }

    // Check type-specific size limits
    if (this.options.limits) {
      await this.validateSizeLimit(file);
    }

    return true;
  }

  /**
   * Validate MIME type
   */
  private async validateMimeType(file: UploadedFile): Promise<void> {
    const allowed = this.options.allowedTypes;
    const matches = allowed.some(type => this.matchMimeType(file.mimetype, type));

    if (!matches) {
      throw UploadError.invalidFileType(file.originalname, file.mimetype);
    }
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
   * Validate type-specific size limits
   */
  private async validateSizeLimit(file: UploadedFile): Promise<void> {
    const limits = this.options.limits || {};
    let maxSize = this.options.maxFileSize;

    // Check for exact match
    if (limits[file.mimetype]) {
      maxSize = limits[file.mimetype];
    } else {
      // Check for wildcard match
      const [type] = file.mimetype.split('/');
      const wildcardPattern = `${type}/*`;
      if (limits[wildcardPattern]) {
        maxSize = limits[wildcardPattern];
      }
    }

    if (file.size > maxSize) {
      throw UploadError.fileTooLarge(file.originalname, file.size, maxSize);
    }
  }
}