import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  MailOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Card, Tag, Tooltip } from 'antd';
import type React from 'react';
import { Handle, Position } from 'reactflow';
import type { CustomNodeBodyProps } from '../types';

/**
 * Gmail Node Body Component
 * Versatile UI component for Gmail nodes (both trigger and action modes)
 */
const GmailNodeBody: React.FC<CustomNodeBodyProps> = ({
  nodeId: _nodeId,
  nodeData,
  selected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onDelete: _onDelete,
  onEdit,
  onOpenProperties,
}) => {
  // Extract Gmail-specific configuration
  const filters = nodeData.parameters?.filters || {};
  const pollTimes = nodeData.parameters?.pollTimes || { mode: 'everyMinute' };
  const credential = nodeData.parameters?.credential;
  const nodeType = nodeData.type || 'gmail-trigger';

  // Mock connection status - in real implementation, this would come from credential store
  const isConnected = Boolean(credential);
  const lastSync = nodeData.lastSync || new Date().toISOString();
  const emailCount = nodeData.emailCount || 0;
  const unreadCount = nodeData.unreadCount || 0;

  // Get polling frequency display for trigger nodes
  const getPollFrequencyDisplay = (pollTimes: any) => {
    const mode = pollTimes.mode || 'everyMinute';
    switch (mode) {
      case 'everyMinute':
        return 'Every Minute';
      case 'everyFiveMinutes':
        return 'Every 5 Minutes';
      case 'everyTenMinutes':
        return 'Every 10 Minutes';
      case 'everyThirtyMinutes':
        return 'Every 30 Minutes';
      case 'everyHour':
        return 'Every Hour';
      default:
        return 'Custom';
    }
  };

  // Get filters display
  const getFiltersDisplay = (filters: any) => {
    const activeFilters = [];
    if (filters.from) {
      activeFilters.push(`From: ${filters.from}`);
    }
    if (filters.subject) {
      activeFilters.push(`Subject: ${filters.subject}`);
    }
    if (filters.label) {
      activeFilters.push(`Label: ${filters.label}`);
    }
    if (filters.unreadOnly) {
      activeFilters.push('Unread Only');
    }
    return activeFilters;
  };

  const activeFilters = getFiltersDisplay(filters);
  const isTrigger = nodeType.includes('trigger');

  return (
    <div
      className="relative bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 min-w-[280px] max-w-[320px]"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        borderColor: selected ? '#1890ff' : isHovered ? '#40a9ff' : '#d9d9d9',
        boxShadow:
          selected || isHovered
            ? '0 4px 12px rgba(24, 144, 255, 0.15)'
            : '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Input Handle for action nodes */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: '#1890ff',
            border: '2px solid white',
            width: '12px',
            height: '12px',
            left: '-6px',
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Avatar
            icon={<MailOutlined />}
            size={32}
            style={{
              backgroundColor: isConnected ? '#DD4B39' : '#666',
              color: 'white',
            }}
          />
          <div>
            <div className="font-medium text-gray-800">
              Gmail {isTrigger ? 'Trigger' : 'Action'}
            </div>
            <div className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Not Connected'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge status={isConnected ? 'success' : 'error'} dot />
          {(selected || isHovered) && (
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={onOpenProperties}
              className="text-gray-400 hover:text-blue-500"
            />
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3 space-y-2">
        {/* Connection Status */}
        {isConnected ? (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircleOutlined className="text-green-500" />
            <span className="text-gray-600">
              {isTrigger ? `Monitoring (${emailCount} emails)` : 'Ready to send'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <ExclamationCircleOutlined className="text-orange-500" />
            <span className="text-gray-600">Authentication required</span>
          </div>
        )}

        {/* Polling Info for triggers */}
        {isTrigger && isConnected && (
          <div className="flex items-center gap-2 text-sm">
            <ClockCircleOutlined className="text-blue-500" />
            <span className="text-gray-600">{getPollFrequencyDisplay(pollTimes)}</span>
          </div>
        )}

        {/* Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <FilterOutlined className="text-gray-400" />
              <span className="text-gray-600">Filters:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {activeFilters.slice(0, 2).map((filter, index) => (
                <Tag key={index} color="blue">
                  {filter}
                </Tag>
              ))}
              {activeFilters.length > 2 && (
                <Tooltip title={activeFilters.slice(2).join(', ')}>
                  <Tag>+{activeFilters.length - 2} more</Tag>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {/* Stats for triggers */}
        {isTrigger && isConnected && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{emailCount}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">{unreadCount}</div>
              <div className="text-xs text-gray-500">Unread</div>
            </div>
          </div>
        )}

        {/* Last sync info */}
        {isConnected && lastSync && (
          <div className="text-xs text-gray-400 pt-1">
            Last sync: {new Date(lastSync).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#1890ff',
          border: '2px solid white',
          width: '12px',
          height: '12px',
          right: '-6px',
        }}
      />

      {/* Enhanced Toolbar */}
      {(selected || isHovered) && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
          <Card
            size="small"
            className="shadow-lg border border-gray-200"
            bodyStyle={{ padding: '4px 8px' }}
          >
            <div className="flex items-center gap-1">
              <Tooltip title="Edit Properties">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={onEdit}
                  className="text-gray-600 hover:text-blue-500"
                />
              </Tooltip>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GmailNodeBody;
