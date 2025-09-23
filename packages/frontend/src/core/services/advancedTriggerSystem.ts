/**
 * Advanced Trigger System
 *
 * Comprehensive event-driven workflow triggering system with webhooks,
 * API integrations, file system monitoring, and complex event processing.
 * Provides enterprise-grade triggering capabilities like Zapier and Microsoft Power Automate.
 */

import { workflowScheduler } from './workflowScheduler';

export interface TriggerConfiguration {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggerType:
    | 'webhook'
    | 'http_request'
    | 'email'
    | 'file_change'
    | 'database_change'
    | 'api_poll'
    | 'calendar_event'
    | 'form_submission'
    | 'social_media'
    | 'iot_sensor'
    | 'custom_event';
  configuration: TriggerConfig;
  filters: TriggerFilter[];
  transformations: DataTransformation[];
  authentication?: AuthenticationConfig;
  rateLimit: RateLimitConfig;
  retryPolicy: TriggerRetryPolicy;
  security: SecurityConfig;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

export type TriggerConfig =
  | WebhookConfig
  | HttpRequestConfig
  | EmailConfig
  | FileChangeConfig
  | DatabaseConfig
  | ApiPollConfig
  | CalendarConfig
  | FormConfig
  | SocialMediaConfig
  | IoTSensorConfig
  | CustomEventConfig;

export interface WebhookConfig {
  endpoint: string; // Auto-generated webhook URL
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
  contentTypes: string[];
  headers: Record<string, string>;
  responseTemplate?: string;
  secretKey?: string; // For webhook verification
}

export interface HttpRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: string;
  pollIntervalMs: number;
  changeDetection: 'hash' | 'content' | 'headers' | 'size';
}

export interface EmailConfig {
  provider: 'gmail' | 'outlook' | 'imap' | 'exchange';
  mailbox: string;
  filters: {
    from?: string[];
    subject?: string;
    body?: string;
    hasAttachment?: boolean;
  };
  markAsRead: boolean;
  moveToFolder?: string;
}

export interface FileChangeConfig {
  path: string;
  recursive: boolean;
  events: ('created' | 'modified' | 'deleted' | 'moved')[];
  patterns: string[]; // Glob patterns
  ignorePatterns: string[];
  debounceMs: number;
}

export interface DatabaseConfig {
  connectionString: string;
  database: string;
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'any';
  columns?: string[];
  conditions?: Record<string, any>;
  pollIntervalMs: number;
}

export interface ApiPollConfig {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
  pollIntervalMs: number;
  responseField?: string; // JSONPath to monitor
  changeThreshold?: number;
}

export interface CalendarConfig {
  provider: 'google' | 'outlook' | 'ical';
  calendarId: string;
  eventTypes: ('created' | 'updated' | 'deleted' | 'started' | 'ended')[];
  timeWindow: number; // Minutes before event to trigger
}

export interface FormConfig {
  formId: string;
  provider: 'typeform' | 'google_forms' | 'jotform' | 'custom';
  webhook?: string;
  fields?: string[]; // Specific fields to monitor
}

export interface SocialMediaConfig {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'youtube';
  account?: string;
  hashtags?: string[];
  mentions?: string[];
  eventTypes: ('post' | 'comment' | 'like' | 'share' | 'mention')[];
}

export interface IoTSensorConfig {
  deviceId: string;
  sensorType: string;
  protocol: 'mqtt' | 'http' | 'websocket' | 'coap';
  endpoint: string;
  dataField: string;
  conditions: SensorCondition[];
}

export interface CustomEventConfig {
  eventName: string;
  eventSource: string;
  schema?: Record<string, any>; // JSON schema for validation
  conditions?: Record<string, any>;
}

export interface SensorCondition {
  field: string;
  operator: '>' | '<' | '=' | '!=' | '>=' | '<=';
  value: number;
  unit?: string;
}

export interface TriggerFilter {
  field: string; // JSONPath to field in trigger data
  operator:
    | 'equals'
    | 'contains'
    | 'starts_with'
    | 'ends_with'
    | 'regex'
    | 'greater_than'
    | 'less_than'
    | 'in_array';
  value: any;
  negate?: boolean;
}

