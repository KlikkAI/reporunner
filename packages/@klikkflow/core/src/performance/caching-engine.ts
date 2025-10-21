import { EventEmitter } from 'node:events';
import { Logger } from '@klikkflow/core';
import { z } from 'zod';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  compress?: boolean;
  serialize?: boolean;
}

export interface CacheStats {
  totalKeys: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: {
    used: number;
    available: number;
    percentage: number;
  };
  topKeys: Array<{
    key: string;
    accessCount: number;
    size: number;
  }>;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxKeys: number; // Maximum number of keys
  defaultTtl: number; // Default TTL in seconds
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'random';
  compressionThreshold: number; // Compress values larger than this (bytes)
  enableStats: boolean;
  enablePersistence: boolean;
  persistenceInterval: number; // Persistence interval in seconds
}

const CacheConfigSchema = z.object({
  maxSize: z.number().positive(),
  maxKeys: z.number().positive(),
  defaultTtl: z.number().positive(),
  evictionPolicy: z.enum(['lru', 'lfu', 'ttl', 'random']),
  compressionThreshold: z.number().positive(),
  enableStats: z.boolean(),
  enablePersistence: z.boolean(),
  persistenceInterval: z.number().positive(),
});

export class CachingEngine extends EventEmitter {
  private logger: Logger;
  private config: CacheConfig;
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = []; // For LRU
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    this.logger = new Logger('CachingEngine');

    this.config = CacheConfigSchema.parse({
      maxSize: 100 * 1024 * 1024, // 100MB
      maxKeys: 10000,
      defaultTtl: 3600, // 1 hour
      evictionPolicy: 'lru',
      compressionThreshold: 1024, // 1KB
      enableStats: true,
      enablePersistence: false,
      persistenceInterval: 300, // 5 minutes
      ...config,
    });

    this.startCleanupInterval();

