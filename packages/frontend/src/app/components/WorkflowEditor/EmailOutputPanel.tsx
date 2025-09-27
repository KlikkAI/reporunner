import { useMemo } from './hooks/useMemo';
import { useState } from './hooks/useState';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { CheckCircle, ChevronDown, ChevronRight, Edit, Pin, Search } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';

type DisplayMode = 'schema' | 'table' | 'json';

interface EmailOutputPanelProps {
  selectedEmail?: any;
  isVisible?: boolean;
}

const EmailOutputPanel: React.FC<EmailOutputPanelProps> = ({ selectedEmail, isVisible = true }) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('schema');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(['labelIds', 'headers', 'from', 'to'])
  );

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm || !selectedEmail) return selectedEmail;

    const filterObject = (obj: any, path = ''): any => {
      if (typeof obj === 'string') {
        return obj.toLowerCase().includes(searchTerm.toLowerCase()) ? obj : null;
      }
      if (typeof obj === 'number') {
        return obj.toString().includes(searchTerm) ? obj : null;
      }
      if (Array.isArray(obj)) {
        const filtered = obj.filter((item, index) => {
          const result = filterObject(item, `${path}[${index}]`);
          return result !== null;
        });
        return filtered.length > 0 ? filtered : null;
      }
      if (typeof obj === 'object' && obj !== null) {
        const filtered: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const newPath = path ? `${path}.${key}` : key;
          if (key.toLowerCase().includes(searchTerm.toLowerCase())) {
            filtered[key] = value;
          } else {
            const result = filterObject(value, newPath);
            if (result !== null) {
              filtered[key] = result;
            }
          }
        }
        return Object.keys(filtered).length > 0 ? filtered : null;
      }
      return null;
    };

    return filterObject(selectedEmail);
  }, [selectedEmail, searchTerm]);

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedItems(newExpanded);
  };

  // Get data type icon
  const getTypeIcon = (value: any) => {
    if (typeof value === 'string') {
      return <span className="text-blue-400">Aa</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-green-400">#</span>;
    }
    if (Array.isArray(value)) {
      return <span className="text-purple-400">[]</span>;
    }
    if (typeof value === 'object') {
      return <span className="text-yellow-400">{}</span>;
    }
    return <span className="text-gray-400">?</span>;
  };

  // Render schema view
  const renderSchemaItem = (key: string, value: any, path: string, nestLevel: number = 0) => {
    const isExpanded = expandedItems.has(path);
    const hasChildren = Array.isArray(value) || (typeof value === 'object' && value !== null);

    return (
      <div key={path} className="border-b border-gray-700 last:border-b-0">
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-700 transition-colors ${nestLevel > 0 ? 'pl-8' : ''}`}
          style={{ paddingLeft: `${nestLevel * 24 + 12}px` }}
        >
          {/* Toggle button for expandable items */}
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(path)}
              className="mr-2 p-1 hover:bg-gray-600 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6 mr-2" />}

          {/* Property name pill */}
          <div className="flex items-center bg-gray-600 rounded px-2 py-1 mr-3 min-w-0">
            <div className="mr-2 flex-shrink-0">{getTypeIcon(value)}</div>
            <span className="text-sm font-medium text-white truncate">
              {Array.isArray(value) ? `${key}` : key}
            </span>
          </div>

          {/* Value display */}
          <div className="flex-1 min-w-0">
            {!hasChildren ? (
              <span className="text-sm text-gray-300 break-all">
                {typeof value === 'string' && value.includes('\n') ? (
                  <div className="whitespace-pre-wrap">{value}</div>
                ) : (
                  String(value)
                )}
              </span>
            ) : (
              <span className="text-sm text-gray-400">
                {Array.isArray(value) ? `Array (${value.length} items)` : 'Object'}
              </span>
            )}
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {Array.isArray(value)
              ? value.map((item, index) =>
                  renderSchemaItem(`[${index}]`, item, `${path}[${index}]`, nestLevel + 1)
                )
              : Object.entries(value).map(([childKey, childValue]) =>
                  renderSchemaItem(childKey, childValue, `${path}.${childKey}`, nestLevel + 1)
                )}
          </div>
        )}
      </div>
    );
  };

  // Render table view
  const renderTableView = () => {
    if (!selectedEmail)
      return <div className="text-gray-400 text-center py-8">No email selected</div>;

    const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
      const result: Record<string, any> = {};

      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (Array.isArray(value)) {
          result[newKey] = value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
          // For nested objects, show a preview
          result[newKey] = `Object (${Object.keys(value).length} properties)`;
        } else {
          result[newKey] = value;
        }
      }

      return result;
    };

    const flatData = flattenObject(selectedEmail);

    return (
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-2 px-3 text-gray-300 font-medium">Property</th>
              <th className="text-left py-2 px-3 text-gray-300 font-medium">Value</th>
              <th className="text-left py-2 px-3 text-gray-300 font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(flatData).map(([key, value]) => (
              <tr key={key} className="border-b border-gray-700 hover:bg-gray-700">
                <td className="py-2 px-3 text-blue-300 font-mono text-xs">{key}</td>
                <td className="py-2 px-3 text-gray-300 break-all">
                  {typeof value === 'string' && value.length > 100
                    ? `${value.substring(0, 100)}...`
                    : String(value)}
                </td>
                <td className="py-2 px-3 text-gray-400 text-xs">{typeof value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render JSON view
  const renderJsonView = () => {
    if (!selectedEmail)
      return <div className="text-gray-400 text-center py-8">No email selected</div>;

    return (
      <div className="overflow-auto">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap p-4 bg-gray-900 rounded border border-gray-600 font-mono">
          {JSON.stringify(filteredData || selectedEmail, null, 2)}
        </pre>
      </div>
    );
  };

  const renderContent = () => {
    if (!selectedEmail) {
      return (
        <div className="text-center text-gray-300 py-12 text-sm">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-2xl">📧</span>
            </div>
          </div>
          <p className="mb-2">Select an email from the input column</p>
          <p className="text-gray-400">to view its detailed structure</p>
        </div>
      );
    }

    switch (displayMode) {
      case 'schema':
        return (
          <div className="overflow-auto max-h-full">
            {filteredData ? (
              Object.entries(filteredData).map(([key, value]) => renderSchemaItem(key, value, key))
            ) : (
              <div className="text-gray-400 text-center py-8">No matching data found</div>
            )}
          </div>
        );
      case 'table':
        return renderTableView();
      case 'json':
        return renderJsonView();
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-600 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-100 flex items-center">
            <span className="mr-2">📤</span>
            OUTPUT
            {selectedEmail && (
              <div className="ml-2 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400 ml-1">Email selected</span>
              </div>
            )}
          </h3>
        </div>

        {/* Controls */}
        {selectedEmail && (
          <div className="flex items-center justify-between space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search email data"
                className="w-full pl-10 pr-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-gray-700"
              />
            </div>

            {/* Display mode tabs */}
            <div className="flex bg-gray-700 rounded overflow-hidden">
              {[
                { key: 'schema', label: 'Schema' },
                { key: 'table', label: 'Table' },
                { key: 'json', label: 'JSON' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDisplayMode(key as DisplayMode)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    displayMode === key
                      ? 'bg-gray-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
                <Edit className="w-4 h-4" />
                edit
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
                <Pin className="w-4 h-4" /> pin
              </button>
            </div>
          </div>
        )}

        {/* Email info */}
        {selectedEmail && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-300">
              <span className="text-blue-300">From:</span> {selectedEmail.from || 'Unknown'}
            </div>
            <div className="text-sm text-gray-300">
              <span className="text-blue-300">Subject:</span>{' '}
              {selectedEmail.subject || 'No subject'}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
};

export default EmailOutputPanel;
