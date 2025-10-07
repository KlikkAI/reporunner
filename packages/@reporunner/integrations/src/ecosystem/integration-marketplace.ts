/**
 * Integration Marketplace System
 * Manages popular SaaS integrations, cloud services, and database connectors
 * Phase D: Community & Growth - Integration ecosystem expansion
 */

import { Logger } from '@reporunner/core';
import { z } from 'zod';

// Integration metadata schema
export const IntegrationMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum([
    'saas',
    'database',
    'cloud',
    'communication',
    'productivity',
    'analytics',
    'storage',
  ]),
  provider: z.string(),
  version: z.string(),
  icon: z.string().optional(),
  website: z.string().optional(),
  documentation: z.string().optional(),
  pricing: z.enum(['free', 'paid', 'freemium', 'enterprise']),
  popularity: z.number().min(0).max(100),
  rating: z.number().min(0).max(5),
  totalInstalls: z.number().default(0),
  lastUpdated: z.date(),
  supportedFeatures: z.array(z.string()),
  requiredCredentials: z.array(z.string()),
  webhookSupport: z.boolean().default(false),
  rateLimits: z
    .object({
      requestsPerMinute: z.number().optional(),
      requestsPerHour: z.number().optional(),
      requestsPerDay: z.number().optional(),
    })
    .optional(),
});

export type IntegrationMetadata = z.infer<typeof IntegrationMetadataSchema>;

// Popular SaaS integrations configuration
export const POPULAR_SAAS_INTEGRATIONS: Partial<IntegrationMetadata>[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and collaboration platform',
    category: 'communication',
    provider: 'Slack Technologies',
    pricing: 'freemium',
    popularity: 95,
    rating: 4.8,
    supportedFeatures: ['send_message', 'create_channel', 'invite_user', 'file_upload', 'webhook'],
    requiredCredentials: ['bot_token', 'app_token'],
    webhookSupport: true,
    rateLimits: {
      requestsPerMinute: 100,
      requestsPerHour: 6000,
    },
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Voice, video, and text communication for communities',
    category: 'communication',
    provider: 'Discord Inc.',
    pricing: 'freemium',
    popularity: 88,
    rating: 4.6,
    supportedFeatures: ['send_message', 'create_channel', 'manage_roles', 'webhook'],
    requiredCredentials: ['bot_token'],
    webhookSupport: true,
    rateLimits: {
      requestsPerMinute: 50,
      requestsPerHour: 3000,
    },
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'All-in-one workspace for notes, docs, and collaboration',
    category: 'productivity',
    provider: 'Notion Labs',
    pricing: 'freemium',
    popularity: 92,
    rating: 4.7,
    supportedFeatures: ['create_page', 'update_page', 'query_database', 'create_database'],
    requiredCredentials: ['integration_token'],
    webhookSupport: false,
    rateLimits: {
      requestsPerMinute: 3,
      requestsPerHour: 180,
    },
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Cloud-based database and spreadsheet hybrid',
    category: 'productivity',
    provider: 'Airtable Inc.',
    pricing: 'freemium',
    popularity: 85,
    rating: 4.5,
    supportedFeatures: ['create_record', 'update_record', 'delete_record', 'list_records'],
    requiredCredentials: ['api_key', 'base_id'],
    webhookSupport: true,
    rateLimits: {
      requestsPerMinute: 5,
      requestsPerHour: 300,
    },
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Customer relationship management platform',
    category: 'saas',
    provider: 'Salesforce Inc.',
    pricing: 'paid',
    popularity: 90,
    rating: 4.4,
    supportedFeatures: ['create_lead', 'update_contact', 'query_records', 'bulk_operations'],
    requiredCredentials: ['client_id', 'client_secret', 'username', 'password', 'security_token'],
    webhookSupport: true,
    rateLimits: {
      requestsPerDay: 15000,
    },
  },
];

