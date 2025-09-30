

export interface AnalyticsConfig {
  mongodb: {
    uri: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  retention: {
    rawEvents: number; // days
    aggregatedData: number; // days
    userSessions: number; // days
  };
  aggregation: {
    intervals: Array<'minute' | 'hour' | 'day' | 'week' | 'month'>;
    batchSize: number;
  };
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  timestamp: Date;
  userId?: string;
  organizationId: string;
  sessionId?: string;
  source: string;
  data: Record<string, any>;
  metadata?: {
    userAgent?: string;
    ip?: string;
    geo?: {
      country?: string;
      city?: string;
      region?: string;
    };
    device?: {
      type?: string;
      os?: string;
      browser?: string;
    };
  };
  tags?: string[];
  correlationId?: string;
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  unit?: string;
  labels: string[];
  retention: number; // days
}

export interface MetricValue {
  id: string;
  metricId: string;
  timestamp: Date;
  value: number;
  labels: Record<string, string>;
  organizationId: string;
}

export interface AggregatedMetric {
  id: string;
  metricId: string;
  interval: 'minute' | 'hour' | 'day' | 'week' | 'month';
  timestamp: Date;
  organizationId: string;
  labels: Record<string, string>;
  aggregations: {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50?: number;
    p95?: number;
    p99?: number;
  };
}

export interface UserSession {
  id: string;
  userId: string;
  organizationId: string;
  startedAt: Date;
  endedAt?: Date;
