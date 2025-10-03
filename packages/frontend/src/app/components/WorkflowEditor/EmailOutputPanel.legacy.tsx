/* eslint-disable @typescript-eslint/no-explicit-any */

import { CheckCircle, Edit, Pin } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { SharedDataVisualizationPanel } from '@/design-system/components/data/SharedDataVisualizationPanel';

interface EmailOutputPanelProps {
  selectedEmail?: any;
  isVisible?: boolean;
}

const EmailOutputPanel: React.FC<EmailOutputPanelProps> = ({ selectedEmail, isVisible = true }) => {
  const emailTitle = useMemo(() => {
    if (!selectedEmail) {
      return 'Email Output';
    }
    const from = selectedEmail.from || 'Unknown sender';
    return `Email from ${from}`;
  }, [selectedEmail]);

  const handleExport = (_format: 'json' | 'csv' | 'xml') => {
    if (!selectedEmail) {
      return;
    }

    // Custom export logic for email data - handled by SharedDataVisualizationPanel
  };

  if (!isVisible) {
    return null;
  }

  if (!selectedEmail) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <div className="text-center text-gray-300 py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-2xl">📧</span>
          </div>
          <p className="mb-2">Select an email from the input column</p>
          <p className="text-gray-400">to view its detailed structure</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header with email info */}
      <div className="flex-shrink-0 p-4 border-b border-gray-600 bg-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-100 flex items-center">
            <span className="mr-2">📤</span>
            OUTPUT
            <div className="ml-2 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400 ml-1">Email selected</span>
            </div>
          </h3>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
              <Pin className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-300">
          <div className="flex justify-between">
            <span>
              <span className="text-blue-300">From:</span> {selectedEmail.from || 'Unknown'}
            </span>
            <span>
              <span className="text-blue-300">Subject:</span>{' '}
              {selectedEmail.subject || 'No subject'}
            </span>
          </div>
        </div>
      </div>

      {/* Content using shared visualization panel */}
      <div className="flex-1 overflow-hidden">
        <SharedDataVisualizationPanel
          data={selectedEmail}
          title={emailTitle}
          options={{
            showJson: true,
            showTable: true,
            showSchema: true,
            maxHeight: 'calc(100vh - 200px)',
          }}
          onExport={handleExport}
          emptyMessage="No email data available"
          className="h-full border-0"
        />
      </div>
    </div>
  );
};

export default EmailOutputPanel;
