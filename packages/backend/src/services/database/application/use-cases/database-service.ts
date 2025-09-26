import {
  BaseCreateUseCase,
  BaseGetByIdUseCase,
  BaseUpdateUseCase,
  BaseDeleteUseCase,
  BaseInitializeUseCase,
  IRepository
} from '@reporunner/shared';
import { injectable, inject } from 'inversify';

// Consolidated database service using shared base classes
// Replaces 5 individual CRUD use-case files

@injectable()
export class DatabaseService {
  constructor(
    @inject('DatabaseRepository')
    private repository: IRepository<any>
  ) {}

  // Create operations
  async create(data: any) {
    const createUseCase = new BaseCreateUseCase(this.repository);
    return createUseCase.execute(data);
  }

  // Read operations
  async getById(id: string) {
    const getUseCase = new BaseGetByIdUseCase(this.repository);
    return getUseCase.execute(id);
  }

  // Update operations
  async update(id: string, data: any) {
    const updateUseCase = new BaseUpdateUseCase(this.repository);
    return updateUseCase.execute({ id, data });
  }

  // Delete operations
  async delete(id: string) {
    const deleteUseCase = new BaseDeleteUseCase(this.repository);
    return deleteUseCase.execute(id);
  }

  // Initialize service
  async initialize() {
    const initUseCase = new BaseInitializeUseCase(this.repository);
    return initUseCase.execute();
  }

  // Service-specific getInstance method
  static getInstance() {
    // Implement singleton pattern if needed
    return new DatabaseService(/* inject repository */);
  }
}

export default DatabaseService;
