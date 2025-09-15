/**
 * Database Node Body Component
 * Gmail-style UI for database operation nodes
 */

import React from 'react'
import { Handle, Position } from 'reactflow'
import type { CustomNodeBodyProps } from '../nodeUiRegistry'
import { NodeIcon, HoverActions, StatusBadge, NodeLabel } from '../shared'

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
}) => {

  const displayName = nodeData.name || nodeData.label || 'Database'
  const operation = nodeData.parameters?.operation || 'select'
  const database = nodeData.parameters?.database || 'PostgreSQL'
  const table = nodeData.parameters?.table || 'users'
  
  // Database type icon
  const getDatabaseIcon = () => {
    const dbType = database.toLowerCase()
    if (dbType.includes('postgres')) {
      return '🐘'
    } else if (dbType.includes('mysql')) {
      return '🐬'
    } else if (dbType.includes('mongo')) {
      return '🍃'
    } else if (dbType.includes('redis')) {
      return '📦'
    } else if (dbType.includes('sqlite')) {
      return '💾'
    } else {
      return '🗃️'
    }
  }

  const icon = getDatabaseIcon()
  const subtitle = `${database} • ${operation}`

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onOpenProperties?.()
  }

  return (
    <div className="flex flex-col">
      <div className="relative">
        <div className="flex items-center">
          <div
            className={`
              relative flex items-center justify-center bg-gray-800 p-4 shadow-lg transition-all duration-200
              rounded-md min-w-[80px] max-w-[150px] min-h-[60px]
              ${selected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-blue-400' : ''}
              ${isHovered ? 'hover:shadow-xl hover:scale-105 ring-2 ring-offset-2 ring-offset-gray-900 ring-blue-400' : ''}
            `}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onDoubleClick={handleDoubleClick}
          >
            {/* Input Handle */}
            <Handle
              type="target"
              position={Position.Left}
              id="input_0"
              style={{
                background: '#555',
                width: 10,
                height: 10,
                left: -5,
              }}
            />

            {/* Output Handle */}
            <Handle
              type="source"
              position={Position.Right}
              id="output_0"
              style={{
                background: '#555',
                width: 10,
                height: 10,
                right: -5,
              }}
            />

            {/* Database Icon */}
            <NodeIcon 
              icon={icon}
              displayName={displayName}
              size="md"
            />

            {/* Hover Actions */}
            <HoverActions
              isVisible={isHovered}
              onEdit={onEdit}
              onDelete={onDelete}
            />

            {/* Status Badges */}
            {nodeData.disabled && (
              <StatusBadge type="disabled" position="top-right" />
            )}
            {operation && (
              <StatusBadge type="info" content={operation.charAt(0).toUpperCase()} position="top-left" color="blue" />
            )}
          </div>
        </div>
      </div>

      {/* Node Label */}
      <NodeLabel 
        displayName={displayName}
        subtitle={subtitle}
        maxWidth={150}
      />
    </div>
  )
}

export default DatabaseNodeBody