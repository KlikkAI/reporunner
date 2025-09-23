export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  outcome: 'success' | 'failure' | 'pending';
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  organizationId?: string;
  action?: string;
  resource?: string;
  outcome?: 'success' | 'failure' | 'pending';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  limit?: number;
  offset?: number;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  standard: 'SOC2' | 'GDPR' | 'HIPAA' | 'ISO27001' | 'PCI-DSS';
  category: 'access' | 'data' | 'security' | 'operational';
  enabled: boolean;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }>;
}

export interface ComplianceReport {
  id: string;
  standard: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  status: 'compliant' | 'non-compliant' | 'partial';
  violations: Array<{
    rule: string;
    count: number;
    severity: string;
    examples: AuditEvent[];
  }>;
  summary: {
    totalEvents: number;
    violations: number;
    complianceScore: number;
  };
}

export class AuditService {
  private events: AuditEvent[] = [];
  private rules: ComplianceRule[] = [];

  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.events.push(auditEvent);

    // Check for real-time compliance violations
    await this.checkComplianceRules(auditEvent);

    return auditEvent.id;
  }

  async logBulkEvents(events: Array<Omit<AuditEvent, 'id' | 'timestamp'>>): Promise<string[]> {
    return Promise.all(events.map((event) => this.logEvent(event)));
  }

  async queryEvents(filter: AuditFilter): Promise<AuditEvent[]> {
    let filteredEvents = this.events;

    if (filter.startDate) {
      filteredEvents = filteredEvents.filter((event) => event.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filteredEvents = filteredEvents.filter((event) => event.timestamp <= filter.endDate!);
    }

    if (filter.userId) {
      filteredEvents = filteredEvents.filter((event) => event.userId === filter.userId);
    }

    if (filter.organizationId) {
      filteredEvents = filteredEvents.filter(
        (event) => event.organizationId === filter.organizationId
      );
    }

    if (filter.action) {
      filteredEvents = filteredEvents.filter((event) => event.action === filter.action);
    }

    if (filter.resource) {
      filteredEvents = filteredEvents.filter((event) => event.resource === filter.resource);
    }

    if (filter.outcome) {
      filteredEvents = filteredEvents.filter((event) => event.outcome === filter.outcome);
    }

    if (filter.severity) {
      filteredEvents = filteredEvents.filter((event) => event.severity === filter.severity);
    }

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;

    return filteredEvents.slice(offset, offset + limit);
  }

  async exportEvents(filter: AuditFilter, format: 'json' | 'csv' | 'xml'): Promise<string> {
    const events = await this.queryEvents(filter);

    switch (format) {
      case 'json':
        return JSON.stringify(events, null, 2);
      case 'csv':
        return this.convertToCSV(events);
      case 'xml':
        return this.convertToXML(events);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async addComplianceRule(rule: ComplianceRule): Promise<void> {
    this.rules.push(rule);
  }

  async generateComplianceReport(
    standard: string,
    period: { start: Date; end: Date }
  ): Promise<ComplianceReport> {
    const relevantRules = this.rules.filter((rule) => rule.standard === standard && rule.enabled);
    const periodEvents = await this.queryEvents({ startDate: period.start, endDate: period.end });

    const violations: ComplianceReport['violations'] = [];
    let totalViolations = 0;

    for (const rule of relevantRules) {
      const violatingEvents = periodEvents.filter((event) => this.checkRuleViolation(rule, event));

      if (violatingEvents.length > 0) {
        violations.push({
          rule: rule.name,
          count: violatingEvents.length,
          severity: this.calculateRuleSeverity(violatingEvents),
          examples: violatingEvents.slice(0, 5), // First 5 examples
        });
        totalViolations += violatingEvents.length;
      }
    }

    const complianceScore = Math.max(
      0,
      Math.min(
        100,
        ((periodEvents.length - totalViolations) / Math.max(1, periodEvents.length)) * 100
      )
    );

    return {
      id: this.generateId(),
      standard,
      generatedAt: new Date(),
      period,
      status:
        complianceScore >= 95 ? 'compliant' : complianceScore >= 80 ? 'partial' : 'non-compliant',
      violations,
      summary: {
        totalEvents: periodEvents.length,
        violations: totalViolations,
        complianceScore: Math.round(complianceScore),
      },
    };
  }

  private async checkComplianceRules(event: AuditEvent): Promise<void> {
    const enabledRules = this.rules.filter((rule) => rule.enabled);

    for (const rule of enabledRules) {
      if (this.checkRuleViolation(rule, event)) {
        // TODO: Trigger alert or notification for real-time violation
        console.warn(`Compliance violation detected: ${rule.name}`, event);
      }
    }
  }

  private checkRuleViolation(rule: ComplianceRule, event: AuditEvent): boolean {
    return rule.conditions.every((condition) => {
      const eventValue = this.getEventFieldValue(event, condition.field);

      switch (condition.operator) {
        case 'equals':
          return eventValue === condition.value;
        case 'contains':
          return String(eventValue).includes(String(condition.value));
        case 'greater_than':
          return Number(eventValue) > Number(condition.value);
        case 'less_than':
          return Number(eventValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  private getEventFieldValue(event: AuditEvent, field: string): any {
    const fields = field.split('.');
    let value: any = event;

    for (const f of fields) {
      value = value?.[f];
    }

    return value;
  }

  private calculateRuleSeverity(events: AuditEvent[]): string {
    const severityLevels = events.map((e) => e.severity);

    if (severityLevels.includes('critical')) return 'critical';
    if (severityLevels.includes('high')) return 'high';
    if (severityLevels.includes('medium')) return 'medium';
    return 'low';
  }

  private convertToCSV(events: AuditEvent[]): string {
    if (events.length === 0) return '';

    const headers = Object.keys(events[0]).join(',');
    const rows = events.map((event) =>
      Object.values(event)
        .map((value) => (typeof value === 'object' ? JSON.stringify(value) : String(value)))
        .join(',')
    );

    return [headers, ...rows].join('\n');
  }

  private convertToXML(events: AuditEvent[]): string {
    const xmlEvents = events
      .map((event) => {
        const fields = Object.entries(event)
          .map(
            ([key, value]) =>
              `<${key}>${typeof value === 'object' ? JSON.stringify(value) : String(value)}</${key}>`
          )
          .join('');
        return `<event>${fields}</event>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?><audit_events>${xmlEvents}</audit_events>`;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export * from './compliance';
export * from './retention';
