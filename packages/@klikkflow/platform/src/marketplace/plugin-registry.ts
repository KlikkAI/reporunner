/**
 * Plugin Registry Service
 * Manages plugin registration, validation, and distribution
 */

import { Logger } from '@reporunner/core';
import { z } from 'zod';

// Plugin metadata schema
export const PluginMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string(),
  category: z.enum(['integration', 'trigger', 'action', 'utility', 'ai']),
  tags: z.array(z.string()),
  icon: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  documentation: z.string().optional(),
  repository: z.string().optional(),
  license: z.string(),
  pricing: z.enum(['free', 'paid', 'freemium']),
  compatibility: z.object({
    minVersion: z.string(),
    maxVersion: z.string().optional(),
  }),
  dependencies: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  downloads: z.number().default(0),
  rating: z.number().min(0).max(5).default(0),
  reviews: z.number().default(0),
  verified: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export type PluginMetadata = z.infer<typeof PluginMetadataSchema>;

// Plugin package schema
export const PluginPackageSchema = z.object({
  metadata: PluginMetadataSchema,
  manifest: z.object({
    main: z.string(),
    nodes: z.array(z.string()).optional(),
    credentials: z.array(z.string()).optional(),
    webhooks: z.array(z.string()).optional(),
  }),
  bundle: z.string(), // Base64 encoded plugin bundle
  checksum: z.string(),
});

export type PluginPackage = z.infer<typeof PluginPackageSchema>;

// Search and filter schemas
export const PluginSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  pricing: z.enum(['free', 'paid', 'freemium']).optional(),
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortBy: z.enum(['name', 'downloads', 'rating', 'updated']).default('downloads'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type PluginSearchQuery = z.infer<typeof PluginSearchSchema>;

export class PluginRegistry {
  private logger: Logger;
  private plugins = new Map<string, PluginMetadata>();

  constructor() {
    this.logger = new Logger('PluginRegistry');
  }

  /**
   * Register a new plugin in the marketplace
   */
  async registerPlugin(
    pluginPackage: PluginPackage
  ): Promise<{ success: boolean; pluginId: string }> {
    try {
      // Validate plugin package
      const validated = PluginPackageSchema.parse(pluginPackage);

      // Check if plugin already exists
      if (this.plugins.has(validated.metadata.id)) {
        throw new Error(`Plugin ${validated.metadata.id} already exists`);
      }

      // Validate plugin bundle integrity
      await this.validatePluginBundle(validated);

      // Store plugin metadata
      this.plugins.set(validated.metadata.id, validated.metadata);

      this.logger.info(`Plugin registered successfully: ${validated.metadata.id}`);

      return {
        success: true,
        pluginId: validated.metadata.id,
      };
    } catch (error) {
      this.logger.error('Failed to register plugin:', error);
      throw error;
    }
  }

  /**
   * Search plugins in the marketplace
   */
  async searchPlugins(searchQuery: PluginSearchQuery): Promise<{
    plugins: PluginMetadata[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const query = PluginSearchSchema.parse(searchQuery);
      let results = Array.from(this.plugins.values());

      // Apply filters
      if (query.query) {
        const searchTerm = query.query.toLowerCase();
        results = results.filter(
          (plugin) =>
            plugin.name.toLowerCase().includes(searchTerm) ||
            plugin.description.toLowerCase().includes(searchTerm) ||
            plugin.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (query.category) {
        results = results.filter((plugin) => plugin.category === query.category);
      }

      if (query.tags && query.tags.length > 0) {
        results = results.filter((plugin) => query.tags?.some((tag) => plugin.tags.includes(tag)));
      }

      if (query.pricing) {
        results = results.filter((plugin) => plugin.pricing === query.pricing);
      }

      if (query.verified !== undefined) {
        results = results.filter((plugin) => plugin.verified === query.verified);
      }

      if (query.featured !== undefined) {
        results = results.filter((plugin) => plugin.featured === query.featured);
      }

      // Apply sorting
      results.sort((a, b) => {
        let comparison = 0;
        switch (query.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'downloads':
            comparison = a.downloads - b.downloads;
            break;
          case 'rating':
            comparison = a.rating - b.rating;
            break;
          case 'updated':
            comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
            break;
        }
        return query.sortOrder === 'desc' ? -comparison : comparison;
      });

      // Apply pagination
      const total = results.length;
      const paginatedResults = results.slice(query.offset, query.offset + query.limit);
      const hasMore = query.offset + query.limit < total;

      return {
        plugins: paginatedResults,
        total,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Failed to search plugins:', error);
      throw error;
    }
  }

  /**
   * Get plugin by ID
   */
  async getPlugin(pluginId: string): Promise<PluginMetadata | null> {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * Update plugin metadata
   */
  async updatePlugin(pluginId: string, updates: Partial<PluginMetadata>): Promise<boolean> {
    try {
      const existing = this.plugins.get(pluginId);
      if (!existing) {
        throw new Error(`Plugin ${pluginId} not found`);
      }

      const updated = { ...existing, ...updates, updatedAt: new Date() };
      const validated = PluginMetadataSchema.parse(updated);

      this.plugins.set(pluginId, validated);

      this.logger.info(`Plugin updated successfully: ${pluginId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to update plugin:', error);
      throw error;
    }
  }

  /**
   * Remove plugin from marketplace
   */
  async removePlugin(pluginId: string): Promise<boolean> {
    try {
      const deleted = this.plugins.delete(pluginId);
      if (deleted) {
        this.logger.info(`Plugin removed successfully: ${pluginId}`);
      }
      return deleted;
    } catch (error) {
      this.logger.error('Failed to remove plugin:', error);
      throw error;
    }
  }

  /**
   * Validate plugin bundle integrity and security
   */
  private async validatePluginBundle(pluginPackage: PluginPackage): Promise<void> {
    // TODO: Implement comprehensive plugin validation
    // - Verify checksum
    // - Scan for malicious code
    // - Validate manifest structure
    // - Check dependencies
    // - Verify permissions

    this.logger.info(`Validating plugin bundle: ${pluginPackage.metadata.id}`);

    // Basic validation for now
    if (!(pluginPackage.bundle && pluginPackage.checksum)) {
      throw new Error('Invalid plugin bundle: missing bundle or checksum');
    }

    if (!pluginPackage.manifest.main) {
      throw new Error('Invalid plugin manifest: missing main entry point');
    }
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<{
    totalPlugins: number;
    verifiedPlugins: number;
    featuredPlugins: number;
    categories: Record<string, number>;
    totalDownloads: number;
  }> {
    const plugins = Array.from(this.plugins.values());

    const stats = {
      totalPlugins: plugins.length,
      verifiedPlugins: plugins.filter((p) => p.verified).length,
      featuredPlugins: plugins.filter((p) => p.featured).length,
      categories: {} as Record<string, number>,
      totalDownloads: plugins.reduce((sum, p) => sum + p.downloads, 0),
    };

    // Count plugins by category
    plugins.forEach((plugin) => {
      stats.categories[plugin.category] = (stats.categories[plugin.category] || 0) + 1;
    });

    return stats;
  }
}
