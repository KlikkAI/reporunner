import { injectable } from 'inversify';

@injectable()
export class HealthCheckService {
  async getHealthStatus(): Promise<{ status: string }> {
    return { status: 'healthy' };
  }
}
