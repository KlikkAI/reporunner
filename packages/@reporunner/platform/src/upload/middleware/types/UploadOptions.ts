import type { FileFilter } from '../filters/FileFilter';
import type { StorageEngine } from '../storage/StorageEngine';
import type { FileTransform } from '../transforms/FileTransform';
import type { FileValidator } from '../validators/FileValidator';

/**
 * Configuration options for file upload middleware
 */
export interface UploadOptions {
  /**
   * Maximum size of each file in bytes
   * @default 5242880 (5MB)
   */
  maxFileSize?: number;

  /**
   * Maximum number of files allowed per request
   * @default 1
   */
  maxFiles?: number;

  /**
   * List of allowed MIME types (e.g., ['image/*', 'application/pdf'])
   * @default ['image/*', 'application/pdf']
   */
  allowedTypes?: string[];

  /**
   * Whether to keep the original file after transformation
   * @default false
   */
  preserveOriginal?: boolean;

  /**
   * Whether to generate unique filenames
   * @default true
   */
  generateUniqueName?: boolean;

  /**
   * Whether to validate MIME type
   * @default true
   */
  validateMimeType?: boolean;

  /**
   * Whether to create directories if they don't exist
   * @default true
   */
  createDirectory?: boolean;

  /**
   * Whether to overwrite existing files
   * @default false
   */
  overwrite?: boolean;

  /**
   * Storage engine to use
   * @default LocalStorageEngine
   */
  storage?: StorageEngine;

  /**
   * File filter to use
   * @default BasicFileFilter
   */
  filter?: FileFilter;

  /**
   * File transformer to use
   * @default NoopTransform
   */
  transform?: FileTransform;

  /**
   * File validator to use
   * @default BasicFileValidator
   */
  validator?: FileValidator;

  /**
   * Custom error handler
   */
  onError?: (error: Error) => void | Promise<void>;

  /**
   * Custom success handler
   */
  onSuccess?: (files: UploadedFile[]) => void | Promise<void>;

  /**
   * Directory to store uploaded files
   * Only applicable for LocalStorageEngine
   */
  uploadDir?: string;

  /**
   * Function to generate file path
   */
  filename?: (file: UploadedFile) => string | Promise<string>;

  /**
   * Additional metadata to attach to uploaded files
   */
  metadata?: Record<string, unknown>;

  /**
   * File size limits by type
   * e.g., { 'image/*': 10485760, 'application/pdf': 5242880 }
   */
  limits?: Record<string, number>;

  /**
   * Whether to process files in parallel
   * @default false
   */
  parallel?: boolean;

  /**
   * Maximum concurrent file processing
   * Only applicable if parallel is true
   * @default 3
   */
  concurrency?: number;

  /**
   * Whether to hash files for integrity checks
   * @default false
   */
  hashFiles?: boolean;

  /**
   * Hash algorithm to use
   * @default 'sha256'
   */
  hashAlgorithm?: 'md5' | 'sha1' | 'sha256' | 'sha512';

  /**
   * Whether to scan files for viruses
   * Requires ClamAV to be installed
   * @default false
   */
  virusScan?: boolean;

  /**
   * Temporary directory for processing files
   * @default os.tmpdir()
   */
  tempDir?: string;

  /**
   * Whether to cleanup temporary files
   * @default true
   */
  cleanupTemp?: boolean;

  /**
   * Custom file sanitization function
   */
  sanitizeFile?: (file: UploadedFile) => Promise<UploadedFile>;
}
