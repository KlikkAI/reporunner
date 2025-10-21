// Main SDK exports

// Re-export core types
export * from '@klikkflow/core';
export type { KlikkFlowClientConfig } from './client/KlikkFlowClient.js';
export { KlikkFlowClient } from './client/KlikkFlowClient.js';
export { WebSocketClient } from './client/WebSocketClient.js';

// SDK-specific types
export interface SDKConfig {
  apiUrl?: string;
  apiKey?: string;
  timeout?: number;
  enableWebSocket?: boolean;
  wsUrl?: string;
}

// Convenience factory function
import { KlikkFlowClient } from './client/KlikkFlowClient.js';
export function createClient(config?: SDKConfig) {
  return new KlikkFlowClient(config);
}
