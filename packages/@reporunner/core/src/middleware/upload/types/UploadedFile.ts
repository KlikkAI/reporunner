/**
 * Represents an uploaded file
 */
export interface UploadedFile {
  /**
   * Original file name
   */
  originalname: string;

  /**
   * File name on disk
   */
  filename: string;

  /**
   * Full path to file
   */
  path: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * MIME type
   */
  mimetype: string;

  /**
   * File encoding
   */
  encoding?: string;

  /**
   * Whether file was modified
   */
  modified: boolean;

  /**
   * Upload timestamp
   */
  uploadedAt: Date;

  /**
   * Hash of file contents
   */
  hash?: string;

  /**
   * Hash algorithm used
   */
  hashAlgorithm?: string;

  /**
   * File metadata
   */
  metadata?: Record<string, unknown>;

  /**
   * Form field name
   */
  fieldname?: string;

  /**
   * Virus scan result
   */
  virusScanResult?: {
    clean: boolean;
    timestamp: Date;
    signature?: string;
    engine?: string;
  };

  /**
   * Media file metadata
   */
  mediaMetadata?: {
    image?: {
      width: number;
      height: number;
      format: string;
      colorSpace: string;
      hasAlpha: boolean;
      orientation?: number;
    };
    video?: {
      width: number;
      height: number;
      duration: number;
      codec: string;
      bitrate: number;
      fps: number;
    };
    audio?: {
      duration: number;
      codec: string;
      bitrate: number;
      sampleRate: number;
      channels: number;
    };
  };
}