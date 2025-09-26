// Canonical On.use-case for frontend
import { injectable } from 'inversify';

@injectable()
export class OnUseCase {
  async execute(_input: any): Promise<any> {
    throw new Error('Not implemented');
  }
}
