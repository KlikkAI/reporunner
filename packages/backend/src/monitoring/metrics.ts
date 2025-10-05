export interface MetricDefinition {
  name: string;
  description: string;
  type: 'counter' | 'gauge' | 'histogram';
  labels?: string[];
}

export class MetricsRegistry {
  private metrics = new Map<string, MetricDefinition>();

  register(metric: MetricDefinition): void {
    this.metrics.set(metric.name, metric);
  }

  get(name: string): MetricDefinition | undefined {
    return this.metrics.get(name);
  }

  list(): MetricDefinition[] {
    return Array.from(this.metrics.values());
  }
}

export const metricsRegistry = new MetricsRegistry();
