/**
 * Data Inspector Component
 *
 * Advanced data inspection tool providing:
 * - Hierarchical data visualization
 * - JSONPath navigation
 * - Data type analysis
 * - Size and performance metrics
 * - Export and copy functionality
 * - Search and filtering
 */

import {
  CompressOutlined,
  CopyOutlined,
  DownloadOutlined,
  ExpandOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Divider,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Tree,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { DataInspector } from '@/core/types/debugging';
import { JsonViewer } from '@/design-system';
import { cn } from '@/design-system/utils';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TreeNode } = Tree;

interface DataInspectorProps {
  data: any;
  nodeId: string;
  type: DataInspector['type'];
  onClose?: () => void;
  className?: string;
}

interface DataNode {
  key: string;
  title: string;
  value: any;
  type: string;
  size: number;
  path: string;
  children?: DataNode[];
  isLeaf?: boolean;
}

const DataInspector: React.FC<DataInspectorProps> = ({
  data,
  nodeId,
  type,
  onClose,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'tree' | 'json' | 'table'>('tree');
  const [filterType, setFilterType] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Convert data to tree structure
  const dataTree = useMemo(() => {
    return convertToTree(data, '', 'root');
  }, [data]);

  // Filter tree based on search and type
  const filteredTree = useMemo(() => {
    return filterTree(dataTree, searchTerm, filterType);
  }, [dataTree, searchTerm, filterType]);

  // Get data statistics
  const dataStats = useMemo(() => {
    return analyzeData(data);
  }, [data]);

  // Get selected data
  const selectedData = useMemo(() => {
    if (!selectedPath) return data;
    return getDataByPath(data, selectedPath);
  }, [data, selectedPath]);

  const handleCopyData = useCallback(async () => {
    try {
      const text =
        typeof selectedData === 'string' ? selectedData : JSON.stringify(selectedData, null, 2);
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy data:', error);
    }
  }, [selectedData]);

  const handleExportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(selectedData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_${nodeId}_${type}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [selectedData, nodeId, type]);

  const handleTreeSelect = useCallback((selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      setSelectedPath(selectedKeys[0] as string);
    }
  }, []);

  const handleExpand = useCallback((expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys as string[]);
  }, []);

  const renderTreeNodes = useCallback((nodes: DataNode[]): React.ReactNode => {
    return nodes.map((node) => (
      <TreeNode
        key={node.key}
        title={
          <div className="flex items-center gap-2">
            <span className="text-white">{node.title}</span>
            <Tag color={getTypeColor(node.type)}>{node.type}</Tag>
            <span className="text-gray-400 text-xs">{formatSize(node.size)}</span>
          </div>
        }
        isLeaf={node.isLeaf}
      >
        {node.children && renderTreeNodes(node.children)}
      </TreeNode>
    ));
  }, []);

  const renderDataTable = useCallback(() => {
    if (!Array.isArray(selectedData)) {
      return <Alert message="Table view only available for arrays" type="info" showIcon />;
    }

    const columns = getTableColumns(selectedData);
    const tableData = selectedData.map((item, index) => ({
      key: index,
      index,
      ...item,
    }));

    return (
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={{ pageSize: 10 }}
        size="small"
        className="bg-gray-800"
        scroll={{ x: 'max-content' }}
      />
    );
  }, [selectedData]);

  const renderDataAnalysis = () => (
    <div className="space-y-4">
      <Title level={5} className="text-white">
        Data Analysis
      </Title>

      <div className="grid grid-cols-2 gap-4">
        <Card size="small" className="bg-gray-800 border-gray-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{dataStats.totalSize}</div>
            <div className="text-gray-400 text-sm">Total Size</div>
          </div>
        </Card>

        <Card size="small" className="bg-gray-800 border-gray-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{dataStats.depth}</div>
            <div className="text-gray-400 text-sm">Max Depth</div>
          </div>
        </Card>

        <Card size="small" className="bg-gray-800 border-gray-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{dataStats.keyCount}</div>
            <div className="text-gray-400 text-sm">Total Keys</div>
          </div>
        </Card>

        <Card size="small" className="bg-gray-800 border-gray-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{dataStats.arrayCount}</div>
            <div className="text-gray-400 text-sm">Arrays</div>
          </div>
        </Card>
      </div>

      <Card size="small" className="bg-gray-800 border-gray-600">
        <Title level={5} className="text-white mb-3">
          Type Distribution
        </Title>
        <div className="space-y-2">
          {Object.entries(dataStats.typeDistribution).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-gray-300">{type}</span>
              <div className="flex items-center gap-2">
                <Progress
                  percent={(count / dataStats.keyCount) * 100}
                  strokeColor={getTypeColor(type)}
                  showInfo={false}
                  size="small"
                  className="flex-1"
                />
                <span className="text-gray-400 text-sm w-8">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const content = (
    <div className={cn('h-full bg-gray-900', className)}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <EyeOutlined className="text-blue-400 text-lg" />
            <Title level={4} className="text-white mb-0">
              Data Inspector
            </Title>
          </div>
          <Space>
            <Button
              type="text"
              size="small"
              icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-gray-400 hover:text-gray-300"
            />
            {onClose && (
              <Button
                type="text"
                size="small"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300"
              >
                Close
              </Button>
            )}
          </Space>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div>
            <Text className="text-gray-400">Node:</Text>
            <span className="text-white ml-1">{nodeId}</span>
          </div>
          <div>
            <Text className="text-gray-400">Type:</Text>
            <Tag color={getTypeColor(type)} className="ml-1">
              {type}
            </Tag>
          </div>
          <div>
            <Text className="text-gray-400">Size:</Text>
            <span className="text-white ml-1">{formatSize(dataStats.totalSize)}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <Search
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
            prefix={<SearchOutlined className="text-gray-400" />}
          />

          <Select value={filterType} onChange={setFilterType} className="w-32">
            <Option value="all">All Types</Option>
            <Option value="string">String</Option>
            <Option value="number">Number</Option>
            <Option value="boolean">Boolean</Option>
            <Option value="object">Object</Option>
            <Option value="array">Array</Option>
          </Select>

          <Select value={viewMode} onChange={setViewMode} className="w-24">
            <Option value="tree">Tree</Option>
            <Option value="json">JSON</Option>
            <Option value="table">Table</Option>
          </Select>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Text className="text-gray-400">Selected Path:</Text>
            <Text className="text-white font-mono text-sm">{selectedPath || 'root'}</Text>
          </div>

          <Space>
            <Tooltip title="Copy Data">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopyData}
                className="text-gray-400 hover:text-gray-300"
              />
            </Tooltip>
            <Tooltip title="Export Data">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleExportData}
                className="text-gray-400 hover:text-gray-300"
              />
            </Tooltip>
          </Space>
        </div>

        <Tabs
          activeKey={viewMode}
          onChange={(key) => setViewMode(key as 'tree' | 'json' | 'table')}
          items={[
            {
              key: 'tree',
              label: 'Tree View',
              children: (
                <div className="h-96 overflow-auto border border-gray-600 rounded bg-gray-800">
                  <Tree
                    showLine
                    defaultExpandAll={false}
                    expandedKeys={expandedKeys}
                    selectedKeys={selectedPath ? [selectedPath] : []}
                    onSelect={handleTreeSelect}
                    onExpand={handleExpand}
                    className="p-4"
                  >
                    {renderTreeNodes(filteredTree)}
                  </Tree>
                </div>
              ),
            },
            {
              key: 'json',
              label: 'JSON View',
              children: (
                <div className="h-96 overflow-auto">
                  <JsonViewer
                    data={selectedData}
                    theme="dark"
                    collapsed={2}
                    maxHeight="100%"
                    enableClipboard
                  />
                </div>
              ),
            },
            {
              key: 'table',
              label: 'Table View',
              children: <div className="h-96 overflow-auto">{renderDataTable()}</div>,
            },
          ]}
        />

        <Divider className="my-4" />

        {renderDataAnalysis()}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <Modal
        title="Data Inspector - Fullscreen"
        open={isFullscreen}
        onCancel={() => setIsFullscreen(false)}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        bodyStyle={{ height: '80vh', padding: 0 }}
      >
        {content}
      </Modal>
    );
  }

  return content;
};

