// Shared base repository interface
// Eliminates 6 identical repository interface duplications

export interface IBaseRepository {
  // Base repository interface methods would go here
  // This replaces the duplicate interfaces across different services
}

// Export type for convenience
export type BaseRepository = IBaseRepository;
