import { ApiClientError, apiClient } from './ApiClient';

/**
 * Plugin metadata interface
 */
export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  tags: string[];
  downloads: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Plugin search parameters
 */
export interface PluginSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  verified?: boolean;
  featured?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'downloads' | 'rating' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Plugin search result
 */
export interface PluginSearchResult {
  plugins: Plugin[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Plugin publish request
 */
export interface PublishPluginRequest {
  pluginPackage: {
    name: string;
    version: string;
    description: string;
    author: string;
    category: string;
    tags: string[];
    entrypoint: string;
    bundle: string; // Base64 encoded bundle
  };
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult {
  isValid: boolean;
  errors: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * Download request
 */
export interface DownloadPluginRequest {
  pluginId: string;
  version: string;
}

/**
 * Download result
 */
export interface DownloadPluginResult {
  downloadUrl: string;
  pluginPackage: {
    name: string;
    version: string;
    bundle: string;
  };
}

/**
 * Marketplace statistics
 */
export interface MarketplaceStats {
  totalPlugins: number;
  totalDownloads: number;
  verifiedPlugins: number;
  categories: Array<{
    id: string;
    count: number;
  }>;
}

/**
 * Plugin category
 */
export interface PluginCategory {
  id: string;
  name: string;
  description: string;
}

/**
 * Plugin review request
 */
export interface PluginReviewRequest {
  rating: number; // 1-5
  comment?: string;
}

/**
 * Type-safe Marketplace API Service
 *
 * Handles all plugin marketplace operations including search, publish, download,
 * and validation
 */
export class MarketplaceApiService {
  /**
   * Search and browse plugins in the marketplace
   */
  async searchPlugins(params?: PluginSearchParams): Promise<PluginSearchResult> {
    try {
      const response = await apiClient.raw({
        method: 'GET',
        url: '/marketplace/plugins',
        params,
      });

      const data = response.data as { success: boolean; data: PluginSearchResult };

      if (!data.success) {
        throw new ApiClientError('Failed to search plugins', response.status, 'SEARCH_FAILED');
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to search plugins', 0, 'SEARCH_ERROR', error);
    }
  }

  /**
   * Get detailed information about a specific plugin
   */
  async getPlugin(pluginId: string): Promise<Plugin> {
    try {
      const response = await apiClient.raw({
        method: 'GET',
        url: `/marketplace/plugins/${pluginId}`,
      });

      const data = response.data as { success: boolean; data: Plugin };

      if (!data.success) {
        throw new ApiClientError(
          `Plugin ${pluginId} not found`,
          response.status,
          'PLUGIN_NOT_FOUND'
        );
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError(
        `Failed to fetch plugin ${pluginId}`,
        0,
        'FETCH_PLUGIN_ERROR',
        error
      );
    }
  }

  /**
   * Publish a new plugin or update an existing one
   */
  async publishPlugin(request: PublishPluginRequest): Promise<{ success: boolean; data: unknown }> {
    try {
      const response = await apiClient.raw({
        method: 'POST',
        url: '/marketplace/plugins',
        data: request,
      });

      const data = response.data as { success: boolean; data: unknown };

      if (!data.success) {
        throw new ApiClientError('Failed to publish plugin', response.status, 'PUBLISH_FAILED');
      }

      return data;
    } catch (error) {
      throw new ApiClientError('Failed to publish plugin', 0, 'PUBLISH_ERROR', error);
    }
  }

  /**
   * Update plugin metadata
   */
  async updatePlugin(pluginId: string, updates: Partial<Plugin>): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.raw({
        method: 'PUT',
        url: `/marketplace/plugins/${pluginId}`,
        data: updates,
      });

      const data = response.data as { success: boolean };

      if (!data.success) {
        throw new ApiClientError('Failed to update plugin', response.status, 'UPDATE_FAILED');
      }

      return data;
    } catch (error) {
      throw new ApiClientError('Failed to update plugin', 0, 'UPDATE_ERROR', error);
    }
  }

  /**
   * Unpublish a specific version of a plugin
   */
  async unpublishPlugin(
    pluginId: string,
    version: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.raw({
        method: 'DELETE',
        url: `/marketplace/plugins/${pluginId}/versions/${version}`,
      });

      const data = response.data as { success: boolean; message: string };

      if (!data.success) {
        throw new ApiClientError('Failed to unpublish plugin', response.status, 'UNPUBLISH_FAILED');
      }

      return data;
    } catch (error) {
      throw new ApiClientError('Failed to unpublish plugin', 0, 'UNPUBLISH_ERROR', error);
    }
  }

  /**
   * Download a plugin
   */
  async downloadPlugin(request: DownloadPluginRequest): Promise<DownloadPluginResult> {
    try {
      const response = await apiClient.raw({
        method: 'POST',
        url: `/marketplace/plugins/${request.pluginId}/download`,
        data: { version: request.version },
      });

      const data = response.data as { success: boolean; data: DownloadPluginResult };

      if (!data.success) {
        throw new ApiClientError('Failed to download plugin', response.status, 'DOWNLOAD_FAILED');
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to download plugin', 0, 'DOWNLOAD_ERROR', error);
    }
  }

  /**
   * Validate a plugin without publishing
   */
  async validatePlugin(pluginPackage: unknown): Promise<PluginValidationResult> {
    try {
      const response = await apiClient.raw({
        method: 'POST',
        url: '/marketplace/plugins/validate',
        data: pluginPackage,
      });

      const data = response.data as { success: boolean; data: PluginValidationResult };

      if (!data.success) {
        throw new ApiClientError('Failed to validate plugin', response.status, 'VALIDATION_FAILED');
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to validate plugin', 0, 'VALIDATION_ERROR', error);
    }
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<MarketplaceStats> {
    try {
      const response = await apiClient.raw({
        method: 'GET',
        url: '/marketplace/stats',
      });

      const data = response.data as { success: boolean; data: MarketplaceStats };

      if (!data.success) {
        throw new ApiClientError('Failed to fetch stats', response.status, 'STATS_FAILED');
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to fetch marketplace stats', 0, 'STATS_ERROR', error);
    }
  }

  /**
   * Get available plugin categories
   */
  async getCategories(): Promise<PluginCategory[]> {
    try {
      const response = await apiClient.raw({
        method: 'GET',
        url: '/marketplace/categories',
      });

      const data = response.data as { success: boolean; data: PluginCategory[] };

      if (!data.success) {
        throw new ApiClientError(
          'Failed to fetch categories',
          response.status,
          'CATEGORIES_FAILED'
        );
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to fetch categories', 0, 'CATEGORIES_ERROR', error);
    }
  }

  /**
   * Get featured plugins
   */
  async getFeaturedPlugins(): Promise<Plugin[]> {
    try {
      const response = await apiClient.raw({
        method: 'GET',
        url: '/marketplace/featured',
      });

      const data = response.data as { success: boolean; data: Plugin[] };

      if (!data.success) {
        throw new ApiClientError(
          'Failed to fetch featured plugins',
          response.status,
          'FEATURED_FAILED'
        );
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to fetch featured plugins', 0, 'FEATURED_ERROR', error);
    }
  }

  /**
   * Submit a review for a plugin
   */
  async submitReview(
    pluginId: string,
    review: PluginReviewRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate rating
      if (review.rating < 1 || review.rating > 5) {
        throw new ApiClientError('Rating must be between 1 and 5', 400, 'INVALID_RATING');
      }

      const response = await apiClient.raw({
        method: 'POST',
        url: `/marketplace/plugins/${pluginId}/review`,
        data: review,
      });

      const data = response.data as { success: boolean; message: string };

      if (!data.success) {
        throw new ApiClientError('Failed to submit review', response.status, 'REVIEW_FAILED');
      }

      return data;
    } catch (error) {
      throw new ApiClientError('Failed to submit review', 0, 'REVIEW_ERROR', error);
    }
  }
}

// Export singleton instance
export const marketplaceApiService = new MarketplaceApiService();