// Helper functions

function convertToTree(data: any, path: string, _key: string): DataNode[] {
  if (data === null || data === undefined) {
    return [
      {
        key: path || 'root',
        title: 'null',
        value: data,
        type: 'null',
        size: 0,
        path: path || 'root',
        isLeaf: true,
      },
    ];
  }

  if (Array.isArray(data)) {
    return [
      {
        key: path || 'root',
        title: `Array (${data.length} items)`,
        value: data,
        type: 'array',
        size: JSON.stringify(data).length,
        path: path || 'root',
        children: data.flatMap((item, index) =>
          convertToTree(item, `${path}[${index}]`, `[${index}]`)
        ),
      },
    ];
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    return [
      {
        key: path || 'root',
        title: `Object (${entries.length} properties)`,
        value: data,
        type: 'object',
        size: JSON.stringify(data).length,
        path: path || 'root',
        children: entries.flatMap(([key, value]) =>
          convertToTree(value, path ? `${path}.${key}` : key, key)
        ),
      },
    ];
  }

  return [
    {
      key: path || 'root',
      title: String(data),
      value: data,
      type: typeof data,
      size: JSON.stringify(data).length,
      path: path || 'root',
      isLeaf: true,
    },
  ];
}

function filterTree(nodes: DataNode[], searchTerm: string, filterType: string): DataNode[] {
  if (!searchTerm && filterType === 'all') return nodes;

  return nodes
    .filter((node) => {
      const matchesSearch =
        !searchTerm ||
        node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.path.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || node.type === filterType;

      return matchesSearch && matchesType;
    })
    .map((node) => ({
      ...node,
      children: node.children ? filterTree(node.children, searchTerm, filterType) : undefined,
    }));
}

