import { Request, Response, NextFunction } from 'express';
import { StorageEngine } from './storage/StorageEngine';
import { FileFilter } from './filters/FileFilter';
import { FileTransform } from './transforms/FileTransform';
import { FileValidator } from './validators/FileValidator';
import { LocalStorageEngine } from './storage/LocalStorageEngine';
import { BasicFileFilter } from './filters/BasicFileFilter';
import { NoopTransform } from './transforms/NoopTransform';
import { BasicFileValidator } from './validators/BasicFileValidator';
import { UploadError } from './errors/UploadError';
import { UploadedFile } from './types/UploadedFile';
import { UploadOptions } from './types/UploadOptions';

export class FileUploadMiddleware {
  private storage: StorageEngine;
  private filter: FileFilter;
  private transform: FileTransform;
  private validator: FileValidator;
  private options: Required<UploadOptions>;

  constructor(options: UploadOptions = {}) {
    this.options = {
      maxFileSize: 5 * 1024 * 1024, // 5MB default
      maxFiles: 1,
      allowedTypes: ['image/*', 'application/pdf'],
      preserveOriginal: false,
      generateUniqueName: true,
      validateMimeType: true,
      createDirectory: true,
      overwrite: false,
      ...options
    };

    // Initialize components
    this.storage = options.storage || new LocalStorageEngine(this.options);
    this.filter = options.filter || new BasicFileFilter(this.options);
    this.transform = options.transform || new NoopTransform();
    this.validator = options.validator || new BasicFileValidator(this.options);
  }

  /**
   * Handle file upload request
   */
  public handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get files from request
      const files = await this.getFilesFromRequest(req);

      // Validate number of files
      if (files.length > this.options.maxFiles) {
        throw new UploadError('TOO_MANY_FILES', `Maximum ${this.options.maxFiles} files allowed`);
      }

      const processedFiles: UploadedFile[] = [];

      for (const file of files) {
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

          processedFiles.push(storedFile);

          // Cleanup original if not preserving
          if (!this.options.preserveOriginal && file.path !== storedFile.path) {
            await this.storage.remove(file.path);
          }
        } catch (error) {
          // Cleanup on error
          await this.cleanup(file, processedFiles);
          throw error;
        }
      }

      // Attach processed files to request
      req.files = processedFiles;
      next();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get files from request based on content type
   */
  private async getFilesFromRequest(req: Request): Promise<UploadedFile[]> {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      throw new UploadError('INVALID_CONTENT_TYPE', 'Content-Type header missing');
    }

    if (contentType.startsWith('multipart/form-data')) {
      return this.handleMultipartFormData(req);
    }

    if (contentType === 'application/octet-stream') {
      return this.handleBinaryUpload(req);
    }

    throw new UploadError('UNSUPPORTED_CONTENT_TYPE', `Unsupported content type: ${contentType}`);
  }

  /**
   * Handle multipart form data upload
   */
  private async handleMultipartFormData(req: Request): Promise<UploadedFile[]> {
    // Implementation will use multer or similar library
    throw new Error('Not implemented');
  }

  /**
   * Handle binary file upload
   */
  private async handleBinaryUpload(req: Request): Promise<UploadedFile[]> {
    // Implementation will handle raw file uploads
    throw new Error('Not implemented');
  }

  /**
   * Cleanup files on error
   */
  private async cleanup(currentFile: UploadedFile, processedFiles: UploadedFile[]): Promise<void> {
    try {
      // Remove current file if it exists
      if (currentFile.path) {
        await this.storage.remove(currentFile.path);
      }

      // Remove any processed files
      for (const file of processedFiles) {
        await this.storage.remove(file.path);
      }
    } catch (error) {
      // Log cleanup errors but don't throw
      console.error('Error during file cleanup:', error);
    }
  }

  /**
   * Set storage engine
   */
  public setStorage(storage: StorageEngine): this {
    this.storage = storage;
    return this;
  }

  /**
   * Set file filter
   */
  public setFilter(filter: FileFilter): this {
    this.filter = filter;
    return this;
  }

  /**
   * Set file transform
   */
  public setTransform(transform: FileTransform): this {
    this.transform = transform;
    return this;
  }

  /**
   * Set file validator
   */
  public setValidator(validator: FileValidator): this {
    this.validator = validator;
    return this;
  }

  /**
   * Update options
   */
  public updateOptions(options: Partial<UploadOptions>): this {
    this.options = {
      ...this.options,
      ...options
    };
    return this;
  }
}