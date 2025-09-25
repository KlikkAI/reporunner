import { injectable } from 'inversify';

@injectable()
export class HttpUseCase {
  async execute(input: any): Promise<any> {
    // TODO: Implement http logic
    throw new Error('Not implemented');
  }
}
