import { injectable } from 'inversify';

@injectable()
export class CatchUseCase {
  async execute(input: any): Promise<any> {
    // TODO: Implement catch logic
    throw new Error('Not implemented');
  }
}