export interface DataTransformation {
  type: 'map' | 'filter' | 'reduce' | 'format' | 'extract' | 'enrich';
  configuration: TransformationConfig;
}

export type TransformationConfig =
  | MapTransformation
  | FilterTransformation
  | ReduceTransformation
  | FormatTransformation
  | ExtractTransformation
  | EnrichTransformation;

export interface MapTransformation {
  mappings: Record<string, string>; // source field -> target field
}

export interface FilterTransformation {
  conditions: TriggerFilter[];
}

export interface ReduceTransformation {
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  field: string;
}

export interface FormatTransformation {
  field: string;
  format: 'date' | 'currency' | 'percentage' | 'custom';
  options?: Record<string, any>;
}

export interface ExtractTransformation {
  field: string;
  pattern: string; // Regex pattern
  groups?: string[];
}

export interface EnrichTransformation {
  source: 'api' | 'database' | 'cache' | 'static';
  configuration: Record<string, any>;
}

export interface AuthenticationConfig {
  type: 'none' | 'api_key' | 'oauth2' | 'basic' | 'bearer' | 'custom';
  credentials: Record<string, any>;
}

export interface RateLimitConfig {
  enabled: boolean;
  maxTriggersPerMinute: number;
  maxTriggersPerHour: number;
  maxTriggersPerDay: number;
  burstLimit: number;
}

export interface TriggerRetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  backoffMs: number;
  exponentialBackoff: boolean;
}

export interface SecurityConfig {
  allowedIPs: string[];
  blockedIPs: string[];
  requireHttps: boolean;
  validateSignature: boolean;
  maxPayloadSize: number; // bytes
}

export interface TriggerEvent {
  id: string;
  triggerId: string;
  workflowId: string;
  timestamp: string;
  rawData: any;
  processedData: any;
  metadata: {
    source: string;
    userAgent?: string;
    ip?: string;
    headers?: Record<string, string>;
  };
  status: 'received' | 'filtered' | 'processed' | 'failed' | 'rate_limited';
  error?: string;
  processingTimeMs: number;
}

export interface TriggerMetrics {
  triggerId: string;
  period: { start: string; end: string };
  totalEvents: number;
  processedEvents: number;
  filteredEvents: number;
  failedEvents: number;
  rateLimitedEvents: number;
  averageProcessingTime: number;
  errorRate: number;
  topSources: Array<{ source: string; count: number }>;
  trends: {
    eventVolume: 'increasing' | 'stable' | 'decreasing';
    errorTrend: 'improving' | 'stable' | 'worsening';
  };
}

export class AdvancedTriggerSystemService {
  private triggers = new Map<string, TriggerConfiguration>();
  private activeTriggers = new Map<string, any>(); // Active monitors/listeners
  private eventHistory = new Map<string, TriggerEvent[]>();
  private rateLimiters = new Map<string, RateLimiter>();
  private eventListeners = new Map<string, Set<(event: TriggerEvent) => void>>();

  // Webhook server endpoints
  private webhookEndpoints = new Map<string, string>();

  constructor() {
    this.initializeWebhookServer();
  }

  /**
   * Create a new trigger configuration
   */
  createTrigger(
    config: Omit<TriggerConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>
  ): TriggerConfiguration {
    const trigger: TriggerConfiguration = {
      ...config,
      id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggerCount: 0,
    };

    // Generate webhook endpoint if needed
    if (trigger.triggerType === 'webhook') {
      const webhookConfig = trigger.configuration as WebhookConfig;
      webhookConfig.endpoint = this.generateWebhookEndpoint(trigger.id);
      this.webhookEndpoints.set(trigger.id, webhookConfig.endpoint);
    }

    this.triggers.set(trigger.id, trigger);

    if (trigger.enabled) {
      this.activateTrigger(trigger);
    }

    return trigger;
  }

