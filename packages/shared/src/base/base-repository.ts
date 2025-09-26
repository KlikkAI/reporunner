/**
 * Base repository with common MongoDB operations
 * Reduces duplication across domain repositories
 */
import { Model, Document } from 'mongoose';
import { IRepository } from './interfaces';

export abstract class BaseRepository<T extends Document, K = string> implements IRepository<T, K> {
  constructor(protected model: Model<T>) {}

  async findById(id: K): Promise<T | null> {
    return this.model.findById(id as any).exec();
  }

  async findAll(): Promise<T[]> {
    return this.model.find().exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }

  async update(id: K, updates: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(
      id as any,
      updates,
      { new: true, runValidators: true }
    ).exec();
  }

  async delete(id: K): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id as any).exec();
    return result !== null;
  }

  async findByUserId(userId: string): Promise<T[]> {
    return this.model.find({ userId } as any).exec();
  }

  async findOneAndDelete(filter: Partial<T>): Promise<T | null> {
    return this.model.findOneAndDelete(filter as any).exec();
  }

  async count(filter: Partial<T> = {}): Promise<number> {
    return this.model.countDocuments(filter as any).exec();
  }

  async exists(id: K): Promise<boolean> {
    const result = await this.model.exists({ _id: id } as any);
    return result !== null;
  }
}