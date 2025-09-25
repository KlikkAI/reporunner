import { injectable } from 'inversify';

@injectable()
export class GetErrorUseCase {
  async execute(input: any): Promise<any> {
    // TODO: Implement getError logic
    throw new Error('Not implemented');
  }
}
