// Export types
export * from './types';

import type {
  NotificationChannel,
  NotificationRequest,
  NotificationResult,
  NotificationTemplate,
} from './types';

export class NotificationService {
  private channels = new Map<string, NotificationChannel>();
  private templates = new Map<string, NotificationTemplate>();

  async addChannel(channel: NotificationChannel): Promise<void> {
    this.channels.set(channel.id, channel);
  }

  async addTemplate(template: NotificationTemplate): Promise<void> {
    this.templates.set(template.id, template);
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const channel = this.channels.get(request.channel);
    if (!channel) {
      throw new Error(`Channel not found: ${request.channel}`);
    }

    const template = this.templates.get(request.template);
    if (!template) {
      throw new Error(`Template not found: ${request.template}`);
    }

    // TODO: Implement actual notification sending
    return {
      id: this.generateId(),
      status: 'sent',
      sentAt: new Date(),
    };
  }

  async sendBulk(requests: NotificationRequest[]): Promise<NotificationResult[]> {
    return Promise.all(requests.map((request) => this.send(request)));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export * from './channels';
export * from './queue';
export * from './templates';
