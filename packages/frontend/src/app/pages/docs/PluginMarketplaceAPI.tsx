/**
 * Plugin Marketplace API Documentation Page
 *
 * Displays Plugin Marketplace API reference and examples
 */

import type React from 'react';
import { Helmet } from 'react-helmet-async';
import { MarkdownRenderer } from '@/app/components/Documentation';
import pluginMarketplaceAPIMd from '../../../../../../docs/api/PLUGIN_MARKETPLACE_API.md?raw';

export const PluginMarketplaceAPI: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Plugin Marketplace API - KlikkFlow Documentation</title>
        <meta
          name="description"
          content="Plugin Marketplace API reference - Endpoints, authentication, publishing, and validation"
        />
      </Helmet>

      <div className="max-w-4xl">
        <MarkdownRenderer content={pluginMarketplaceAPIMd} />
      </div>
    </>
  );
};
