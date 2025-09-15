/**
 * Database Node Body Component
 * Specialized UI for database operation nodes with connection status and query visualization
 */

import React, { useState } from 'react'
import { Handle, Position } from 'reactflow'
import { Card, Avatar, Badge, Tooltip, Progress, Tag } from 'antd'
import { 
  DatabaseOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  SyncOutlined,
  DisconnectOutlined 
} from '@ant-design/icons'
import type { CustomNodeBodyProps } from '../../../../app/node-extensions/types'
import { useNodeTheme } from '../../../../app/node-extensions/themes'
import { EnhancedNodeToolbar, createStatusBadge, createTextBadge } from '../../common'

const DatabaseNodeBody: React.FC<CustomNodeBodyProps> = ({
  nodeId,
  nodeData,
  selected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onDelete,
  onEdit,
  onOpenProperties,
  theme: propTheme,
}) => {
  const { theme: contextTheme } = useNodeTheme()
  const theme = propTheme || contextTheme
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected')

  // Extract database-specific configuration
  const operation = nodeData.parameters?.operation || 'select'
  const database = nodeData.parameters?.database || 'PostgreSQL'
  const table = nodeData.parameters?.table || 'users'
  const queryLimit = nodeData.parameters?.limit || 100
  const connectionString = nodeData.parameters?.connection

  // Database type styling
  const getDatabaseInfo = () => {
    const dbType = database.toLowerCase()
    if (dbType.includes('postgres')) {
      return { color: '#336791', icon: '🐘', name: 'PostgreSQL' }
    } else if (dbType.includes('mysql')) {
      return { color: '#4479A1', icon: '🐬', name: 'MySQL' }
    } else if (dbType.includes('mongo')) {
      return { color: '#47A248', icon: '🍃', name: 'MongoDB' }
    } else if (dbType.includes('redis')) {
      return { color: '#DC382D', icon: '📦', name: 'Redis' }
    } else if (dbType.includes('sqlite')) {
      return { color: '#003B57', icon: '💾', name: 'SQLite' }
    } else {
      return { color: '#4169E1', icon: '🗃️', name: 'Database' }
    }
  }

  const dbInfo = getDatabaseInfo()

  // Connection status styling
  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: <CheckCircleOutlined />, color: theme.colors.success, text: 'Connected' }
      case 'connecting':
        return { icon: <SyncOutlined spin />, color: theme.colors.info, text: 'Connecting' }
      case 'error':
        return { icon: <ExclamationCircleOutlined />, color: theme.colors.error, text: 'Error' }
      default:
        return { icon: <DisconnectOutlined />, color: theme.colors.textSecondary, text: 'Disconnected' }
    }
  }

  const statusInfo = getConnectionStatusInfo()

  // Operation type styling
  const getOperationColor = () => {
    switch (operation.toLowerCase()) {
      case 'select':
      case 'find':
      case 'get': return theme.colors.info
      case 'insert':
      case 'create': return theme.colors.success
      case 'update':
      case 'modify': return theme.colors.warning
      case 'delete':
      case 'remove': return theme.colors.error
      default: return theme.colors.primary
    }
  }

  // Toolbar handlers
  const handlePlay = (nodeId: string) => {
    setConnectionStatus('connecting')
    // Simulate connection process
    setTimeout(() => {
      setConnectionStatus(Math.random() > 0.2 ? 'connected' : 'error')
    }, 2000)
  }

  const handleStop = (nodeId: string) => {
    setConnectionStatus('disconnected')
  }

  const handleDelete = (nodeId: string) => {
    onDelete?.()
  }

  const handleMenuToggle = (nodeId: string) => {
    console.log('Database node menu:', nodeId)
  }

  // Generate badges
  const badges = [
    createStatusBadge(
      connectionStatus === 'connected' ? 'success' : 
      connectionStatus === 'error' ? 'error' : 'info',
      'top-right'
    ),
    createTextBadge(operation.toUpperCase(), 'top-left', '#ffffff', getOperationColor())
  ]

  if (queryLimit > 1000) {
    badges.push(createTextBadge('LARGE', 'bottom-right', '#ffffff', theme.colors.warning))
  }

  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Enhanced Node Toolbar */}
      <EnhancedNodeToolbar
        nodeId={nodeId}
        visible={isHovered && selected}
        onActionClick={(actionId, nodeId) => {
          switch (actionId) {
            case 'play': handlePlay(nodeId); break
            case 'stop': handleStop(nodeId); break
            case 'delete': handleDelete(nodeId); break
            default: handleMenuToggle(nodeId)
          }
        }}
        theme={theme}
      />

      {/* Badges */}
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="absolute z-10"
          style={{
            ...{
              'top-left': { top: '-6px', left: '-6px' },
              'top-right': { top: '-6px', right: '-6px' },
              'bottom-left': { bottom: '-6px', left: '-6px' },
              'bottom-right': { bottom: '-6px', right: '-6px' },
            }[badge.position],
          }}
        >
          <div
            style={{
              backgroundColor: badge.backgroundColor,
              color: badge.color,
              fontSize: theme.typography.fontSize.xs,
              fontWeight: theme.typography.fontWeight.medium,
              borderRadius: theme.borderRadius.sm,
              padding: '2px 6px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.shadows.sm,
            }}
          >
            {badge.icon && <span style={{ marginRight: badge.text ? '2px' : '0' }}>{badge.icon}</span>}
            {badge.text && <span>{badge.text}</span>}
          </div>
        </div>
      ))}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input_0"
        style={{
          background: theme.colors.border,
          width: 10,
          height: 10,
          top: '50%',
        }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output_0"
        style={{
          background: dbInfo.color,
          width: 10,
          height: 10,
          top: '50%',
        }}
      />

      <Card
        size="small"
        bordered
        style={{
          minWidth: 220,
          maxWidth: 350,
          borderColor: selected ? dbInfo.color : theme.colors.border,
          borderWidth: selected ? 2 : 1,
          backgroundColor: nodeData.disabled ? theme.colors.background : '#fff',
        }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <div className="flex items-start gap-3">
          {/* Database Avatar */}
          <Avatar
            size={36}
            style={{
              backgroundColor: dbInfo.color,
              fontSize: '20px',
              flexShrink: 0,
            }}
          >
            {dbInfo.icon}
          </Avatar>

          {/* Node Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-semibold text-sm truncate">
                {nodeData.name || 'Database'}
              </div>
              <DatabaseOutlined className="text-blue-500 text-xs" />
            </div>

            <div className="text-xs text-gray-500 mb-2">
              {dbInfo.name} • {operation}
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: statusInfo.color, fontSize: '12px' }}>
                {statusInfo.icon}
              </span>
              <span style={{ fontSize: '11px', color: statusInfo.color }}>
                {statusInfo.text}
              </span>
            </div>

            {/* Database Details */}
            <div className="space-y-1">
              {table && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Table:</span>
                  <Tag size="small" color="blue">{table}</Tag>
                </div>
              )}
              
              {queryLimit && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Limit:</span>
                  <Tag size="small" color={queryLimit > 1000 ? 'orange' : 'green'}>
                    {queryLimit.toLocaleString()}
                  </Tag>
                </div>
              )}
            </div>

            {/* Connection Progress (when connecting) */}
            {connectionStatus === 'connecting' && (
              <div className="mt-2">
                <Progress 
                  percent={60} 
                  size="small" 
                  status="active" 
                  showInfo={false}
                  strokeColor={theme.colors.info}
                />
              </div>
            )}
          </div>
        </div>

        {/* Execution Settings Indicators */}
        <div className="mt-3 flex gap-1 flex-wrap">
          {nodeData.retryOnFail && (
            <Badge
              count={`Retry ${nodeData.maxTries || 3}x`}
              style={{ backgroundColor: theme.colors.info, fontSize: '10px' }}
            />
          )}
          {nodeData.continueOnFail && (
            <Badge
              count="Continue on fail"
              style={{ backgroundColor: theme.colors.warning, fontSize: '10px' }}
            />
          )}
          {connectionString && (
            <Badge
              count="SSL"
              style={{ backgroundColor: theme.colors.success, fontSize: '10px' }}
            />
          )}
        </div>

        {/* Notes */}
        {nodeData.notes && (
          <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
            {nodeData.notes}
          </div>
        )}
      </Card>
    </div>
  )
}

export default DatabaseNodeBody