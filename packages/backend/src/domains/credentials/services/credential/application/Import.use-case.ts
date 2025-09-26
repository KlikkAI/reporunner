// Canonical placeholder implementation kept here for reuse
import { injectable } from 'inversify';

@injectable()
export class ImportUseCase {
  async execute(input: any): Promise<any> {
    throw new Error('Not implemented');
  }
}