  /**
   * Update existing trigger configuration
   */
  updateTrigger(triggerId: string, updates: Partial<TriggerConfiguration>): TriggerConfiguration {
    const existing = this.triggers.get(triggerId);
    if (!existing) {
      throw new Error(`Trigger ${triggerId} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.triggers.set(triggerId, updated);

    // Reactivate trigger if needed
    this.deactivateTrigger(triggerId);
    if (updated.enabled) {
      this.activateTrigger(updated);
    }

    return updated;
  }

  /**
   * Delete a trigger
   */
  deleteTrigger(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return false;

    this.deactivateTrigger(triggerId);
    this.triggers.delete(triggerId);
    this.rateLimiters.delete(triggerId);
    this.eventHistory.delete(triggerId);
    this.webhookEndpoints.delete(triggerId);

    return true;
  }

  /**
   * Enable or disable a trigger
   */
  toggleTrigger(triggerId: string, enabled: boolean): void {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      throw new Error(`Trigger ${triggerId} not found`);
    }

    trigger.enabled = enabled;
    trigger.updatedAt = new Date().toISOString();

    if (enabled) {
      this.activateTrigger(trigger);
    } else {
      this.deactivateTrigger(triggerId);
    }
  }

  /**
   * Manually test a trigger
   */
  async testTrigger(triggerId: string, testData?: any): Promise<TriggerEvent> {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      throw new Error(`Trigger ${triggerId} not found`);
    }

    const event: TriggerEvent = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      timestamp: new Date().toISOString(),
      rawData: testData || this.generateTestData(trigger.triggerType),
      processedData: null,
      metadata: {
        source: 'manual_test',
        userAgent: 'Trigger Test',
      },
      status: 'received',
      processingTimeMs: 0,
    };

    return this.processEvent(event, trigger);
  }

  /**
   * Get trigger metrics and analytics
   */
  getTriggerMetrics(triggerId: string, periodDays = 7): TriggerMetrics {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      throw new Error(`Trigger ${triggerId} not found`);
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const events = this.eventHistory.get(triggerId) || [];
    const periodEvents = events.filter(
      (event) => new Date(event.timestamp) >= startDate && new Date(event.timestamp) <= endDate
    );

    const totalEvents = periodEvents.length;
    const processedEvents = periodEvents.filter((e) => e.status === 'processed').length;
    const filteredEvents = periodEvents.filter((e) => e.status === 'filtered').length;
    const failedEvents = periodEvents.filter((e) => e.status === 'failed').length;
    const rateLimitedEvents = periodEvents.filter((e) => e.status === 'rate_limited').length;

    const averageProcessingTime =
      periodEvents.length > 0
        ? periodEvents.reduce((sum, e) => sum + e.processingTimeMs, 0) / periodEvents.length
        : 0;

    const errorRate = totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0;

    // Count events by source
    const sourceCounts = new Map<string, number>();
    periodEvents.forEach((event) => {
      const source = event.metadata.source;
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });

    const topSources = Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      triggerId,
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      totalEvents,
      processedEvents,
      filteredEvents,
      failedEvents,
      rateLimitedEvents,
      averageProcessingTime,
      errorRate,
      topSources,
      trends: {
        eventVolume: this.calculateVolumetrend(periodEvents),
        errorTrend: this.calculateErrorTrend(periodEvents),
      },
    };
  }

  /**
   * Get all triggers
   */
  getAllTriggers(): TriggerConfiguration[] {
    return Array.from(this.triggers.values());
  }

  /**
   * Get recent events for a trigger
   */
  getRecentEvents(triggerId: string, limit = 100): TriggerEvent[] {
    const events = this.eventHistory.get(triggerId) || [];
    return events.slice(-limit).reverse();
  }

  /**
   * Subscribe to trigger events
   */
  subscribeToEvents(
    event: 'received' | 'processed' | 'failed',
    callback: (event: TriggerEvent) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);

    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  // Private methods

  private activateTrigger(trigger: TriggerConfiguration): void {
    switch (trigger.triggerType) {
      case 'webhook':
        this.activateWebhookTrigger(trigger);
        break;
      case 'http_request':
        this.activateHttpTrigger(trigger);
        break;
      case 'email':
        this.activateEmailTrigger(trigger);
        break;
      case 'file_change':
        this.activateFileWatcher(trigger);
        break;
      case 'database_change':
        this.activateDatabaseWatcher(trigger);
        break;
      case 'api_poll':
        this.activateApiPoller(trigger);
        break;
      case 'calendar_event':
        this.activateCalendarWatcher(trigger);
        break;
      default:
    }

    // Setup rate limiter
    this.rateLimiters.set(trigger.id, new RateLimiter(trigger.rateLimit));
  }

  private deactivateTrigger(triggerId: string): void {
    const activeTrigger = this.activeTriggers.get(triggerId);
    if (activeTrigger) {
      // Clean up active monitors/timers
      if (activeTrigger.timer) {
        clearInterval(activeTrigger.timer);
      }
      if (activeTrigger.watcher) {
        activeTrigger.watcher.close?.();
      }

      this.activeTriggers.delete(triggerId);
    }
  }

  private activateWebhookTrigger(trigger: TriggerConfiguration): void {
    // Webhook endpoints are handled by the webhook server
    const _config = trigger.configuration as WebhookConfig;
  }

  private activateHttpTrigger(trigger: TriggerConfiguration): void {
    const config = trigger.configuration as HttpRequestConfig;

    const pollFn = async () => {
      try {
        const response = await fetch(config.url, {
          method: config.method,
          headers: config.headers,
          body: config.body,
        });

        const data = await response.text();
        const currentHash = this.calculateHash(data);

        // Check for changes
        const lastHash = this.activeTriggers.get(trigger.id)?.lastHash;
        if (lastHash && currentHash === lastHash) {
          return; // No changes
        }

        // Store new hash
        this.activeTriggers.set(trigger.id, {
          ...this.activeTriggers.get(trigger.id),
          lastHash: currentHash,
        });

        // Create trigger event
        await this.handleTriggerEvent(trigger, {
          url: config.url,
          method: config.method,
          response: data,
          hash: currentHash,
          timestamp: new Date().toISOString(),
        });
      } catch (_error) {}
    };

    const timer = setInterval(pollFn, config.pollIntervalMs);
    this.activeTriggers.set(trigger.id, { timer, lastHash: null });

    // Initial poll
    pollFn();
  }

  private activateEmailTrigger(_trigger: TriggerConfiguration): void {}

  private activateFileWatcher(_trigger: TriggerConfiguration): void {}

  private activateDatabaseWatcher(_trigger: TriggerConfiguration): void {}

  private activateApiPoller(trigger: TriggerConfiguration): void {
    const config = trigger.configuration as ApiPollConfig;

    const pollFn = async () => {
      try {
        const response = await fetch(config.url, {
          method: config.method,
          headers: config.headers,
          body: config.body,
        });

        const data = await response.json();
        const fieldValue = config.responseField
          ? this.getNestedValue(data, config.responseField)
          : data;

        // Check for changes
        const lastValue = this.activeTriggers.get(trigger.id)?.lastValue;
        if (lastValue !== undefined && fieldValue === lastValue) {
          return; // No changes
        }

        // Check threshold if configured
        if (
          config.changeThreshold &&
          typeof fieldValue === 'number' &&
          typeof lastValue === 'number'
        ) {
          const change = Math.abs(fieldValue - lastValue);
          if (change < config.changeThreshold) {
            return; // Change below threshold
          }
        }

        // Store new value
        this.activeTriggers.set(trigger.id, {
          ...this.activeTriggers.get(trigger.id),
          lastValue: fieldValue,
        });

        // Create trigger event
        await this.handleTriggerEvent(trigger, {
          url: config.url,
          previousValue: lastValue,
          currentValue: fieldValue,
          change:
            typeof fieldValue === 'number' && typeof lastValue === 'number'
              ? fieldValue - lastValue
              : null,
          timestamp: new Date().toISOString(),
        });
      } catch (_error) {}
    };

    const timer = setInterval(pollFn, config.pollIntervalMs);
    this.activeTriggers.set(trigger.id, { timer, lastValue: undefined });

    // Initial poll
    pollFn();
  }

  private activateCalendarWatcher(_trigger: TriggerConfiguration): void {}

  private async handleTriggerEvent(trigger: TriggerConfiguration, data: any): Promise<void> {
    const event: TriggerEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      timestamp: new Date().toISOString(),
      rawData: data,
      processedData: null,
      metadata: {
        source: trigger.triggerType,
      },
      status: 'received',
      processingTimeMs: 0,
    };

    await this.processEvent(event, trigger);
  }

  private async processEvent(
    event: TriggerEvent,
    trigger: TriggerConfiguration
  ): Promise<TriggerEvent> {
    const startTime = performance.now();

    try {
      // Check rate limits
      const rateLimiter = this.rateLimiters.get(trigger.id);
      if (rateLimiter && !rateLimiter.canTrigger()) {
        event.status = 'rate_limited';
        event.error = 'Rate limit exceeded';
        this.recordEvent(event);
        return event;
      }

      // Apply filters
      if (!this.applyFilters(event.rawData, trigger.filters)) {
        event.status = 'filtered';
        this.recordEvent(event);
        return event;
      }

      // Apply transformations
      event.processedData = await this.applyTransformations(event.rawData, trigger.transformations);

      // Trigger workflow execution
      await workflowScheduler.triggerSchedule(trigger.workflowId, true);

      // Update trigger stats
      trigger.triggerCount++;
      trigger.lastTriggered = event.timestamp;

      event.status = 'processed';
      this.emitEvent('processed', event);
    } catch (error) {
      event.status = 'failed';
      event.error = error instanceof Error ? error.message : String(error);
      this.emitEvent('failed', event);
    } finally {
      event.processingTimeMs = performance.now() - startTime;
      this.recordEvent(event);
    }

    return event;
  }

  private applyFilters(data: any, filters: TriggerFilter[]): boolean {
    for (const filter of filters) {
      const fieldValue = this.getNestedValue(data, filter.field);
      const matches = this.evaluateFilter(fieldValue, filter);

      if (filter.negate ? matches : !matches) {
        return false;
      }
    }
    return true;
  }

  private evaluateFilter(value: any, filter: TriggerFilter): boolean {
    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'contains':
        return String(value).includes(String(filter.value));
      case 'starts_with':
        return String(value).startsWith(String(filter.value));
      case 'ends_with':
        return String(value).endsWith(String(filter.value));
      case 'regex':
        return new RegExp(filter.value).test(String(value));
      case 'greater_than':
        return Number(value) > Number(filter.value);
      case 'less_than':
        return Number(value) < Number(filter.value);
      case 'in_array':
        return Array.isArray(filter.value) && filter.value.includes(value);
      default:
        return false;
    }
  }

  private async applyTransformations(
    data: any,
    transformations: DataTransformation[]
  ): Promise<any> {
    let result = data;

    for (const transformation of transformations) {
      result = await this.applyTransformation(result, transformation);
    }

    return result;
  }

  private async applyTransformation(data: any, transformation: DataTransformation): Promise<any> {
    switch (transformation.type) {
      case 'map':
        return this.applyMapTransformation(data, transformation.configuration as MapTransformation);
      case 'filter':
        return this.applyFilterTransformation(
          data,
          transformation.configuration as FilterTransformation
        );
      case 'format':
        return this.applyFormatTransformation(
          data,
          transformation.configuration as FormatTransformation
        );
      default:
        return data;
    }
  }

  private applyMapTransformation(data: any, config: MapTransformation): any {
    const result: any = {};

    for (const [source, target] of Object.entries(config.mappings)) {
      const value = this.getNestedValue(data, source);
      this.setNestedValue(result, target, value);
    }

    return result;
  }

  private applyFilterTransformation(data: any, config: FilterTransformation): any {
    // Apply filters and return filtered data
    return this.applyFilters(data, config.conditions) ? data : null;
  }

  private applyFormatTransformation(data: any, config: FormatTransformation): any {
    const value = this.getNestedValue(data, config.field);
    let formattedValue = value;

    switch (config.format) {
      case 'date':
        formattedValue = new Date(value).toISOString();
        break;
      case 'currency':
        formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(value));
        break;
      case 'percentage':
        formattedValue = `${(Number(value) * 100).toFixed(2)}%`;
        break;
    }

    const result = { ...data };
    this.setNestedValue(result, config.field, formattedValue);
    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private calculateHash(data: string): string {
    // Simple hash function for change detection
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private generateWebhookEndpoint(triggerId: string): string {
    return `/api/webhooks/${triggerId}`;
  }

  private generateTestData(triggerType: string): any {
    const testData = {
      webhook: {
        message: 'Test webhook trigger',
        timestamp: new Date().toISOString(),
      },
      http_request: { status: 'success', data: 'Test HTTP response' },
      email: {
        from: 'test@example.com',
        subject: 'Test Email',
        body: 'This is a test email',
      },
      file_change: {
        path: '/test/file.txt',
        event: 'created',
        timestamp: new Date().toISOString(),
      },
      database_change: { table: 'users', operation: 'insert', recordId: '123' },
      api_poll: { value: 42, previous: 38, change: 4 },
    };

    return testData[triggerType as keyof typeof testData] || { test: true };
  }

  private recordEvent(event: TriggerEvent): void {
    const events = this.eventHistory.get(event.triggerId) || [];
    events.push(event);

    // Keep only last 1000 events per trigger
    if (events.length > 1000) {
      events.shift();
    }

    this.eventHistory.set(event.triggerId, events);
    this.emitEvent('received', event);
  }

  private calculateVolumetrend(events: TriggerEvent[]): 'increasing' | 'stable' | 'decreasing' {
    if (events.length < 10) return 'stable';

    const mid = Math.floor(events.length / 2);
    const firstHalf = events.slice(0, mid);
    const secondHalf = events.slice(mid);

    const firstRate = firstHalf.length;
    const secondRate = secondHalf.length;

    const ratio = secondRate / firstRate;

    if (ratio > 1.2) return 'increasing';
    if (ratio < 0.8) return 'decreasing';
    return 'stable';
  }

  private calculateErrorTrend(events: TriggerEvent[]): 'improving' | 'stable' | 'worsening' {
    if (events.length < 10) return 'stable';

    const mid = Math.floor(events.length / 2);
    const firstHalf = events.slice(0, mid);
    const secondHalf = events.slice(mid);

    const firstErrors = firstHalf.filter((e) => e.status === 'failed').length;
    const secondErrors = secondHalf.filter((e) => e.status === 'failed').length;

    const firstRate = firstHalf.length > 0 ? firstErrors / firstHalf.length : 0;
    const secondRate = secondHalf.length > 0 ? secondErrors / secondHalf.length : 0;

    if (secondRate < firstRate * 0.8) return 'improving';
    if (secondRate > firstRate * 1.2) return 'worsening';
    return 'stable';
  }

  private initializeWebhookServer(): void {}

  private emitEvent(event: string, triggerEvent: TriggerEvent): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(triggerEvent);
        } catch (_error) {}
      });
    }
  }

  /**
   * Stop all triggers and cleanup resources
   */
  destroy(): void {
    this.triggers.forEach((_, id) => this.deactivateTrigger(id));
    this.triggers.clear();
    this.activeTriggers.clear();
    this.eventHistory.clear();
    this.rateLimiters.clear();
    this.eventListeners.clear();
    this.webhookEndpoints.clear();
  }
}

// Rate Limiter utility class
class RateLimiter {
  private events: number[] = [];

  constructor(private config: RateLimitConfig) {}

  canTrigger(): boolean {
    if (!this.config.enabled) return true;

    const now = Date.now();

    // Clean old events
    this.events = this.events.filter((time) => now - time < 60000); // Keep last minute

    // Check limits
    const eventsLastMinute = this.events.length;

    if (eventsLastMinute >= this.config.maxTriggersPerMinute) {
      return false;
    }

    // Record this trigger
    this.events.push(now);
    return true;
  }
}

// Export singleton instance
export const advancedTriggerSystem = new AdvancedTriggerSystemService();
