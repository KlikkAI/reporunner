/**
 * Integration Types - Third-party service integrations
 */

import type { BaseEntity, ID, Timestamp } from '../common';
import type { INodeType } from '../node';

/**
 * Integration category
 */
export type IntegrationCategory =
  | 'communication'
  | 'productivity'
  | 'ai'
  | 'database'
  | 'crm'
  | 'marketing'
  | 'developer-tools'
  | 'analytics'
  | 'finance'
  | 'social-media'
  | 'other';

/**
 * Integration status
 */
export type IntegrationStatus = 'available' | 'beta' | 'deprecated' | 'coming-soon';

/**
 * Integration interface
 */
export interface IIntegration extends BaseEntity {
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  iconUrl?: string;
  category: IntegrationCategory;
  subcategories?: string[];
  status: IntegrationStatus;
  version: string;
  nodeTypes?: INodeType[];
  credentialTypes?: string[];
  documentation?: {
    url?: string;
    quickStart?: string;
    apiReference?: string;
  };
  pricing?: {
    tier?: 'free' | 'pro' | 'enterprise';
    requiresApiKey?: boolean;
  };
  metadata?: {
    author?: string;
    website?: string;
    supportUrl?: string;
    repository?: string;
  };
}

/**
 * User integration connection
 */
export interface IUserIntegrationConnection {
  id: ID;
  userId: ID;
  organizationId?: ID;
  integrationId: ID;
  credentialId?: ID;
  status: 'connected' | 'disconnected' | 'error';
  connectedAt: Timestamp;
  lastUsedAt?: Timestamp;
  usageCount?: number;
  settings?: Record<string, any>;
}

/**
 * Integration statistics
 */
export interface IIntegrationStats {
  integrationId: ID;
  totalUsers: number;
  activeConnections: number;
  totalWorkflows: number;
  totalExecutions: number;
  averageExecutionTime: number;
  errorRate: number;
}

/**
 * Integration marketplace listing
 */
export interface IIntegrationListing {
  integration: IIntegration;
  stats?: IIntegrationStats;
  isConnected?: boolean;
  isFeatured?: boolean;
  rating?: number;
  reviewCount?: number;
}