    if (this.config.enablePersistence) {
      this.startPersistenceInterval();
    }
  }

  /**
   * Set a value in the cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.config.defaultTtl;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttl * 1000);

      // Serialize and compress if needed
      let processedValue = value;
      if (options.serialize !== false) {
        processedValue = JSON.stringify(value) as any;
      }

      if (options.compress && this.shouldCompress(processedValue)) {
        processedValue = await this.compress(processedValue);
      }

      const entry: CacheEntry<T> = {
        key,
        value: processedValue,
        ttl,
        createdAt: now,
        expiresAt,
        accessCount: 0,
        lastAccessed: now,
        tags: options.tags,
        metadata: {
          compressed: options.compress && this.shouldCompress(value),
          serialized: options.serialize !== false,
          priority: options.priority || 'medium',
          originalSize: this.getSize(value),
        },
      };

      // Check if we need to evict entries
      await this.ensureCapacity(entry);

      // Set the entry
      this.cache.set(key, entry);
      this.updateAccessOrder(key);
      this.updateStats('set', entry);

      this.emit('set', { key, value, options });

      this.logger.debug('Cache entry set', {
        key,
        ttl,
        size: this.getSize(processedValue),
        compressed: entry.metadata?.compressed,
      });
    } catch (error) {
      this.logger.error('Failed to set cache entry', { error, key });
      throw error;
    }
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        this.emit('miss', { key });
        return null;
      }

      // Check if expired
      if (this.isExpired(entry)) {
        await this.delete(key);
        this.stats.misses++;
        this.emit('miss', { key, reason: 'expired' });
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = new Date();
      this.updateAccessOrder(key);
      this.stats.hits++;

      // Decompress and deserialize if needed
      let value = entry.value;
      if (entry.metadata?.compressed) {
        value = await this.decompress(value);
      }

      if (entry.metadata?.serialized) {
        value = JSON.parse(value as string);
      }

      this.emit('hit', { key, value });

      this.logger.debug('Cache hit', {
        key,
        accessCount: entry.accessCount,
        age: Date.now() - entry.createdAt.getTime(),
      });

      return value as T;
    } catch (error) {
      this.logger.error('Failed to get cache entry', { error, key });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Delete a value from the cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const entry = this.cache.get(key);
      if (!entry) {
        return false;
      }

      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.updateStats('delete', entry);

      this.emit('delete', { key });

      this.logger.debug('Cache entry deleted', { key });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete cache entry', { error, key });
      return false;
    }
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const keyCount = this.cache.size;
      this.cache.clear();
      this.accessOrder = [];
      this.stats.totalSize = 0;

      this.emit('clear', { keyCount });

      this.logger.info('Cache cleared', { keyCount });
    } catch (error) {
      this.logger.error('Failed to clear cache', { error });
      throw error;
    }
  }

  /**
   * Delete entries by tags
   */
  async deleteByTags(tags: string[]): Promise<number> {
    try {
      let deletedCount = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.tags?.some((tag) => tags.includes(tag))) {
          await this.delete(key);
          deletedCount++;
        }
      }

      this.emit('deleteByTags', { tags, deletedCount });

      this.logger.info('Cache entries deleted by tags', { tags, deletedCount });
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to delete cache entries by tags', { error, tags });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;

    // Calculate memory usage
    const maxSize = this.config.maxSize;
    const usedSize = this.stats.totalSize;
    const memoryUsage = {
      used: usedSize,
      available: maxSize - usedSize,
      percentage: (usedSize / maxSize) * 100,
    };

    // Get top accessed keys
    const topKeys = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        size: this.getSize(entry.value),
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      totalKeys: this.cache.size,
      totalSize: this.stats.totalSize,
      hitRate,
      missRate,
      evictionCount: this.stats.evictions,
      memoryUsage,
      topKeys,
    };
  }

  /**
   * Get or set with a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Generate value using factory
      const value = await factory();

      // Set in cache
      await this.set(key, value, options);

      return value;
    } catch (error) {
      this.logger.error('Failed to get or set cache entry', { error, key });
      throw error;
    }
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};

    for (const key of keys) {
      results[key] = await this.get<T>(key);
    }

    return results;
  }

  /**
   * Batch set multiple key-value pairs
   */
  async mset<T>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.options);
    }
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, delta: number = 1): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const newValue = current + delta;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Decrement a numeric value
   */
  async decrement(key: string, delta: number = 1): Promise<number> {
    return this.increment(key, -delta);
  }

  /**
   * Set expiration for an existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    entry.ttl = ttl;
    entry.expiresAt = new Date(Date.now() + ttl * 1000);

    return true;
  }

  /**
   * Get TTL for a key
   */
  getTTL(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const remaining = entry.expiresAt.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  private async ensureCapacity(newEntry: CacheEntry): Promise<void> {
    const newEntrySize = this.getSize(newEntry.value);

    // Check if we need to evict by size
    while (this.stats.totalSize + newEntrySize > this.config.maxSize && this.cache.size > 0) {
      await this.evictOne();
    }

    // Check if we need to evict by key count
    while (this.cache.size >= this.config.maxKeys) {
      await this.evictOne();
    }
  }

  private async evictOne(): Promise<void> {
    let keyToEvict: string | null = null;

    switch (this.config.evictionPolicy) {
      case 'lru':
        keyToEvict = this.accessOrder[0] || null;
        break;

      case 'lfu':
        keyToEvict = this.findLFUKey();
        break;

      case 'ttl':
        keyToEvict = this.findEarliestExpiringKey();
        break;

      case 'random': {
        const keys = Array.from(this.cache.keys());
        keyToEvict = keys[Math.floor(Math.random() * keys.length)] || null;
        break;
      }
    }

    if (keyToEvict) {
      await this.delete(keyToEvict);
      this.stats.evictions++;
      this.emit('evict', { key: keyToEvict, policy: this.config.evictionPolicy });
    }
  }

  private findLFUKey(): string | null {
    let minAccessCount = Number.POSITIVE_INFINITY;
    let lfuKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount;
        lfuKey = key;
      }
    }

    return lfuKey;
  }

  private findEarliestExpiringKey(): string | null {
    let earliestExpiry = Number.POSITIVE_INFINITY;
    let ttlKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt.getTime() < earliestExpiry) {
        earliestExpiry = entry.expiresAt.getTime();
        ttlKey = key;
      }
    }

    return ttlKey;
  }

  private updateAccessOrder(key: string): void {
    // Remove from current position
    this.removeFromAccessOrder(key);
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt.getTime();
  }

  private getSize(value: any): number {
    if (typeof value === 'string') {
      return Buffer.byteLength(value, 'utf8');
    }

    if (Buffer.isBuffer(value)) {
      return value.length;
    }

    // Estimate size for objects
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  }

  private shouldCompress(value: any): boolean {
    return this.getSize(value) > this.config.compressionThreshold;
  }

  private async compress(value: any): Promise<any> {
    // In a real implementation, you'd use a compression library like zlib
    // For now, we'll just return the value as-is
    return value;
  }

  private async decompress(value: any): Promise<any> {
    // In a real implementation, you'd decompress using zlib
    // For now, we'll just return the value as-is
    return value;
  }

  private updateStats(operation: 'set' | 'delete', entry: CacheEntry): void {
    const size = this.getSize(entry.value);

    if (operation === 'set') {
      this.stats.totalSize += size;
    } else if (operation === 'delete') {
      this.stats.totalSize -= size;
    }
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000);
  }

  private startPersistenceInterval(): void {
    // Persist cache to disk periodically
    setInterval(() => {
      this.persistCache();
    }, this.config.persistenceInterval * 1000);
  }

  private cleanupExpired(): void {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt.getTime()) {
        this.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug('Cleaned up expired cache entries', { cleanedCount });
      this.emit('cleanup', { cleanedCount });
    }
  }

  private async persistCache(): Promise<void> {
    try {
      // In a real implementation, you'd persist to Redis, file system, etc.
      this.logger.debug('Cache persistence completed', {
        keyCount: this.cache.size,
        totalSize: this.stats.totalSize,
      });
    } catch (error) {
      this.logger.error('Failed to persist cache', { error });
    }
  }
}

export default CachingEngine;
