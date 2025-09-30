import { EventEmitter } from 'node:events';
import type { DistributedEventBus } from '@reporunner/platform/event-bus';
import { logger } from '@reporunner/shared/logger';
import { Redis } from 'ioredis';
import type { Collection, Db, MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

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
  duration?: number;
  events: number;
  metadata: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    device?: Record<string, any>;
    geo?: Record<string, any>;
  };
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
  private events: Collection<AnalyticsEvent>;
  private metrics: Collection<MetricValue>;
  private aggregatedMetrics: Collection<AggregatedMetric>;
  private metricDefinitions: Collection<MetricDefinition>;
  private userSessions: Collection<UserSession>;
  private dashboards: Collection<DashboardConfig>;
  private eventBus: DistributedEventBus;

  private aggregationTimer?: NodeJS.Timeout;
  private sessionManager: UserSessionManager;
  private metricCollector: MetricCollector;

  constructor(
    private config: AnalyticsConfig,
    mongoClient: MongoClient,
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

    this.initializeIndexes();
    this.setupEventSubscriptions();
    this.startAggregationTimer();
    this.setupDefaultMetrics();
  }

  private async initializeIndexes(): Promise<void> {
    try {
      // Events indexes
      await this.events.createIndex({ timestamp: -1 });
      await this.events.createIndex({ type: 1, timestamp: -1 });
      await this.events.createIndex({ organizationId: 1, timestamp: -1 });
      await this.events.createIndex({ userId: 1, timestamp: -1 });
      await this.events.createIndex({ sessionId: 1 });
      await this.events.createIndex({ correlationId: 1 });
      await this.events.createIndex({ tags: 1 });

      // Metrics indexes
      await this.metrics.createIndex({ metricId: 1, timestamp: -1 });
      await this.metrics.createIndex({ organizationId: 1, metricId: 1, timestamp: -1 });
      await this.metrics.createIndex({ 'labels.workflow_id': 1, timestamp: -1 });

      // Aggregated metrics indexes
      await this.aggregatedMetrics.createIndex({
        metricId: 1,
        interval: 1,
        timestamp: -1,
      });
      await this.aggregatedMetrics.createIndex({
        organizationId: 1,
        metricId: 1,
        interval: 1,
        timestamp: -1,
      });

      // User sessions indexes
      await this.userSessions.createIndex({ userId: 1, startedAt: -1 });
      await this.userSessions.createIndex({ organizationId: 1, startedAt: -1 });
      await this.userSessions.createIndex({ sessionId: 1 });

      // Dashboards indexes
      await this.dashboards.createIndex({ organizationId: 1, createdAt: -1 });
      await this.dashboards.createIndex({ createdBy: 1 });

      logger.info('Analytics service indexes initialized');
    } catch (error) {
      logger.error('Failed to create analytics indexes', error);
    }
  }

  private async setupEventSubscriptions(): Promise<void> {
    // Subscribe to workflow events
    await this.eventBus.subscribe('workflow.*', async (event) => {
      await this.handleWorkflowEvent(event);
    });

    // Subscribe to execution events
    await this.eventBus.subscribe('execution.*', async (event) => {
      await this.handleExecutionEvent(event);
    });

    // Subscribe to user events
    await this.eventBus.subscribe('user.*', async (event) => {
      await this.handleUserEvent(event);
    });

    // Subscribe to system events
    await this.eventBus.subscribe('system.*', async (event) => {
      await this.handleSystemEvent(event);
    });
  }

  private startAggregationTimer(): void {
    // Run aggregation every minute
    this.aggregationTimer = setInterval(async () => {
      try {
        await this.performAggregation();
      } catch (error) {
        logger.error('Aggregation failed', error);
      }
    }, 60000);

    // Run cleanup daily at 2 AM
    const now = new Date();
    const nextCleanup = new Date();
    nextCleanup.setHours(2, 0, 0, 0);
    if (nextCleanup <= now) {
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }

    setTimeout(() => {
      this.performCleanup();
      // Then run cleanup daily
      setInterval(() => this.performCleanup(), 24 * 60 * 60 * 1000);
    }, nextCleanup.getTime() - now.getTime());
  }

  private async setupDefaultMetrics(): Promise<void> {
    const defaultMetrics: Omit<MetricDefinition, 'id'>[] = [
      {
        name: 'workflow_executions_total',
        description: 'Total number of workflow executions',
        type: 'counter',
        labels: ['workflow_id', 'status', 'trigger_type'],
        retention: 90,
      },
      {
        name: 'workflow_execution_duration',
        description: 'Duration of workflow executions in milliseconds',
        type: 'histogram',
        unit: 'ms',
        labels: ['workflow_id', 'status'],
        retention: 90,
      },
      {
        name: 'active_users',
        description: 'Number of active users',
        type: 'gauge',
        labels: ['time_window'],
        retention: 30,
      },
      {
        name: 'api_requests_total',
        description: 'Total number of API requests',
        type: 'counter',
        labels: ['method', 'endpoint', 'status_code'],
        retention: 60,
      },
      {
        name: 'api_request_duration',
        description: 'Duration of API requests in milliseconds',
        type: 'histogram',
        unit: 'ms',
        labels: ['method', 'endpoint'],
        retention: 60,
      },
      {
        name: 'node_executions_total',
        description: 'Total number of node executions',
        type: 'counter',
        labels: ['node_type', 'status', 'workflow_id'],
        retention: 90,
      },
      {
        name: 'errors_total',
        description: 'Total number of errors',
        type: 'counter',
        labels: ['error_type', 'component', 'severity'],
        retention: 90,
      },
      {
        name: 'system_resources',
        description: 'System resource usage',
        type: 'gauge',
        unit: 'percent',
        labels: ['resource_type', 'instance'],
        retention: 30,
      },
    ];

    for (const metric of defaultMetrics) {
      await this.createMetricDefinition(metric);
    }
  }

  // Event tracking methods
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        ...event,
        id: uuidv4(),
        timestamp: new Date(),
      };

      await this.events.insertOne(analyticsEvent);

      // Update session if sessionId provided
      if (event.sessionId && event.userId) {
        await this.sessionManager.updateSession(event.sessionId, event.userId, {
          lastActivity: analyticsEvent.timestamp,
          eventCount: 1,
        });
      }

      // Emit real-time event
      this.emit('event.tracked', analyticsEvent);

      return analyticsEvent.id;
    } catch (error) {
      logger.error('Failed to track event', error);
      throw error;
    }
  }

  async trackUserAction(
    userId: string,
    organizationId: string,
    action: string,
    data?: Record<string, any>,
    sessionId?: string
  ): Promise<string> {
    return this.trackEvent({
      type: 'user_action',
      userId,
      organizationId,
      sessionId,
      source: 'user_interface',
      data: {
        action,
        ...data,
      },
    });
  }

  async trackPageView(
    userId: string,
    organizationId: string,
    path: string,
    sessionId: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const eventId = await this.trackEvent({
      type: 'page_view',
      userId,
      organizationId,
      sessionId,
      source: 'web_app',
      data: {
        path,
        ...metadata,
      },
    });

    // Update session with page info
    await this.sessionManager.addPageView(sessionId, path);

    return eventId;
  }

  // Metric collection methods
  async recordMetric(
    metricId: string,
    value: number,
    labels: Record<string, string> = {},
    organizationId: string
  ): Promise<void> {
    try {
      const metric: MetricValue = {
        id: uuidv4(),
        metricId,
        timestamp: new Date(),
        value,
        labels,
        organizationId,
      };

      await this.metricCollector.record(metric);

      // Also cache recent values for real-time queries
      const cacheKey = `metric:${metricId}:${JSON.stringify(labels)}`;
      await this.cache.lpush(cacheKey, JSON.stringify(metric));
      await this.cache.ltrim(cacheKey, 0, 99); // Keep last 100 values
      await this.cache.expire(cacheKey, 3600); // Expire in 1 hour
    } catch (error) {
      logger.error('Failed to record metric', error);
      throw error;
    }
  }

  async incrementCounter(
    metricId: string,
    labels: Record<string, string> = {},
    organizationId: string,
    increment: number = 1
  ): Promise<void> {
    await this.recordMetric(metricId, increment, labels, organizationId);
  }

  async setGauge(
    metricId: string,
    value: number,
    labels: Record<string, string> = {},
    organizationId: string
  ): Promise<void> {
    await this.recordMetric(metricId, value, labels, organizationId);
  }

  // Query methods
  async queryEvents(organizationId: string, options: QueryOptions): Promise<AnalyticsEvent[]> {
    try {
      const query: any = {
        organizationId,
        timestamp: {
          $gte: options.startTime,
          $lte: options.endTime,
        },
      };

      // Apply filters
      if (options.filters) {
        for (const filter of options.filters) {
          this.applyFilter(query, filter);
        }
      }

      const pipeline: any[] = [{ $match: query }];

      // Add grouping if specified
      if (options.groupBy) {
        const groupBy: any = {};
        for (const field of options.groupBy) {
          groupBy[field] = `$${field}`;
        }

        pipeline.push({
          $group: {
            _id: groupBy,
            count: { $sum: 1 },
            firstEvent: { $first: '$$ROOT' },
          },
        });
      }

      // Add sorting
      if (options.sort) {
        pipeline.push({ $sort: options.sort });
      } else {
        pipeline.push({ $sort: { timestamp: -1 } });
      }

      // Add limit
      if (options.limit) {
        pipeline.push({ $limit: options.limit });
      }

      const results = await this.events.aggregate(pipeline).toArray();
      return results.map((r) => (options.groupBy ? r.firstEvent : r));
    } catch (error) {
      logger.error('Failed to query events', error);
      throw error;
    }
  }

  async queryMetrics(
    organizationId: string,
    metricId: string,
    options: QueryOptions
  ): Promise<AggregatedMetric[]> {
    try {
      const query: any = {
        organizationId,
        metricId,
        timestamp: {
          $gte: options.startTime,
          $lte: options.endTime,
        },
      };

      if (options.interval) {
        query.interval = options.interval;
      }

      // Apply filters for labels
      if (options.filters) {
        for (const filter of options.filters) {
          if (filter.field.startsWith('labels.')) {
            this.applyFilter(query, filter);
          }
        }
      }

      const pipeline: any[] = [{ $match: query }];

      // Group by specified fields
      if (options.groupBy) {
        const groupBy: any = {};
        for (const field of options.groupBy) {
          groupBy[field] = field.startsWith('labels.') ? `$${field}` : `$${field}`;
        }

        pipeline.push({
          $group: {
            _id: groupBy,
            count: { $sum: '$aggregations.count' },
            sum: { $sum: '$aggregations.sum' },
            avg: { $avg: '$aggregations.avg' },
            min: { $min: '$aggregations.min' },
            max: { $max: '$aggregations.max' },
            timestamp: { $first: '$timestamp' },
          },
        });
      }

      // Add sorting
      pipeline.push({ $sort: options.sort || { timestamp: 1 } });

      // Add limit
      if (options.limit) {
        pipeline.push({ $limit: options.limit });
      }

      return await this.aggregatedMetrics.aggregate(pipeline).toArray();
    } catch (error) {
      logger.error('Failed to query metrics', error);
      throw error;
    }
  }

  async getRealtimeMetric(
    metricId: string,
    labels: Record<string, string> = {}
  ): Promise<MetricValue[]> {
    try {
      const cacheKey = `metric:${metricId}:${JSON.stringify(labels)}`;
      const cached = await this.cache.lrange(cacheKey, 0, 9); // Last 10 values

      return cached.map((item) => JSON.parse(item));
    } catch (error) {
      logger.error('Failed to get realtime metric', error);
      return [];
    }
  }

  // Dashboard methods
  async createDashboard(
    dashboard: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DashboardConfig> {
    try {
      const newDashboard: DashboardConfig = {
        ...dashboard,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.dashboards.insertOne(newDashboard);
      return newDashboard;
    } catch (error) {
      logger.error('Failed to create dashboard', error);
      throw error;
    }
  }

  async getDashboard(id: string): Promise<DashboardConfig | null> {
    try {
      return await this.dashboards.findOne({ id });
    } catch (error) {
      logger.error('Failed to get dashboard', error);
      throw error;
    }
  }

  async listDashboards(organizationId: string, userId?: string): Promise<DashboardConfig[]> {
    try {
      const query: any = {
        $or: [
          { organizationId, isPublic: true },
          { organizationId, createdBy: userId },
        ],
      };

      return await this.dashboards.find(query).sort({ createdAt: -1 }).toArray();
    } catch (error) {
      logger.error('Failed to list dashboards', error);
      throw error;
    }
  }

  // Session management
  async startSession(
    userId: string,
    organizationId: string,
    metadata: Partial<UserSession['metadata']> = {}
  ): Promise<string> {
    return await this.sessionManager.startSession(userId, organizationId, metadata);
  }

  async endSession(sessionId: string): Promise<void> {
    await this.sessionManager.endSession(sessionId);
  }

  async getActiveUsers(
    organizationId: string,
    timeWindow: number = 24 // hours
  ): Promise<number> {
    try {
      const since = new Date(Date.now() - timeWindow * 60 * 60 * 1000);

      const count = await this.userSessions.countDocuments({
        organizationId,
        $or: [
          { endedAt: { $gte: since } },
          { endedAt: { $exists: false }, startedAt: { $gte: since } },
        ],
      });

      return count;
    } catch (error) {
      logger.error('Failed to get active users count', error);
      return 0;
    }
  }

  // Analytics insights
  async getWorkflowInsights(
    organizationId: string,
    workflowId?: string,
    timeRange: { from: Date; to: Date } = {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(),
    }
  ): Promise<{
    totalExecutions: number;
    successRate: number;
    avgDuration: number;
    errorRate: number;
    topErrors: Array<{ error: string; count: number }>;
    executionTrend: Array<{ date: string; count: number; successRate: number }>;
  }> {
    try {
      const pipeline = [
        {
          $match: {
            organizationId,
            type: 'execution.completed',
            timestamp: { $gte: timeRange.from, $lte: timeRange.to },
            ...(workflowId && { 'data.workflowId': workflowId }),
          },
        },
        {
          $facet: {
            overview: [
              {
                $group: {
                  _id: null,
                  totalExecutions: { $sum: 1 },
                  successful: {
                    $sum: { $cond: [{ $eq: ['$data.status', 'completed'] }, 1, 0] },
                  },
                  avgDuration: { $avg: '$data.duration' },
                },
              },
            ],
            errors: [
              { $match: { 'data.status': 'failed' } },
              {
                $group: {
                  _id: '$data.error.message',
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
              { $limit: 5 },
            ],
            trend: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$timestamp',
                    },
                  },
                  count: { $sum: 1 },
                  successful: {
                    $sum: { $cond: [{ $eq: ['$data.status', 'completed'] }, 1, 0] },
                  },
                },
              },
              {
                $project: {
                  date: '$_id',
                  count: 1,
                  successRate: {
                    $multiply: [{ $divide: ['$successful', '$count'] }, 100],
                  },
                },
              },
              { $sort: { date: 1 } },
            ],
          },
        },
      ];

      const result = await this.events.aggregate(pipeline).toArray();
      const data = result[0];

      const overview = data.overview[0] || {
        totalExecutions: 0,
        successful: 0,
        avgDuration: 0,
      };

      return {
        totalExecutions: overview.totalExecutions,
        successRate:
          overview.totalExecutions > 0 ? (overview.successful / overview.totalExecutions) * 100 : 0,
        avgDuration: overview.avgDuration || 0,
        errorRate:
          overview.totalExecutions > 0
            ? ((overview.totalExecutions - overview.successful) / overview.totalExecutions) * 100
            : 0,
        topErrors: data.errors.map((e: any) => ({
          error: e._id,
          count: e.count,
        })),
        executionTrend: data.trend,
      };
    } catch (error) {
      logger.error('Failed to get workflow insights', error);
      throw error;
    }
  }

  // Metric definitions
  async createMetricDefinition(metric: Omit<MetricDefinition, 'id'>): Promise<MetricDefinition> {
    try {
      // Check if metric already exists
      const existing = await this.metricDefinitions.findOne({ name: metric.name });
      if (existing) {
        return existing;
      }

      const definition: MetricDefinition = {
        ...metric,
        id: uuidv4(),
      };

      await this.metricDefinitions.insertOne(definition);
      return definition;
    } catch (error) {
      logger.error('Failed to create metric definition', error);
      throw error;
    }
  }

  async getMetricDefinition(name: string): Promise<MetricDefinition | null> {
    return await this.metricDefinitions.findOne({ name });
  }

  async listMetricDefinitions(): Promise<MetricDefinition[]> {
    return await this.metricDefinitions.find({}).sort({ name: 1 }).toArray();
  }

  // Helper methods
  private applyFilter(query: any, filter: QueryFilter): void {
    const { field, operator, value } = filter;

    switch (operator) {
      case 'eq':
        query[field] = value;
        break;
      case 'neq':
        query[field] = { $ne: value };
        break;
      case 'gt':
        query[field] = { $gt: value };
        break;
      case 'gte':
        query[field] = { $gte: value };
        break;
      case 'lt':
        query[field] = { $lt: value };
        break;
      case 'lte':
        query[field] = { $lte: value };
        break;
      case 'in':
        query[field] = { $in: value };
        break;
      case 'nin':
        query[field] = { $nin: value };
        break;
      case 'contains':
        query[field] = { $regex: value, $options: 'i' };
        break;
      case 'exists':
        query[field] = { $exists: value };
        break;
    }
  }

  private async performAggregation(): Promise<void> {
    const now = new Date();
    const intervals = this.config.aggregation.intervals;

    for (const interval of intervals) {
      try {
        await this.aggregateMetricsForInterval(interval, now);
      } catch (error) {
        logger.error(`Failed to aggregate metrics for interval ${interval}`, error);
      }
    }
  }

  private async aggregateMetricsForInterval(
    interval: 'minute' | 'hour' | 'day' | 'week' | 'month',
    now: Date
  ): Promise<void> {
    const timeWindow = this.getTimeWindow(interval, now);
    const metricDefinitions = await this.listMetricDefinitions();

    for (const metricDef of metricDefinitions) {
      try {
        await this.aggregateMetric(metricDef, interval, timeWindow);
      } catch (error) {
        logger.error(`Failed to aggregate metric ${metricDef.name}`, error);
      }
    }
  }

  private async aggregateMetric(
    metricDef: MetricDefinition,
    interval: string,
    timeWindow: { start: Date; end: Date }
  ): Promise<void> {
    // Check if aggregation already exists
    const existing = await this.aggregatedMetrics.findOne({
      metricId: metricDef.id,
      interval,
      timestamp: timeWindow.start,
    });

    if (existing) {
      return; // Already aggregated
    }

    // Perform aggregation
    const pipeline = [
      {
        $match: {
          metricId: metricDef.id,
          timestamp: {
            $gte: timeWindow.start,
            $lt: timeWindow.end,
          },
        },
      },
      {
        $group: {
          _id: {
            organizationId: '$organizationId',
            labels: '$labels',
          },
          count: { $sum: 1 },
          sum: { $sum: '$value' },
          avg: { $avg: '$value' },
          min: { $min: '$value' },
          max: { $max: '$value' },
          values: { $push: '$value' },
        },
      },
    ];

    const results = await this.metrics.aggregate(pipeline).toArray();

    for (const result of results) {
      const aggregated: AggregatedMetric = {
        id: uuidv4(),
        metricId: metricDef.id,
        interval: interval as any,
        timestamp: timeWindow.start,
        organizationId: result._id.organizationId,
        labels: result._id.labels,
        aggregations: {
          count: result.count,
          sum: result.sum,
          avg: result.avg,
          min: result.min,
          max: result.max,
          p50: this.calculatePercentile(result.values, 50),
          p95: this.calculatePercentile(result.values, 95),
          p99: this.calculatePercentile(result.values, 99),
        },
      };

      await this.aggregatedMetrics.insertOne(aggregated);
    }
  }

  private getTimeWindow(
    interval: 'minute' | 'hour' | 'day' | 'week' | 'month',
    now: Date
  ): { start: Date; end: Date } {
    const start = new Date(now);
    const end = new Date(now);

    switch (interval) {
      case 'minute':
        start.setSeconds(0, 0);
        start.setMinutes(start.getMinutes() - 1);
        end.setSeconds(0, 0);
        break;
      case 'hour':
        start.setMinutes(0, 0, 0);
        start.setHours(start.getHours() - 1);
        end.setMinutes(0, 0, 0);
        break;
      case 'day':
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 1);
        end.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - start.getDay() - 7);
        end.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - end.getDay());
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        start.setMonth(start.getMonth() - 1);
        end.setDate(1);
        end.setHours(0, 0, 0, 0);
        break;
    }

    return { start, end };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) {
      return 0;
    }

    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private async performCleanup(): Promise<void> {
    const now = new Date();

    // Clean up old raw events
    const eventCutoff = new Date(
      now.getTime() - this.config.retention.rawEvents * 24 * 60 * 60 * 1000
    );
    await this.events.deleteMany({ timestamp: { $lt: eventCutoff } });

    // Clean up old aggregated data
    const aggregatedCutoff = new Date(
      now.getTime() - this.config.retention.aggregatedData * 24 * 60 * 60 * 1000
    );
    await this.aggregatedMetrics.deleteMany({ timestamp: { $lt: aggregatedCutoff } });

    // Clean up old user sessions
    const sessionCutoff = new Date(
      now.getTime() - this.config.retention.userSessions * 24 * 60 * 60 * 1000
    );
    await this.userSessions.deleteMany({ startedAt: { $lt: sessionCutoff } });

    logger.info('Analytics cleanup completed', {
      eventCutoff,
      aggregatedCutoff,
      sessionCutoff,
    });
  }

  // Event handlers
  private async handleWorkflowEvent(event: any): Promise<void> {
    try {
      await this.trackEvent({
        type: `workflow.${event.type}`,
        organizationId: event.data.organizationId || 'system',
        userId: event.data.userId,
        source: 'workflow_service',
        data: event.data,
        correlationId: event.correlationId,
      });

      // Record metrics
      if (event.type === 'created') {
        await this.incrementCounter(
          'workflow_operations_total',
          { operation: 'create' },
          event.data.organizationId || 'system'
        );
      }
    } catch (error) {
      logger.error('Failed to handle workflow event', error);
    }
  }

  private async handleExecutionEvent(event: any): Promise<void> {
    try {
      await this.trackEvent({
        type: `execution.${event.type}`,
        organizationId: event.data.organizationId || 'system',
        userId: event.data.triggeredBy,
        source: 'execution_service',
        data: event.data,
        correlationId: event.correlationId,
      });

      // Record execution metrics
      if (event.type === 'completed' || event.type === 'failed') {
        await this.incrementCounter(
          'workflow_executions_total',
          {
            workflow_id: event.data.workflowId,
            status: event.data.status,
            trigger_type: event.data.triggerType || 'unknown',
          },
          event.data.organizationId || 'system'
        );

        if (event.data.duration) {
          await this.recordMetric(
            'workflow_execution_duration',
            event.data.duration,
            {
              workflow_id: event.data.workflowId,
              status: event.data.status,
            },
            event.data.organizationId || 'system'
          );
        }
      }
    } catch (error) {
      logger.error('Failed to handle execution event', error);
    }
  }

  private async handleUserEvent(event: any): Promise<void> {
    try {
      await this.trackEvent({
        type: `user.${event.type}`,
        organizationId: event.data.organizationId || 'system',
        userId: event.data.userId,
        source: 'auth_service',
        data: event.data,
        correlationId: event.correlationId,
      });

      // Track user metrics
      if (event.type === 'login') {
        await this.incrementCounter(
          'user_logins_total',
          { method: event.data.method || 'password' },
          event.data.organizationId || 'system'
        );
      }
    } catch (error) {
      logger.error('Failed to handle user event', error);
    }
  }

  private async handleSystemEvent(event: any): Promise<void> {
    try {
      await this.trackEvent({
        type: `system.${event.type}`,
        organizationId: 'system',
        source: 'system',
        data: event.data,
        correlationId: event.correlationId,
      });
    } catch (error) {
      logger.error('Failed to handle system event', error);
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    metrics: {
      eventsProcessed24h: number;
      metricsRecorded24h: number;
      activeSessions: number;
    };
  }> {
    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [eventsProcessed, metricsRecorded, activeSessions] = await Promise.all([
        this.events.countDocuments({ timestamp: { $gte: last24h } }),
        this.metrics.countDocuments({ timestamp: { $gte: last24h } }),
        this.userSessions.countDocuments({
          $or: [{ endedAt: { $exists: false } }, { endedAt: { $gte: last24h } }],
        }),
      ]);

      return {
        status: 'healthy',
        metrics: {
          eventsProcessed24h: eventsProcessed,
          metricsRecorded24h: metricsRecorded,
          activeSessions,
        },
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        metrics: {
          eventsProcessed24h: 0,
          metricsRecorded24h: 0,
          activeSessions: 0,
        },
      };
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down analytics service');

    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
    }

    await this.cache.quit();
  }
}

