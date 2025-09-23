export interface AlertRule {
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  enabled: boolean;
}

export interface AlertManager {
  addRule(rule: AlertRule): void;
  removeRule(name: string): void;
  evaluateRules(): Promise<Alert[]>;
}

export interface Alert {
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export class DefaultAlertManager implements AlertManager {
  private rules = new Map<string, AlertRule>();

  addRule(rule: AlertRule): void {
    this.rules.set(rule.name, rule);
  }

  removeRule(name: string): void {
    this.rules.delete(name);
  }

  async evaluateRules(): Promise<Alert[]> {
    // TODO: Implement rule evaluation
    return [];
  }
}
