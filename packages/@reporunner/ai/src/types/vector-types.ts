// Vector store types reusing patterns from database vector-types.ts

export interface VectorSearchOptions {
  vector: number[];
  limit?: number;
  filter?: Record<string, unknown>;
  threshold?: number;
  includeMetadata?: boolean;
  includeValues?: boolean;
  namespace?: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, unknown>;
  namespace?: string;
}

export interface VectorUpsertRequest {
  vectors: VectorRecord[];
  namespace?: string;
}

export interface VectorRecord {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
  sparseValues?: {
    indices: number[];
    values: number[];
  };
}

export interface VectorDeleteRequest {
  ids?: string[];
  deleteAll?: boolean;
  namespace?: string;
  filter?: Record<string, unknown>;
}

export interface VectorIndexStats {
  vectorCount?: number;
  pendingVectorCount?: number;
  indexSize?: number;
  dimension?: number;
  indexFullness?: number;
  namespaces?: Record<string, NamespaceStats>;
}

export interface NamespaceStats {
  vectorCount?: number;
}

export interface VectorIndexConfig {
  name: string;
  dimension: number;
  metric?: 'cosine' | 'euclidean' | 'dotproduct';
  pods?: number;
  replicas?: number;
  podType?: string;
  metadataConfig?: {
    indexed?: string[];
  };
  sourceCollection?: string;
}

export interface VectorQuery {
  vector?: number[];
  topK: number;
  includeValues?: boolean;
  includeMetadata?: boolean;
  namespace?: string;
  filter?: Record<string, unknown>;
  id?: string;
  sparseVector?: {
    indices: number[];
    values: number[];
  };
}

export interface VectorQueryResponse {
  matches: VectorMatch[];
  namespace?: string;
  usage?: {
    readUnits?: number;
  };
}

export interface VectorMatch {
  id: string;
  score: number;
  values?: number[];
  sparseValues?: {
    indices: number[];
    values: number[];
  };
  metadata?: Record<string, unknown>;
}

// Additional types for vector store implementation
export interface VectorSearchParams {
  query: string | number[];
  queryEmbedding?: number[];
  limit?: number;
  threshold?: number;
  filter?: Record<string, unknown>;
  includeMetadata?: boolean;
}

export interface VectorStoreConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  connectionString?: string;
  tableName: string;
  dimensions: number;
  embeddingDimensions?: number;
  ssl?: boolean;
}

export interface VectorStoreDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class VectorStoreError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'VectorStoreError';
  }
}