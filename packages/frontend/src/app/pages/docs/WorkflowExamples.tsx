/**
 * Workflow Examples Documentation Page
 *
 * Displays example workflows and use cases
 */

import type React from 'react';
import { Helmet } from 'react-helmet-async';
import { MarkdownRenderer } from '@/app/components/Documentation';
import workflowExamplesMd from '../../../../../../docs/user-guide/WORKFLOW_EXAMPLES.md?raw';

export const WorkflowExamples: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Workflow Examples - KlikkFlow Documentation</title>
        <meta
          name="description"
          content="Learn from example workflows - AI automation, data processing, notifications, and more"
        />
      </Helmet>

      <div className="max-w-4xl">
        <MarkdownRenderer content={workflowExamplesMd} />
      </div>
    </>
  );
};
