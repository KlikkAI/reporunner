import { UploadedFile } from '../types/UploadedFile';

/**
 * Interface for storage engine implementations
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
   * Check if file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file information
   */
  stat(path: string): Promise<UploadedFile>;

  /**
   * Create read stream
   */
  createReadStream(path: string): NodeJS.ReadableStream;

  /**
   * Create write stream
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
   * List files in directory
   */
  list?(directory: string): Promise<UploadedFile[]>;

  /**
   * Generate unique filename
   */
  generateFilename?(originalname: string): Promise<string>;

  /**
   * Get public URL
   */
  getPublicUrl?(path: string): Promise<string>;

  /**
   * Get signed URL
   */
  getSignedUrl?(path: string, expiresIn: number): Promise<string>;

  /**
   * Set metadata
   */
  setMetadata?(path: string, metadata: Record<string, unknown>): Promise<void>;

  /**
   * Get metadata
   */
  getMetadata?(path: string): Promise<Record<string, unknown>>;

  /**
   * Check health
   */
  healthCheck?(): Promise<{
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
  }>;
}