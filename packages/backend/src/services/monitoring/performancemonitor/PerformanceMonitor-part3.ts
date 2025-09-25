// System monitoring
private
startSystemMonitoring();
: void
{
  this.systemMetricsInterval = setInterval(() => {
    this.collectSystemMetrics();
  }, 30000); // Every 30 seconds
}

private
collectSystemMetrics();
: void
{
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  // Memory metrics
  this.recordGauge('system_memory_heap_used', memoryUsage.heapUsed, 'bytes');
  this.recordGauge('system_memory_heap_total', memoryUsage.heapTotal, 'bytes');
  this.recordGauge('system_memory_rss', memoryUsage.rss, 'bytes');
  this.recordGauge('system_memory_external', memoryUsage.external, 'bytes');

  // CPU metrics
  this.recordGauge('system_cpu_user', cpuUsage.user, 'microseconds');
  this.recordGauge('system_cpu_system', cpuUsage.system, 'microseconds');

  // Event loop lag
  this.measureEventLoopLag().then((lag) => {
    this.recordGauge('system_event_loop_lag', lag, 'ms');
  });

  // Check for memory leaks
  this.detectMemoryLeaks();
}

private
async;
measureEventLoopLag();
: Promise<number>
{
  return new Promise((resolve) => {
      const start = performance.now();
      setImmediate(() => {
        const lag = performance.now() - start;
        resolve(lag);
      });
    });
}

private
detectMemoryLeaks();
: void
{
  const memoryUsage = process.memoryUsage();
  const currentHeapUsed = memoryUsage.heapUsed;
  const timestamp = Date.now();

  // Store memory usage
  this.memoryLeakDetection.set(timestamp.toString(), currentHeapUsed);

  // Keep only last 10 minutes of data
  const tenMinutesAgo = timestamp - 10 * 60 * 1000;
  for (const [key, _] of this.memoryLeakDetection) {
    if (parseInt(key, 10) < tenMinutesAgo) {
      this.memoryLeakDetection.delete(key);
    }
  }

  // Check for consistent memory growth
  const samples = Array.from(this.memoryLeakDetection.values());
  if (samples.length >= 10) {
    const trend = this.calculateMemoryTrend(samples);
    if (trend > 0.8) {
      // 80% of samples show growth
      logger.warn('Potential memory leak detected', {
        component: 'performance',
        memoryTrend: trend,
        currentHeapUsed: currentHeapUsed,
        samples: samples.length,
      });
    }
  }
}

private
calculateMemoryTrend(samples: number[])
: number
{
  let increases = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i] > samples[i - 1]) {
      increases++;
    }
  }
  return increases / (samples.length - 1);
}

private
setupGCMonitoring();
: void
{
    // Note: In production, you might want to use more sophisticated GC monitoring
    // This is a basic implementation
    if (global.gc) {
      const originalGC = global.gc;
      global.gc = async () => {
        const start = performance.now();
        await originalGC();
        const duration = performance.now() - start;

        this.gcStats.collections++;
        this.gcStats.duration += duration;

        this.recordMetric({
          name: 'gc_collection_duration',
          value: duration,
          unit: 'ms',
          timestamp: Date.now(),
