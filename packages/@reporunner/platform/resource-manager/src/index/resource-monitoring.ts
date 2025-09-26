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
  ): Promise<ResourcePool | undefined>
{
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

private
calculatePoolScore(pool: ResourcePool, profile: WorkflowResourceProfile)
: number
{
  const usage = pool.currentUsage;
  const limits = pool.limits;

  // Calculate remaining capacity
  const cpuCapacity = (limits.cpu.maxUsagePercent - usage.cpu.usage) / 100;
  const memoryCapacity = (limits.memory.maxGB - usage.memory.used) / limits.memory.maxGB;
  const storageCapacity = (limits.storage.maxGB - usage.storage.used) / limits.storage.maxGB;

  // Check if pool can handle the estimated load
  const cpuFit = cpuCapacity >= profile.estimatedResources.cpu / 100;
  const memoryFit = memoryCapacity >= profile.estimatedResources.memory / limits.memory.maxGB;

  if (!cpuFit || !memoryFit) return 0;

  // Score based on available capacity and current load
  return cpuCapacity * 0.4 + memoryCapacity * 0.4 + storageCapacity * 0.2;
}

private
wouldExceedLimits(pool: ResourcePool, profile: WorkflowResourceProfile)
: boolean
{
  const estimatedCpuUsage = pool.currentUsage.cpu.usage + profile.estimatedResources.cpu;
  const estimatedMemoryUsage =
    pool.currentUsage.memory.used + profile.estimatedResources.memory / 1024;

  return (
      estimatedCpuUsage > pool.limits.cpu.maxUsagePercent ||
      estimatedMemoryUsage > pool.limits.memory.maxGB
    );
}

private
async;
updatePoolUsage(poolId: string)
: Promise<void>
{
  const pool = this.pools.get(poolId);
  if (!pool) return;

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

private
async;
getCurrentSystemUsage();
: Promise<ResourceUsage>
{
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
