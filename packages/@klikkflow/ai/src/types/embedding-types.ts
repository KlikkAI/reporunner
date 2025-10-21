// Embedding types reusing patterns from workflow-types.ts

export interface EmbeddingRequest {
  input: string | string[];
  model: string;
  encodingFormat?: 'float' | 'base64';
  dimensions?: number;
  user?: string;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingResponse {
  object: 'list';
  data: EmbeddingData[];
  model: string;
  usage: EmbeddingUsage;
}

export interface EmbeddingData {
  object: 'embedding';
  index: number;
  embedding: number[];
}

export interface EmbeddingUsage {
  promptTokens: number;
  totalTokens: number;
}

export interface EmbeddingModelInfo {
  id: string;
  name: string;
  description?: string;
  dimensions: number;
  maxTokens: number;
  pricing?: {
    input: number;
    currency: string;
  };
  supportedFormats: ('float' | 'base64')[];
}

export interface EmbeddingComparison {
  similarity: number;
  distance: number;
  method: 'cosine' | 'euclidean' | 'dot_product';
  confidence?: number;
}

export interface EmbeddingSearchOptions {
  vector: number[];
  limit?: number;
  threshold?: number;
  filter?: Record<string, unknown>;
  includeMetadata?: boolean;
  includeValues?: boolean;
}

export interface EmbeddingSearchResult {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, unknown>;
  content?: string;
}
