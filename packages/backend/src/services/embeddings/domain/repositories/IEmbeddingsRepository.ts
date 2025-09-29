// Embeddings Repository Interface
// Extends shared base repository interface to eliminate duplication

import type { IBaseRepository } from '../../../shared/interfaces/IBaseRepository';

export interface IEmbeddingsRepository extends IBaseRepository {
  // Embeddings-specific repository methods would be defined here
  // This extends the shared base interface instead of duplicating it
}

export default IEmbeddingsRepository;
