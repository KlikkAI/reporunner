// VersionControl Repository Interface
// Extends shared base repository interface to eliminate duplication

import { IBaseRepository } from '../../../shared/interfaces/IBaseRepository';

export interface IVersionControlRepository extends IBaseRepository {
  // VersionControl-specific repository methods would be defined here
  // This extends the shared base interface instead of duplicating it
}

export default IVersionControlRepository;
