/**
 * Types exports for @reporunner/shared
 * Consolidated from @reporunner/types and existing shared types
 */

// Re-export Zod for convenience
export { z } from 'zod';
// Existing shared types
export * from './audit';
// Core types (from @reporunner/types)
export * from './common';
export * from './execution';
export * from './express';
export * from './schedules';
export * from './security';
export * from './triggers';
export * from './user';
export * from './workflow';

import type { ExecutionStatus, IExecution } from './execution';
// Type Guards - Runtime type checking utilities
import type { IUser } from './user';
import type { IEdge, INode, IWorkflow } from './workflow';

/**
 * Type guard for INode
 */
export function isNode(value: any): value is INode {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    typeof value.position === 'object'
  );
}

/**
 * Type guard for IEdge
 */
export function isEdge(value: any): value is IEdge {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.source === 'string' &&
    typeof value.target === 'string'
  );
}

/**
 * Type guard for IWorkflow
 */
export function isWorkflow(value: any): value is IWorkflow {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.nodes) &&
    Array.isArray(value.edges)
  );
}

/**
 * Type guard for IExecution
 */
export function isExecution(value: any): value is IExecution {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.workflowId === 'string' &&
    typeof value.status === 'string'
  );
}

/**
 * Type guard for IUser
 */
export function isUser(value: any): value is IUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.role === 'string'
  );
}

/**
 * Check if execution is in terminal state (completed, failed, or cancelled)
 */
export function isExecutionTerminal(status: ExecutionStatus): boolean {
  return ['success', 'error', 'cancelled', 'crashed'].includes(status);
}

/**
 * Check if execution is still active (running or pending)
 */
export function isExecutionActive(status: ExecutionStatus): boolean {
  return ['pending', 'running', 'waiting'].includes(status);
}
