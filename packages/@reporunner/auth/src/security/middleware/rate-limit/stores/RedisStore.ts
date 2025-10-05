import Redis from 'ioredis';
import type { Store } from './Store';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export class RedisStore implements Store {
  private client: Redis;
  private prefix: string;

  constructor(config: RedisConfig) {
    this.client = new Redis(config);
    this.prefix = 'rate-limit:';
  }

  public async getHits(key: string, windowStart: number): Promise<number> {
    const hits = await this.client.zrangebyscore(this.getKey(key), windowStart, '+inf');
    return hits.length;
  }

  public async incrementHits(key: string, timestamp: number, windowMs: number): Promise<void> {
    const redisKey = this.getKey(key);

    // Use Redis transaction to ensure atomicity
    await this.client
      .multi()
      // Add new hit
      .zadd(redisKey, timestamp, `${timestamp}`)
      // Remove old hits
      .zremrangebyscore(redisKey, '-inf', timestamp - windowMs)
      // Set expiry
      .expire(redisKey, Math.ceil(windowMs / 1000))
      .exec();
  }

  public async resetKey(key: string): Promise<void> {
    await this.client.del(this.getKey(key));
  }

  public async deleteOldHits(windowStart: number): Promise<void> {
    // Get all rate limit keys
    const keys = await this.client.keys(`${this.prefix}*`);

    // Remove old hits from each key
    for (const key of keys) {
      await this.client.zremrangebyscore(key, '-inf', windowStart);
    }
  }

  /**
   * Get Redis key with prefix
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Close Redis connection
   */
  public async shutdown(): Promise<void> {
    await this.client.quit();
  }
}
