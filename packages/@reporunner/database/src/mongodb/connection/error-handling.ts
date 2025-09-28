// MongoDB error handling reusing patterns from core error handling
export class MongoDBError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MongoDBError';
  }
}

export class MongoConnectionError extends MongoDBError {
  constructor(message: string, details?: any) {
    super(message, 'MONGO_CONNECTION_ERROR', details);
    this.name = 'MongoConnectionError';
  }
}

export class MongoQueryError extends MongoDBError {
  constructor(message: string, query?: any) {
    super(message, 'MONGO_QUERY_ERROR', { query });
    this.name = 'MongoQueryError';
  }
}

export function handleMongoError(error: any): MongoDBError {
  if (error instanceof MongoDBError) {
    return error;
  }

  if (error.name === 'MongoNetworkError') {
    return new MongoConnectionError(error.message, error);
  }

  return new MongoDBError(error.message || 'Unknown MongoDB error', undefined, error);
}