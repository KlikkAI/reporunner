})
}
}
  }

  // Query and analysis methods
  public getMetrics(name?: string, since?: number): PerformanceMetric[]
{
  let filtered = this.metrics;

  if (name) {
    filtered = filtered.filter((m) => m.name.includes(name));
  }

  if (since) {
    filtered = filtered.filter((m) => m.timestamp >= since);
  }

  return filtered;
}

public
getAverageMetric(name: string, since?: number)
: number
{
  const metrics = this.getMetrics(name, since);
  if (metrics.length === 0) return 0;

  const sum = metrics.reduce((acc, m) => acc + m.value, 0);
  return sum / metrics.length;
}

public
getPercentile(name: string, percentile: number, since?: number)
: number
{
  const metrics = this.getMetrics(name, since);
  if (metrics.length === 0) return 0;

  const sorted = metrics.map((m) => m.value).sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

public
getCurrentSystemMetrics();
: SystemMetrics
{
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      memory: {
        timestamp: Date.now(),
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
      eventLoop: {
        delay: 0, // Would be filled by measureEventLoopLag
        utilization: 0, // Would need additional measurement
      },
      gc: this.gcStats,
    };
}

// Middleware for Express
public
createExpressMiddleware();
{
    return (req: any, res: any, next: any) => {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();

      // Add request ID for tracking
      req.id = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      res.on('finish', () => {
        const duration = performance.now() - startTime;
        const endMemory = process.memoryUsage();

        // Record request metrics
        this.recordMetric({
          name: 'http_request_duration',
          value: duration,
          unit: 'ms',
          timestamp: Date.now(),
          tags: {
            method: req.method,
            route: req.route?.path || req.path,
            status: res.statusCode.toString(),
          },
          metadata: {
            requestId: req.id,
            userAgent: req.get('User-Agent'),
            contentLength: res.get('Content-Length'),
            memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
          },
        });

        // Log request performance
        logger.logRequest(req, res, duration);
      });

      next();
    };
