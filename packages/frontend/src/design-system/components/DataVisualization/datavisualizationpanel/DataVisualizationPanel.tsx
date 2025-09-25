import { useState } from './hooks/useState';
import { useMemo } from './hooks/useMemo';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { CheckCircle, Search } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import JsonView from './JsonView';
import SchemaView from './SchemaView';
import TableView from './TableView';

type DisplayMode = 'schema' | 'table' | 'json';

interface DataVisualizationPanelProps {
  data: any;
  title?: string;
  description?: string;
  nodeId?: string;
  nodeType?: string;
  onDataTransform?: (transformedData: any) => void;
  compact?: boolean;
}

const DataVisualizationPanel: React.FC<DataVisualizationPanelProps> = ({
  data,
  title = 'Input Data',
  nodeId,
  onDataTransform,
  compact = false,
}) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('schema');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm || !data) return data;

    const filterObject = (obj: any, term: string): any => {
      if (typeof obj === 'string') {
        return obj.toLowerCase().includes(term.toLowerCase()) ? obj : null;
      }

      if (Array.isArray(obj)) {
        return obj.map((item) => filterObject(item, term)).filter((item) => item !== null);
      }

      if (typeof obj === 'object' && obj !== null) {
        const filtered: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key.toLowerCase().includes(term.toLowerCase())) {
            filtered[key] = value;
          } else {
            const filteredValue = filterObject(value, term);
            if (filteredValue !== null) {
              filtered[key] = filteredValue;
            }
          }
        }
        return Object.keys(filtered).length > 0 ? filtered : null;
      }

      return obj;
    };

    return filterObject(data, searchTerm);
  }, [data, searchTerm]);

  // Data statistics
  const dataStats = useMemo(() => {
    if (!data) return null;

    const countFields = (obj: any): number => {
      if (typeof obj !== 'object' || obj === null) return 0;

      let count = 0;
      for (const [value] of Object.entries(obj)) {
        count++;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          count += countFields(value);
        }
      }
      return count;
    };

    return {
      totalFields: countFields(data),
      topLevelFields: Object.keys(data || {}).length,
      hasArrays: JSON.stringify(data).includes('['),
      hasNested: JSON.stringify(data).includes('{', 1),
      dataSize: JSON.stringify(data).length,
    };
  }, [data]);

  const handleCopyData = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const handleDownloadData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nodeId || 'data'}-output.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showFieldDetails = (fieldPath: string) => {
    setSelectedField(fieldPath);
    setIsModalVisible(true);
  };

  const renderContent = () => {
    if (!data) {
      return (
        <div className="text-center text-gray-300 py-12 text-sm">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <p className="mb-2">No input data available</p>
          <p className="text-gray-400">
            Connect this node to a data source to see input data visualization
          </p>
        </div>
      );
    }

    switch (displayMode) {
      case 'schema':
        return (
          <div className="overflow-auto max-h-full">
            <SchemaView data={filteredData} onFieldClick={showFieldDetails} compact={compact} />
          </div>
        );
      case 'table':
        return (
          <div className="overflow-auto max-h-full">
            <TableView
              data={filteredData}
              onFieldClick={showFieldDetails}
              onDataTransform={onDataTransform}
              compact={compact}
            />
          </div>
        );
      case 'json':
        return (
          <div className="overflow-auto max-h-full">
            <JsonView data={filteredData} onFieldClick={showFieldDetails} compact={compact} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-600 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-100 flex items-center">
            <span className="mr-2">📥</span>
            {title}
            {data && (
              <div className="ml-2 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400 ml-1">Data loaded</span>
              </div>
            )}
          </h3>
        </div>

        {/* Controls */}
        {data && (
          <div className="flex items-center justify-between space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search data fields"
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
              <button
                onClick={handleCopyData}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                title="Copy JSON"
              >
                <CopyOutlined className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadData}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                title="Download JSON"
              >
                <DownloadOutlined className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Data info */}
        {data && dataStats && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-300">
              <span className="text-blue-300">Fields:</span> {dataStats.totalFields}
            </div>
            <div className="text-sm text-gray-300">
              <span className="text-blue-300">Size:</span> {(dataStats.dataSize / 1024).toFixed(1)}
              KB
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>

      {/* Field Details Modal */}
      <Modal
        title={`Field Details: ${selectedField}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        className="dark-modal"
      >
        {selectedField && (
          <div className="bg-gray-900 p-4 rounded">
            <JsonView data={filteredData} highlightPath={selectedField} compact={false} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataVisualizationPanel;
