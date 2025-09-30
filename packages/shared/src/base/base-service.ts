/**
 * Base service class with common business logic patterns
 * Reduces duplication across domain services
 */
import { injectable } from 'inversify';
import { LoggingUtils } from '../utilities';
import type { IRepository, IService } from './interfaces';

@injectable()
export abstract class BaseService<T, K = string> implements IService<T, K> {
  constructor(
    protected repository: IRepository<T, K>,
    protected entityName: string
  ) {}

  async getById(id: K): Promise<T | null> {
    try {
      LoggingUtils.debug(`Getting ${this.entityName} by ID: ${id}`);
      const entity = await this.repository.findById(id);

      if (!entity) {
        LoggingUtils.warn(`${this.entityName} not found with ID: ${id}`);
      }

      return entity;
    } catch (error) {
      LoggingUtils.error(`Error getting ${this.entityName} by ID: ${id}`, error);
      throw error;
    }
  }

  async getAll(): Promise<T[]> {
    try {
      LoggingUtils.debug(`Getting all ${this.entityName}s`);
      return await this.repository.findAll();
    } catch (error) {
      LoggingUtils.error(`Error getting all ${this.entityName}s`, error);
      throw error;
    }
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      LoggingUtils.debug(`Creating ${this.entityName}`, data);
      const entity = await this.repository.create(data);
      LoggingUtils.info(`${this.entityName} created successfully`);
      return entity;
    } catch (error) {
      LoggingUtils.error(`Error creating ${this.entityName}`, error);
      throw error;
    }
  }

  async update(id: K, data: Partial<T>): Promise<T | null> {
    try {
      LoggingUtils.debug(`Updating ${this.entityName} with ID: ${id}`, data);
      const entity = await this.repository.update(id, data);

      if (!entity) {
        LoggingUtils.warn(`${this.entityName} not found for update with ID: ${id}`);
      } else {
        LoggingUtils.info(`${this.entityName} updated successfully`);
      }

      return entity;
    } catch (error) {
      LoggingUtils.error(`Error updating ${this.entityName} with ID: ${id}`, error);
      throw error;
    }
  }

  async delete(id: K): Promise<boolean> {
    try {
      LoggingUtils.debug(`Deleting ${this.entityName} with ID: ${id}`);
      const deleted = await this.repository.delete(id);

      if (deleted) {
        LoggingUtils.info(`${this.entityName} deleted successfully`);
      } else {
        LoggingUtils.warn(`${this.entityName} not found for deletion with ID: ${id}`);
      }

      return deleted;
    } catch (error) {
      LoggingUtils.error(`Error deleting ${this.entityName} with ID: ${id}`, error);
      throw error;
    }
  }
}
