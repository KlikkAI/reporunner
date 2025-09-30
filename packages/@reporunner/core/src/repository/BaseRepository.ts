import type {
  Collection,
  Db,
  Filter,
  FindOptions,
  OptionalUnlessRequiredId,
  UpdateFilter,
} from 'mongodb';

export interface BaseEntity {
  _id?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RepositoryOptions {
  enableTimestamps?: boolean;
  enableSoftDelete?: boolean;
  cacheTTL?: number;
}

/**
 * Base repository class that eliminates duplication across MongoDB repositories.
 * Provides common CRUD operations, pagination, caching, and error handling.
 */
export abstract class BaseRepository<T extends BaseEntity> {
  protected db: Db;
  protected collection: Collection<T>;
  protected collectionName: string;
  protected options: RepositoryOptions;

  constructor(db: Db, collectionName: string, options: RepositoryOptions = {}) {
    this.db = db;
    this.collectionName = collectionName;
    this.collection = db.collection<T>(collectionName);
    this.options = {
      enableTimestamps: true,
      enableSoftDelete: false,
      cacheTTL: 300, // 5 minutes default
      ...options,
    };
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const document = {
      ...data,
      ...(this.options.enableTimestamps && {
        createdAt: now,
        updatedAt: now,
      }),
    } as T;

    const result = await this.collection.insertOne(document as OptionalUnlessRequiredId<T>);
    return { ...document, _id: result.insertedId } as T;
  }

  /**
   * Create multiple documents
   */
  async createMany(data: Array<Omit<T, '_id' | 'createdAt' | 'updatedAt'>>): Promise<T[]> {
    const now = new Date();
    const documents = data.map((item) => ({
      ...item,
      ...(this.options.enableTimestamps && {
        createdAt: now,
        updatedAt: now,
      }),
    })) as T[];

    const result = await this.collection.insertMany(documents as OptionalUnlessRequiredId<T>[]);
    return documents.map((doc, index) => ({
      ...doc,
      _id: result.insertedIds[index],
    }));
  }

  /**
   * Find a document by ID
   */
  async findById(id: any): Promise<T | null> {
    const filter = this.applyBaseFilter({ _id: id });
    return (await this.collection.findOne(filter)) as T | null;
  }

  /**
   * Find a single document by filter
   */
  async findOne(filter: Filter<T>, options?: FindOptions<T>): Promise<T | null> {
    const baseFilter = this.applyBaseFilter(filter);
    return (await this.collection.findOne(baseFilter, options)) as T | null;
  }

  /**
   * Find multiple documents
   */
  async find(filter: Filter<T> = {}, options?: FindOptions<T>): Promise<T[]> {
    const baseFilter = this.applyBaseFilter(filter);
    return (await this.collection.find(baseFilter, options).toArray()) as T[];
  }

  /**
   * Find documents with pagination
   */
  async findPaginated(
    filter: Filter<T> = {},
    paginationOptions: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10, sort = { _id: -1 } } = paginationOptions;

    const skip = (page - 1) * limit;
    const baseFilter = this.applyBaseFilter(filter);

