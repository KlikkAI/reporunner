import { injectable } from 'inversify';

@injectable()
export class ErrorUseCase {
  async execute(input: any): Promise<any> {
    // TODO: Implement error logic
    throw new Error('Not implemented');
  }
}
