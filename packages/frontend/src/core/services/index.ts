/**
 * Core Frontend Services
 *
 * UI-only services - all business logic moved to backend for security
 */

// AI Assistant - User-facing AI features (UI only)
export type { AIAssistantConfig, AIWorkflowSuggestion, ChatMessage } from './aiAssistantService';
export { AIAssistantService, aiAssistantService } from './aiAssistantService';

// Analytics - Client-side analytics and tracking (UI only)
export type {
  AnalyticsEvent,
  BottleneckAnalysis,
  CostOptimization,
  ExecutionMetrics,
  NodeMetrics,
  NodePerformanceStats,
  PerformanceMetric,
  PredictiveInsight,
  TimeSeriesPoint,
  WorkflowAnalytics,
} from './analyticsService';
export { AnalyticsService, analyticsService } from './analyticsService';
// Config - Application configuration (UI only)
// Re-export LogLevel from ConfigService (where it's defined)
export type { ApiEndpoints, AppConfig, LogLevel } from './ConfigService';
export { ConfigService, configService } from './ConfigService';

// Logging - Client-side logging (UI only, sends to backend)
export type {
  LogContext,
  LogEntry,
  PerformanceMetric as LoggingPerformanceMetric,
  UserAction,
} from './LoggingService';
export { Logger, logger } from './LoggingService';

// Performance - Client-side performance monitoring (UI only)
export type {
  ComponentPerformance,
  PerformanceMetric as PerformanceServiceMetric,
  WebVital,
} from './PerformanceService';
export { PerformanceMonitoringService, performanceService } from './PerformanceService';
