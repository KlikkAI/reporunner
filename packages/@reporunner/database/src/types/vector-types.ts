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
