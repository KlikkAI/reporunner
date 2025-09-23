/**
 * Audit Logging and Compliance Service
 * Provides comprehensive audit trails for enterprise security and compliance
 */

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  organizationId?: string;
  teamId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: AuditCategory;
  result: 'success' | 'failure' | 'error';
  metadata?: Record<string, any>;
}

export type AuditCategory =
  | 'authentication'
  | 'authorization'
  | 'workflow'
  | 'credential'
  | 'organization'
  | 'user_management'
  | 'system'
  | 'integration'
  | 'data_access'
  | 'configuration';

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resource?: string;
  organizationId?: string;
  severity?: AuditEvent['severity'];
  category?: AuditCategory;
  result?: AuditEvent['result'];
  searchTerm?: string;
}

export interface ComplianceReport {
  id: string;
  name: string;
  description: string;
  generatedAt: Date;
  generatedBy: string;
  organizationId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: ComplianceMetrics;
  findings: ComplianceFinding[];
  recommendations: string[];
  status: 'compliant' | 'non_compliant' | 'requires_attention';
}

export interface ComplianceMetrics {
  totalEvents: number;
  securityEvents: number;
  failedLogins: number;
  privilegedOperations: number;
  dataAccess: number;
  configurationChanges: number;
  userManagementChanges: number;
  averageResponseTime: number;
  uniqueUsers: number;
  riskyActions: number;
}

export interface ComplianceFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  events: AuditEvent[];
  recommendation: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface DataRetentionPolicy {
  auditLogRetentionDays: number;
  executionLogRetentionDays: number;
  userDataRetentionDays: number;
  backupRetentionDays: number;
  automaticPurge: boolean;
  complianceMode: boolean; // Extended retention for compliance
}

export interface SecurityAlert {
  id: string;
  type:
    | 'suspicious_activity'
    | 'failed_login_attempts'
    | 'privilege_escalation'
    | 'data_breach'
    | 'system_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggeredAt: Date;
  userId?: string;
  organizationId?: string;
  events: AuditEvent[];
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolvedAt?: Date;
  resolution?: string;
}

export class AuditService {
  private events: AuditEvent[] = [];
  private complianceReports: ComplianceReport[] = [];
  private securityAlerts: SecurityAlert[] = [];
  private retentionPolicy: DataRetentionPolicy = {
    auditLogRetentionDays: 90,
    executionLogRetentionDays: 30,
    userDataRetentionDays: 365,
    backupRetentionDays: 180,
    automaticPurge: true,
    complianceMode: false,
  };

