import { injectable } from 'inversify';

@injectable()
export class VerboseUseCase {
  async execute(input: any): Promise<any> {
    // TODO: Implement verbose logic
    throw new Error('Not implemented');
  }
}
