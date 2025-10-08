export interface ResourceLimits {
  cpu: {
    maxCores: number;
    maxUsagePercent: number;
  };
  memory: {
    maxGB: number;
    maxUsagePercent: number;
  };
  storage: {
    maxGB: number;
    maxUsagePercent: number;
  };
  network: {
    maxBandwidthMbps: number;
    maxConnections: number;
  };
}

export interface ResourceUsage {
  timestamp: Date;
  cpu: {
    usage: number; // percentage
    cores: number;
    load: number[];
  };
  memory: {
    used: number; // GB
    available: number; // GB
    usage: number; // percentage
  };
  storage: {
    used: number; // GB
    available: number; // GB
    usage: number; // percentage
  };
  network: {
    rx: number; // bytes/sec
    tx: number; // bytes/sec
    connections: number;
  };
}

export interface WorkflowResourceProfile {
  workflowId: string;
  organizationId: string;
  estimatedResources: {
    cpu: number;
    memory: number;
    storage: number;
    duration: number; // ms
  };
  priority: 'low' | 'normal' | 'high' | 'critical';
  constraints: {
    maxConcurrent: number;
    timeout: number;
    retries: number;
  };
}

export interface ScalingPolicy {
  id: string;
  name: string;
  organizationId: string;
  triggers: Array<{
    metric: 'cpu' | 'memory' | 'queue_size' | 'response_time';
    threshold: number;
    duration: number; // seconds
    operator: 'greater_than' | 'less_than';
  }>;
  actions: Array<{
    type: 'scale_up' | 'scale_down' | 'notification' | 'throttle';
    parameters: Record<string, unknown>;
  }>;
  cooldown: number; // seconds
  enabled: boolean;
}

export interface ResourcePool {
  id: string;
  name: string;
  organizationId?: string;
  limits: ResourceLimits;
  currentUsage: ResourceUsage;
  allocatedWorkflows: string[];
  status: 'available' | 'overloaded' | 'maintenance';
}

export class ResourceManager {
  private pools = new Map<string, ResourcePool>();
  private profiles = new Map<string, WorkflowResourceProfile>();
  private policies = new Map<string, ScalingPolicy>();
  private usageHistory: ResourceUsage[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.startMonitoring();
  }

  async createResourcePool(
    pool: Omit<ResourcePool, 'id' | 'currentUsage' | 'allocatedWorkflows' | 'status'>
  ): Promise<string> {
    const newPool: ResourcePool = {
      ...pool,
      id: this.generateId(),
      currentUsage: await this.getCurrentSystemUsage(),
      allocatedWorkflows: [],
      status: 'available',
    };

    this.pools.set(newPool.id, newPool);
    return newPool.id;
  }

  async allocateResources(
    workflowId: string,
    profile: WorkflowResourceProfile
  ): Promise<{
    allocated: boolean;
    poolId?: string;
    reason?: string;
  }> {
    // Find best pool for allocation
    const suitablePool = await this.findSuitablePool(profile);

    if (!suitablePool) {
      return {
        allocated: false,
        reason: 'No available resource pool with sufficient capacity',
      };
    }

    // Check if allocation would exceed limits
    const wouldExceedLimits = this.wouldExceedLimits(suitablePool, profile);
    if (wouldExceedLimits) {
      return {
        allocated: false,
        reason: 'Allocation would exceed resource limits',
      };
    }

    // Allocate resources
    suitablePool.allocatedWorkflows.push(workflowId);
    this.profiles.set(workflowId, profile);

    // Update pool usage estimation
    await this.updatePoolUsage(suitablePool.id);

    return {
      allocated: true,
      poolId: suitablePool.id,
    };
  }

  async deallocateResources(workflowId: string): Promise<boolean> {
    // Find pool containing this workflow
    const pool = Array.from(this.pools.values()).find((p) =>
      p.allocatedWorkflows.includes(workflowId)
    );

    if (!pool) {
      return false;
    }

    // Remove allocation
    const index = pool.allocatedWorkflows.indexOf(workflowId);
    pool.allocatedWorkflows.splice(index, 1);

    // Remove profile
    this.profiles.delete(workflowId);

    // Update pool usage
    await this.updatePoolUsage(pool.id);

    return true;
  }

  async addScalingPolicy(policy: Omit<ScalingPolicy, 'id'>): Promise<string> {
    const newPolicy: ScalingPolicy = {
      ...policy,
      id: this.generateId(),
    };

    this.policies.set(newPolicy.id, newPolicy);
    return newPolicy.id;
  }

