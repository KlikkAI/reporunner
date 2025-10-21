/**
 * Cloud Providers Documentation Page
 *
 * Displays cloud provider deployment guides (AWS, GCP, Azure)
 */

import type React from 'react';
import { Helmet } from 'react-helmet-async';
import { MarkdownRenderer } from '@/app/components/Documentation';
import cloudProvidersMd from '../../../../../../docs/deployment/cloud-providers/README.md?raw';

export const CloudProviders: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Cloud Providers - Reporunner Documentation</title>
        <meta
          name="description"
          content="Deploy Reporunner on cloud platforms - AWS, GCP, Azure with Terraform modules"
        />
      </Helmet>

      <div className="max-w-4xl">
        <MarkdownRenderer content={cloudProvidersMd} />
      </div>
    </>
  );
};
