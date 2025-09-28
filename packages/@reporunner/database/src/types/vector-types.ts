// Vector database types reusing patterns from core repository interfaces

export interface VectorSearchOptions {
  vector: number[];
  limit?: number;
  filter?: Record<string, unknown>;
  threshold?: number;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  score: number;
}

export interface VectorEmbedding {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVectorRepository {
  upsert(
    id: string,
    content: string,
    embedding: number[],
    metadata?: Record<string, unknown>
  ): Promise<void>;
  search(options: VectorSearchOptions): Promise<VectorSearchResult[]>;
  delete(id: string): Promise<boolean>;
  deleteByFilter(filter: Record<string, unknown>): Promise<number>;
}