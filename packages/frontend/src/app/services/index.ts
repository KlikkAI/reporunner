/**
 * App Services - Application layer service integrations
 *
 * This module provides app-specific service integrations that handle
 * business logic coordination and user-facing operations.
 */

// Re-export core services that are still used by the app layer
export * from '@/core/services';
export {
  ExecutionMonitorService,
  executionMonitor,
  useExecutionMonitor,
} from './executionMonitor';
// App-specific services
export { integrationService } from './integrationService';
