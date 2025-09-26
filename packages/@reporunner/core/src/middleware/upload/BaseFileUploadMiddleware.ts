import { BaseMiddleware, MiddlewareContext, BaseMiddlewareOptions } from '../BaseMiddleware';
import { StorageEngine } from './storage/StorageEngine';
import { FileValidator } from './validation/FileValidator';
import { FileTransform } from './transform/FileTransform';
import { FileFilter } from './filter/FileFilter';
import { UploadedFile } from './types/UploadedFile';
import { UploadError } from './errors/UploadError';

/**
 * Extended context for file uploads
 */
export interface FileUploadContext extends MiddlewareContext {
  files?: UploadedFile[];
  uploadResult?: FileUploadResult;
}

/**
 * Result of file upload operations
 */
export interface FileUploadResult {
  success: boolean;
  files: UploadedFile[];
  errors: UploadError[];
  metadata?: Record<string, unknown>;
}

/**
 * Extended options for file upload middleware
 */
export interface FileUploadOptions extends BaseMiddlewareOptions {
  /**
   * Maximum file size in bytes
   */
  maxFileSize?: number;

  /**
   * Maximum number of files
   */
  maxFiles?: number;

  /**
   * Allowed file types
   */
  allowedTypes?: string[];

  /**
   * Whether to keep original files after transformation
   */
  preserveOriginal?: boolean;

  /**
   * Whether to generate unique filenames
   */
  generateUniqueName?: boolean;

  /**
   * Whether to validate MIME types
   */
  validateMimeType?: boolean;

  /**
   * Whether to create directories if they don't exist
   */
  createDirectory?: boolean;

  /**
   * Whether to overwrite existing files
   */
  overwrite?: boolean;

  /**
   * Storage engine to use
   */
  storage?: StorageEngine;

  /**
   * File validator to use
   */
  validator?: FileValidator;

  /**
   * File transformer to use
   */
  transform?: FileTransform;

  /**
   * File filter to use
   */
  filter?: FileFilter;

  /**
   * Upload directory (for local storage)
   */
  uploadDir?: string;

  /**
   * Whether to hash files
   */
  hashFiles?: boolean;

  /**
   * Hash algorithm to use
   */
  hashAlgorithm?: 'md5' | 'sha1' | 'sha256' | 'sha512';

  /**
   * Whether to scan for viruses
   */
  virusScan?: boolean;

  /**
   * Custom filename generator
   */
  filename?: (file: UploadedFile) => Promise<string>;
}

/**
 * Base class for file upload middleware implementations
 */
export abstract class BaseFileUploadMiddleware extends BaseMiddleware {
  protected uploadOptions: Required<FileUploadOptions>;
  protected storage: StorageEngine;
  protected validator: FileValidator;
  protected transform: FileTransform;
  protected filter: FileFilter;

  constructor(options: FileUploadOptions = {}) {
    super(options);

    this.uploadOptions = {
      ...this.options,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 1,
      allowedTypes: ['image/*', 'application/pdf'],
      preserveOriginal: false,
      generateUniqueName: true,
      validateMimeType: true,
      createDirectory: true,
      overwrite: false,
      uploadDir: process.env.UPLOAD_DIR || './uploads',
      hashFiles: false,
      hashAlgorithm: 'sha256',
      virusScan: false,
      ...options
    };

    // Initialize components
    this.storage = options.storage || this.createDefaultStorage();
    this.validator = options.validator || this.createDefaultValidator();
    this.transform = options.transform || this.createDefaultTransform();
    this.filter = options.filter || this.createDefaultFilter();
  }

  /**
   * Main implementation
   */
  protected async implementation(context: MiddlewareContext): Promise<void> {
    const uploadContext = await this.createUploadContext(context);

    // Get files from request
    const files = await this.getFilesFromRequest(uploadContext);

    // Validate number of files
    if (files.length > this.uploadOptions.maxFiles) {
      throw new UploadError('TOO_MANY_FILES', `Maximum ${this.uploadOptions.maxFiles} files allowed`);
    }

    const result: FileUploadResult = {
      success: true,
      files: [],
      errors: []
    };

    // Process each file
    for (const file of files) {
      try {
        const processedFile = await this.processFile(file);
        result.files.push(processedFile);
      } catch (error) {
        if (error instanceof UploadError) {
          result.errors.push(error);
          if (this.options.abortEarly) {
            break;
          }
        } else {
          throw error;
        }
      }
    }

    // Update result
    result.success = result.errors.length === 0;
    uploadContext.uploadResult = result;

    // Update request
    uploadContext.files = result.files;

    // Handle errors if any
    if (!result.success && this.options.abortEarly) {
      throw result.errors[0];
    }
  }

  /**
   * Create upload context
   */
  protected async createUploadContext(context: MiddlewareContext): Promise<FileUploadContext> {
    return {
      ...context
    };
  }

  /**
   * Get files from request based on content type
   */
  protected abstract getFilesFromRequest(context: FileUploadContext): Promise<UploadedFile[]>;

  /**
   * Process a single file
   */
  protected async processFile(file: UploadedFile): Promise<UploadedFile> {
    try {
      // Apply file filter
      if (!await this.filter.shouldAccept(file)) {
        throw new UploadError('FILE_NOT_ALLOWED', `File type ${file.mimetype} not allowed`);
      }

      // Validate file
      await this.validator.validate(file);

      // Transform file if needed
      const transformedFile = await this.transform.transform(file);

      // Store file
      const storedFile = await this.storage.store(transformedFile);

      // Cleanup original if not preserving
      if (!this.uploadOptions.preserveOriginal && file.path !== storedFile.path) {
        await this.storage.remove(file.path);
      }

      return storedFile;
    } catch (error) {
      // Cleanup on error
      await this.cleanup(file);
      throw error;
    }
  }

  /**
   * Cleanup files on error
   */
  protected async cleanup(file: UploadedFile): Promise<void> {
    try {
      if (file.path) {
        await this.storage.remove(file.path);
      }
    } catch (error) {
      this.log('Error during cleanup', { error });
    }
  }

  /**
   * Create default storage engine
   */
  protected abstract createDefaultStorage(): StorageEngine;

  /**
   * Create default validator
   */
  protected abstract createDefaultValidator(): FileValidator;

  /**
   * Create default transform
   */
  protected abstract createDefaultTransform(): FileTransform;

  /**
   * Create default filter
   */
  protected abstract createDefaultFilter(): FileFilter;
}