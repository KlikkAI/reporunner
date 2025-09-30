import type { UploadedFile } from '../types/UploadedFile';

/**
 * Interface for storage engines
 */
export interface StorageEngine {
  /**
   * Store a file
   */
  store(file: UploadedFile): Promise<UploadedFile>;

  /**
   * Remove a file
   */
  remove(path: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file information
   */
  stat(path: string): Promise<UploadedFile>;

  /**
   * Get a read stream for a file
   */
  createReadStream(path: string): NodeJS.ReadableStream;

  /**
   * Get a write stream for a file
   */
  createWriteStream(path: string): NodeJS.WritableStream;

  /**
   * Move a file
   */
  move(source: string, destination: string): Promise<void>;

  /**
   * Copy a file
   */
  copy(source: string, destination: string): Promise<void>;

  /**
   * Initialize storage
   */
  initialize?(): Promise<void>;

  /**
   * Cleanup storage
   */
  cleanup?(): Promise<void>;

  /**
   * List files in a directory
   */
  list?(directory: string): Promise<UploadedFile[]>;

  /**
   * Generate a unique filename
   */
  generateFilename?(originalname: string): Promise<string>;

  /**
   * Get public URL for a file
   */
  getPublicUrl?(path: string): Promise<string>;

  /**
   * Get signed URL for a file
   */
  getSignedUrl?(path: string, expiresIn: number): Promise<string>;

  /**
   * Set file metadata
   */
  setMetadata?(path: string, metadata: Record<string, unknown>): Promise<void>;

  /**
   * Get file metadata
   */
  getMetadata?(path: string): Promise<Record<string, unknown>>;

  /**
   * Check storage health
   */
  healthCheck?(): Promise<boolean>;
}
