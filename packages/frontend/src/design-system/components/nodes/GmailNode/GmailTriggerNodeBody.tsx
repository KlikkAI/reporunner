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
import type { CustomNodeBodyProps } from '../../../../app/node-extensions/types';
import { gmailTheme } from '../../../themes/gmailTheme';
import EnhancedNodeToolbar from '../../common/EnhancedNodeToolbar';

/**
 * Gmail Trigger Node Body Component
 * Specialized UI for Gmail trigger nodes with connection status, polling indicators, and email statistics
 */
const GmailTriggerNodeBody: React.FC<CustomNodeBodyProps> = ({
  nodeId,
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
  const options = nodeData.parameters?.options || {};
  const simplify = nodeData.parameters?.simplify !== false;
  const credential = nodeData.parameters?.credential;

  // Mock connection status - in real implementation, this would come from credential store
  const isConnected = Boolean(credential);
  const lastSync = nodeData.lastSync || new Date().toISOString();
  const emailCount = nodeData.emailCount || 0;
  const unreadCount = nodeData.unreadCount || 0;

  // Get polling frequency display
  const getPollFrequencyDisplay = (pollTimes: any) => {
    const mode = pollTimes.mode || 'everyMinute';
    switch (mode) {
      case 'everyMinute':
        return 'Every Minute';
      case 'everyHour':
        return `Every Hour (${pollTimes.minute || 0}m)`;
      case 'everyDay':
        return `Daily ${pollTimes.hour || 9}:${String(pollTimes.minute || 0).padStart(2, '0')}`;
      case 'everyWeek':
        return `Weekly ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][pollTimes.weekday || 1]}`;
      case 'everyMonth':
        return `Monthly (Day ${pollTimes.dayOfMonth || 1})`;
      case 'customInterval':
        return `Every ${pollTimes.intervalMinutes || 5}m`;
      case 'customCron':
        return 'Custom Cron';
      default:
        return 'Every Minute';
    }
  };

  // Get active filters count
  const getActiveFiltersCount = (filters: any) => {
    let count = 0;
    if (filters.search) count++;
    if (filters.senderFilter) count++;
    if (filters.subjectFilter) count++;
    if (filters.labelNamesOrIds?.length > 0) count++;
    if (filters.readStatus && filters.readStatus !== 'all') count++;
    if (filters.hasAttachment && filters.hasAttachment !== 'any') count++;
    if (filters.dateRange?.enabled) count++;
    return count;
  };

  const activeFilters = getActiveFiltersCount(filters);
  const pollFrequency = getPollFrequencyDisplay(pollTimes);

  // Enhanced toolbar actions for Gmail
  const toolbarActions = [
    {
      id: 'test-connection',
      icon: 'SyncOutlined',
      label: 'Test Connection',
      action: 'testConnection',
    },
    {
      id: 'view-emails',
      icon: 'EyeOutlined',
      label: 'Preview Emails',
      action: 'previewEmails',
    },
    {
      id: 'configure-filters',
      icon: 'FilterOutlined',
      label: 'Configure Filters',
      action: 'configureFilters',
    },
  ];

  const handleToolbarAction = (action: string) => {
    console.log('Gmail toolbar action:', action);
    switch (action) {
      case 'testConnection':
        // TODO: Implement connection test
        break;
      case 'previewEmails':
        // TODO: Implement email preview
        break;
      case 'configureFilters':
        onOpenProperties?.();
        break;
    }
  };

  // Event handlers with debug logging
  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('🎯 Gmail Card double-click handler called');
    onOpenProperties?.();
  };

  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('📝 Gmail edit button clicked');
    onEdit?.();
  };

  const handleSettingsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('⚙️ Gmail settings button clicked');
    onOpenProperties?.();
  };

  return (
    <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {/* Enhanced Node Toolbar */}
      <EnhancedNodeToolbar
        visible={isHovered && selected}
        nodeId={nodeId}
        actions={toolbarActions}
        onActionClick={(actionId) => handleToolbarAction(actionId)}
        theme={gmailTheme}
      />

      {/* Gmail Trigger Input Handle (Hidden - triggers don't have inputs) */}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output_0"
        style={{
          background: '#ea4335',
          width: 12,
          height: 12,
          top: '50%',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      />

      <Card
        size="small"
        variant="outlined"
        onDoubleClick={handleDoubleClick}
        className={`
          gmail-trigger-node
          ${selected ? 'node-selected' : ''}
          ${isConnected ? 'node-connected' : 'node-disconnected'}
          transition-all duration-200 hover:shadow-md cursor-pointer
        `}
        style={{
          minWidth: 280,
          maxWidth: 320,
          borderColor: selected ? '#ea4335' : isConnected ? '#34a853' : '#fbbc04',
          borderWidth: selected ? 2 : 1,
          backgroundColor: nodeData.disabled ? '#f8f9fa' : '#fff',
          boxShadow: selected ? '0 4px 12px rgba(234, 67, 53, 0.15)' : undefined,
        }}
        styles={{ body: { padding: '16px' } }}
      >
        {/* Header Section */}
        <div className="flex items-start gap-3 mb-3">
          {/* Gmail Logo Avatar */}
          <Avatar
            size={36}
            style={{
              backgroundColor: '#ea4335',
              flexShrink: 0,
            }}
          >
            <MailOutlined style={{ fontSize: '20px', color: '#fff' }} />
          </Avatar>

          {/* Node Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-semibold text-sm truncate flex-1">
                {nodeData.name || 'Gmail Trigger'}
              </div>
              {isConnected ? (
                <CheckCircleOutlined className="text-green-500 text-xs" />
              ) : (
                <ExclamationCircleOutlined className="text-yellow-500 text-xs" />
              )}

              {/* Standard Edit/Settings Buttons */}
              <div className="flex gap-1 ml-2">
                <Tooltip title="Edit">
                  <Button
                    size="small"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={handleEditClick}
                    className="text-gray-500 hover:text-gray-700"
                  />
                </Tooltip>
                <Tooltip title="Settings">
                  <Button
                    size="small"
                    type="text"
                    icon={<SettingOutlined />}
                    onClick={handleSettingsClick}
                    className="text-gray-500 hover:text-gray-700"
                  />
                </Tooltip>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-2">
              {isConnected ? 'Connected to Gmail' : 'Not connected'}
            </div>

            {/* Connection Status */}
            <div className="flex gap-1 mb-2">
              <Tag color={isConnected ? 'green' : 'orange'} style={{ margin: 0, fontSize: '10px' }}>
                {isConnected ? 'Connected' : 'Setup Required'}
              </Tag>
              {isConnected && (
                <Tag color="blue" style={{ margin: 0, fontSize: '10px' }}>
                  <ClockCircleOutlined style={{ marginRight: '2px' }} />
                  {pollFrequency}
                </Tag>
              )}
            </div>
          </div>
        </div>

        {/* Email Statistics */}
        {isConnected && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold text-blue-600">{emailCount}</div>
                <div className="text-xs text-gray-500">Recent</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">{unreadCount}</div>
                <div className="text-xs text-gray-500">Unread</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">{activeFilters}</div>
                <div className="text-xs text-gray-500">Filters</div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Summary */}
        <div className="space-y-2">
          {/* Filters Summary */}
          {activeFilters > 0 && (
            <div className="flex items-center gap-2">
              <FilterOutlined className="text-blue-500 text-xs" />
              <span className="text-xs text-gray-600">
                {activeFilters} filter{activeFilters !== 1 ? 's' : ''} active
              </span>
            </div>
          )}

          {/* Output Format */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Output:</span>
            <Badge
              count={simplify ? 'Simplified' : 'Full'}
              style={{
                backgroundColor: simplify ? '#52c41a' : '#1890ff',
                fontSize: '9px',
                height: '16px',
                lineHeight: '14px',
              }}
            />
          </div>

          {/* Advanced Options */}
          {options.downloadAttachments && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Attachments:</span>
              <Badge
                count="Download"
                style={{
                  backgroundColor: '#fa8c16',
                  fontSize: '9px',
                  height: '16px',
                  lineHeight: '14px',
                }}
              />
            </div>
          )}

          {options.markAsRead && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Auto-mark:</span>
              <Badge
                count="Read"
                style={{
                  backgroundColor: '#13c2c2',
                  fontSize: '9px',
                  height: '16px',
                  lineHeight: '14px',
                }}
              />
            </div>
          )}
        </div>

        {/* Last Sync Info */}
        {isConnected && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last sync:</span>
              <span>{new Date(lastSync).toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        {/* Polling Status Indicator */}
        {isConnected && (
          <div className="absolute top-2 right-2">
            <Tooltip title="Polling active">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </Tooltip>
          </div>
        )}

        {/* Notes */}
        {nodeData.notes && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs border border-blue-100">
            {nodeData.notes}
          </div>
        )}
      </Card>
    </div>
  );
};

export default GmailTriggerNodeBody;
