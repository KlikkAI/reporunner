/**
 * Kubernetes Deployment Documentation Page
 *
 * Displays Kubernetes deployment guide with Helm charts
 */

import type React from 'react';
import { Helmet } from 'react-helmet-async';
import { MarkdownRenderer } from '@/app/components/Documentation';
import kubernetesDeploymentMd from '../../../../../../docs/deployment/kubernetes/README.md?raw';

export const KubernetesDeployment: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Kubernetes Deployment - Reporunner Documentation</title>
        <meta
          name="description"
          content="Deploy Reporunner on Kubernetes - Helm charts, configuration, scaling, and best practices"
        />
      </Helmet>

      <div className="max-w-4xl">
        <MarkdownRenderer content={kubernetesDeploymentMd} />
      </div>
    </>
  );
};
