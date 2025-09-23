// Legacy config file - kept for backward compatibility
// For new code, use the enhanced ConfigService from services/ConfigService

export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    timeout: 30000,
  },
  websocket: {
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  },
  auth: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    timeout: parseInt(import.meta.env.VITE_AUTH_TIMEOUT || '3600000', 10),
  },
  features: {
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
  },
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
} as const;

export type Config = typeof config;

// Re-export the enhanced config service for new code
export { configService } from '../services/ConfigService';
