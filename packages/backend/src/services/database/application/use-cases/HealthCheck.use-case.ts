import { injectable } from 'inversify';

@injectable()
export class HealthCheckUseCase {
  async execute(input: any): Promise<any> {
    // TODO: Implement healthCheck logic
    throw new Error('Not implemented');
  }
}
