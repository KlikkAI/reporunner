/**
 * Docker Deployment Documentation Page
 *
 * Displays Docker deployment guide and configuration
 */

import type React from 'react';
import { Helmet } from 'react-helmet-async';
import { MarkdownRenderer } from '@/app/components/Documentation';
import dockerDeploymentMd from '../../../../../../docs/deployment/docker/README.md?raw';

export const DockerDeployment: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Docker Deployment - KlikkFlow Documentation</title>
        <meta
          name="description"
          content="Deploy KlikkFlow with Docker - Quick start, profiles, configuration, and troubleshooting"
        />
      </Helmet>

      <div className="max-w-4xl">
        <MarkdownRenderer content={dockerDeploymentMd} />
      </div>
    </>
  );
};
