// Shared base repository interface
// Eliminates 6 identical repository interface duplications

import type { IRepositoryWithPagination } from '../../interfaces/IRepository';

/**
 * Base repository interface that all specific repositories should extend.
 */
export interface IBaseRepository<T = unknown> extends IRepositoryWithPagination<T> {}

// Export type for convenience
export type BaseRepository = IBaseRepository;
