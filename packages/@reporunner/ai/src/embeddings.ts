export interface EmbeddingModel {
  modelName: string;
  dimensions: number;
  maxTokens: number;
}

export interface EmbeddingOptions {
  model?: string;
  batchSize?: number;
  dimensions?: number;
}

export abstract class EmbeddingProvider {
  protected model: EmbeddingModel;
  protected options: EmbeddingOptions;

  constructor(model: EmbeddingModel, options: EmbeddingOptions = {}) {
    this.model = model;
    this.options = options;
  }

  abstract embed(texts: string[]): Promise<number[][]>;
  abstract embedSingle(text: string): Promise<number[]>;
  
  async embedDocuments(documents: string[]): Promise<number[][]> {
    const batchSize = this.options.batchSize || 10;
    const embeddings: number[][] = [];
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const batchEmbeddings = await this.embed(batch);
      embeddings.push(...batchEmbeddings);
    }
    
    return embeddings;
  }

  async embedQuery(query: string): Promise<number[]> {
    return this.embedSingle(query);
  }

  getDimensions(): number {
    return this.model.dimensions;
  }

  getModelName(): string {
    return this.model.modelName;
  }
}

export class OpenAIEmbeddings extends EmbeddingProvider {
  constructor(apiKey?: string, options: EmbeddingOptions = {}) {
    super(
      {
        modelName: options.model || 'text-embedding-ada-002',
        dimensions: 1536,
        maxTokens: 8192,
      },
      options
    );
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Mock implementation
    console.log('Embedding texts with OpenAI');
    return texts.map(() => this.generateMockEmbedding());
  }

  async embedSingle(text: string): Promise<number[]> {
    // Mock implementation
    console.log('Embedding single text with OpenAI');
    return this.generateMockEmbedding();
  }

  private generateMockEmbedding(): number[] {
    return Array(this.model.dimensions).fill(0).map(() => Math.random() * 2 - 1);
  }
}

export class HuggingFaceEmbeddings extends EmbeddingProvider {
  constructor(modelName = 'sentence-transformers/all-MiniLM-L6-v2', options: EmbeddingOptions = {}) {
    super(
      {
        modelName,
        dimensions: options.dimensions || 384,
        maxTokens: 512,
      },
      options
    );
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Mock implementation
    console.log('Embedding texts with HuggingFace');
    return texts.map(() => this.generateMockEmbedding());
  }

  async embedSingle(text: string): Promise<number[]> {
    // Mock implementation
    console.log('Embedding single text with HuggingFace');
    return this.generateMockEmbedding();
  }

  private generateMockEmbedding(): number[] {
    return Array(this.model.dimensions).fill(0).map(() => Math.random() * 2 - 1);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}