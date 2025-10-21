/**
 * Plugin Distribution Service
 * Handles plugin publishing, downloading, and version management
 */

import { Logger } from '@klikkflow/core';
import { z } from 'zod';
import type { PluginPackage } from './plugin-registry';

// Distribution schemas
export const PublishRequestSchema = z.object({
  pluginPackage: z.any(), // PluginPackage schema
  publisherInfo: z.object({
    userId: z.string(),
    organizationId: z.string().optional(),
    publisherType: z.enum(['individual', 'organization', 'verified']),
  }),
  releaseNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type PublishRequest = z.infer<typeof PublishRequestSchema>;

export const PublishResultSchema = z.object({
  success: z.boolean(),
  pluginId: z.string(),
  version: z.string(),
  downloadUrl: z.string().optional(),
  validationResult: z.any().optional(), // ValidationResult
  errors: z.array(z.string()).optional(),
});

export type PublishResult = z.infer<typeof PublishResultSchema>;

export const DownloadRequestSchema = z.object({
  pluginId: z.string(),
  version: z.string().optional(), // Latest if not specified
  userId: z.string(),
  organizationId: z.string().optional(),
});

export type DownloadRequest = z.infer<typeof DownloadRequestSchema>;

export class PluginDistribution {
  private logger: Logger;
  private pluginStorage = new Map<string, Map<string, PluginPackage>>(); // pluginId -> version -> package
  private downloadStats = new Map<string, number>(); // pluginId -> download count

  constructor() {
    this.logger = new Logger('PluginDistribution');
  }

  /**
   * Publish a plugin to the marketplace
   */
  async publishPlugin(request: PublishRequest): Promise<PublishResult> {
    try {
      this.logger.info(`Publishing plugin: ${request.pluginPackage.metadata.id}`);

      const { pluginPackage, publisherInfo, releaseNotes } = request;
      const { metadata } = pluginPackage;

      // Validate publish request
      const validation = await this.validatePublishRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          pluginId: metadata.id,
          version: metadata.version,
          errors: validation.errors,
        };
      }

      // Check if this is an update or new plugin
      const existingVersions = this.pluginStorage.get(metadata.id);
      const isUpdate = existingVersions !== undefined;

      if (isUpdate) {
        // Validate update permissions
        const canUpdate = await this.validateUpdatePermissions(metadata.id, publisherInfo);
        if (!canUpdate) {
          return {
            success: false,
            pluginId: metadata.id,
            version: metadata.version,
            errors: ['Insufficient permissions to update this plugin'],
          };
        }

        // Check version conflicts
        if (existingVersions?.has(metadata.version)) {
          return {
            success: false,
            pluginId: metadata.id,
            version: metadata.version,
            errors: [`Version ${metadata.version} already exists`],
          };
        }
      }

      // Store plugin package
      if (!this.pluginStorage.has(metadata.id)) {
        this.pluginStorage.set(metadata.id, new Map());
      }
      this.pluginStorage.get(metadata.id)?.set(metadata.version, pluginPackage);

      // Initialize download stats if new plugin
      if (!isUpdate) {
        this.downloadStats.set(metadata.id, 0);
      }

      // Generate download URL
      const downloadUrl = this.generateDownloadUrl(metadata.id, metadata.version);

      // Log publication
      await this.logPublication(metadata.id, metadata.version, publisherInfo, releaseNotes);

      this.logger.info(`Plugin published successfully: ${metadata.id}@${metadata.version}`);

      return {
        success: true,
        pluginId: metadata.id,
        version: metadata.version,
        downloadUrl,
      };
    } catch (error) {
      this.logger.error('Failed to publish plugin:', error);
      throw error;
    }
  }

  /**
   * Download a plugin from the marketplace
   */
  async downloadPlugin(request: DownloadRequest): Promise<{
    success: boolean;
    pluginPackage?: PluginPackage;
    downloadUrl?: string;
    error?: string;
  }> {
    try {
      const { pluginId, version, userId } = request;

      this.logger.info(`Download requested: ${pluginId}@${version || 'latest'} by user ${userId}`);

      // Check if plugin exists
      const pluginVersions = this.pluginStorage.get(pluginId);
      if (!pluginVersions || pluginVersions.size === 0) {
        return {
          success: false,
          error: `Plugin ${pluginId} not found`,
        };
      }

      // Determine version to download
      let targetVersion = version;
      if (!targetVersion) {
        // Get latest version
        const versions = Array.from(pluginVersions.keys()).sort(
          (a, b) => this.compareVersions(b, a) // Sort descending
        );
        targetVersion = versions[0];
      }

      // Get plugin package
      const pluginPackage = pluginVersions.get(targetVersion);
      if (!pluginPackage) {
        return {
          success: false,
          error: `Version ${targetVersion} of plugin ${pluginId} not found`,
        };
      }

      // Validate download permissions
      const canDownload = await this.validateDownloadPermissions(pluginId, request);
      if (!canDownload) {
        return {
          success: false,
          error: 'Insufficient permissions to download this plugin',
        };
      }

      // Update download statistics
      const currentDownloads = this.downloadStats.get(pluginId) || 0;
      this.downloadStats.set(pluginId, currentDownloads + 1);

      // Log download
      await this.logDownload(pluginId, targetVersion, userId);

      // Generate secure download URL
      const downloadUrl = this.generateSecureDownloadUrl(pluginId, targetVersion, userId);

      this.logger.info(`Plugin downloaded successfully: ${pluginId}@${targetVersion}`);

      return {
        success: true,
        pluginPackage,
        downloadUrl,
      };
    } catch (error) {
      this.logger.error('Failed to download plugin:', error);
      throw error;
    }
  }

  /**
   * Get plugin versions
   */
  async getPluginVersions(pluginId: string): Promise<{
    versions: Array<{
      version: string;
      publishedAt: Date;
      downloads: number;
      isLatest: boolean;
    }>;
  }> {
    const pluginVersions = this.pluginStorage.get(pluginId);
    if (!pluginVersions) {
      return { versions: [] };
    }

    const versions = Array.from(pluginVersions.entries()).map(([version, pkg]) => ({
      version,
      publishedAt: pkg.metadata.createdAt,
      downloads: 0, // TODO: Track per-version downloads
      isLatest: false,
    }));

    // Sort versions and mark latest
    versions.sort((a, b) => this.compareVersions(b.version, a.version));
    if (versions.length > 0) {
      versions[0].isLatest = true;
    }

    return { versions };
  }

  /**
   * Unpublish a plugin version
   */
  async unpublishPlugin(
    pluginId: string,
    version: string,
    publisherInfo: PublishRequest['publisherInfo']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.info(`Unpublishing plugin: ${pluginId}@${version}`);

      // Validate permissions
      const canUnpublish = await this.validateUpdatePermissions(pluginId, publisherInfo);
      if (!canUnpublish) {
        return {
          success: false,
          error: 'Insufficient permissions to unpublish this plugin',
        };
      }

      // Check if version exists
      const pluginVersions = this.pluginStorage.get(pluginId);
      if (!pluginVersions?.has(version)) {
        return {
          success: false,
          error: `Version ${version} of plugin ${pluginId} not found`,
        };
      }

      // Remove version
      pluginVersions.delete(version);

      // If no versions left, remove plugin entirely
      if (pluginVersions.size === 0) {
        this.pluginStorage.delete(pluginId);
        this.downloadStats.delete(pluginId);
      }

      // Log unpublication
      await this.logUnpublication(pluginId, version, publisherInfo);

      this.logger.info(`Plugin unpublished successfully: ${pluginId}@${version}`);

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to unpublish plugin:', error);
      throw error;
    }
  }

  /**
   * Get download statistics
   */
  async getDownloadStats(pluginId?: string): Promise<{
    totalDownloads: number;
    pluginStats?: Array<{
      pluginId: string;
      downloads: number;
      versions: number;
    }>;
  }> {
    if (pluginId) {
      const downloads = this.downloadStats.get(pluginId) || 0;
      const versions = this.pluginStorage.get(pluginId)?.size || 0;

      return {
        totalDownloads: downloads,
        pluginStats: [
          {
            pluginId,
            downloads,
            versions,
          },
        ],
      };
    }

    // Return stats for all plugins
    const totalDownloads = Array.from(this.downloadStats.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const pluginStats = Array.from(this.downloadStats.entries()).map(([id, downloads]) => ({
      pluginId: id,
      downloads,
      versions: this.pluginStorage.get(id)?.size || 0,
    }));

    return {
      totalDownloads,
      pluginStats,
    };
  }

  /**
   * Validate publish request
   */
  private async validatePublishRequest(request: PublishRequest): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Validate plugin package structure
      if (!request.pluginPackage.metadata.id) {
        errors.push('Plugin ID is required');
      }

      if (!request.pluginPackage.metadata.version) {
        errors.push('Plugin version is required');
      }

      if (!request.pluginPackage.bundle) {
        errors.push('Plugin bundle is required');
      }

      // Validate publisher info
      if (!request.publisherInfo.userId) {
        errors.push('Publisher user ID is required');
      }

      // Validate version format (semantic versioning)
      const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/;
      if (!versionRegex.test(request.pluginPackage.metadata.version)) {
        errors.push('Invalid version format - use semantic versioning (e.g., 1.0.0)');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      this.logger.error('Validation failed:', error);
      return {
        isValid: false,
        errors: ['Validation failed due to internal error'],
      };
    }
  }

  /**
   * Validate update permissions
   */
  private async validateUpdatePermissions(
    pluginId: string,
    publisherInfo: PublishRequest['publisherInfo']
  ): Promise<boolean> {
    // TODO: Implement proper permission checking
    // - Check if user is the original publisher
    // - Check organization permissions
    // - Check admin/moderator permissions

    this.logger.debug(`Validating update permissions for ${pluginId} by ${publisherInfo.userId}`);
    return true; // Allow all updates for now
  }

  /**
   * Validate download permissions
   */
  private async validateDownloadPermissions(
    pluginId: string,
    request: DownloadRequest
  ): Promise<boolean> {
    // TODO: Implement proper permission checking
    // - Check if plugin is public/private
    // - Check user/organization access
    // - Check paid plugin access

    this.logger.debug(`Validating download permissions for ${pluginId} by ${request.userId}`);
    return true; // Allow all downloads for now
  }

  /**
   * Generate download URL
   */
  private generateDownloadUrl(pluginId: string, version: string): string {
    return `/api/marketplace/plugins/${pluginId}/versions/${version}/download`;
  }

  /**
   * Generate secure download URL with token
   */
  private generateSecureDownloadUrl(pluginId: string, version: string, userId: string): string {
    // TODO: Generate secure token for download
    const token = Buffer.from(`${pluginId}:${version}:${userId}:${Date.now()}`).toString('base64');
    return `/api/marketplace/plugins/${pluginId}/versions/${version}/download?token=${token}`;
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(a: string, b: string): number {
    const parseVersion = (version: string) => {
      const [main, pre] = version.split('-');
      const [major, minor, patch] = main.split('.').map(Number);
      return { major, minor, patch, pre };
    };

    const versionA = parseVersion(a);
    const versionB = parseVersion(b);

    if (versionA.major !== versionB.major) {
      return versionA.major - versionB.major;
    }
    if (versionA.minor !== versionB.minor) {
      return versionA.minor - versionB.minor;
    }
    if (versionA.patch !== versionB.patch) {
      return versionA.patch - versionB.patch;
    }

    // Handle pre-release versions
    if (versionA.pre && !versionB.pre) {
      return -1;
    }
    if (!versionA.pre && versionB.pre) {
      return 1;
    }
    if (versionA.pre && versionB.pre) {
      return versionA.pre.localeCompare(versionB.pre);
    }

    return 0;
  }

  /**
   * Log plugin publication
   */
  private async logPublication(
    pluginId: string,
    version: string,
    publisherInfo: PublishRequest['publisherInfo'],
    releaseNotes?: string
  ): Promise<void> {
    this.logger.info(`Plugin published: ${pluginId}@${version} by ${publisherInfo.userId}`, {
      pluginId,
      version,
      publisherId: publisherInfo.userId,
      organizationId: publisherInfo.organizationId,
      releaseNotes,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log plugin download
   */
  private async logDownload(pluginId: string, version: string, userId: string): Promise<void> {
    this.logger.info(`Plugin downloaded: ${pluginId}@${version} by ${userId}`, {
      pluginId,
      version,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log plugin unpublication
   */
  private async logUnpublication(
    pluginId: string,
    version: string,
    publisherInfo: PublishRequest['publisherInfo']
  ): Promise<void> {
    this.logger.info(`Plugin unpublished: ${pluginId}@${version} by ${publisherInfo.userId}`, {
      pluginId,
      version,
      publisherId: publisherInfo.userId,
      timestamp: new Date().toISOString(),
    });
  }
}
