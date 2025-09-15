import { Model, Document } from 'mongoose';
import { IRepository, IRepositoryWithPagination } from '../interfaces/IRepository.js';

export abstract class BaseRepository<T extends Document> implements IRepositoryWithPagination<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.model.findById(id);
  }

  /**
   * Find one document by query
   */
  async findOne(query: any): Promise<T | null> {
    return this.model.findOne(query);
  }

  /**
   * Find multiple documents
   */
  async find(query: any): Promise<T[]> {
    return this.model.find(query);
  }

  /**
   * Create new document
   */
  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return document.save();
  }

  /**
   * Update document by ID
   */
  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Delete document by ID
   */
  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Count documents matching query
   */
  async countDocuments(query: any): Promise<number> {
    return this.model.countDocuments(query);
  }

  /**
   * Find with pagination
   */
  async findWithPagination(query: any, skip: number, limit: number): Promise<T[]> {
    return this.model.find(query).skip(skip).limit(limit).sort({ updatedAt: -1 });
  }

  /**
   * Find one and delete
   */
  async findOneAndDelete(query: any): Promise<T | null> {
    return this.model.findOneAndDelete(query);
  }

  /**
   * Update one document
   */
  async updateOne(query: any, update: any): Promise<boolean> {
    const result = await this.model.updateOne(query, update);
    return result.modifiedCount > 0;
  }

  /**
   * Delete many documents
   */
  async deleteMany(query: any): Promise<number> {
    const result = await this.model.deleteMany(query);
    return result.deletedCount || 0;
  }
}