    const [items, total] = await Promise.all([
      this.collection.find(baseFilter).sort(sort).skip(skip).limit(limit).toArray(),
      this.collection.countDocuments(baseFilter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items as T[],
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Update a document by ID
   */
  async updateById(id: any, update: UpdateFilter<T> | Partial<T>): Promise<T | null> {
    const filter = this.applyBaseFilter({ _id: id });
    const updateDoc = this.applyTimestampToUpdate(update);

    const result = await this.collection.findOneAndUpdate(filter, updateDoc, {
      returnDocument: 'after',
    });

    return (result as T) || null;
  }

  /**
   * Update a single document
   */
  async updateOne(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>): Promise<T | null> {
    const baseFilter = this.applyBaseFilter(filter);
    const updateDoc = this.applyTimestampToUpdate(update);

    const result = await this.collection.findOneAndUpdate(baseFilter, updateDoc, {
      returnDocument: 'after',
    });

    return (result as T) || null;
  }

  /**
   * Update multiple documents
   */
  async updateMany(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>): Promise<number> {
    const baseFilter = this.applyBaseFilter(filter);
    const updateDoc = this.applyTimestampToUpdate(update);

    const result = await this.collection.updateMany(baseFilter, updateDoc);
    return result.modifiedCount;
  }

  /**
   * Delete a document by ID
   */
  async deleteById(id: any): Promise<boolean> {
    if (this.options.enableSoftDelete) {
      const result = await this.updateById(id, { deletedAt: new Date() } as any);
      return result !== null;
    }

    const result = await this.collection.deleteOne({ _id: id } as Filter<T>);
    return result.deletedCount > 0;
  }

  /**
   * Delete a single document
   */
  async deleteOne(filter: Filter<T>): Promise<boolean> {
    if (this.options.enableSoftDelete) {
      const result = await this.updateOne(filter, { deletedAt: new Date() } as any);
      return result !== null;
    }

    const result = await this.collection.deleteOne(this.applyBaseFilter(filter));
    return result.deletedCount > 0;
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(filter: Filter<T>): Promise<number> {
    if (this.options.enableSoftDelete) {
      return await this.updateMany(filter, { deletedAt: new Date() } as any);
    }

    const result = await this.collection.deleteMany(this.applyBaseFilter(filter));
    return result.deletedCount;
  }

  /**
   * Count documents
   */
  async count(filter: Filter<T> = {}): Promise<number> {
    const baseFilter = this.applyBaseFilter(filter);
    return await this.collection.countDocuments(baseFilter);
  }

  /**
   * Check if document exists
   */
  async exists(filter: Filter<T>): Promise<boolean> {
    const count = await this.count(filter);
    return count > 0;
  }

  /**
   * Apply base filters (e.g., soft delete)
   */
  protected applyBaseFilter(filter: Filter<T>): Filter<T> {
    if (this.options.enableSoftDelete) {
      return {
        ...filter,
        deletedAt: { $exists: false },
      } as Filter<T>;
    }
    return filter;
  }

  /**
   * Apply timestamp to update operations
   */
  protected applyTimestampToUpdate(update: UpdateFilter<T> | Partial<T>): UpdateFilter<T> {
    if (!this.options.enableTimestamps) {
      return update as UpdateFilter<T>;
    }

    // If it's a direct partial update
    if (!('$set' in update || '$unset' in update || '$inc' in update)) {
      return {
        $set: {
          ...update,
          updatedAt: new Date(),
        },
      } as UpdateFilter<T>;
    }

    // If it's a MongoDB update operator
    const mongoUpdate = update as UpdateFilter<T>;
    return {
      ...mongoUpdate,
      $set: {
        ...mongoUpdate.$set,
        updatedAt: new Date(),
      } as any,
    };
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    storageSize: number;
    avgDocumentSize: number;
  }> {
    const stats = await this.db.command({ collStats: this.collectionName });
    return {
      totalDocuments: stats.count || 0,
      storageSize: stats.storageSize || 0,
      avgDocumentSize: stats.avgObjSize || 0,
    };
  }

  /**
   * Create indexes for the collection
   */
  async createIndexes(): Promise<void> {
    const indexes = this.getIndexDefinitions();
    if (indexes.length > 0) {
      await this.collection.createIndexes(indexes);
    }
  }

  /**
   * Override this method to define collection-specific indexes
   */
  protected getIndexDefinitions(): Array<{ key: Record<string, 1 | -1>; [key: string]: any }> {
    const indexes: Array<{ key: Record<string, 1 | -1>; [key: string]: any }> = [];

    if (this.options.enableTimestamps) {
      indexes.push({ key: { createdAt: -1 } });
      indexes.push({ key: { updatedAt: -1 } });
    }

    if (this.options.enableSoftDelete) {
      indexes.push({ key: { deletedAt: 1 }, sparse: true });
    }

    return indexes;
  }
}

export default BaseRepository;
