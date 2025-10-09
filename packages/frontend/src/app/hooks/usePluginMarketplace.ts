/**
 * Plugin Marketplace Hook
 * Custom hook for managing plugin marketplace operations
 */

import type {
  DownloadRequest,
  PluginMetadata,
  PluginSearchQuery,
  PublishRequest,
} from '../types/plugin';
import { message } from 'antd';
import { useCallback, useState } from 'react';

interface MarketplaceStats {
  totalPlugins: number;
  verifiedPlugins: number;
  featuredPlugins: number;
  categories: Record<string, number>;
  totalDownloads: number;
}

interface UsePluginMarketplaceReturn {
  // State
  plugins: PluginMetadata[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  stats: MarketplaceStats | null;
  featuredPlugins: PluginMetadata[];

  // Actions
  searchPlugins: (query: PluginSearchQuery) => Promise<void>;
  getPlugin: (pluginId: string) => Promise<PluginMetadata | null>;
  downloadPlugin: (request: DownloadRequest) => Promise<void>;
  publishPlugin: (request: PublishRequest) => Promise<void>;
  validatePlugin: (pluginPackage: any) => Promise<any>;
  getMarketplaceStats: () => Promise<void>;
  getFeaturedPlugins: () => Promise<void>;
}

export const usePluginMarketplace = (): UsePluginMarketplaceReturn => {
  const [plugins, setPlugins] = useState<PluginMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [featuredPlugins, setFeaturedPlugins] = useState<PluginMetadata[]>([]);

  // API base URL
  const API_BASE = '/api/marketplace';

  // Generic API call helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  };

  // Search plugins
  const searchPlugins = useCallback(
    async (query: PluginSearchQuery) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v.toString()));
            } else {
              params.append(key, value.toString());
            }
          }
        });

        const response = await apiCall(`/plugins?${params.toString()}`);

        if (response.success) {
          setPlugins(response.data.plugins);
          setTotal(response.data.total);
          setHasMore(response.data.hasMore);
        } else {
          throw new Error(response.error || 'Failed to search plugins');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search plugins';
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  // Get single plugin
  const getPlugin = useCallback(
    async (pluginId: string): Promise<PluginMetadata | null> => {
      try {
        const response = await apiCall(`/plugins/${pluginId}`);

        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.error || 'Plugin not found');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get plugin';
        message.error(errorMessage);
        return null;
      }
    },
    [apiCall]
  );

  // Download plugin
  const downloadPlugin = useCallback(
    async (request: DownloadRequest) => {
      try {
        setLoading(true);

        const response = await apiCall(`/plugins/${request.pluginId}/download`, {
          method: 'POST',
          body: JSON.stringify(request),
        });

        if (response.success) {
          // Handle successful download
          message.success('Plugin downloaded successfully');

          // If there's a download URL, trigger download
          if (response.data.downloadUrl) {
            window.open(response.data.downloadUrl, '_blank');
          }
        } else {
          throw new Error(response.error || 'Failed to download plugin');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to download plugin';
        message.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  // Publish plugin
  const publishPlugin = useCallback(
    async (request: PublishRequest) => {
      try {
        setLoading(true);

        const response = await apiCall('/plugins', {
          method: 'POST',
          body: JSON.stringify(request),
        });

        if (response.success) {
          message.success('Plugin published successfully');
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to publish plugin');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to publish plugin';
        message.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  // Validate plugin
  const validatePlugin = useCallback(
    async (pluginPackage: any) => {
      try {
        const response = await apiCall(`/plugins/${pluginPackage.metadata.id}/validate`, {
          method: 'POST',
          body: JSON.stringify(pluginPackage),
        });

        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to validate plugin');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to validate plugin';
        message.error(errorMessage);
        throw err;
      }
    },
    [apiCall]
  );

  // Get marketplace statistics
  const getMarketplaceStats = useCallback(async () => {
    try {
      const response = await apiCall('/stats');

      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to get stats');
      }
    } catch (err) {
      const __errorMessage = err instanceof Error ? err.message : 'Failed to get marketplace stats';
      // Don't show error message for stats as it's not critical
    }
  }, [apiCall]);

  // Get featured plugins
  const getFeaturedPlugins = useCallback(async () => {
    try {
      const response = await apiCall('/featured');

      if (response.success) {
        setFeaturedPlugins(response.data);
      } else {
        throw new Error(response.error || 'Failed to get featured plugins');
      }
    } catch (err) {
      // Silently ignore errors for featured plugins as it's not critical
      const __errorMessage = err instanceof Error ? err.message : 'Failed to get featured plugins';
    }
  }, [apiCall]);

  return {
    // State
    plugins,
    loading,
    error,
    total,
    hasMore,
    stats,
    featuredPlugins,

    // Actions
    searchPlugins,
    getPlugin,
    downloadPlugin,
    publishPlugin,
    validatePlugin,
    getMarketplaceStats,
    getFeaturedPlugins,
  };
};
