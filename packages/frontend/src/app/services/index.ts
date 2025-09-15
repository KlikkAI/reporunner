/**
 * App Services - Application layer service integrations
 * 
 * This module provides app-specific service integrations that handle
 * business logic coordination and user-facing operations.
 */

// App-specific services
export { default as integrationService } from './integrationService';
export { default as executionMonitor } from './executionMonitor';

// Re-export core services that are still used by the app layer
export * from '@/core/services';