/**
 * Advanced Trigger System - Stub
 * This service was removed during consolidation.
 * Minimal types provided for backward compatibility.
 */

export interface TriggerConfig {
  id: string;
  type: 'webhook' | 'schedule' | 'event';
  config: Record<string, any>;
}

export interface TriggerConfiguration extends TriggerConfig {
  workflowId: string;
  enabled: boolean;
  conditions?: any[];
  metadata?: Record<string, any>;
}

export interface TriggerEvent {
  id: string;
  triggerId: string;
  type: string;
  payload: any;
  timestamp: Date;
  processed: boolean;
}

export interface TriggerMetrics {
  triggerId: string;
  totalEvents: number;
  successfulTriggers: number;
  failedTriggers: number;
  averageProcessingTime: number;
  lastTriggered?: Date;
}

// Stub service class
class AdvancedTriggerSystem {
  async getTriggers(): Promise<TriggerConfig[]> {
    return [];
  }
}

export const advancedTriggerSystem = new AdvancedTriggerSystem();
