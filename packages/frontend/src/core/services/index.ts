/**
 * Core Services - Core business logic services
 * 
 * This module provides core business logic services that handle
 * foundational functionality like configuration, logging, and performance.
 */

// Core business logic services
export * from './ConfigService'
export * from './LoggingService'

// Explicitly import and re-export PerformanceMetric to avoid ambiguity
export type { PerformanceMetric } from './PerformanceService'
export * from './PerformanceService'

// Re-export API services from core/api
export * from '@/core/api';

// Service instances for direct use
export { configService } from './ConfigService'
export { logger } from './LoggingService'
export { performanceService } from './PerformanceService'
