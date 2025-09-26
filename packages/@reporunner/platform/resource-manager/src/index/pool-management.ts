return pool ? pool.currentUsage : await this.getCurrentSystemUsage();
}

return this.usageHistory.slice(-100); // Last 100 measurements
}

  async getResourcePools(organizationId?: string): Promise<ResourcePool[]>
{
  const pools = Array.from(this.pools.values());

  if (organizationId) {
    return pools.filter((p) => p.organizationId === organizationId);
  }

  return pools;
}

async;
optimizeAllocation();
: Promise<
{
  optimized: boolean;
  changes: Array<{ workflowId: string; fromPool: string; toPool: string; reason: string }>;
}
>
{
  const changes: Array<{ workflowId: string; fromPool: string; toPool: string; reason: string }> =
    [];

  // Analyze current allocations
  for (const pool of this.pools.values()) {
    if (pool.status === 'overloaded') {
      // Try to move some workflows to other pools
      const movableWorkflows = this.findMovableWorkflows(pool);

      for (const workflowId of movableWorkflows) {
        const profile = this.profiles.get(workflowId);
        if (!profile) continue;

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

async;
checkResourceHealth();
: Promise<
{
  healthy: boolean;
  issues: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}
>
{
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
