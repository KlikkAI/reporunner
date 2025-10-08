export interface AnalyticsEvent {
  id: string;
  timestamp: Date;
  userId: string;
  organizationId: string;
  eventType: string;
  eventName: string;
  properties: Record<string, unknown>;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
}

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels: string[];
  unit?: string;
}

export interface Metric {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

export interface AnalyticsQuery {
  eventType?: string;
  eventName?: string;
  userId?: string;
  organizationId?: string;
  startDate: Date;
  endDate: Date;
  groupBy?: string[];
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  filters?: Record<string, unknown>;
}

export interface AnalyticsResult {
  data: Array<{
    timestamp: Date;
    value: number;
    labels: Record<string, string>;
  }>;
  totalCount: number;
  aggregatedValue?: number;
}