function getDataByPath(data: any, path: string): any {
  if (path === 'root' || !path) return data;

  try {
    return path.split('.').reduce((obj, key) => {
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.substring(0, key.indexOf('['));
        const index = parseInt(key.substring(key.indexOf('[') + 1, key.indexOf(']')));
        return obj[arrayKey][index];
      }
      return obj[key];
    }, data);
  } catch (error) {
    return undefined;
  }
}

function analyzeData(data: any): {
  totalSize: number;
  depth: number;
  keyCount: number;
  arrayCount: number;
  typeDistribution: Record<string, number>;
} {
  const stats = {
    totalSize: JSON.stringify(data).length,
    depth: 0,
    keyCount: 0,
    arrayCount: 0,
    typeDistribution: {} as Record<string, number>,
  };

  function analyze(obj: any, currentDepth: number = 0) {
    stats.depth = Math.max(stats.depth, currentDepth);

    if (Array.isArray(obj)) {
      stats.arrayCount++;
      stats.typeDistribution.array = (stats.typeDistribution.array || 0) + 1;
      obj.forEach((item) => analyze(item, currentDepth + 1));
    } else if (obj !== null && typeof obj === 'object') {
      stats.typeDistribution.object = (stats.typeDistribution.object || 0) + 1;
      Object.entries(obj).forEach(([_key, value]) => {
        stats.keyCount++;
        analyze(value, currentDepth + 1);
      });
    } else {
      const type = typeof obj;
      stats.typeDistribution[type] = (stats.typeDistribution[type] || 0) + 1;
    }
  }

  analyze(data);
  return stats;
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'string':
      return 'green';
    case 'number':
      return 'blue';
    case 'boolean':
      return 'orange';
    case 'object':
      return 'purple';
    case 'array':
      return 'cyan';
    case 'null':
      return 'gray';
    case 'undefined':
      return 'red';
    default:
      return 'default';
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getTableColumns(data: any[]): any[] {
  if (data.length === 0) return [];

  const sample = data[0];
  if (typeof sample !== 'object' || Array.isArray(sample)) {
    return [
      { title: 'Index', dataIndex: 'index', key: 'index' },
      { title: 'Value', dataIndex: '0', key: 'value' },
    ];
  }

  return Object.keys(sample).map((key) => ({
    title: key,
    dataIndex: key,
    key,
    render: (value: any) => {
      if (typeof value === 'object') {
        return <JsonViewer data={value} theme="dark" collapsed={1} maxHeight="100px" />;
      }
      return String(value);
    },
  }));
}

export default DataInspector;
