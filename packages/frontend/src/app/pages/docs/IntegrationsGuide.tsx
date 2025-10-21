/**
 * Integrations Guide Documentation Page
 *
 * Displays available integrations and how to use them
 */

import type React from 'react';
import { Helmet } from 'react-helmet-async';
import { MarkdownRenderer } from '@/app/components/Documentation';
import integrationsGuideMd from '../../../../../../docs/user-guide/INTEGRATIONS_GUIDE.md?raw';

export const IntegrationsGuide: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Integrations Guide - KlikkFlow Documentation</title>
        <meta
          name="description"
          content="Complete guide to KlikkFlow integrations - Available connectors, authentication, and usage examples"
        />
      </Helmet>

      <div className="max-w-4xl">
        <MarkdownRenderer content={integrationsGuideMd} />
      </div>
    </>
  );
};
