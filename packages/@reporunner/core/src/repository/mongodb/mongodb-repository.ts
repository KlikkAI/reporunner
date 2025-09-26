import { Collection, ClientSession, ObjectId } from 'mongodb';
import { BaseRepository } from '../base-repository';
import { Filter, Sort, Pagination } from '../../types/repository.types';

/**
 * Base MongoDB repository implementation that provides concrete MongoDB-specific
 * implementations of the base repository operations.
 */
export abstract class MongoDBRepository<T extends { _id?: ObjectId }, ID = string> extends BaseRepository<T, ID> {
  protected session: ClientSession | null = null;
  
  constructor(
    protected readonly collection: Collection<T>
  ) {
    super();
  }
  
  /**
   * Convert string ID to ObjectId
   */
  protected toObjectId(id: ID): ObjectId {
    return new ObjectId(id as string);
  }
  
  /**
   * Transform repository filter to MongoDB filter
   */
  protected transformFilter(filter: Filter<T> = {}): any {
    // Convert string IDs to ObjectIds in the filter
    const transformed = { ...filter };
    if (transformed._id) {
      if (typeof transformed._id === 'string') {
        transformed._id = this.toObjectId(transformed._id as unknown as ID);
      } else if (typeof transformed._id === 'object') {
        const idFilter = transformed._id as any;
        if (idFilter.$eq) idFilter.$eq = this.toObjectId(idFilter.$eq);
        if (idFilter.$in) idFilter.$in = idFilter.$in.map((id: string) => this.toObjectId(id as unknown as ID));
      }
    }
    return transformed;
  }
  
  /**
   * Transform repository sort to MongoDB sort
   */
  protected transformSort(sort: Sort<T> = {}): any {
    const transformed: Record<string, 1 | -1> = {};
    for (const [key, value] of Object.entries(sort)) {
      transformed[key] = value === 'desc' || value === -1 ? -1 : 1;
    }
    return transformed;
  }
  
  async findById(id: ID): Promise<T | null> {
    return this.wrapError(async () => {
      return this.collection.findOne(
        { _id: this.toObjectId(id) } as any,
        { session: this.session }
      );
    });
  }
  
  async findOne(filter: Filter<T>): Promise<T | null> {
    return this.wrapError(async () => {
      return this.collection.findOne(
        this.transformFilter(filter),
        { session: this.session }
      );
    });
  }
  
  async find(filter?: Filter<T>, sort?: Sort<T>, pagination?: Pagination): Promise<T[]> {
    return this.wrapError(async () => {
      let query = this.collection.find(
        this.transformFilter(filter),
        { session: this.session }
      );
      
      if (sort) {
        query = query.sort(this.transformSort(sort));
      }
      
      if (pagination) {
        query = query.skip(pagination.skip).limit(pagination.limit);
      }
      
      return query.toArray();
    });
  }
  
  async count(filter?: Filter<T>): Promise<number> {
    return this.wrapError(async () => {
      return this.collection.countDocuments(
        this.transformFilter(filter),
        { session: this.session }
      );
    });
  }
  
  async create(data: Partial<T>): Promise<T> {
    return this.wrapError(async () => {
      const result = await this.collection.insertOne(
        data as any,
        { session: this.session }
      );
      return { ...data, _id: result.insertedId } as T;
    });
  }
  
  async createMany(data: Partial<T>[]): Promise<T[]> {
    return this.wrapError(async () => {
      const result = await this.collection.insertMany(
        data as any[],
        { session: this.session }
      );
      return data.map((item, index) => ({
        ...item,
        _id: result.insertedIds[index]
      })) as T[];
    });
  }
  
  async update(id: ID, data: Partial<T>): Promise<T> {
    return this.wrapError(async () => {
      const result = await this.collection.findOneAndUpdate(
        { _id: this.toObjectId(id) } as any,
        { $set: data },
        { 
          session: this.session,
          returnDocument: 'after'
        }
      );
      return this.throwIfNotFound(result, id);
    });
  }
  
  async updateMany(filter: Filter<T>, data: Partial<T>): Promise<number> {
    return this.wrapError(async () => {
      const result = await this.collection.updateMany(
        this.transformFilter(filter),
        { $set: data },
        { session: this.session }
      );
      return result.modifiedCount;
    });
  }
  
  async delete(id: ID): Promise<boolean> {
    return this.wrapError(async () => {
      const result = await this.collection.deleteOne(
        { _id: this.toObjectId(id) } as any,
        { session: this.session }
      );
      return result.deletedCount > 0;
    });
  }
  
  async deleteMany(filter: Filter<T>): Promise<number> {
    return this.wrapError(async () => {
      const result = await this.collection.deleteMany(
        this.transformFilter(filter),
        { session: this.session }
      );
      return result.deletedCount;
    });
  }
  
  protected async beginTransactionImpl(): Promise<void> {
    this.session = await this.collection.db.client.startSession();
    await this.session.startTransaction();
  }
  
  protected async commitTransactionImpl(): Promise<void> {
    await this.session?.commitTransaction();
    await this.session?.endSession();
    this.session = null;
  }
  
  protected async rollbackTransactionImpl(): Promise<void> {
    await this.session?.abortTransaction();
    await this.session?.endSession();
    this.session = null;
  }
}