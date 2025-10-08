/**
 * Backend Trigger System Service
 * Handles workflow triggers (webhooks, events, schedules)
 */

import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { Logger } from '@reporunner/core';

export interface TriggerConfig {
  id: string;
  type: 'webhook' | 'schedule' | 'event' | 'manual';
  workflowId: string;
  enabled: boolean;
  config: Record<string, any>;
  conditions?: TriggerCondition[];
  metadata?: Record<string, any>;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value: any;
}

export interface TriggerEvent {
  id: string;
  triggerId: string;
  type: string;
  payload: any;
  timestamp: Date;
  processed: boolean;
  processingTime?: number;
  result?: any;
  error?: string;
}

export interface WebhookTrigger extends TriggerConfig {
  type: 'webhook';
  config: {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    authentication?: {
      type: 'none' | 'basic' | 'bearer' | 'signature';
      secret?: string;
    };
    responseMode: 'sync' | 'async';
  };
}

export interface EventTrigger extends TriggerConfig {
  type: 'event';
  config: {
    eventType: string;
    source?: string;
    filters?: Record<string, any>;
  };
}

export class TriggerSystemService extends EventEmitter {
  private logger: Logger;
  private triggers = new Map<string, TriggerConfig>();
  private events = new Map<string, TriggerEvent>();
  private webhookPaths = new Map<string, string>(); // path -> triggerId

  constructor() {
    super();
    this.logger = new Logger('TriggerSystemService');
    this.logger.info('Trigger system service initialized');
  }

  /**
   * Create a new trigger
   */
  async createTrigger(trigger: Omit<TriggerConfig, 'id'>): Promise<TriggerConfig> {
    try {
      const triggerId = this.generateTriggerId();

      const newTrigger: TriggerConfig = {
        ...trigger,
        id: triggerId,
      };

      // Validate trigger configuration
      await this.validateTriggerConfig(newTrigger);

      this.triggers.set(triggerId, newTrigger);

      // Set up trigger-specific resources
      await this.setupTrigger(newTrigger);

      this.emit('trigger_created', newTrigger);

      this.logger.info('Trigger created', {
        triggerId,
        type: trigger.type,
        workflowId: trigger.workflowId,
      });

      return newTrigger;
    } catch (error) {
      this.logger.error('Failed to create trigger', { error, trigger });
      throw error;
    }
  }

  /**
   * Update an existing trigger
   */
  async updateTrigger(triggerId: string, updates: Partial<TriggerConfig>): Promise<TriggerConfig> {
    try {
      const trigger = this.triggers.get(triggerId);
      if (!trigger) {
        throw new Error(`Trigger not found: ${triggerId}`);
      }

      // Clean up old trigger setup
      await this.cleanupTrigger(trigger);

      // Update trigger
      const updatedTrigger = { ...trigger, ...updates };
      this.triggers.set(triggerId, updatedTrigger);

      // Validate updated configuration
      await this.validateTriggerConfig(updatedTrigger);

      // Set up trigger with new configuration
      if (updatedTrigger.enabled) {
        await this.setupTrigger(updatedTrigger);
      }

      this.emit('trigger_updated', updatedTrigger);

      this.logger.info('Trigger updated', { triggerId, updates });

      return updatedTrigger;
    } catch (error) {
      this.logger.error('Failed to update trigger', { error, triggerId, updates });
      throw error;
    }
  }

  /**
   * Delete a trigger
   */
  async deleteTrigger(triggerId: string): Promise<void> {
    try {
      const trigger = this.triggers.get(triggerId);
      if (!trigger) {
        throw new Error(`Trigger not found: ${triggerId}`);
      }

      // Clean up trigger resources
      await this.cleanupTrigger(trigger);

      // Remove trigger
      this.triggers.delete(triggerId);

      this.emit('trigger_deleted', trigger);

      this.logger.info('Trigger deleted', { triggerId });
    } catch (error) {
      this.logger.error('Failed to delete trigger', { error, triggerId });
      throw error;
    }
  }

  /**
   * Get trigger by ID
   */
  getTrigger(triggerId: string): TriggerConfig | undefined {
    return this.triggers.get(triggerId);
  }

  /**
   * List triggers
   */
  listTriggers(workflowId?: string, type?: string): TriggerConfig[] {
    const triggers = Array.from(this.triggers.values());

    let filtered = triggers;

    if (workflowId) {
      filtered = filtered.filter((t) => t.workflowId === workflowId);
    }

    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }

