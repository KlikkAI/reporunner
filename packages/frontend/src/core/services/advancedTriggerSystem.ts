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

// Stub service class
class AdvancedTriggerSystem {
  async getTriggers(): Promise<TriggerConfig[]> {
    return [];
  }
}

export const advancedTriggerSystem = new AdvancedTriggerSystem();
