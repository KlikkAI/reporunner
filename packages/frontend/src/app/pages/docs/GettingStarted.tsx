/**
 * Getting Started Documentation Page
 *
 * Displays the getting started guide for new users
 */

import type React from 'react';
import { Helmet } from 'react-helmet-async';
import { MarkdownRenderer } from '@/app/components/Documentation';
import gettingStartedMd from '../../../../../../docs/user-guide/GETTING_STARTED.md?raw';

export const GettingStarted: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Getting Started - KlikkFlow Documentation</title>
        <meta
          name="description"
          content="Get started with KlikkFlow - Prerequisites, installation, and creating your first workflow"
        />
      </Helmet>

      <div className="max-w-4xl">
        <MarkdownRenderer content={gettingStartedMd} />
      </div>
    </>
  );
};
