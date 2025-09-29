/**
 * Advanced Trigger System
 * 
 * Reuses existing infrastructure to provide advanced trigger capabilities
 */

export interface TriggerConfig {
  id: string;
  type: 'webhook' | 'schedule' | 'email' | 'file' | 'manual' | 'database';
  name: string;
  description?: string;
  enabled: boolean;
  config: Record<string, any>;
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

export interface TriggerExecution {
  id: string;
  triggerId: string;
  timestamp: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data?: any;
  error?: string;
}

class AdvancedTriggerSystem {
  private triggers = new Map<string, TriggerConfig>();
  private executions = new Map<string, TriggerExecution>();
  private listeners = new Map<string, ((data: any) => void)[]>();

  /**
   * Register a trigger
   */
  registerTrigger(trigger: TriggerConfig): void {
    this.triggers.set(trigger.id, trigger);
    this.listeners.set(trigger.id, []);
  }

  /**
   * Update trigger configuration
   */
  updateTrigger(triggerId: string, updates: Partial<TriggerConfig>): void {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      this.triggers.set(triggerId, { ...trigger, ...updates });
    }
  }

  /**
   * Enable/disable trigger
   */
  setTriggerEnabled(triggerId: string, enabled: boolean): void {
    this.updateTrigger(triggerId, { enabled });
  }

  /**
   * Delete trigger
   */
  deleteTrigger(triggerId: string): void {
    this.triggers.delete(triggerId);
    this.listeners.delete(triggerId);
  }

  /**
   * Get all triggers
   */
  getTriggers(): TriggerConfig[] {
    return Array.from(this.triggers.values());
  }

  /**
   * Get trigger by ID
   */
  getTrigger(triggerId: string): TriggerConfig | undefined {
    return this.triggers.get(triggerId);
  }

  /**
   * Execute trigger manually
   */
  async executeTrigger(triggerId: string, data?: any): Promise<TriggerExecution> {
    const trigger = this.triggers.get(triggerId);
    
    if (!trigger) {
      throw new Error(`Trigger not found: ${triggerId}`);
    }

    if (!trigger.enabled) {
      throw new Error(`Trigger is disabled: ${triggerId}`);
    }

    const execution: TriggerExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      triggerId,
      timestamp: new Date().toISOString(),
      status: 'running',
      data,
    };

    this.executions.set(execution.id, execution);

    try {
      // Notify listeners
      const listeners = this.listeners.get(triggerId) || [];
      listeners.forEach(listener => listener(data));

      // Update execution status
      execution.status = 'completed';
      this.executions.set(execution.id, execution);

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      this.executions.set(execution.id, execution);
      
      throw error;
    }
  }

  /**
   * Subscribe to trigger executions
   */
  onTriggerExecuted(triggerId: string, callback: (data: any) => void): () => void {
    const listeners = this.listeners.get(triggerId) || [];
    listeners.push(callback);
    this.listeners.set(triggerId, listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = this.listeners.get(triggerId) || [];
      const index = currentListeners.indexOf(callback);
      if (index > -1) {
        currentListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get trigger execution history
   */
  getTriggerExecutions(triggerId: string): TriggerExecution[] {
    return Array.from(this.executions.values())
      .filter(execution => execution.triggerId === triggerId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Validate trigger configuration
   */
  validateTriggerConfig(trigger: Partial<TriggerConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!trigger.id) {
      errors.push('Trigger ID is required');
    }

    if (!trigger.type) {
      errors.push('Trigger type is required');
    }

    if (!trigger.name) {
      errors.push('Trigger name is required');
    }

    // Type-specific validation
    if (trigger.type === 'schedule' && !trigger.config?.cron) {
      errors.push('Schedule triggers require a cron expression');
    }

    if (trigger.type === 'webhook' && !trigger.config?.path) {
      errors.push('Webhook triggers require a path');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available trigger types
   */
  getAvailableTriggerTypes(): Array<{
    type: string;
    name: string;
    description: string;
    configSchema: Record<string, any>;
  }> {
    return [
      {
        type: 'manual',
        name: 'Manual Trigger',
        description: 'Trigger workflow manually',
        configSchema: {},
      },
      {
        type: 'webhook',
        name: 'Webhook',
        description: 'HTTP webhook trigger',
        configSchema: {
          path: { type: 'string', required: true },
          method: { type: 'string', default: 'POST' },
          authentication: { type: 'boolean', default: false },
        },
      },
      {
        type: 'schedule',
        name: 'Schedule',
        description: 'Time-based trigger',
        configSchema: {
          cron: { type: 'string', required: true },
          timezone: { type: 'string', default: 'UTC' },
        },
      },
      {
        type: 'email',
        name: 'Email',
        description: 'Email-based trigger',
        configSchema: {
          email: { type: 'string', required: true },
          subject: { type: 'string' },
          from: { type: 'string' },
        },
      },
    ];
  }
}

export const advancedTriggerSystem = new AdvancedTriggerSystem();
export { AdvancedTriggerSystem };