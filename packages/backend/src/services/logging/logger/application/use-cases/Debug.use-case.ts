import { injectable } from 'inversify';

@injectable()
export class DebugUseCase {
  async execute(input: any): Promise<any> {
    // TODO: Implement debug logic
    throw new Error('Not implemented');
  }
}
