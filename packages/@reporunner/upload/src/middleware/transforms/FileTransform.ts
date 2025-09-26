import { UploadedFile } from '../types/UploadedFile';

/**
 * Interface for file transformers
 */
export interface FileTransform {
  /**
   * Transform a file
   * @returns Transformed file information
   */
  transform(file: UploadedFile): Promise<UploadedFile>;
}