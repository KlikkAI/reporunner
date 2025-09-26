import { StorageEngine } from './StorageEngine';
import { UploadedFile } from '../types/UploadedFile';
import { UploadOptions } from '../types/UploadOptions';
import { UploadError } from '../errors/UploadError';
import { createHash } from 'crypto';
import { promises as fs, createReadStream, createWriteStream } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

export class LocalStorageEngine implements StorageEngine {
  private options: Required<UploadOptions>;
  private uploadDir: string;
  private tempDir: string;

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
      uploadDir: join(process.cwd(), 'uploads'),
      tempDir: tmpdir(),
      hashFiles: false,
      hashAlgorithm: 'sha256',
      cleanupTemp: true,
      ...options
    };

    this.uploadDir = this.options.uploadDir;
    this.tempDir = this.options.tempDir;
  }

  /**
   * Store a file
   */
  public async store(file: UploadedFile): Promise<UploadedFile> {
    try {
      // Generate unique filename if needed
      if (this.options.generateUniqueName) {
        file.filename = await this.generateFilename(file.originalname);
      }

      const fullPath = join(this.uploadDir, file.filename);

      // Create directory if it doesn't exist
      if (this.options.createDirectory) {
        await fs.mkdir(dirname(fullPath), { recursive: true });
      }

      // Check if file exists
      if (!this.options.overwrite && await this.exists(fullPath)) {
        throw new UploadError(
          'FILE_EXISTS',
          `File ${file.filename} already exists`
        );
      }

      // Move file to destination
      if (file.path !== fullPath) {
        await this.move(file.path, fullPath);
      }

      // Update file path
      file.path = fullPath;

      // Generate hash if enabled
      if (this.options.hashFiles) {
        file.hash = await this.hashFile(fullPath);
        file.hashAlgorithm = this.options.hashAlgorithm;
      }

      // Get file stats
      const stats = await fs.stat(fullPath);
      file.stats = {
        birthtime: stats.birthtime,
        mtime: stats.mtime,
        atime: stats.atime,
        ctime: stats.ctime,
        mode: stats.mode,
        uid: stats.uid,
        gid: stats.gid
      };

      return file;
    } catch (error) {
      // Cleanup on error
      try {
        if (file.path) {
          await this.remove(file.path);
        }
      } catch {
        // Ignore cleanup errors
      }

      throw error;
    }
  }

  /**
   * Remove a file
   */
  public async remove(path: string): Promise<void> {
    try {
      await fs.unlink(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Check if a file exists
   */
  public async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file information
   */
  public async stat(path: string): Promise<UploadedFile> {
    const stats = await fs.stat(path);
    return {
      originalname: basename(path),
      filename: basename(path),
      path,
      size: stats.size,
      mimetype: await this.getMimeType(path),
      modified: false,
      uploadedAt: stats.birthtime,
      stats: {
        birthtime: stats.birthtime,
        mtime: stats.mtime,
        atime: stats.atime,
        ctime: stats.ctime,
        mode: stats.mode,
        uid: stats.uid,
        gid: stats.gid
      }
    };
  }

  /**
   * Get a read stream for a file
   */
  public createReadStream(path: string): NodeJS.ReadableStream {
    return createReadStream(path);
  }

  /**
   * Get a write stream for a file
   */
  public createWriteStream(path: string): NodeJS.WritableStream {
    return createWriteStream(path);
  }

  /**
   * Move a file
   */
  public async move(source: string, destination: string): Promise<void> {
    try {
      await fs.rename(source, destination);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EXDEV') {
        // Cross-device move, fallback to copy + delete
        await this.copy(source, destination);
        await this.remove(source);
      } else {
        throw error;
      }
    }
  }

  /**
   * Copy a file
   */
  public async copy(source: string, destination: string): Promise<void> {
    await fs.copyFile(source, destination);
  }

  /**
   * Initialize storage
   */
  public async initialize(): Promise<void> {
    if (this.options.createDirectory) {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  /**
   * Cleanup storage
   */
  public async cleanup(): Promise<void> {
    if (this.options.cleanupTemp) {
      try {
        const files = await fs.readdir(this.tempDir);
        await Promise.all(
          files.map(file => this.remove(join(this.tempDir, file)))
        );
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * List files in a directory
   */
  public async list(directory: string = this.uploadDir): Promise<UploadedFile[]> {
    const files = await fs.readdir(directory);
    return Promise.all(
      files.map(async file => {
        const path = join(directory, file);
        const stats = await fs.stat(path);
        if (stats.isFile()) {
          return this.stat(path);
        }
        return null;
      })
    ).then(results => results.filter((file): file is UploadedFile => file !== null));
  }

  /**
   * Generate a unique filename
   */
  public async generateFilename(originalname: string): Promise<string> {
    const ext = extname(originalname);
    const uuid = uuidv4();
    return `${uuid}${ext}`;
  }

  /**
   * Get public URL for a file
   */
  public async getPublicUrl(path: string): Promise<string> {
    // This is just a basic implementation
    // In real applications, you'd need to consider your web server configuration
    const relativePath = path.replace(this.uploadDir, '');
    return `/uploads${relativePath}`;
  }

  /**
   * Hash a file
   */
  private async hashFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash(this.options.hashAlgorithm);
      const stream = createReadStream(path);

      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  /**
   * Get MIME type for a file
   */
  private async getMimeType(path: string): Promise<string> {
    // This is a basic implementation
    // In real applications, you'd want to use a proper MIME type detection library
    const ext = extname(path).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}