// Main SDK exports

// Re-export core types
export * from '@reporunner/core';
export type { ReporunnerClientConfig } from './client/ReporunnerClient.js';
export { ReporunnerClient } from './client/ReporunnerClient.js';
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
import { ReporunnerClient } from './client/ReporunnerClient.js';
export function createClient(config?: SDKConfig) {
  return new ReporunnerClient(config);
}
