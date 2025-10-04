/**
 * Core Frontend Services
 *
 * UI-only services - all business logic moved to backend for security
 */

// AI Assistant - User-facing AI features (UI only)
export * from './aiAssistantService';

// Analytics - Client-side analytics and tracking (UI only)
export * from './analyticsService';

// Config - Application configuration (UI only)
export * from './ConfigService';

// Logging - Client-side logging (UI only, sends to backend)
export * from './LoggingService';

// Performance - Client-side performance monitoring (UI only)
export * from './PerformanceService';
