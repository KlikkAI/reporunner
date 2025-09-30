duration?: number;
events: number;
{
  userAgent?: string;
  ip?: string;
  referrer?: string;
  device?: Record<string, any>;
  geo?: Record<string, any>;
}
pages: Array<{
  path: string;
  timestamp: Date;
  timeSpent?: number;
}>;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  widgets: DashboardWidget[];
  filters?: Record<string, any>;
  timeRange?: {
    type: 'relative' | 'absolute';
    value: string; // e.g., '7d', '2024-01-01:2024-01-31'
  };
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    metrics: string[];
    groupBy?: string[];
    filters?: Record<string, any>;
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  };
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'exists';
  value: any;
}

export interface QueryOptions {
  startTime: Date;
  endTime: Date;
  filters?: QueryFilter[];
  groupBy?: string[];
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'p50' | 'p95' | 'p99';
  interval?: 'minute' | 'hour' | 'day' | 'week' | 'month';
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export class AnalyticsService extends EventEmitter {
  private db: Db;
  private cache: Redis;
  private metrics: Collection<MetricValue>;
  private metricDefinitions: Collection<MetricDefinition>;
  private userSessions: Collection<UserSession>;

  constructor(config: AnalyticsConfig,mongoClient: MongoClient,
    eventBus: DistributedEventBus
  ) {
    super();
    this.eventBus = eventBus;
    this.cache = new Redis(config.redis);
    this.db = mongoClient.db(config.mongodb.database);

    // Initialize collections
    this.events = this.db.collection<AnalyticsEvent>('analytics_events');
    this.metrics = this.db.collection<MetricValue>('metrics');
    this.aggregatedMetrics = this.db.collection<AggregatedMetric>('aggregated_metrics');
    this.metricDefinitions = this.db.collection<MetricDefinition>('metric_definitions');
    this.userSessions = this.db.collection<UserSession>('user_sessions');
    this.dashboards = this.db.collection<DashboardConfig>('dashboards');

    // Initialize components
    this.sessionManager = new UserSessionManager(this.userSessions, this.cache);
    this.metricCollector = new MetricCollector(this.metrics, this.metricDefinitions);
