// Canonical backend Replace use-case
import { injectable } from 'inversify';

@injectable()
export class ReplaceUseCase {
  async execute(_input: any): Promise<any> {
    throw new Error('Not implemented');
  }
}
