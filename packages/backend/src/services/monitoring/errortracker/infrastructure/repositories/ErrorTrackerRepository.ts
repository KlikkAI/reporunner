import { injectable } from 'inversify';
import type { IErrorTrackerRepository } from '../../domain/repositories/IErrorTrackerRepository';

@injectable()
export class ErrorTrackerRepository implements IErrorTrackerRepository {
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
