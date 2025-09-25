import { injectable } from 'inversify';
import type { ILoggerRepository } from '../../domain/repositories/ILoggerRepository';

@injectable()
export class LoggerRepository implements ILoggerRepository {
  async findById(id: string): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async findAll(): Promise<any[]> {
    // TODO: Implement
    return [];
  }

  async create(data: any): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async update(id: string, data: any): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Implement
    return false;
  }
}
