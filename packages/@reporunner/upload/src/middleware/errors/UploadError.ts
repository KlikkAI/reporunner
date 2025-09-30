export type UploadErrorCode =
  | 'INVALID_CONTENT_TYPE'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'TOO_MANY_FILES'
  | 'FILE_NOT_ALLOWED'
  | 'FILE_EXISTS'
  | 'STORAGE_ERROR'
  | 'VALIDATION_ERROR'
  | 'VIRUS_DETECTED'
  | 'TRANSFORM_ERROR'
  | 'UNKNOWN_ERROR';

export class UploadError extends Error {
  public readonly code: UploadErrorCode;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(code: UploadErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'UploadError';
    this.code = code;
    this.details = details;
    this.status = this.getStatusCode(code);

    // Ensure proper prototype chain for ES5
    Object.setPrototypeOf(this, new.target.prototype);
  }

  private getStatusCode(code: UploadErrorCode): number {
    switch (code) {
      case 'INVALID_CONTENT_TYPE':
      case 'INVALID_FILE_TYPE':
      case 'FILE_TOO_LARGE':
      case 'TOO_MANY_FILES':
      case 'FILE_NOT_ALLOWED':
      case 'VALIDATION_ERROR':
        return 400;
      case 'FILE_EXISTS':
        return 409;
      case 'VIRUS_DETECTED':
        return 406;
      case 'STORAGE_ERROR':
      case 'TRANSFORM_ERROR':
        return 500;
      default:
        return 500;
    }
  }

  /**
   * Convert error to JSON for response
   */
  public toJSON(): Record<string, unknown> {
    return {
      error: {
        name: this.name,
        code: this.code,
        message: this.message,
        status: this.status,
        ...(this.details && { details: this.details }),
      },
    };
  }

  /**
   * Create an invalid content type error
   */
  public static invalidContentType(contentType: string): UploadError {
    return new UploadError('INVALID_CONTENT_TYPE', `Invalid content type: ${contentType}`);
  }

  /**
   * Create an invalid file type error
   */
  public static invalidFileType(filename: string, type: string): UploadError {
    return new UploadError('INVALID_FILE_TYPE', `Invalid file type for ${filename}: ${type}`, {
      filename,
      type,
    });
  }

  /**
   * Create a file too large error
   */
  public static fileTooLarge(filename: string, size: number, maxSize: number): UploadError {
    return new UploadError(
      'FILE_TOO_LARGE',
      `File ${filename} is too large (${size} bytes). Maximum size is ${maxSize} bytes`,
      { filename, size, maxSize }
    );
  }

  /**
   * Create a too many files error
   */
  public static tooManyFiles(count: number, maxFiles: number): UploadError {
    return new UploadError('TOO_MANY_FILES', `Too many files. Maximum ${maxFiles} files allowed`, {
      count,
      maxFiles,
    });
  }

  /**
   * Create a file not allowed error
   */
  public static fileNotAllowed(filename: string, reason: string): UploadError {
    return new UploadError('FILE_NOT_ALLOWED', `File ${filename} not allowed: ${reason}`, {
      filename,
      reason,
    });
  }

  /**
   * Create a file exists error
   */
  public static fileExists(filename: string): UploadError {
    return new UploadError('FILE_EXISTS', `File ${filename} already exists`, { filename });
  }

  /**
   * Create a storage error
   */
  public static storageError(operation: string, details: Record<string, unknown>): UploadError {
    return new UploadError('STORAGE_ERROR', `Storage error during ${operation}`, details);
  }

  /**
   * Create a validation error
   */
  public static validationError(filename: string, errors: string[]): UploadError {
    return new UploadError('VALIDATION_ERROR', `Validation failed for ${filename}`, {
      filename,
      errors,
    });
  }

  /**
   * Create a virus detected error
   */
  public static virusDetected(filename: string, details: Record<string, unknown>): UploadError {
    return new UploadError('VIRUS_DETECTED', `Virus detected in file ${filename}`, details);
  }

  /**
   * Create a transform error
   */
  public static transformError(filename: string, error: Error): UploadError {
    return new UploadError(
      'TRANSFORM_ERROR',
      `Error transforming file ${filename}: ${error.message}`,
      { filename, originalError: error }
    );
  }
}