// Database connectors configuration
export const DATABASE_CONNECTORS: Partial<IntegrationMetadata>[] = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Advanced open-source relational database',
    category: 'database',
    provider: 'PostgreSQL Global Development Group',
    pricing: 'free',
    popularity: 94,
    rating: 4.9,
    supportedFeatures: ['query', 'insert', 'update', 'delete', 'bulk_operations', 'transactions'],
    requiredCredentials: ['host', 'port', 'database', 'username', 'password'],
    webhookSupport: false,
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'Document-oriented NoSQL database',
    category: 'database',
    provider: 'MongoDB Inc.',
    pricing: 'freemium',
    popularity: 89,
    rating: 4.6,
    supportedFeatures: ['find', 'insert', 'update', 'delete', 'aggregate', 'bulk_operations'],
    requiredCredentials: ['connection_string'],
    webhookSupport: false,
  },
  {
    id: 'mysql',
    name: 'MySQL',
    description: 'Popular open-source relational database',
    category: 'database',
    provider: 'Oracle Corporation',
    pricing: 'free',
    popularity: 91,
    rating: 4.7,
    supportedFeatures: ['query', 'insert', 'update', 'delete', 'stored_procedures'],
    requiredCredentials: ['host', 'port', 'database', 'username', 'password'],
    webhookSupport: false,
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'In-memory data structure store',
    category: 'database',
    provider: 'Redis Ltd.',
    pricing: 'freemium',
    popularity: 87,
    rating: 4.8,
    supportedFeatures: ['get', 'set', 'delete', 'expire', 'pub_sub', 'lua_scripts'],
    requiredCredentials: ['host', 'port', 'password'],
    webhookSupport: false,
  },
];

// Cloud service integrations
export const CLOUD_INTEGRATIONS: Partial<IntegrationMetadata>[] = [
  {
    id: 'aws-s3',
    name: 'Amazon S3',
    description: 'Scalable object storage service',
    category: 'cloud',
    provider: 'Amazon Web Services',
    pricing: 'paid',
    popularity: 96,
    rating: 4.8,
    supportedFeatures: [
      'upload_file',
      'download_file',
      'delete_file',
      'list_objects',
      'presigned_urls',
    ],
    requiredCredentials: ['access_key_id', 'secret_access_key', 'region'],
    webhookSupport: true,
  },
  {
    id: 'gcp-storage',
    name: 'Google Cloud Storage',
    description: 'Unified object storage for developers and enterprises',
    category: 'cloud',
    provider: 'Google Cloud',
    pricing: 'paid',
    popularity: 88,
    rating: 4.6,
    supportedFeatures: [
      'upload_file',
      'download_file',
      'delete_file',
      'list_objects',
      'signed_urls',
    ],
    requiredCredentials: ['service_account_key'],
    webhookSupport: true,
  },
  {
    id: 'azure-blob',
    name: 'Azure Blob Storage',
    description: 'Massively scalable object storage for unstructured data',
    category: 'cloud',
    provider: 'Microsoft Azure',
    pricing: 'paid',
    popularity: 82,
    rating: 4.4,
    supportedFeatures: ['upload_blob', 'download_blob', 'delete_blob', 'list_blobs'],
    requiredCredentials: ['connection_string'],
    webhookSupport: true,
  },
];

export class IntegrationMarketplace {
  private logger: Logger;
  private integrations = new Map<string, IntegrationMetadata>();
  private installCounts = new Map<string, number>();

  constructor() {
    this.logger = new Logger('IntegrationMarketplace');
    this.initializeIntegrations();
  }

  /**
   * Initialize marketplace with popular integrations
   */
  private initializeIntegrations(): void {
    const allIntegrations = [
      ...POPULAR_SAAS_INTEGRATIONS,
      ...DATABASE_CONNECTORS,
      ...CLOUD_INTEGRATIONS,
    ];

    allIntegrations.forEach((integration) => {
      if (integration.id) {
        const fullIntegration: IntegrationMetadata = {
          ...integration,
          version: integration.version || '1.0.0',
          lastUpdated: new Date(),
          totalInstalls: Math.floor(Math.random() * 10000) + 1000,
        } as IntegrationMetadata;

        this.integrations.set(integration.id, fullIntegration);
        this.installCounts.set(integration.id, fullIntegration.totalInstalls);
      }
    });

    this.logger.info(`Initialized ${this.integrations.size} integrations in marketplace`);
  }

  /**
   * Get all available integrations
   */
  async getAllIntegrations(): Promise<IntegrationMetadata[]> {
    return Array.from(this.integrations.values());
  }

  /**
   * Get integrations by category
   */
  async getIntegrationsByCategory(
    category: IntegrationMetadata['category']
  ): Promise<IntegrationMetadata[]> {
    return Array.from(this.integrations.values()).filter(
      (integration) => integration.category === category
    );
  }

