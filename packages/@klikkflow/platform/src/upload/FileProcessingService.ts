import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:pses';
import { Logger } from '@klikkflow/core';
import { z } from 'zod';

export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  generateThumbnails?: boolean;
  scanForViruses?: boolean;
  extractMetadata?: boolean;
}

export interface ProcessedFile {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  extension: string;
  hash: string;
  metadata?: Record<string, unknown>;
  thumbnails?: {
    small: string;
    medium: string;
    large: string;
  };
  uploadedAt: Date;
  processedAt: Date;
  status: 'processing' | 'completed' | 'error';
  error?: string;
}

export interface FileProcessingProgress {
  fileId: string;
  stage: 'upload' | 'validation' | 'processing' | 'thumbnail' | 'metadata' | 'completed';
  progress: number;
  message?: string;
}

const FileUploadSchema = z.object({
  maxSize: z
    .number()
    .optional()
    .default(10 * 1024 * 1024), // 10MB
  allowedTypes: z
    .array(z.string())
    .optional()
    .default([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
      'application/xml',
    ]),
  allowedExtensions: z
    .array(z.string())
    .optional()
    .default(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.csv', '.json', '.xml']),
  generateThumbnails: z.boolean().optional().default(true),
  scanForViruses: z.boolean().optional().default(false),
  extractMetadata: z.boolean().optional().default(true),
});

export class FileProcessingService extends EventEmitter {
  private logger: Logger;
  private uploadDir: string;
  private processingQueue = new Map<string, ProcessedFile>();

  constructor(uploadDir: string = './uploads') {
    super();
    this.logger = new Logger('FileProcessingService');
    this.uploadDir = uploadDir;
    this.ensureUploadDirectory();
  }

  /**
   * Process uploaded file with comprehensive validation and processing
   */
  async processFile(
    file: Express.Multer.File,
    options: FileUploadOptions = {}
  ): Promise<ProcessedFile> {
    const validatedOptions = FileUploadSchema.parse(options);
    const fileId = this.generateFileId();

    try {
      this.emitProgress(fileId, 'upload', 0, 'Starting file processing');

      // Create processed file record
      const processedFile: ProcessedFile = {
        id: fileId,
        originalName: file.originalname,
        filename: this.generateSafeFilename(file.originalname),
        path: '',
        size: file.size,
        mimeType: file.mimetype,
        extension: path.extname(file.originalname).toLowerCase(),
        hash: '',
        uploadedAt: new Date(),
        processedAt: new Date(),
        status: 'processing',
      };

      this.processingQueue.set(fileId, processedFile);

      // Validate file
      this.emitProgress(fileId, 'validation', 20, 'Validating file');
      await this.validateFile(file, validatedOptions);

      // Generate file hash
      this.emitProgress(fileId, 'processing', 40, 'Generating file hash');
      processedFile.hash = await this.generateFileHash(file.buffer);

      // Save file to disk
      this.emitProgress(fileId, 'processing', 60, 'Saving file');
      const filePath = path.join(this.uploadDir, processedFile.filename);
      await fs.writeFile(filePath, file.buffer);
      processedFile.path = filePath;

      // Extract metadata
      if (validatedOptions.extractMetadata) {
        this.emitProgress(fileId, 'metadata', 70, 'Extracting metadata');
        processedFile.metadata = await this.extractMetadata(file, filePath);
      }

      // Generate thumbnails for images
      if (validatedOptions.generateThumbnails && this.isImage(file.mimetype)) {
        this.emitProgress(fileId, 'thumbnail', 80, 'Generating thumbnails');
        processedFile.thumbnails = await this.generateThumbnails(filePath);
      }

      // Virus scanning (if enabled)
      if (validatedOptions.scanForViruses) {
        this.emitProgress(fileId, 'processing', 90, 'Scanning for viruses');
        await this.scanForViruses(filePath);
      }

      // Complete processing
      processedFile.status = 'completed';
      processedFile.processedAt = new Date();
      this.emitProgress(fileId, 'completed', 100, 'File processing completed');

      this.logger.info('File processed successfully', {
        fileId,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });

      return processedFile;
    } catch (error) {
      this.logger.error('File processing failed', { error, fileId });

      const processedFile = this.processingQueue.get(fileId);
      if (processedFile) {
        processedFile.status = 'error';
        processedFile.error = error instanceof Error ? error.message : 'Unknown error';
      }

      throw error;
    }
  }

  /**
   * Process multiple files concurrently
   */
  async processFiles(
    files: Express.Multer.File[],
    options: FileUploadOptions = {}
  ): Promise<ProcessedFile[]> {
    const results = await Promise.allSettled(files.map((file) => this.processFile(file, options)));

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        this.logger.error('File processing failed in batch', {
          index,
          error: result.reason,
        });
        throw result.reason;
      }
    });
  }

  /**
   * Get file processing status
   */
  getProcessingStatus(fileId: string): ProcessedFile | null {
    return this.processingQueue.get(fileId) || null;
  }

  /**
   * Stream file for download
   */
  async streamFile(filePath: string): Promise<NodeJS.ReadableStream> {
    try {
      await fs.access(filePath);
      return createReadStream(filePath);
    } catch (error) {
      this.logger.error('Failed to stream file', { error, filePath });
      throw new Error('File not found or inaccessible');
    }
  }

  /**
   * Delete processed file
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const processedFile = this.processingQueue.get(fileId);
      if (!processedFile) {
        throw new Error('File not found');
      }

      // Delete main file
      if (processedFile.path) {
        await fs.unlink(processedFile.path);
      }

      // Delete thumbnails
      if (processedFile.thumbnails) {
        await Promise.all([
          fs.unlink(processedFile.thumbnails.small).catch(() => {}),
          fs.unlink(processedFile.thumbnails.medium).catch(() => {}),
          fs.unlink(processedFile.thumbnails.large).catch(() => {}),
        ]);
      }

      this.processingQueue.delete(fileId);

      this.logger.info('File deleted successfully', { fileId });
    } catch (error) {
      this.logger.error('Failed to delete file', { error, fileId });
      throw error;
    }
  }

  private async validateFile(file: Express.Multer.File, options: FileUploadOptions): Promise<void> {
    // Size validation
    if (options.maxSize && file.size > options.maxSize) {
      throw new Error(`File size ${file.size} exceeds maximum allowed size ${options.maxSize}`);
    }

    // MIME type validation
    if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }

    // Extension validation
    const extension = path.extname(file.originalname).toLowerCase();
    if (options.allowedExtensions && !options.allowedExtensions.includes(extension)) {
      throw new Error(`File extension ${extension} is not allowed`);
    }

    // Basic file content validation
    if (file.size === 0) {
      throw new Error('File is empty');
    }

    // Magic number validation for common file types
    await this.validateFileSignature(file);
  }

  private async validateFileSignature(file: Express.Multer.File): Promise<void> {
    const buffer = file.buffer;
    const signatures: Record<string, number[]> = {
      'image/jpeg': [0xff, 0xd8, 0xff],
      'image/png': [0x89, 0x50, 0x4e, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'application/pdf': [0x25, 0x50, 0x44, 0x46],
    };

    const signature = signatures[file.mimetype];
    if (signature) {
      const fileHeader = Array.from(buffer.slice(0, signature.length));
      if (!signature.every((byte, index) => byte === fileHeader[index])) {
        throw new Error('File signature does not match declared MIME type');
      }
    }
  }

  private async generateFileHash(buffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateSafeFilename(originalName: string): string {
    const timestamp = Date.now();
    const extension = path.extname(originalName);
    const baseName = path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);

    return `${timestamp}_${baseName}${extension}`;
  }

  private async extractMetadata(
    file: Express.Multer.File,
    filePath: string
  ): Promise<Record<string, unknown>> {
    const metadata: Record<string, unknown> = {
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
    };

    try {
      const stats = await fs.stat(filePath);
      metadata.createdAt = stats.birthtime;
      metadata.modifiedAt = stats.mtime;

      // Add image-specific metadata
      if (this.isImage(file.mimetype)) {
        // In a real implementation, you'd use a library like 'sharp' or 'exifr'
        metadata.imageType = 'raster';
        metadata.hasExif = false;
      }

      // Add document-specific metadata
      if (file.mimetype === 'application/pdf') {
        // In a real implementation, you'd use a library like 'pdf-parse'
        metadata.documentType = 'pdf';
        metadata.pageCount = 0;
      }
    } catch (error) {
      this.logger.warn('Failed to extract metadata', { error, filePath });
    }

    return metadata;
  }

  private async generateThumbnails(filePath: string): Promise<{
    small: string;
    medium: string;
    large: string;
  }> {
    // In a real implementation, you'd use a library like 'sharp' for image processing
    const thumbnailDir = path.join(this.uploadDir, 'thumbnails');
    await this.ensureDirectory(thumbnailDir);

    const baseName = path.basename(filePath, path.extname(filePath));

    return {
      small: path.join(thumbnailDir, `${baseName}_small.jpg`),
      medium: path.join(thumbnailDir, `${baseName}_medium.jpg`),
      large: path.join(thumbnailDir, `${baseName}_large.jpg`),
    };
  }

  private async scanForViruses(filePath: string): Promise<void> {
    // In a real implementation, you'd integrate with a virus scanning service
    // like ClamAV or a cloud-based service
    this.logger.debug('Virus scan completed (mock)', { filePath });
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private async ensureUploadDirectory(): Promise<void> {
    await this.ensureDirectory(this.uploadDir);
    await this.ensureDirectory(path.join(this.uploadDir, 'thumbnails'));
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private emitProgress(
    fileId: string,
    stage: FileProcessingProgress['stage'],
    progress: number,
    message?: string
  ): void {
    const progressEvent: FileProcessingProgress = {
      fileId,
      stage,
      progress,
      message,
    };

    this.emit('progress', progressEvent);
  }
}

export default FileProcessingService;
