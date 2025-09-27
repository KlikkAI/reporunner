export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  setex<T>(key: string, ttl: number, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  del(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  delMany(keys: string[]): Promise<void>;
}
