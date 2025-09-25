import { injectable } from 'inversify';

@injectable()
export class CanAccessResourceUseCase {
  async execute(input: any): Promise<any> {
    // TODO: Implement canAccessResource logic
    throw new Error('Not implemented');
  }
}
