/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react';

interface AIAgentInputPanelProps {
  connectedInputNodes: any[];
  onDataTransform?: (data: any) => void;
}

const AIAgentInputPanel: React.FC<AIAgentInputPanelProps> = ({
  connectedInputNodes,
  onDataTransform: _onDataTransform,
}) => {
  if (connectedInputNodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center space-y-3">
          <div className="text-3xl">🔗</div>
          <div className="text-sm font-medium">No Input Connections</div>
          <div className="text-xs text-gray-500 max-w-48">
            Connect nodes like Gmail Trigger or Transform to provide input data for AI processing
          </div>
          <div className="mt-4 text-xs text-orange-400">
            💡 AI Agents work best with structured input data
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* === INPUT OVERVIEW === */}
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">⚡</span>
          <div className="text-sm font-medium text-blue-200">Input Data Available</div>
          <span className="px-2 py-1 bg-blue-800 text-blue-100 rounded text-xs">
            {connectedInputNodes.length} source
            {connectedInputNodes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="text-xs text-blue-300">
          This data will be processed by the AI Agent and can be referenced in prompts using{' '}
          <code className="bg-blue-800 px-1 rounded">{'{{input}}'}</code>
        </div>
      </div>

      {/* === CONNECTED NODES === */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-100 flex items-center space-x-2">
          <span>📥</span>
          <span>Connected Input Nodes</span>
        </div>

        {connectedInputNodes.map((node, index) => {
          const hasOutputData = node?.data?.outputData || node?.data?.testResults?.data;
          const nodeData = hasOutputData
            ? node.data.outputData || node.data.testResults.data
            : null;

          return (
            <div
              key={node?.id || index}
              className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden"
            >
              {/* === NODE HEADER === */}
              <div className="p-3 border-b border-gray-600 bg-gray-750">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl" title={node?.data?.label || 'Node Icon'}>
                      {node?.data?.icon || getNodeIcon(node)}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {node?.data?.label || 'Unnamed Node'}
                      </div>
                      <div className="text-xs text-gray-400">{getNodeTypeDisplay(node)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasOutputData ? (
                      <span className="px-2 py-1 bg-green-800 text-green-200 rounded text-xs flex items-center space-x-1">
                        <span>✓</span>
                        <span>Data Ready</span>
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-800 text-yellow-200 rounded text-xs flex items-center space-x-1">
                        <span>⏳</span>
                        <span>No Data</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* === DATA CONTENT === */}
              <div className="p-3">
                {hasOutputData ? (
                  <InputDataRenderer data={nodeData} nodeType={getNodeType(node)} />
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <div className="text-sm">No output data available</div>
                    <div className="text-xs mt-1">Test the connected node to generate data</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* === AI PROCESSING TIPS === */}
      <div className="mt-6 p-3 bg-gray-800 rounded-lg border border-gray-600">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">💡</span>
          <div className="text-sm font-medium text-gray-200">AI Processing Tips</div>
        </div>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex items-start space-x-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>
              Use <code className="bg-gray-700 px-1 rounded text-gray-300">{'{{input}}'}</code> in
              your prompts to reference the input data
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>
              For email data, you can reference specific fields like{' '}
              <code className="bg-gray-700 px-1 rounded text-gray-300">subject</code>,{' '}
              <code className="bg-gray-700 px-1 rounded text-gray-300">body</code>,{' '}
              <code className="bg-gray-700 px-1 rounded text-gray-300">from</code>
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-orange-400 mt-0.5">•</span>
            <span>
              The AI will automatically detect and process structured data from connected nodes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component to render different types of input data
const InputDataRenderer: React.FC<{ data: any; nodeType: string }> = ({ data, nodeType }) => {
  if (!data) {
    return <div className="text-gray-400 text-sm">No data available</div>;
  }

  // Handle email data (from Gmail triggers)
  if (nodeType === 'gmail' || nodeType === 'gmail-trigger') {
    // Handle array of emails
    if (Array.isArray(data)) {
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-2">
            {data.length} email{data.length !== 1 ? 's' : ''} available for AI processing
          </div>
          {data.slice(0, 3).map((email, index) => (
            <EmailPreview key={index} email={email} isLatest={index === 0} />
          ))}
          {data.length > 3 && (
            <div className="text-xs text-gray-400 text-center py-2 border-t border-gray-600">
              + {data.length - 3} more email{data.length - 3 !== 1 ? 's' : ''} available
            </div>
          )}
        </div>
      );
    }
    // Handle single email
    return <EmailPreview email={data} isLatest={true} />;
  }

  // Handle transform node data
  if (nodeType === 'transform') {
    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-400 mb-2">Transformed data ready for AI processing</div>
        <TransformDataPreview data={data} />
      </div>
    );
  }

  // Handle generic structured data
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-400 mb-2">
          Structured data with {keys.length} field{keys.length !== 1 ? 's' : ''}
        </div>
        <StructuredDataPreview data={data} />
      </div>
    );
  }

  // Fallback for other data types
  return (
    <div className="bg-gray-900 p-2 rounded border border-gray-600 font-mono text-xs text-gray-200 max-h-32 overflow-y-auto">
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </div>
  );
};

// Email preview component
const EmailPreview: React.FC<{ email: any; isLatest: boolean }> = ({ email, isLatest }) => {
  return (
    <div
      className={`p-3 rounded border ${isLatest ? 'border-blue-600 bg-blue-900/10' : 'border-gray-600 bg-gray-750'}`}
    >
      {isLatest && (
        <div className="text-xs text-blue-400 mb-2 flex items-center space-x-1">
          <span>⭐</span>
          <span>Latest Email (Primary Input)</span>
        </div>
      )}
      <div className="space-y-1">
        <div className="flex items-start space-x-2 text-sm">
          <span className="text-gray-400 w-12 flex-shrink-0">From:</span>
          <span className="text-gray-200 truncate">{email.from || 'Unknown'}</span>
        </div>
        <div className="flex items-start space-x-2 text-sm">
          <span className="text-gray-400 w-12 flex-shrink-0">Subject:</span>
          <span className="text-gray-200">{email.subject || 'No Subject'}</span>
        </div>
        <div className="flex items-start space-x-2 text-sm">
          <span className="text-gray-400 w-12 flex-shrink-0">Preview:</span>
          <span className="text-gray-300 text-xs leading-relaxed">
            {email.body
              ? email.body.length > 150
                ? `${email.body.substring(0, 150)}...`
                : email.body
              : 'No content'}
          </span>
        </div>
        {(email.isUnread || email.hasAttachments || email.labels?.length > 0) && (
          <div className="flex items-center space-x-2 mt-2">
            {email.isUnread && (
              <span className="px-2 py-1 bg-blue-800 text-blue-200 rounded text-xs">Unread</span>
            )}
            {email.hasAttachments && (
              <span className="px-2 py-1 bg-purple-800 text-purple-200 rounded text-xs">
                📎 Attachments
              </span>
            )}
            {email.labels && email.labels.length > 0 && (
              <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                🏷️ {Array.isArray(email.labels) ? email.labels.slice(0, 2).join(', ') : email.labels}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Transform data preview component
const TransformDataPreview: React.FC<{ data: any }> = ({ data }) => {
  if (!data || typeof data !== 'object') {
    return <div className="text-gray-400 text-sm">Invalid transform data</div>;
  }

  const fields = Object.keys(data);
  return (
    <div className="bg-gray-750 p-3 rounded border border-gray-600">
      <div className="grid grid-cols-1 gap-2">
        {fields.slice(0, 5).map((field) => {
          const value = data[field];
          const displayValue =
            typeof value === 'string' && value.length > 100
              ? `${value.substring(0, 100)}...`
              : value;

          return (
            <div key={field} className="flex items-start space-x-2 text-sm">
              <span className="text-gray-400 w-20 flex-shrink-0 capitalize">{field}:</span>
              <span className="text-gray-200 flex-1">
                {typeof displayValue === 'object'
                  ? JSON.stringify(displayValue)
                  : String(displayValue || 'N/A')}
              </span>
            </div>
          );
        })}
        {fields.length > 5 && (
          <div className="text-xs text-gray-400 text-center pt-1 border-t border-gray-600">
            + {fields.length - 5} more field{fields.length - 5 !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

// Structured data preview component
const StructuredDataPreview: React.FC<{ data: any }> = ({ data }) => {
  const fields = Object.keys(data);

  return (
    <div className="bg-gray-750 p-3 rounded border border-gray-600">
      <div className="space-y-2">
        {fields.slice(0, 4).map((field) => {
          const value = data[field];
          const displayValue =
            typeof value === 'string' && value.length > 80 ? `${value.substring(0, 80)}...` : value;

          return (
            <div key={field} className="text-sm">
              <div className="text-gray-400 text-xs mb-1">{field}:</div>
              <div className="text-gray-200 bg-gray-800 p-2 rounded text-xs font-mono">
                {typeof displayValue === 'object'
                  ? JSON.stringify(displayValue, null, 2)
                  : String(displayValue || 'null')}
              </div>
            </div>
          );
        })}
        {fields.length > 4 && (
          <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-600">
            + {fields.length - 4} more field{fields.length - 4 !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const getNodeIcon = (node: any): string => {
  if (
    node?.data?.integrationData?.id === 'gmail' ||
    node?.data?.enhancedNodeType?.id === 'gmail-trigger'
  ) {
    return '📧';
  }
  if (node?.type === 'transform') {
    return '🔄';
  }
  if (node?.type === 'trigger') {
    return '⚡';
  }
  return '📊';
};

const getNodeType = (node: any): string => {
  if (
    node?.data?.integrationData?.id === 'gmail' ||
    node?.data?.enhancedNodeType?.id === 'gmail-trigger'
  ) {
    return 'gmail-trigger';
  }
  if (node?.type === 'transform') {
    return 'transform';
  }
  return node?.type || 'unknown';
};

const getNodeTypeDisplay = (node: any): string => {
  return (
    node?.data?.enhancedNodeType?.displayName ||
    node?.data?.nodeTypeData?.displayName ||
    node?.data?.nodeTypeData?.name ||
    node?.type ||
    'Unknown Node Type'
  );
};

export default AIAgentInputPanel;
