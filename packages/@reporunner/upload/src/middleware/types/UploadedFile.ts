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
   * Full path to the uploaded file
   */
  path: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * File MIME type
   */
  mimetype: string;

  /**
   * File encoding
   */
  encoding?: string;

  /**
   * Hash of file contents (if enabled)
   */
  hash?: string;

  /**
   * Hash algorithm used
   */
  hashAlgorithm?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;

  /**
   * Timestamp when file was uploaded
   */
  uploadedAt: Date;

  /**
   * Field name specified in the form
   */
  fieldname?: string;

  /**
   * Whether file was modified during processing
   */
  modified: boolean;

  /**
   * Original file path (if transformed)
   */
  originalPath?: string;

  /**
   * Destination storage identifier (for multi-storage support)
   */
  destination?: string;

  /**
   * Whether file passed virus scan (if enabled)
   */
  virusScanned?: boolean;

  /**
   * Virus scan results (if enabled)
   */
  virusScanResult?: {
    clean: boolean;
    timestamp: Date;
    signature?: string;
    engine?: string;
  };

  /**
   * File type specific metadata
   */
  fileTypeMetadata?: {
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
    pdf?: {
      pages: number;
      encrypted: boolean;
      version: string;
    };
  };

  /**
   * Custom validation results
   */
  validationResults?: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };

  /**
   * Processing history
   */
  processingHistory?: {
    timestamp: Date;
    operation: string;
    details: Record<string, unknown>;
  }[];

  /**
   * Whether file is temporary
   */
  temporary?: boolean;

  /**
   * Expiration date for temporary files
   */
  expiresAt?: Date;

  /**
   * Access control information
   */
  access?: {
    public: boolean;
    permissions: string[];
    ownerId?: string;
    groupId?: string;
  };

  /**
   * Storage-specific metadata
   */
  storageMetadata?: {
    etag?: string;
    versionId?: string;
    storageClass?: string;
    replicationStatus?: string;
  };

  /**
   * Original file stats
   */
  stats?: {
    birthtime: Date;
    mtime: Date;
    atime: Date;
    ctime: Date;
    mode: number;
    uid: number;
    gid: number;
  };
}
