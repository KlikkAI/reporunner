webhook?: string;
token?: string;
channel?: string;
}
teams?:
{
  webhook: string;
}
discord?: {
    webhook: string;
}
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  channelType: NotificationChannel['type'];
  subject?: string; // For email/push notifications
  template: string; // Template content with variables
  variables: TemplateVariable[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface NotificationRequest {
  id?: string;
  channelId: string;
  templateId?: string;
  recipients: NotificationRecipient[];
  subject?: string;
  content?: string; // Raw content if no template
  variables?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  deduplicationId?: string; // Prevent duplicate notifications
  organizationId: string;
  triggeredBy?: string;
  correlationId?: string;
}

export interface NotificationRecipient {
  id: string;
  type: 'user' | 'email' | 'phone' | 'webhook' | 'channel';
  value: string; // email, phone, webhook URL, etc.
  name?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  id: string;
  requestId: string;
  recipientId: string;
  channelId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled' | 'expired';
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  error?: NotificationError;
  attempts: number;
  maxAttempts: number;
  metadata?: Record<string, any>;
  response?: {
    statusCode?: number;
    body?: any;
    headers?: Record<string, string>;
  };
}

export interface NotificationError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

export interface NotificationJobData {
  requestId: string;
  recipientId: string;
  channelId: string;
  subject?: string;
  content: string;
  metadata?: Record<string, any>;
  attempt: number;
}
