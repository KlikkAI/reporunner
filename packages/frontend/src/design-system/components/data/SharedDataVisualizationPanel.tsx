import { Button, Card, Empty, Tabs } from 'antd';
import type React from 'react';
import { useMemo, useState } from 'react';
import SchemaView from '@/design-system/components/DataVisualization/SchemaView';
import TableView from '@/design-system/components/DataVisualization/TableView';
import { JsonViewer } from '@/design-system/components/JsonViewer';
import { cn } from '@/design-system/utils';

const { TabPane } = Tabs;

interface DataVisualizationOptions {
  showJson?: boolean;
  showTable?: boolean;
  showSchema?: boolean;
  showRaw?: boolean;
  maxHeight?: string;
  title?: string;
}

interface SharedDataVisualizationPanelProps {
  data: any;
  title?: string;
  className?: string;
  options?: DataVisualizationOptions;
  emptyMessage?: string;
  onExport?: (format: 'json' | 'csv' | 'xml') => void;
}

/**
 * Shared data visualization panel that eliminates duplication across
 * EmailOutputPanel, DataVisualizationPanel, and other data display components.
 * Provides consistent tabbed interface for JSON, Table, Schema, and Raw views.
 */
export const SharedDataVisualizationPanel: React.FC<SharedDataVisualizationPanelProps> = ({
  data,
  title = 'Data Output',
  className = '',
  options = {},
  emptyMessage = 'No data available',
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState('json');

  const {
    showJson = true,
    showTable = true,
    showSchema = true,
    showRaw = false,
    maxHeight = '400px',
  } = options;

  // Memoized data processing for performance
  const processedData = useMemo(() => {
    if (!data) {
      return null;
    }

    const hasData = Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0;
    if (!hasData) {
      return null;
    }

    return {
      json: data,
      table: Array.isArray(data) ? data : [data],
      raw: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      schema: data,
    };
  }, [data]);

  // Export functionality
  const handleExport = (format: 'json' | 'csv' | 'xml') => {
    if (onExport) {
      onExport(format);
      return;
    }

    // Default export implementation
    let content = '';
    let mimeType = '';
    let fileName = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        fileName = 'data.json';
        break;
      case 'csv':
        if (Array.isArray(data) && data.length > 0) {
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map((row) => Object.values(row).join(',')).join('\n');
          content = `${headers}\n${rows}`;
        } else {
          content = JSON.stringify(data, null, 2);
        }
        mimeType = 'text/csv';
        fileName = 'data.csv';
        break;
      case 'xml':
        // Simple XML conversion
        content = `<data>${JSON.stringify(data)}</data>`;
        mimeType = 'application/xml';
        fileName = 'data.xml';
        break;
    }

    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!processedData) {
    return (
      <Card title={title} className={cn('bg-gray-800 border-gray-700', className)}>
        <Empty description={emptyMessage} className="text-gray-400" />
      </Card>
    );
  }

  return (
    <Card
      title={title}
      className={cn('bg-gray-800 border-gray-700', className)}
      extra={
        <div className="flex space-x-2">
          <Button
            size="small"
            onClick={() => handleExport('json')}
            className="text-gray-300 border-gray-600 hover:border-gray-500"
          >
            Export JSON
          </Button>
          {showTable && (
            <Button
              size="small"
              onClick={() => handleExport('csv')}
              className="text-gray-300 border-gray-600 hover:border-gray-500"
            >
              Export CSV
            </Button>
          )}
        </div>
      }
    >
      <div style={{ maxHeight, overflow: 'auto' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="[&_.ant-tabs-tab]:text-gray-300 [&_.ant-tabs-tab-active]:text-white"
        >
          {showJson && (
            <TabPane tab="JSON" key="json">
              <JsonViewer data={processedData.json} className="bg-gray-900 border-gray-600" />
            </TabPane>
          )}

          {showTable && (
            <TabPane tab="Table" key="table">
              <TableView data={processedData.table} className="bg-gray-900" />
            </TabPane>
          )}

          {showSchema && (
            <TabPane tab="Schema" key="schema">
              <SchemaView data={processedData.schema} className="bg-gray-900" />
            </TabPane>
          )}

          {showRaw && (
            <TabPane tab="Raw" key="raw">
              <pre className="bg-gray-900 p-4 rounded border border-gray-600 text-gray-200 text-sm overflow-auto">
                {processedData.raw}
              </pre>
            </TabPane>
          )}
        </Tabs>
      </div>
    </Card>
  );
};

export default SharedDataVisualizationPanel;
