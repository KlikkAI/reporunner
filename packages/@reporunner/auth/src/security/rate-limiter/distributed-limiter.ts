import { AdvancedRateLimiter, type RateLimiterConfig } from '../rate-limiter';

/**
 * Distributed rate limiter for multi-instance deployments
 * Extends the advanced rate limiter with clustering support
 */
export class DistributedRateLimiter extends AdvancedRateLimiter {
  private nodeId: string;
  private clusterNodes: Set<string> = new Set();

  constructor(config: RateLimiterConfig & { nodeId?: string } = {}) {
    super(config);
    this.nodeId = config.nodeId || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register this node in the cluster
   */
  async registerNode(): Promise<void> {
    // Implementation would register this node with Redis or service discovery
    this.clusterNodes.add(this.nodeId);
  }

  /**
   * Cleanup resources and disconnect
   */
  async cleanup(): Promise<void> {
    this.clusterNodes.delete(this.nodeId);
    await super.cleanup();
  }

  /**
   * Get cluster information
   */
  getClusterInfo(): { nodeId: string; clusterSize: number } {
    return {
      nodeId: this.nodeId,
      clusterSize: this.clusterNodes.size,
    };
  }
}

// Export singleton instance
export const distributedRateLimiter = new DistributedRateLimiter();

export default DistributedRateLimiter;