  async updateScalingPolicy(id: string, updates: Partial<ScalingPolicy>): Promise<boolean> {
    const policy = this.policies.get(id);
    if (!policy) {
      return false;
    }

    Object.assign(policy, updates);
    return true;
  }

  async removeScalingPolicy(id: string): Promise<boolean> {
    return this.policies.delete(id);
  }

  async getResourceUsage(poolId?: string): Promise<ResourceUsage | ResourceUsage[]> {
    if (poolId) {
      const pool = this.pools.get(poolId);
      return pool ? pool.currentUsage : await this.getCurrentSystemUsage();
    }

    return this.usageHistory.slice(-100); // Last 100 measurements
  }

  async getResourcePools(organizationId?: string): Promise<ResourcePool[]> {
    const pools = Array.from(this.pools.values());

    if (organizationId) {
      return pools.filter((p) => p.organizationId === organizationId);
    }

    return pools;
  }

  async optimizeAllocation(): Promise<{
    optimized: boolean;
    changes: Array<{ workflowId: string; fromPool: string; toPool: string; reason: string }>;
  }> {
    const changes: Array<{ workflowId: string; fromPool: string; toPool: string; reason: string }> =
      [];

    // Analyze current allocations
    for (const pool of this.pools.values()) {
      if (pool.status === 'overloaded') {
        // Try to move some workflows to other pools
        const movableWorkflows = this.findMovableWorkflows(pool);

        for (const workflowId of movableWorkflows) {
          const profile = this.profiles.get(workflowId);
          if (!profile) {
            continue;
          }

          const betterPool = await this.findBetterPool(workflowId, pool.id, profile);
          if (betterPool) {
            // Move workflow
            await this.moveWorkflow(workflowId, pool.id, betterPool.id);
            changes.push({
              workflowId,
              fromPool: pool.id,
              toPool: betterPool.id,
              reason: 'Load balancing optimization',
            });
          }
        }
      }
    }

    return {
      optimized: changes.length > 0,
      changes,
    };
  }

