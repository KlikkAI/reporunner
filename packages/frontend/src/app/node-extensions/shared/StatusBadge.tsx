/**
 * Shared Status Badge Component
 * Consistent status indicators for all nodes
 */

import React from 'react'

interface StatusBadgeProps {
  type: 'disabled' | 'retry' | 'continue' | 'count' | 'warning' | 'info'
  content?: string | number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  color?: 'red' | 'yellow' | 'blue' | 'green' | 'purple'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  content,
  position = 'top-right',
  color
}) => {
  // Auto-determine color based on type if not specified
  const getColor = () => {
    if (color) return color
    switch (type) {
      case 'disabled': return 'red'
      case 'retry': return 'blue' 
      case 'continue': return 'yellow'
      case 'warning': return 'yellow'
      case 'count': return 'red'
      case 'info': return 'blue'
      default: return 'red'
    }
  }

  // Auto-determine content based on type if not specified
  const getContent = () => {
    if (content !== undefined) return content
    switch (type) {
      case 'disabled': return '!'
      case 'retry': return 'R'
      case 'continue': return 'C'
      case 'warning': return '⚠'
      case 'info': return 'i'
      default: return '?'
    }
  }

  // Position classes
  const positionClasses = {
    'top-right': '-top-2 -right-2',
    'top-left': '-top-2 -left-2',
    'bottom-right': '-bottom-2 -right-2',
    'bottom-left': '-bottom-2 -left-2'
  }

  // Color classes
  const colorClasses = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  }

  const selectedColor = getColor()
  const displayContent = getContent()

  return (
    <div className={`
      absolute ${positionClasses[position]} 
      w-4 h-4 ${colorClasses[selectedColor]} rounded-full 
      flex items-center justify-center
      border border-gray-800
    `}>
      <span className="text-white text-xs font-medium">
        {displayContent}
      </span>
    </div>
  )
}

export default StatusBadge