// Helper classes
class UserSessionManager {
  constructor(
    private sessions: Collection<UserSession>,
    private cache: Redis
  ) {}

  async startSession(
    userId: string,
    organizationId: string,
    metadata: Partial<UserSession['metadata']> = {}
  ): Promise<string> {
    const sessionId = uuidv4();

    const session: UserSession = {
      id: sessionId,
      userId,
      organizationId,
      startedAt: new Date(),
      events: 0,
      metadata: metadata as UserSession['metadata'],
      pages: [],
    };

    await this.sessions.insertOne(session);

    // Cache active session
    await this.cache.setex(`session:${sessionId}`, 3600, JSON.stringify(session));

    return sessionId;
  }

  async updateSession(
    sessionId: string,
    userId: string,
    updates: {
      lastActivity?: Date;
      eventCount?: number;
    }
  ): Promise<void> {
    await this.sessions.updateOne(
      { id: sessionId, userId },
      {
        $set: { lastActivity: updates.lastActivity },
        $inc: { events: updates.eventCount || 0 },
      }
    );

    // Update cache
    const cached = await this.cache.get(`session:${sessionId}`);
    if (cached) {
      const session = JSON.parse(cached);
      session.lastActivity = updates.lastActivity;
      session.events += updates.eventCount || 0;
      await this.cache.setex(`session:${sessionId}`, 3600, JSON.stringify(session));
    }
  }

  async addPageView(sessionId: string, path: string): Promise<void> {
    const now = new Date();

    await this.sessions.updateOne(
      { id: sessionId },
      {
        $push: {
          pages: {
            path,
            timestamp: now,
          },
        },
      }
    );
  }

  async endSession(sessionId: string): Promise<void> {
    const endedAt = new Date();

    const session = await this.sessions.findOne({ id: sessionId });
    if (session) {
      const duration = endedAt.getTime() - session.startedAt.getTime();

      await this.sessions.updateOne(
        { id: sessionId },
        {
          $set: {
            endedAt,
            duration,
          },
        }
      );
    }

    // Remove from cache
    await this.cache.del(`session:${sessionId}`);
  }
}

class MetricCollector {
  constructor(
    private metrics: Collection<MetricValue>,
    _definitions: Collection<MetricDefinition>
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
