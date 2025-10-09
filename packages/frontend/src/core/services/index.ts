/**
 * Core Frontend Services
 *
 * UI-only services - all business logic moved to backend for security
 */

// AI Assistant - User-facing AI features (UI only)
export type { AIAssistantConfig, ChatMessage, AIWorkflowSuggestion } from './aiAssistantService';
export { AIAssistantService, aiAssistantService } from './aiAssistantService';

// Analytics - Client-side analytics and tracking (UI only)
export type {
  AnalyticsEvent,
  PerformanceMetric,
  WorkflowAnalytics,
  NodePerformanceStats,
  ExecutionMetrics,
  NodeMetrics,
  BottleneckAnalysis,
  PredictiveInsight,
  TimeSeriesPoint,
  CostOptimization,
} from './analyticsService';
export { analyticsService, AnalyticsService } from './analyticsService';

// Config - Application configuration (UI only)
export type { AppConfig, ApiEndpoints } from './ConfigService';
export { configService, ConfigService } from './ConfigService';
// Re-export LogLevel from ConfigService (where it's defined)
export type { LogLevel } from './ConfigService';

// Logging - Client-side logging (UI only, sends to backend)
export type {
  LogEntry,
  LogContext,
  PerformanceMetric as LoggingPerformanceMetric,
  UserAction,
} from './LoggingService';
export { logger, Logger } from './LoggingService';

// Performance - Client-side performance monitoring (UI only)
export type {
  PerformanceMetric as PerformanceServiceMetric,
  WebVital,
  ComponentPerformance,
} from './PerformanceService';
export { performanceService, PerformanceMonitoringService } from './PerformanceService';
