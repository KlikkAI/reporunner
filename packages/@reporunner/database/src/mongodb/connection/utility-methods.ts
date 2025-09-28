// MongoDB utilities reusing patterns from core utilities
import type { QueryOptions } from '../../types/query-types';

export class MongoDBUtils {
  /**
   * Convert query options to MongoDB format
   */
  static buildMongoQuery(options?: QueryOptions) {
    if (!options) return {};

    const mongoQuery: any = {};

    if (options.filter) {
      Object.assign(mongoQuery, options.filter);
    }

    return mongoQuery;
  }

  /**
   * Build MongoDB find options
   */
  static buildFindOptions(options?: QueryOptions) {
    if (!options) return {};

    const findOptions: any = {};

    if (options.limit) {
      findOptions.limit = options.limit;
    }

    if (options.offset) {
      findOptions.skip = options.offset;
    }

    if (options.sort) {
      findOptions.sort = options.sort;
    }

    return findOptions;
  }

  /**
   * Sanitize input for MongoDB operations
   */
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.replace(/[{}$]/g, '');
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        // Remove MongoDB operators from user input
        if (!key.startsWith('$')) {
          sanitized[key] = this.sanitizeInput(value);
        }
      }
      return sanitized;
    }

    return input;
  }
}