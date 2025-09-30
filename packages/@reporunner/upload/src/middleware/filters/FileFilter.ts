import type { UploadedFile } from '../types/UploadedFile';

/**
 * Interface for file filters
 */
export interface FileFilter {
  /**
   * Check if a file should be accepted
   */
  shouldAccept(file: UploadedFile): Promise<boolean>;
}
