/**
 * Plugin Marketplace Types
 * Local type definitions for plugin marketplace functionality
 */

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  downloads: number;
  rating: number;
  verified: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  icon?: string;
  screenshots?: string[];
  repository?: string;
  license?: string;
  homepage?: string;
}

export interface PluginSearchQuery {
  query?: string;
  category?: string;
  sortBy?: 'downloads' | 'rating' | 'created' | 'updated' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  tags?: string[];
  verified?: boolean;
  featured?: boolean;
}

export interface DownloadRequest {
  pluginId: string;
  version?: string;
}

export interface PublishRequest {
  metadata: PluginMetadata;
  packageData: any;
  readme?: string;
}
