/**
 * Backend Audit Service
 * Provides audit logging functionality for the backend API
 */

import { Logger } from '@reporunner/core';
import {
  type AuditEvent,
  AuditLogger,
  type AuditQuery,
  type AuditReport,
} from '@reporunner/security';

export class AuditService {
  private auditLogger: AuditLogger;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('AuditService');
    this.auditLogger = new AuditLogger({
      maxEvents: 100000,
      retentionDays: 365,
      complianceMode: process.env.NODE_ENV === 'production',
    });

    this.logger.info('Audit service initialized');
  }

  /**
   * Log authentication events
   */
  async logAuthentication(
    action:
      | 'login'
      | 'logout'
      | 'login_failed'
      | 'password_change'
      | 'mfa_enabled'
      | 'mfa_disabled',
    userId?: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    return this.auditLogger.logAuthentication(action, userId, metadata);
  }

  /**
   * Log authorization events
   */
  async logAuthorization(
    action:
      | 'access_granted'
      | 'access_denied'
      | 'permission_changed'
      | 'role_assigned'
      | 'role_removed',
    userId: string,
    resource: string,
    resourceId?: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    return this.auditLogger.logAuthorization(action, userId, resource, resourceId, metadata);
  }

  /**
   * Log workflow events
   */
  async logWorkflowEvent(
    action: 'created' | 'updated' | 'deleted' | 'executed' | 'failed' | 'shared',
    workflowId: string,
    userId?: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    return this.auditLogger.logWorkflowEvent(action, workflowId, userId, metadata);
  }

  /**
   * Log data access events
   */
  async logDataEvent(
    action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import',
    resource: string,
    resourceId: string,
    userId?: string,
    changes?: AuditEvent['changes'],
    metadata: Record<string, any> = {}
  ): Promise<string> {
    return this.auditLogger.logDataEvent(action, resource, resourceId, userId, changes, metadata);
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    action: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    userId?: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    return this.auditLogger.logSecurityEvent(action, severity, message, userId, metadata);
  }

  /**
   * Query audit events
   */
  async queryEvents(query: AuditQuery = {}): Promise<AuditEvent[]> {
    return this.auditLogger.queryEvents(query);
  }

  /**
   * Generate compliance report
   */
  async generateReport(
    reportType: 'compliance' | 'security' | 'activity' | 'risk',
    timeRange: { start: Date; end: Date },
    filters: AuditQuery = {},
    generatedBy: string
  ): Promise<AuditReport> {
    return this.auditLogger.generateReport(reportType, timeRange, filters, generatedBy);
  }

  /**
   * Export audit events
   */
  async exportEvents(
    query: AuditQuery = {},
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<string> {
    return this.auditLogger.exportEvents(query, format);
  }
}

// Singleton instance
export const auditService = new AuditService();
export default auditService;
