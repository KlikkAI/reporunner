import { DistributedEventBus } from '@reporunner/platform/event-bus';
import { logger } from '@reporunner/shared/logger';
import { Job, Queue, Worker } from 'bullmq';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { Collection, Db, MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export interface NotificationConfig {
  mongodb: {
    uri: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queue: {
    maxConcurrentJobs: number;
    retryAttempts: number;
    backoffDelay: number;
  };
  providers: {
    email?: {
      provider: 'smtp' | 'sendgrid' | 'ses' | 'mailgun';
      config: Record<string, any>;
    };
    sms?: {
      provider: 'twilio' | 'nexmo' | 'sns';
      config: Record<string, any>;
    };
    slack?: {
      webhook?: string;
      token?: string;
    };
    teams?: {
      webhook?: string;
    };
    discord?: {
      webhook?: string;
    };
    webhook?: {
      defaultHeaders?: Record<string, string>;
    };
  };
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'slack' | 'discord' | 'webhook' | 'push' | 'teams' | 'in_app';
  organizationId: string;
  config: ChannelConfig;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  rateLimit?: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

export interface ChannelConfig {
  // Email config
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
    fromEmail: string;
  };
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };

  // SMS config
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };

  // Chat/Webhook config
  webhook?: {
    url: string;
    headers?: Record<string, string>;
    method?: 'POST' | 'PUT';
  };
  slack?: {
