/**
 * Core Frontend Services
 *
 * UI-only services - all business logic moved to backend for security
 */

// AI Assistant - User-facing AI features (UI only)
export { AIAssistantService } from './aiAssistantService';
export type { AIAssistantConfig, ChatMessage, WorkflowSuggestion } from './aiAssistantService';

// Analytics - Client-side analytics and tracking (UI only)
// Use PerformanceMetric from analyticsService as the canonical version
export { analyticsService } from './analyticsService';
export type {
  AnalyticsEvent,
  AnalyticsEventType,
  PerformanceMetric,
  UserJourneyStep,
  WorkflowAnalytics,
} from './analyticsService';

// Config - Application configuration (UI only)
export { configService } from './ConfigService';
export type { ConfigService } from './ConfigService';

// Logging - Client-side logging (UI only, sends to backend)
export { loggingService } from './LoggingService';
export type {
  LogEntry,
  LogLevel,
  LoggingConfig,
  PerformanceMetric as LoggingPerformanceMetric, // Rename to avoid conflict
} from './LoggingService';

// Performance - Client-side performance monitoring (UI only)
export { performanceService } from './PerformanceService';
export type {
  PerformanceMetric as PerformanceServiceMetric, // Rename to avoid conflict
  PerformanceReport,
  RenderMetric,
} from './PerformanceService';

// Credential service
export { credentialService } from './credentialService';

// Integration service
export { integrationService } from './integrationService';

// Workflow exporter service
export { workflowExporterService } from './workflowExporterService';
