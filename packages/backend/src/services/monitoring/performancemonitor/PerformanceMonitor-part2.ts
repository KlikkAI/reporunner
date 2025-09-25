context: timer.context, component;
: 'performance',
      })
}

return duration;
}

  public measureOperation<T>(
    name: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T>
{
  return new Promise(async (resolve, reject) => {
      const timerId = this.startTimer(name, context);
      const startMemory = process.memoryUsage();

      try {
        const result = await operation();
        const duration = this.endTimer(timerId);
        const endMemory = process.memoryUsage();

        // Track memory usage
        this.recordMetric({
          name: `${name}_memory_delta`,
          value: endMemory.heapUsed - startMemory.heapUsed,
          unit: 'bytes',
          timestamp: Date.now(),
          metadata: { ...context, duration },
        });

        resolve(result);
      } catch (error) {
        this.endTimer(timerId);
        this.recordMetric({
          name: `${name}_error`,
          value: 1,
          unit: 'count',
          timestamp: Date.now(),
          metadata: {
            ...context,
            error: error instanceof Error ? error.message : String(error),
          },
        });
        reject(error);
      }
    });
}

// Metric recording
public
recordMetric(metric: PerformanceMetric)
: void
{
  this.metrics.push(metric);
  this.emit('metric', metric);

  // Log performance metrics to specialized logger
  logger.logPerformanceMetrics(
    metric.name,
    {
      duration: metric.value,
      timestamp: metric.timestamp,
    },
    {
      component: 'performance',
      unit: metric.unit,
      tags: metric.tags,
      ...metric.metadata,
    }
  );

  // Keep metrics buffer manageable
  if (this.metrics.length > 10000) {
    this.metrics = this.metrics.slice(-5000);
  }
}

public
incrementCounter(name: string, value: number = 1, tags?: Record<string, string>)
: void
{
  this.recordMetric({
    name,
    value,
    unit: 'count',
    timestamp: Date.now(),
    tags,
  });
}

public
recordGauge(
    name: string,
    value: number,
    unit: string = 'units',
    tags?: Record<string, string>
  )
: void
{
  this.recordMetric({
    name,
    value,
    unit,
    timestamp: Date.now(),
    tags,
  });
}
