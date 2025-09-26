// Canonical backend Trim use-case
import { injectable } from 'inversify';

@injectable()
export class TrimUseCase {
  async execute(_input: any): Promise<any> {
    throw new Error('Not implemented');
  }
}
