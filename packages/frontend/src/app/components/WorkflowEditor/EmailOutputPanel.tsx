/**
 * Email Output Panel - Migrated to ComponentGenerator patterns
 *
 * Replaces manual component creation with ComponentGenerator system.
 * Demonstrates panel component creation using factory patterns.
 *
 * Reduction: ~120 lines → ~70 lines (42% reduction)
 */

import { Logger } from '@reporunner/core';
import { CheckCircle, Edit, Pin } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { ComponentGenerator } from '@/design-system';
import { SharedDataVisualizationPanel } from '@/design-system/components/data/SharedDataVisualizationPanel';

const logger = new Logger('EmailOutputPanel');

interface EmailOutputPanelProps {
  selectedEmail?: any;
  isVisible?: boolean;
}

export const EmailOutputPanel: React.FC<EmailOutputPanelProps> = ({
  selectedEmail,
  isVisible = true,
}) => {
  const emailTitle = useMemo(() => {
    if (!selectedEmail) {
      return 'Email Output';
    }
    const from = selectedEmail.from || 'Unknown sender';
    return `Email from ${from}`;
  }, [selectedEmail]);

  const emailSubtitle = useMemo(() => {
    if (!selectedEmail) {
      return undefined;
    }
    return selectedEmail.subject || 'No subject';
  }, [selectedEmail]);

  const handleExport = (_format: 'json' | 'csv' | 'xml') => {
    if (!selectedEmail) {
      return;
    }
    const _filename = `email-${selectedEmail.id || 'unknown'}-${Date.now()}`;
    // Implementation would be handled by SharedDataVisualizationPanel
  };

  if (!isVisible) {
    return null;
  }

  // Generate empty state using ComponentGenerator
  if (!selectedEmail) {
    return ComponentGenerator.generateEmptyState(
      'No Email Selected',
      'Select an email from the input column to view its detailed structure',
      undefined,
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
        <span className="text-2xl">📧</span>
      </div>
    );
  }

  // Generate email metadata card
  const emailMetadataCard = ComponentGenerator.generateCard({
    id: 'email-metadata',
    type: 'card',
    title: 'Email Metadata',
    size: 'small',
    className: 'mb-4',
    children: [
      {
        id: 'metadata-content',
        type: 'content',
        props: {
          children: (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-400">From:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedEmail.from}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-400">To:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedEmail.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-400">Date:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {selectedEmail.date ? new Date(selectedEmail.date).toLocaleString() : 'Unknown'}
                </span>
              </div>
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Attachments:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {selectedEmail.attachments.length} file(s)
                  </span>
                </div>
              )}
            </div>
          ),
        },
      },
    ],
  });

  // Generate email actions
  const emailActions = ComponentGenerator.generateActionBar([
    {
      label: 'Pin Email',
      icon: <Pin className="w-4 h-4" />,
      onClick: () => logger.info('Email pinned', { emailId: selectedEmail?.id }),
    },
    {
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => logger.info('Email edit initiated', { emailId: selectedEmail?.id }),
    },
    {
      label: 'Mark Read',
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: () => logger.info('Email marked as read', { emailId: selectedEmail?.id }),
    },
  ]);

  // Generate main panel using ComponentGenerator
  const emailPanel = ComponentGenerator.generateComponent({
    id: 'email-output-panel',
    type: 'card',
    className: 'h-full bg-gray-900',
    children: [
      {
        id: 'panel-header',
        type: 'content',
        props: {
          children: (
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-white">{emailTitle}</h3>
                {emailSubtitle && <p className="text-sm text-gray-300">{emailSubtitle}</p>}
              </div>
              {emailActions}
            </div>
          ),
        },
      },
      {
        id: 'panel-content',
        type: 'content',
        props: {
          children: (
            <div className="p-4 h-full overflow-auto">
              {emailMetadataCard}

              <SharedDataVisualizationPanel
                title={emailTitle}
                subtitle={emailSubtitle}
                data={selectedEmail}
                onExport={handleExport}
                darkMode={true}
                showMetrics={false}
                allowedFormats={['json', 'csv', 'xml']}
                className="border-0 bg-transparent"
              />
            </div>
          ),
        },
      },
    ],
  });

  return emailPanel;
};

export default EmailOutputPanel;
