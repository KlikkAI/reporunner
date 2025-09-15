/**
 * Shared Node Label Component
 * Consistent labeling below nodes
 */

import React from 'react'

interface NodeLabelProps {
  displayName: string
  subtitle?: string
  maxWidth?: number
  showSubtitle?: boolean
}

const NodeLabel: React.FC<NodeLabelProps> = ({
  displayName,
  subtitle,
  maxWidth = 150,
  showSubtitle = true
}) => {
  return (
    <div className="mt-2 text-center">
      {/* Main Label */}
      <div 
        className="text-white text-sm font-medium truncate"
        style={{ maxWidth: `${maxWidth}px` }}
        title={displayName}
      >
        {displayName}
      </div>
      
      {/* Subtitle */}
      {showSubtitle && subtitle && (
        <div 
          className="text-xs text-gray-400 truncate mt-0.5"
          style={{ maxWidth: `${maxWidth}px` }}
          title={subtitle}
        >
          {subtitle}
        </div>
      )}
    </div>
  )
}

export default NodeLabel