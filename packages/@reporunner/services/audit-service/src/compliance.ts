import type { AuditEvent, ComplianceRule } from './index';

export const SOC2_RULES: ComplianceRule[] = [
  {
    id: 'soc2-access-control',
    name: 'Access Control Monitoring',
    description: 'Monitor privileged access and administrative actions',
    standard: 'SOC2',
    category: 'access',
    enabled: true,
    conditions: [
      { field: 'action', operator: 'contains', value: 'admin' },
      { field: 'severity', operator: 'equals', value: 'high' },
    ],
  },
  {
    id: 'soc2-data-retention',
    name: 'Data Retention Policy',
    description: 'Ensure data is retained according to policy',
    standard: 'SOC2',
    category: 'data',
    enabled: true,
    conditions: [
      { field: 'action', operator: 'equals', value: 'data_deletion' },
      { field: 'outcome', operator: 'equals', value: 'success' },
    ],
  },
];

export const GDPR_RULES: ComplianceRule[] = [
  {
    id: 'gdpr-data-access',
    name: 'Data Subject Access Rights',
    description: 'Monitor data access requests and responses',
    standard: 'GDPR',
    category: 'data',
    enabled: true,
    conditions: [{ field: 'action', operator: 'equals', value: 'data_access_request' }],
  },
  {
    id: 'gdpr-consent-tracking',
    name: 'Consent Management',
    description: 'Track consent changes and updates',
    standard: 'GDPR',
    category: 'data',
    enabled: true,
    conditions: [{ field: 'action', operator: 'contains', value: 'consent' }],
  },
];

export const HIPAA_RULES: ComplianceRule[] = [
  {
    id: 'hipaa-phi-access',
    name: 'PHI Access Monitoring',
    description: 'Monitor access to protected health information',
    standard: 'HIPAA',
    category: 'access',
    enabled: true,
    conditions: [
      { field: 'resource', operator: 'contains', value: 'phi' },
      { field: 'action', operator: 'equals', value: 'read' },
    ],
  },
];

export class ComplianceFramework {
  private standardRules: Map<string, ComplianceRule[]> = new Map();

  constructor() {
    this.standardRules.set('SOC2', SOC2_RULES);
    this.standardRules.set('GDPR', GDPR_RULES);
    this.standardRules.set('HIPAA', HIPAA_RULES);
  }

  getStandardRules(standard: string): ComplianceRule[] {
    return this.standardRules.get(standard) || [];
  }

  getAllStandards(): string[] {
    return Array.from(this.standardRules.keys());
  }

  validateCompliance(
    events: AuditEvent[],
    standard: string
  ): {
    compliant: boolean;
    violations: Array<{ rule: ComplianceRule; events: AuditEvent[] }>;
    score: number;
  } {
    const rules = this.getStandardRules(standard);
    const violations: Array<{ rule: ComplianceRule; events: AuditEvent[] }> = [];

    for (const rule of rules) {
      const violatingEvents = events.filter((event) => this.checkViolation(rule, event));
      if (violatingEvents.length > 0) {
        violations.push({ rule, events: violatingEvents });
      }
    }

    const totalViolations = violations.reduce((sum, v) => sum + v.events.length, 0);
    const score = Math.max(
      0,
      Math.min(100, ((events.length - totalViolations) / Math.max(1, events.length)) * 100)
    );

    return {
      compliant: violations.length === 0,
      violations,
      score: Math.round(score),
    };
  }

  private checkViolation(rule: ComplianceRule, event: AuditEvent): boolean {
    if (!rule.enabled) {
      return false;
    }

    return rule.conditions.some((condition) => {
      const eventValue = this.getFieldValue(event, condition.field);

      switch (condition.operator) {
        case 'equals':
          return eventValue !== condition.value;
        case 'contains':
          return !String(eventValue).includes(String(condition.value));
        case 'greater_than':
          return Number(eventValue) <= Number(condition.value);
        case 'less_than':
          return Number(eventValue) >= Number(condition.value);
        default:
          return false;
      }
    });
  }

  private getFieldValue(event: AuditEvent, field: string): any {
    const fields = field.split('.');
    let value: any = event;

    for (const f of fields) {
      value = value?.[f];
    }

    return value;
  }
}