  async checkResourceHealth(): Promise<{
    healthy: boolean;
    issues: Array<{
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  }> {
    const issues: Array<{
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }> = [];

    // Check each pool
    for (const pool of this.pools.values()) {
      const usage = pool.currentUsage;

      // CPU usage check
      if (usage.cpu.usage > 90) {
        issues.push({
          type: 'high_cpu_usage',
          message: `Pool ${pool.name} has ${usage.cpu.usage}% CPU usage`,
          severity: 'critical',
        });
      } else if (usage.cpu.usage > 75) {
        issues.push({
          type: 'high_cpu_usage',
          message: `Pool ${pool.name} has ${usage.cpu.usage}% CPU usage`,
          severity: 'high',
        });
      }

      // Memory usage check
      if (usage.memory.usage > 90) {
        issues.push({
          type: 'high_memory_usage',
          message: `Pool ${pool.name} has ${usage.memory.usage}% memory usage`,
          severity: 'critical',
        });
      } else if (usage.memory.usage > 75) {
        issues.push({
          type: 'high_memory_usage',
          message: `Pool ${pool.name} has ${usage.memory.usage}% memory usage`,
          severity: 'high',
        });
      }

      // Storage usage check
      if (usage.storage.usage > 95) {
        issues.push({
          type: 'high_storage_usage',
          message: `Pool ${pool.name} has ${usage.storage.usage}% storage usage`,
          severity: 'critical',
        });
      }
    }

    return {
      healthy: issues.filter((i) => i.severity === 'critical').length === 0,
      issues,
    };
  }

  private async findSuitablePool(
    profile: WorkflowResourceProfile
  ): Promise<ResourcePool | undefined> {
    const availablePools = Array.from(this.pools.values())
      .filter((p) => p.status === 'available')
      .filter((p) => !p.organizationId || p.organizationId === profile.organizationId);

    // Score pools based on available resources and load
    const scoredPools = availablePools.map((pool) => ({
      pool,
      score: this.calculatePoolScore(pool, profile),
    }));

    // Sort by score (higher is better)
    scoredPools.sort((a, b) => b.score - a.score);

    return scoredPools.length > 0 ? scoredPools[0].pool : undefined;
  }

  private calculatePoolScore(pool: ResourcePool, profile: WorkflowResourceProfile): number {
    const usage = pool.currentUsage;
    const limits = pool.limits;

    // Calculate remaining capacity
    const cpuCapacity = (limits.cpu.maxUsagePercent - usage.cpu.usage) / 100;
    const memoryCapacity = (limits.memory.maxGB - usage.memory.used) / limits.memory.maxGB;
    const storageCapacity = (limits.storage.maxGB - usage.storage.used) / limits.storage.maxGB;

    // Check if pool can handle the estimated load
    const cpuFit = cpuCapacity >= profile.estimatedResources.cpu / 100;
    const memoryFit = memoryCapacity >= profile.estimatedResources.memory / limits.memory.maxGB;

    if (!(cpuFit && memoryFit)) {
      return 0;
    }

    // Score based on available capacity and current load
    return cpuCapacity * 0.4 + memoryCapacity * 0.4 + storageCapacity * 0.2;
  }

  private wouldExceedLimits(pool: ResourcePool, profile: WorkflowResourceProfile): boolean {
    const estimatedCpuUsage = pool.currentUsage.cpu.usage + profile.estimatedResources.cpu;
    const estimatedMemoryUsage =
      pool.currentUsage.memory.used + profile.estimatedResources.memory / 1024;

    return (
      estimatedCpuUsage > pool.limits.cpu.maxUsagePercent ||
      estimatedMemoryUsage > pool.limits.memory.maxGB
    );
  }

  private async updatePoolUsage(poolId: string): Promise<void> {
    const pool = this.pools.get(poolId);
    if (!pool) {
      return;
    }

    // Update current usage
    pool.currentUsage = await this.getCurrentSystemUsage();

    // Update pool status based on usage
    const usage = pool.currentUsage;
    if (usage.cpu.usage > 90 || usage.memory.usage > 90) {
      pool.status = 'overloaded';
    } else {
      pool.status = 'available';
    }
  }

  private async getCurrentSystemUsage(): Promise<ResourceUsage> {
    // TODO: Implement actual system monitoring using systeminformation
    // For now, return mock data
    return {
      timestamp: new Date(),
      cpu: {
        usage: Math.random() * 100,
        cores: 4,
        load: [0.5, 0.7, 0.3],
      },
      memory: {
        used: Math.random() * 8,
        available: 8,
        usage: Math.random() * 100,
      },
      storage: {
        used: Math.random() * 100,
        available: 500,
        usage: Math.random() * 100,
      },
      network: {
        rx: Math.random() * 1000000,
        tx: Math.random() * 1000000,
        connections: Math.floor(Math.random() * 100),
      },
    };
  }

  private findMovableWorkflows(pool: ResourcePool): string[] {
    // Find workflows with low priority that can be moved
    return pool.allocatedWorkflows.filter((workflowId) => {
      const profile = this.profiles.get(workflowId);
      return profile && profile.priority === 'low';
    });
  }

  private async findBetterPool(
    _workflowId: string,
    currentPoolId: string,
    profile: WorkflowResourceProfile
  ): Promise<ResourcePool | undefined> {
    const _otherPools = Array.from(this.pools.values()).filter(
      (p) => p.id !== currentPoolId && p.status === 'available'
    );

    return this.findSuitablePool(profile);
  }

  private async moveWorkflow(
    workflowId: string,
    fromPoolId: string,
    toPoolId: string
  ): Promise<void> {
    const fromPool = this.pools.get(fromPoolId);
    const toPool = this.pools.get(toPoolId);

    if (!(fromPool && toPool)) {
      return;
    }

    // Remove from old pool
    const index = fromPool.allocatedWorkflows.indexOf(workflowId);
    if (index !== -1) {
      fromPool.allocatedWorkflows.splice(index, 1);
    }

    // Add to new pool
    toPool.allocatedWorkflows.push(workflowId);

    // Update both pools
    await this.updatePoolUsage(fromPoolId);
    await this.updatePoolUsage(toPoolId);
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      // Update usage for all pools
      for (const poolId of this.pools.keys()) {
        await this.updatePoolUsage(poolId);
      }

      // Add to history
      const currentUsage = await this.getCurrentSystemUsage();
      this.usageHistory.push(currentUsage);

      // Keep only last 1000 measurements
      if (this.usageHistory.length > 1000) {
        this.usageHistory = this.usageHistory.slice(-1000);
      }

      // Check scaling policies
      await this.evaluateScalingPolicies();
    }, 30000); // Every 30 seconds
  }

  private async evaluateScalingPolicies(): Promise<void> {
    for (const policy of this.policies.values()) {
      if (!policy.enabled) {
      }

      // TODO: Implement scaling policy evaluation
      // This would check triggers and execute actions
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

export * from './monitoring';
export * from './scaling';
