import type { Store } from './Store';

interface Hit {
  timestamp: number;
}

interface KeyData {
  hits: Hit[];
}

export class MemoryStore implements Store {
  private store: Map<string, KeyData>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.store = new Map();

    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.deleteOldHits(Date.now() - 24 * 60 * 60 * 1000); // Clean up hits older than 24 hours
    }, 60 * 1000);
  }

  public async getHits(key: string, windowStart: number): Promise<number> {
    const data = this.store.get(key);
    if (!data) {
      return 0;
    }

    return data.hits.filter((hit) => hit.timestamp >= windowStart).length;
  }

  public async incrementHits(key: string, timestamp: number, windowMs: number): Promise<void> {
    let data = this.store.get(key);

    if (!data) {
      data = { hits: [] };
      this.store.set(key, data);
    }

    // Add new hit
    data.hits.push({ timestamp });

    // Clean up old hits for this key
    const windowStart = timestamp - windowMs;
    data.hits = data.hits.filter((hit) => hit.timestamp >= windowStart);
  }

  public async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async deleteOldHits(windowStart: number): Promise<void> {
    for (const [key, data] of this.store.entries()) {
      data.hits = data.hits.filter((hit) => hit.timestamp >= windowStart);

      // Remove key if no hits remain
      if (data.hits.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Stop cleanup interval
   */
  public shutdown(): void {
    clearInterval(this.cleanupInterval);
  }
}