    return filtered;
  }

  /**
   * Handle webhook request
   */
  async handleWebhookRequest(
    path: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    query: Record<string, string>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const triggerId = this.webhookPaths.get(path);
      if (!triggerId) {
        return { success: false, error: 'Webhook path not found' };
      }

      const trigger = this.triggers.get(triggerId) as WebhookTrigger;
      if (!trigger?.enabled) {
        return { success: false, error: 'Trigger not found or disabled' };
      }

      // Validate method
      if (trigger.config.method !== method) {
        return { success: false, error: `Method ${method} not allowed` };
      }

      // Authenticate request
      const authResult = await this.authenticateWebhookRequest(trigger, headers, body);
      if (!authResult.success) {
        return authResult;
      }

      // Create trigger event
      const event: TriggerEvent = {
        id: this.generateEventId(),
        triggerId,
        type: 'webhook',
        payload: {
          headers,
          body,
          query,
          method,
          path,
        },
        timestamp: new Date(),
        processed: false,
      };

      this.events.set(event.id, event);

      // Process trigger
      const result = await this.processTriggerEvent(trigger, event);

      this.logger.info('Webhook trigger processed', {
        triggerId,
        eventId: event.id,
        success: result.success,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to handle webhook request', { error, path, method });
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Handle system event
   */
  async handleSystemEvent(eventType: string, source: string, payload: any): Promise<void> {
    try {
      // Find matching event triggers
      const eventTriggers = Array.from(this.triggers.values()).filter(
        (t) => t.type === 'event' && t.enabled
      ) as EventTrigger[];

      for (const trigger of eventTriggers) {
        if (this.matchesEventTrigger(trigger, eventType, source, payload)) {
          const event: TriggerEvent = {
            id: this.generateEventId(),
            triggerId: trigger.id,
            type: 'event',
            payload: {
              eventType,
              source,
              data: payload,
            },
            timestamp: new Date(),
            processed: false,
          };

          this.events.set(event.id, event);

          // Process trigger asynchronously
          this.processTriggerEvent(trigger, event).catch((error) => {
            this.logger.error('Failed to process event trigger', {
              error,
              triggerId: trigger.id,
              eventId: event.id,
            });
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to handle system event', { error, eventType, source });
    }
  }

  /**
   * Manually trigger a workflow
   */
  async manualTrigger(
    triggerId: string,
    payload: any = {}
  ): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const trigger = this.triggers.get(triggerId);
      if (!trigger) {
        return { success: false, error: 'Trigger not found' };
      }

      const event: TriggerEvent = {
        id: this.generateEventId(),
        triggerId,
        type: 'manual',
        payload,
        timestamp: new Date(),
        processed: false,
      };

      this.events.set(event.id, event);

      const result = await this.processTriggerEvent(trigger, event);

      this.logger.info('Manual trigger executed', {
        triggerId,
        eventId: event.id,
        success: result.success,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to execute manual trigger', { error, triggerId });
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get trigger events
   */
  getTriggerEvents(triggerId?: string): TriggerEvent[] {
    const events = Array.from(this.events.values());

    if (triggerId) {
      return events.filter((e) => e.triggerId === triggerId);
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get trigger metrics
   */
  getTriggerMetrics(triggerId?: string): {
    totalEvents: number;
    successfulTriggers: number;
    failedTriggers: number;
    averageProcessingTime: number;
    lastTriggered?: Date;
  } {
    const events = triggerId
      ? Array.from(this.events.values()).filter((e: TriggerEvent) => e.triggerId === triggerId)
      : Array.from(this.events.values());

    const totalEvents = events.length;
    const processedEvents = events.filter((e: TriggerEvent) => e.processed);
    const successfulTriggers = processedEvents.filter((e: TriggerEvent) => !e.error).length;
    const failedTriggers = processedEvents.filter((e: TriggerEvent) => e.error).length;

    const processingTimes = processedEvents
      .filter((e: TriggerEvent) => e.processingTime)
      .map((e: TriggerEvent) => e.processingTime!);

    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a: number, b: number) => a + b, 0) / processingTimes.length
        : 0;

    const lastTriggered =
      events.length > 0
        ? events.sort((a: TriggerEvent, b: TriggerEvent) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
        : undefined;

    return {
      totalEvents,
      successfulTriggers,
      failedTriggers,
      averageProcessingTime,
      lastTriggered,
    };
  }

  private async validateTriggerConfig(trigger: TriggerConfig): Promise<void> {
    switch (trigger.type) {
      case 'webhook': {
        const webhookTrigger = trigger as WebhookTrigger;
        if (!webhookTrigger.config.path) {
          throw new Error('Webhook path is required');
        }
        if (!webhookTrigger.config.method) {
          throw new Error('Webhook method is required');
        }
        break;
      }

      case 'event': {
        const eventTrigger = trigger as EventTrigger;
        if (!eventTrigger.config.eventType) {
          throw new Error('Event type is required');
        }
        break;
      }
    }
  }

  private async setupTrigger(trigger: TriggerConfig): Promise<void> {
    switch (trigger.type) {
      case 'webhook': {
        const webhookTrigger = trigger as WebhookTrigger;
        this.webhookPaths.set(webhookTrigger.config.path, trigger.id);
        break;
      }
    }
  }

  private async cleanupTrigger(trigger: TriggerConfig): Promise<void> {
    switch (trigger.type) {
      case 'webhook': {
        const webhookTrigger = trigger as WebhookTrigger;
        this.webhookPaths.delete(webhookTrigger.config.path);
        break;
      }
    }
  }

  private async authenticateWebhookRequest(
    trigger: WebhookTrigger,
    headers: Record<string, string>,
    body: any
  ): Promise<{ success: boolean; error?: string }> {
    const auth = trigger.config.authentication;

    if (!auth || auth.type === 'none') {
      return { success: true };
    }

    switch (auth.type) {
      case 'basic': {
        const authHeader = headers.authorization;
        if (!authHeader?.startsWith('Basic ')) {
          return { success: false, error: 'Basic authentication required' };
        }
        // TODO: Validate basic auth credentials
        return { success: true };
      }

      case 'bearer': {
        const bearerHeader = headers.authorization;
        if (!bearerHeader?.startsWith('Bearer ')) {
          return { success: false, error: 'Bearer token required' };
        }
        // TODO: Validate bearer token
        return { success: true };
      }

      case 'signature': {
        if (!auth.secret) {
          return { success: false, error: 'Signature secret not configured' };
        }

        const signature = headers['x-signature'] || headers['x-hub-signature-256'];
        if (!signature) {
          return { success: false, error: 'Signature header missing' };
        }

        // Validate signature
        const expectedSignature = crypto
          .createHmac('sha256', auth.secret)
          .update(JSON.stringify(body))
          .digest('hex');

        if (signature !== `sha256=${expectedSignature}`) {
          return { success: false, error: 'Invalid signature' };
        }

        return { success: true };
      }

      default:
        return { success: false, error: 'Unsupported authentication type' };
    }
  }

  private matchesEventTrigger(
    trigger: EventTrigger,
    eventType: string,
    source: string,
    payload: any
  ): boolean {
    // Check event type
    if (trigger.config.eventType !== eventType) {
      return false;
    }

    // Check source if specified
    if (trigger.config.source && trigger.config.source !== source) {
      return false;
    }

    // Check filters if specified
    if (trigger.config.filters) {
      for (const [key, value] of Object.entries(trigger.config.filters)) {
        if (payload[key] !== value) {
          return false;
        }
      }
    }

    // Check conditions if specified
    if (trigger.conditions) {
      for (const condition of trigger.conditions) {
        if (!this.evaluateCondition(condition, payload)) {
          return false;
        }
      }
    }

    return true;
  }

  private evaluateCondition(condition: TriggerCondition, payload: any): boolean {
    const fieldValue = this.getNestedValue(payload, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async processTriggerEvent(
    trigger: TriggerConfig,
    event: TriggerEvent
  ): Promise<{ success: boolean; executionId?: string; error?: string }> {
    const startTime = Date.now();

    try {
      event.processed = true;

      // TODO: Integrate with actual workflow execution engine
      // For now, simulate workflow execution
      const executionId = this.generateExecutionId();

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 100));

      event.processingTime = Date.now() - startTime;
      event.result = { executionId, success: true };

      this.emit('trigger_executed', { trigger, event });

      return { success: true, executionId };
    } catch (error) {
      event.processingTime = Date.now() - startTime;
      event.error = error instanceof Error ? error.message : 'Unknown error';

      this.emit('trigger_failed', { trigger, event, error });

      return { success: false, error: event.error };
    }
  }

  private generateTriggerId(): string {
    return `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const triggerSystemService = new TriggerSystemService();
export default triggerSystemService;
