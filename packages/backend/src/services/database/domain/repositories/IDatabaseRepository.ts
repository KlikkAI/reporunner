// Database Repository Interface
// Extends shared base repository interface to eliminate duplication

import type { IBaseRepository } from '../../../shared/interfaces/IBaseRepository';

export interface IDatabaseRepository extends IBaseRepository {
  // Database-specific repository methods would be defined here
  // This extends the shared base interface instead of duplicating it
}

export default IDatabaseRepository;
