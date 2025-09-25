import { useMemo } from './hooks/useMemo';
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  BranchesOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  NumberOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { Space, Tag, Tree, Typography } from 'antd';
import type React from 'react';
import { useMemo } from 'react';

const { Text } = Typography;

interface SchemaNode {
  key: string;
  title: React.ReactNode;
  children?: SchemaNode[];
  isLeaf?: boolean;
  type: string;
  nullable: boolean;
  path: string;
}

interface SchemaViewProps {
  data: any;
  onFieldClick?: (fieldPath: string) => void;
  compact?: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'string':
      return <FileTextOutlined className="text-green-400" />;
    case 'number':
      return <NumberOutlined className="text-blue-400" />;
    case 'boolean':
      return <CheckSquareOutlined className="text-purple-400" />;
    case 'date':
      return <CalendarOutlined className="text-orange-400" />;
    case 'array':
      return <TableOutlined className="text-red-400" />;
    case 'object':
      return <BranchesOutlined className="text-yellow-400" />;
    case 'null':
      return <DatabaseOutlined className="text-gray-400" />;
    default:
      return <FileTextOutlined className="text-gray-400" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'string':
      return 'green';
    case 'number':
      return 'blue';
    case 'boolean':
      return 'purple';
    case 'date':
      return 'orange';
    case 'array':
      return 'red';
    case 'object':
      return 'yellow';
    case 'null':
      return 'gray';
    default:
      return 'default';
  }
};

const inferType = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') {
    // Check if it's a date string
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return 'date';
    }
    // Check if it's an email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'email';
    }
    // Check if it's a URL
    if (/^https?:\/\//.test(value)) {
      return 'url';
    }
    return 'string';
  }
  return typeof value;
};

const getValuePreview = (value: any, type: string): string => {
  if (value === null || value === undefined) return '';

  switch (type) {
    case 'string':
      return value.length > 50 ? `"${value.substring(0, 47)}..."` : `"${value}"`;
    case 'array':
      return `[${value.length} items]`;
    case 'object':
      return `{${Object.keys(value).length} fields}`;
    case 'date':
      return new Date(value).toLocaleDateString();
    default:
      return String(value);
  }
};

const buildSchemaTree = (
  obj: any,
  path: string = '',
  onFieldClick?: (fieldPath: string) => void
): SchemaNode[] => {
  if (!obj || typeof obj !== 'object') return [];

  return Object.entries(obj).map(([key, value]) => {
    const currentPath = path ? `${path}.${key}` : key;
    const type = inferType(value);
    const nullable = value === null || value === undefined;
    const preview = getValuePreview(value, type);

    const nodeTitle = (
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-gray-700 px-2 py-1 rounded"
        onClick={() => onFieldClick?.(currentPath)}
      >
        <Space size="small">
          {getTypeIcon(type)}
          <Text className="text-white font-medium">{key}</Text>
          <Tag color={getTypeColor(type)}>{type}</Tag>
          {nullable && <Tag color="red">nullable</Tag>}
        </Space>
        {preview && <Text className="text-gray-400 text-xs ml-2 max-w-xs truncate">{preview}</Text>}
      </div>
    );

    const node: SchemaNode = {
      key: currentPath,
      title: nodeTitle,
      type,
      nullable,
      path: currentPath,
      isLeaf: type !== 'object' && type !== 'array',
    };

    // Add children for objects and arrays
    if (type === 'object' && value && Object.keys(value).length > 0) {
      node.children = buildSchemaTree(value, currentPath, onFieldClick);
    } else if (type === 'array' && Array.isArray(value) && value.length > 0) {
      // For arrays, show the schema of the first item
      const firstItem = value[0];
      if (firstItem && typeof firstItem === 'object') {
        node.children = buildSchemaTree(firstItem, `${currentPath}[0]`, onFieldClick);
      }
    }

    return node;
  });
};

const SchemaView: React.FC<SchemaViewProps> = ({ data, onFieldClick, compact = false }) => {
  const schemaTree = useMemo(() => {
    return buildSchemaTree(data, '', onFieldClick);
  }, [data, onFieldClick]);

  const schemaStats = useMemo(() => {
    const countTypes = (nodes: SchemaNode[]): Record<string, number> => {
      const counts: Record<string, number> = {};

      const traverse = (nodeList: SchemaNode[]) => {
        nodeList.forEach((node) => {
          counts[node.type] = (counts[node.type] || 0) + 1;
          if (node.children) {
            traverse(node.children);
          }
        });
      };

      traverse(nodes);
      return counts;
    };

    return countTypes(schemaTree);
  }, [schemaTree]);

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-400">
        <DatabaseOutlined className="text-4xl mb-2" />
        <div>No data to analyze</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded border border-gray-700 overflow-hidden h-full flex flex-col">
      {/* Schema Statistics Header */}
      {(compact || !compact) && (
        <div
          className={`${compact ? 'p-2' : 'p-3'} border-b border-gray-700 bg-gray-800 flex-shrink-0`}
        >
          <Text
            className={`text-gray-300 ${compact ? 'text-xs' : 'text-sm'} font-medium mb-2 block`}
          >
            Type Distribution
          </Text>
          <div className="flex flex-wrap gap-1">
            {Object.entries(schemaStats).map(([type, count]) => (
              <div key={type} className="flex items-center gap-1">
                {compact ? null : getTypeIcon(type)}
                <Tag
                  color={getTypeColor(type)}
                  // size={compact ? 'small' : 'default'}
                >
                  {type} ({count})
                </Tag>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schema Tree */}
      <div className={`${compact ? 'p-2' : 'p-4'} flex-1 overflow-hidden bg-gray-900`}>
        <Tree
          treeData={schemaTree}
          defaultExpandAll={!compact}
          showLine
          showIcon={false}
          className="bg-gray-900"
        />
      </div>
    </div>
  );
};

export default SchemaView;
