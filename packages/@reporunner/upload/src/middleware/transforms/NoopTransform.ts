import { FileTransform } from './FileTransform';
import { UploadedFile } from '../types/UploadedFile';

/**
 * A transform that does nothing to the file
 */
export class NoopTransform implements FileTransform {
  /**
   * Return file as-is without transformation
   */
  public async transform(file: UploadedFile): Promise<UploadedFile> {
    return {
      ...file,
      modified: false
    };
  }
}