/**
 * Core Services - Core business logic services
 *
 * This module provides core business logic services that handle
 * foundational functionality like configuration, logging, and performance.
 */

// Re-export API services from core/api
export * from '@/core/api';
// Core business logic services
export * from './ConfigService';
// Service instances for direct use
export { configService } from './ConfigService';
export * from './LoggingService';
export { logger } from './LoggingService';
// Explicitly import and re-export PerformanceMetric to avoid ambiguity
export type { PerformanceMetric } from './PerformanceService';
export * from './PerformanceService';
export { performanceService } from './PerformanceService';
