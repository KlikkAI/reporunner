/**
 * Transform Node Utils
 *
 * Utilities for working with transform nodes and data transformation
 */

export interface TransformOperation {
  type: 'map' | 'filter' | 'reduce' | 'sort' | 'group' | 'merge' | 'split';
  config: Record<string, any>;
}

export interface TransformResult {
  success: boolean;
  data: any;
  error?: string;
  metadata?: {
    inputCount?: number;
    outputCount?: number;
    processingTime?: number;
  };
}

class TransformNodeUtils {
  /**
   * Apply transformation to data
   */
  transform(data: any, operations: TransformOperation[]): TransformResult {
    const startTime = Date.now();

    try {
      let result = data;
      const inputCount = Array.isArray(data) ? data.length : 1;

      for (const operation of operations) {
        result = this.applyOperation(result, operation);
      }

      const outputCount = Array.isArray(result) ? result.length : 1;
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          inputCount,
          outputCount,
          processingTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Transform failed',
      };
    }
  }

  /**
   * Apply a single transformation operation
   */
  private applyOperation(data: any, operation: TransformOperation): any {
    switch (operation.type) {
      case 'map':
        return this.mapOperation(data, operation.config);

      case 'filter':
        return this.filterOperation(data, operation.config);

      case 'reduce':
        return this.reduceOperation(data, operation.config);

      case 'sort':
        return this.sortOperation(data, operation.config);

      case 'group':
        return this.groupOperation(data, operation.config);

      case 'merge':
        return this.mergeOperation(data, operation.config);

      case 'split':
        return this.splitOperation(data, operation.config);

      default:
        throw new Error(`Unknown transform operation: ${operation.type}`);
    }
  }

  /**
   * Map operation - transform each item
   */
  private mapOperation(data: any, config: any): any {
    if (!Array.isArray(data)) {
      data = [data];
    }

    return data.map((item: any) => {
      if (config.fields) {
        const mapped: any = {};
        for (const [newKey, oldKey] of Object.entries(config.fields)) {
          mapped[newKey] = item[oldKey as string];
        }
        return mapped;
      }

      return item;
    });
  }

  /**
   * Filter operation - filter items based on conditions
   */
  private filterOperation(data: any, config: any): any {
    if (!Array.isArray(data)) {
      data = [data];
    }

    if (!config.condition) {
      return data;
    }

    return data.filter((item: any) => {
      return this.evaluateCondition(item, config.condition);
    });
  }

  /**
   * Reduce operation - aggregate data
   */
  private reduceOperation(data: any, config: any): any {
    if (!Array.isArray(data)) {
      return data;
    }

    const { operation = 'sum', field, initialValue = 0 } = config;

    switch (operation) {
      case 'sum':
        return data.reduce((acc, item) => acc + (item[field] || 0), initialValue);

      case 'count':
        return data.length;

      case 'average': {
        const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
        return data.length > 0 ? sum / data.length : 0;
      }

      case 'min':
        return Math.min(...data.map((item) => item[field] || 0));

      case 'max':
        return Math.max(...data.map((item) => item[field] || 0));

      default:
        return data;
    }
  }

  /**
   * Sort operation - sort data
   */
  private sortOperation(data: any, config: any): any {
    if (!Array.isArray(data)) {
      return data;
    }

    const { field, direction = 'asc' } = config;

    return [...data].sort((a, b) => {
      const aValue = field ? a[field] : a;
      const bValue = field ? b[field] : b;

      if (direction === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  }

  /**
   * Group operation - group data by field
   */
  private groupOperation(data: any, config: any): any {
    if (!Array.isArray(data)) {
      return data;
    }

    const { field } = config;

    return data.reduce((groups: any, item: any) => {
      const key = item[field] || 'undefined';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Merge operation - merge objects/arrays
   */
  private mergeOperation(data: any, config: any): any {
    if (Array.isArray(data)) {
      if (config.strategy === 'objects') {
        return data.reduce((merged, item) => ({ ...merged, ...item }), {});
      } else {
        return data.flat();
      }
    }

    return data;
  }

  /**
   * Split operation - split strings or arrays
   */
  private splitOperation(data: any, config: any): any {
    const { field, delimiter = ',' } = config;

    if (Array.isArray(data)) {
      return data.map((item) => {
        if (field && typeof item[field] === 'string') {
          return {
            ...item,
            [field]: item[field].split(delimiter),
          };
        }
        return item;
      });
    }

    if (typeof data === 'string') {
      return data.split(delimiter);
    }

    return data;
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(item: any, condition: any): boolean {
    const { field, operator, value } = condition;
    const itemValue = item[field];

    switch (operator) {
      case 'equals':
        return itemValue === value;
      case 'notEquals':
        return itemValue !== value;
      case 'greaterThan':
        return itemValue > value;
      case 'lessThan':
        return itemValue < value;
      case 'contains':
        return typeof itemValue === 'string' && itemValue.includes(value);
      case 'exists':
        return itemValue !== undefined && itemValue !== null;
      default:
        return true;
    }
  }

  /**
   * Get available transform operations
   */
  getAvailableOperations(): TransformOperation['type'][] {
    return ['map', 'filter', 'reduce', 'sort', 'group', 'merge', 'split'];
  }

  /**
   * Validate transform operation
   */
  validateOperation(operation: TransformOperation): { valid: boolean; error?: string } {
    if (!this.getAvailableOperations().includes(operation.type)) {
      return {
        valid: false,
        error: `Unknown operation type: ${operation.type}`,
      };
    }

    // Add specific validation for each operation type
    switch (operation.type) {
      case 'reduce':
        if (!operation.config.operation) {
          return {
            valid: false,
            error: 'Reduce operation requires an operation type (sum, count, etc.)',
          };
        }
        break;

      case 'sort':
        if (operation.config.direction && !['asc', 'desc'].includes(operation.config.direction)) {
          return {
            valid: false,
            error: 'Sort direction must be "asc" or "desc"',
          };
        }
        break;
    }

    return { valid: true };
  }
}

export const transformNodeUtils = new TransformNodeUtils();
export { TransformNodeUtils };
