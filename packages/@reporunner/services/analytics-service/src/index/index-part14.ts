)
}

    // Remove from cache
    await this.cache.del(`session:$
{
  sessionId;
}
`);
  }
}

class MetricCollector {
  constructor(
    private metrics: Collection<MetricValue>,
    private definitions: Collection<MetricDefinition>
  ) {}

  async record(metric: MetricValue): Promise<void> {
    await this.metrics.insertOne(metric);
  }

  async bulkRecord(metrics: MetricValue[]): Promise<void> {
    if (metrics.length > 0) {
      await this.metrics.insertMany(metrics);
    }
  }
}

export * from './collectors';
export * from './dashboards';
export * from './reports';
