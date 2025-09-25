/**
 * Core interfaces for dependency injection and consistent architecture
 */

export interface ILogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
}

export interface IEventBus {
  publish(event: string, payload: unknown): Promise<void>;
  subscribe(event: string, handler: (payload: unknown) => Promise<void>): Promise<void>;
  unsubscribe(event: string, handler: (payload: unknown) => Promise<void>): Promise<void>;
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  save(entity: T): Promise<void>;
  update(id: string, entity: Partial<T>): Promise<void>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(filter?: Record<string, unknown>): Promise<number>;
}

export interface IService {
  healthCheck(): Promise<{ healthy: boolean; details?: Record<string, unknown> }>;
  dispose(): Promise<void>;
}

export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

export interface IMapper<TSource, TTarget> {
  toTarget(source: TSource): TTarget;
  toSource(target: TTarget): TSource;
}
