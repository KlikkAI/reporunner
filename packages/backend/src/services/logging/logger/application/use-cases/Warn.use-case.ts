import { injectable } from 'inversify';

@injectable()
export class WarnUseCase {
  async execute(input: any): Promise<any> {
    // TODO: Implement warn logic
    throw new Error('Not implemented');
  }
}
