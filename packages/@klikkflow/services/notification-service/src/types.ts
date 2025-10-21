export interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'slack' | 'discord' | 'webhook' | 'push' | 'teams';
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  template: string;
  variables: string[];
}

export interface NotificationRequest {
  channel: string;
  template: string;
  recipients: string[];
  variables: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
}

export interface NotificationResult {
  id: string;
  status: 'sent' | 'failed' | 'pending' | 'scheduled';
  sentAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}