  /**
   * Get popular integrations
   */
  async getPopularIntegrations(limit = 10): Promise<IntegrationMetadata[]> {
    return Array.from(this.integrations.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * Search integrations
   */
  async searchIntegrations(query: string): Promise<IntegrationMetadata[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.integrations.values()).filter(
      (integration) =>
        integration.name.toLowerCase().includes(searchTerm) ||
        integration.description.toLowerCase().includes(searchTerm) ||
        integration.provider.toLowerCase().includes(searchTerm) ||
        integration.supportedFeatures.some((feature) => feature.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get integration by ID
   */
  async getIntegration(id: string): Promise<IntegrationMetadata | null> {
    return this.integrations.get(id) || null;
  }

  /**
   * Install integration
   */
  async installIntegration(
    id: string,
    userId: string
  ): Promise<{
    success: boolean;
    integration?: IntegrationMetadata;
    error?: string;
  }> {
    try {
      const integration = this.integrations.get(id);
      if (!integration) {
        return {
          success: false,
          error: 'Integration not found',
        };
      }

      // Update install count
      const currentCount = this.installCounts.get(id) || 0;
      this.installCounts.set(id, currentCount + 1);

      // Update integration metadata
      integration.totalInstalls = currentCount + 1;
      this.integrations.set(id, integration);

      this.logger.info(`Integration ${id} installed by user ${userId}`);

      return {
        success: true,
        integration,
      };
    } catch (error) {
      this.logger.error('Failed to install integration:', error);
      return {
        success: false,
        error: 'Installation failed',
      };
    }
  }

  /**
   * Get integration statistics
   */
  async getMarketplaceStats(): Promise<{
    totalIntegrations: number;
    totalInstalls: number;
    categoryCounts: Record<string, number>;
    topIntegrations: Array<{
      id: string;
      name: string;
      installs: number;
    }>;
  }> {
    const integrations = Array.from(this.integrations.values());
    const totalInstalls = Array.from(this.installCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    // Count by category
    const categoryCounts: Record<string, number> = {};
    integrations.forEach((integration) => {
      categoryCounts[integration.category] = (categoryCounts[integration.category] || 0) + 1;
    });

    // Top integrations by install count
    const topIntegrations = integrations
      .map((integration) => ({
        id: integration.id,
        name: integration.name,
        installs: this.installCounts.get(integration.id) || 0,
      }))
      .sort((a, b) => b.installs - a.installs)
      .slice(0, 10);

    return {
      totalIntegrations: integrations.length,
      totalInstalls,
      categoryCounts,
      topIntegrations,
    };
  }

  /**
   * Add custom integration
   */
  async addCustomIntegration(
    integration: Omit<IntegrationMetadata, 'totalInstalls' | 'lastUpdated'>
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Validate integration data
      const validatedIntegration = IntegrationMetadataSchema.parse({
        ...integration,
        totalInstalls: 0,
        lastUpdated: new Date(),
      });

      // Check if integration already exists
      if (this.integrations.has(validatedIntegration.id)) {
        return {
          success: false,
          error: 'Integration with this ID already exists',
        };
      }

      this.integrations.set(validatedIntegration.id, validatedIntegration);
      this.installCounts.set(validatedIntegration.id, 0);

      this.logger.info(`Custom integration added: ${validatedIntegration.id}`);

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to add custom integration:', error);
      return {
        success: false,
        error: 'Invalid integration data',
      };
    }
  }

  /**
   * Update integration metadata
   */
  async updateIntegration(
    id: string,
    updates: Partial<IntegrationMetadata>
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const existing = this.integrations.get(id);
      if (!existing) {
        return {
          success: false,
          error: 'Integration not found',
        };
      }

      const updated = {
        ...existing,
        ...updates,
        lastUpdated: new Date(),
      };

      const validated = IntegrationMetadataSchema.parse(updated);
      this.integrations.set(id, validated);

      this.logger.info(`Integration updated: ${id}`);

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to update integration:', error);
      return {
        success: false,
        error: 'Update failed',
      };
    }
  }

  /**
   * Remove integration
   */
  async removeIntegration(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const deleted = this.integrations.delete(id);
      this.installCounts.delete(id);

      if (deleted) {
        this.logger.info(`Integration removed: ${id}`);
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Integration not found',
        };
      }
    } catch (error) {
      this.logger.error('Failed to remove integration:', error);
      return {
        success: false,
        error: 'Removal failed',
      };
    }
  }

  /**
   * Get integration recommendations based on usage patterns
   */
  async getRecommendations(_userId: string, limit = 5): Promise<IntegrationMetadata[]> {
    // Simple recommendation based on popularity and rating
    // In production, this would use ML algorithms and user behavior
    return Array.from(this.integrations.values())
      .filter((integration) => integration.popularity > 80 && integration.rating > 4.0)
      .sort((a, b) => b.popularity * b.rating - a.popularity * a.rating)
      .slice(0, limit);
  }

  /**
   * Get trending integrations
   */
  async getTrendingIntegrations(limit = 5): Promise<IntegrationMetadata[]> {
    // Mock trending calculation - in production, this would track install velocity
    return Array.from(this.integrations.values())
      .sort(() => Math.random() - 0.5) // Random for demo
      .slice(0, limit);
  }
}
