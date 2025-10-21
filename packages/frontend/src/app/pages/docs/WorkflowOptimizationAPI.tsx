/**
 * Workflow Optimization API Documentation Page
 *
 * Displays Workflow Optimization API reference with AI-powered analysis
 */

import type React from 'react';
import { Helmet } from 'react-helmet-async';
import { MarkdownRenderer } from '@/app/components/Documentation';
import workflowOptimizationAPIMd from '../../../../../../docs/api/WORKFLOW_OPTIMIZATION_API.md?raw';

export const WorkflowOptimizationAPI: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Workflow Optimization API - KlikkFlow Documentation</title>
        <meta
          name="description"
          content="Workflow Optimization API reference - AI-powered analysis, performance insights, and recommendations"
        />
      </Helmet>

      <div className="max-w-4xl">
        <MarkdownRenderer content={workflowOptimizationAPIMd} />
      </div>
    </>
  );
};