  // Event logging methods
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      ...event,
    };

    this.events.push(auditEvent);

    // Check for security alerts
    await this.checkForSecurityAlerts(auditEvent);

    // Trigger real-time notifications for critical events
    if (auditEvent.severity === 'critical') {
      await this.triggerSecurityAlert(auditEvent);
    }
  }

  // Authentication events
  async logLogin(
    userId: string,
    userName: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    organizationId?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'login',
      resource: 'authentication',
      details: { success },
      ipAddress,
      userAgent,
      organizationId,
      severity: success ? 'low' : 'medium',
      category: 'authentication',
      result: success ? 'success' : 'failure',
    });
  }

  async logLogout(
    userId: string,
    userName: string,
    ipAddress: string,
    userAgent: string,
    organizationId?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'logout',
      resource: 'authentication',
      details: {},
      ipAddress,
      userAgent,
      organizationId,
      severity: 'low',
      category: 'authentication',
      result: 'success',
    });
  }

  async logPasswordChange(
    userId: string,
    userName: string,
    ipAddress: string,
    userAgent: string,
    organizationId?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'password_change',
      resource: 'user',
      resourceId: userId,
      details: {},
      ipAddress,
      userAgent,
      organizationId,
      severity: 'medium',
      category: 'authentication',
      result: 'success',
    });
  }

  // Workflow events
  async logWorkflowCreated(
    userId: string,
    userName: string,
    workflowId: string,
    workflowName: string,
    ipAddress: string,
    userAgent: string,
    organizationId?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'create',
      resource: 'workflow',
      resourceId: workflowId,
      details: { workflowName },
      ipAddress,
      userAgent,
      organizationId,
      severity: 'low',
      category: 'workflow',
      result: 'success',
    });
  }

  async logWorkflowExecuted(
    userId: string,
    userName: string,
    workflowId: string,
    workflowName: string,
    executionId: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    organizationId?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'execute',
      resource: 'workflow',
      resourceId: workflowId,
      details: { workflowName, executionId, success },
      ipAddress,
      userAgent,
      organizationId,
      severity: 'medium',
      category: 'workflow',
      result: success ? 'success' : 'failure',
    });
  }

  async logWorkflowDeleted(
    userId: string,
    userName: string,
    workflowId: string,
    workflowName: string,
    ipAddress: string,
    userAgent: string,
    organizationId?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'delete',
      resource: 'workflow',
      resourceId: workflowId,
      details: { workflowName },
      ipAddress,
      userAgent,
      organizationId,
      severity: 'high',
      category: 'workflow',
      result: 'success',
    });
  }

  // Credential events
  async logCredentialCreated(
    userId: string,
    userName: string,
    credentialId: string,
    credentialType: string,
    ipAddress: string,
    userAgent: string,
    organizationId?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'create',
      resource: 'credential',
      resourceId: credentialId,
      details: { credentialType },
      ipAddress,
      userAgent,
      organizationId,
      severity: 'medium',
      category: 'credential',
      result: 'success',
    });
  }

  async logCredentialAccessed(
    userId: string,
    userName: string,
    credentialId: string,
    credentialType: string,
    purpose: string,
    ipAddress: string,
    userAgent: string,
    organizationId?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'access',
      resource: 'credential',
      resourceId: credentialId,
      details: { credentialType, purpose },
      ipAddress,
      userAgent,
      organizationId,
      severity: 'medium',
      category: 'credential',
      result: 'success',
    });
  }

  // Organization events
  async logUserInvited(
    userId: string,
    userName: string,
    invitedEmail: string,
    role: string,
    organizationId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'invite_user',
      resource: 'organization',
      resourceId: organizationId,
      details: { invitedEmail, role },
      ipAddress,
      userAgent,
      organizationId,
      severity: 'medium',
      category: 'user_management',
      result: 'success',
    });
  }

  async logRoleChanged(
    userId: string,
    userName: string,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    organizationId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'change_role',
      resource: 'user',
      resourceId: targetUserId,
      details: { oldRole, newRole },
      ipAddress,
      userAgent,
      organizationId,
      severity: 'high',
      category: 'authorization',
      result: 'success',
    });
  }

  // Query methods
  async getEvents(
    filter: AuditFilter,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditEvent[]> {
    let filteredEvents = [...this.events];

    // Apply filters
    if (filter.startDate) {
      filteredEvents = filteredEvents.filter((event) => event.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filteredEvents = filteredEvents.filter((event) => event.timestamp <= filter.endDate!);
    }

    if (filter.userId) {
      filteredEvents = filteredEvents.filter((event) => event.userId === filter.userId);
    }

    if (filter.action) {
      filteredEvents = filteredEvents.filter((event) => event.action.includes(filter.action!));
    }

    if (filter.resource) {
      filteredEvents = filteredEvents.filter((event) => event.resource === filter.resource);
    }

    if (filter.organizationId) {
      filteredEvents = filteredEvents.filter(
        (event) => event.organizationId === filter.organizationId
      );
    }

    if (filter.severity) {
      filteredEvents = filteredEvents.filter((event) => event.severity === filter.severity);
    }

    if (filter.category) {
      filteredEvents = filteredEvents.filter((event) => event.category === filter.category);
    }

    if (filter.result) {
      filteredEvents = filteredEvents.filter((event) => event.result === filter.result);
    }

    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.action.toLowerCase().includes(searchLower) ||
          event.resource.toLowerCase().includes(searchLower) ||
          event.userName.toLowerCase().includes(searchLower) ||
          JSON.stringify(event.details).toLowerCase().includes(searchLower)
      );
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    return filteredEvents.slice(offset, offset + limit);
  }

  async getEventCount(filter: AuditFilter): Promise<number> {
    const events = await this.getEvents(filter, Number.MAX_SAFE_INTEGER, 0);
    return events.length;
  }

  // Compliance reporting
  async generateComplianceReport(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    generatedBy: string
  ): Promise<ComplianceReport> {
    const events = await this.getEvents(
      {
        organizationId,
        startDate,
        endDate,
      },
      Number.MAX_SAFE_INTEGER,
      0
    );

    const metrics = this.calculateComplianceMetrics(events);
    const findings = await this.analyzeComplianceFindings(events);

    const report: ComplianceReport = {
      id: this.generateId(),
      name: `Compliance Report - ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      description: 'Automated compliance analysis based on audit trail data',
      generatedAt: new Date(),
      generatedBy,
      organizationId,
      timeRange: { start: startDate, end: endDate },
      metrics,
      findings,
      recommendations: this.generateRecommendations(findings),
      status: findings.some((f) => f.severity === 'critical' || f.severity === 'high')
        ? 'requires_attention'
        : 'compliant',
    };

    this.complianceReports.push(report);
    return report;
  }

  private calculateComplianceMetrics(events: AuditEvent[]): ComplianceMetrics {
    const uniqueUsers = new Set(events.map((e) => e.userId)).size;
    const securityEvents = events.filter(
      (e) =>
        e.category === 'authentication' ||
        e.category === 'authorization' ||
        e.severity === 'high' ||
        e.severity === 'critical'
    ).length;

    return {
      totalEvents: events.length,
      securityEvents,
      failedLogins: events.filter((e) => e.action === 'login' && e.result === 'failure').length,
      privilegedOperations: events.filter((e) => e.category === 'authorization').length,
      dataAccess: events.filter((e) => e.category === 'data_access').length,
      configurationChanges: events.filter((e) => e.category === 'configuration').length,
      userManagementChanges: events.filter((e) => e.category === 'user_management').length,
      averageResponseTime: 0, // Would be calculated from actual response times
      uniqueUsers,
      riskyActions: events.filter((e) => e.severity === 'high' || e.severity === 'critical').length,
    };
  }

  private async analyzeComplianceFindings(events: AuditEvent[]): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Check for multiple failed login attempts
    const failedLogins = events.filter((e) => e.action === 'login' && e.result === 'failure');
    const loginsByUser = new Map<string, AuditEvent[]>();

    failedLogins.forEach((event) => {
      if (!loginsByUser.has(event.userId)) {
        loginsByUser.set(event.userId, []);
      }
      loginsByUser.get(event.userId)?.push(event);
    });

    loginsByUser.forEach((userFailedLogins, userId) => {
      if (userFailedLogins.length >= 5) {
        findings.push({
          id: this.generateId(),
          severity: 'high',
          category: 'Authentication',
          title: 'Multiple Failed Login Attempts',
          description: `User ${userId} has ${userFailedLogins.length} failed login attempts`,
          events: userFailedLogins,
          recommendation:
            'Consider implementing account lockout policies or investigating potential brute force attacks',
          resolved: false,
        });
      }
    });

    // Check for privileged operations outside business hours
    const privilegedEvents = events.filter(
      (e) =>
        e.category === 'authorization' ||
        e.action.includes('delete') ||
        e.action.includes('change_role')
    );

    privilegedEvents.forEach((event) => {
      const hour = event.timestamp.getHours();
      if (hour < 6 || hour > 22) {
        // Outside 6 AM - 10 PM
        findings.push({
          id: this.generateId(),
          severity: 'medium',
          category: 'Access Control',
          title: 'Privileged Operation Outside Business Hours',
          description: `${event.action} performed on ${event.resource} at ${event.timestamp.toLocaleTimeString()}`,
          events: [event],
          recommendation:
            'Review if this privileged operation was authorized and necessary outside business hours',
          resolved: false,
        });
      }
    });

    return findings;
  }

  private generateRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations = new Set<string>();

    findings.forEach((finding) => {
      switch (finding.category) {
        case 'Authentication':
          recommendations.add('Implement multi-factor authentication for all users');
          recommendations.add('Set up account lockout policies after failed login attempts');
          break;
        case 'Access Control':
          recommendations.add('Review and update access control policies');
          recommendations.add('Implement time-based access restrictions for privileged operations');
          break;
        default:
          recommendations.add('Conduct regular security audits and access reviews');
      }
    });

    return Array.from(recommendations);
  }

  // Security alerting
  private async checkForSecurityAlerts(event: AuditEvent): Promise<void> {
    // Check for suspicious patterns
    const recentEvents = this.events.filter(
      (e) => e.userId === event.userId && e.timestamp.getTime() > Date.now() - 3600000 // Last hour
    );

    // Multiple failed logins
    const recentFailedLogins = recentEvents.filter(
      (e) => e.action === 'login' && e.result === 'failure'
    );

    if (recentFailedLogins.length >= 3) {
      await this.createSecurityAlert({
        type: 'failed_login_attempts',
        severity: 'high',
        title: 'Multiple Failed Login Attempts',
        description: `User ${event.userName} has ${recentFailedLogins.length} failed login attempts in the last hour`,
        userId: event.userId,
        organizationId: event.organizationId,
        events: recentFailedLogins,
      });
    }

    // Unusual activity patterns
    if (recentEvents.length > 50) {
      // More than 50 actions in an hour
      await this.createSecurityAlert({
        type: 'suspicious_activity',
        severity: 'medium',
        title: 'Unusual Activity Volume',
        description: `User ${event.userName} has performed ${recentEvents.length} actions in the last hour`,
        userId: event.userId,
        organizationId: event.organizationId,
        events: recentEvents.slice(-10), // Last 10 events
      });
    }
  }

  private async createSecurityAlert(
    alertData: Omit<SecurityAlert, 'id' | 'triggeredAt' | 'status'>
  ): Promise<void> {
    const alert: SecurityAlert = {
      id: this.generateId(),
      triggeredAt: new Date(),
      status: 'open',
      ...alertData,
    };

    this.securityAlerts.push(alert);
  }

  private async triggerSecurityAlert(_event: AuditEvent): Promise<void> {}

  // Data export for compliance
  async exportAuditData(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const events = await this.getEvents(
      {
        organizationId,
        startDate,
        endDate,
      },
      Number.MAX_SAFE_INTEGER,
      0
    );

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    } else {
      // CSV export
      const headers = [
        'timestamp',
        'userId',
        'userName',
        'action',
        'resource',
        'result',
        'severity',
        'ipAddress',
      ];
      const rows = events.map((event) => [
        event.timestamp.toISOString(),
        event.userId,
        event.userName,
        event.action,
        event.resource,
        event.result,
        event.severity,
        event.ipAddress,
      ]);

      return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }
  }

  // Utility methods
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup methods
  async performDataRetention(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicy.auditLogRetentionDays);

    const _beforeCount = this.events.length;
    this.events = this.events.filter((event) => event.timestamp >= cutoffDate);
    const _afterCount = this.events.length;
  }
}

// Singleton instance
export const auditService = new AuditService();
