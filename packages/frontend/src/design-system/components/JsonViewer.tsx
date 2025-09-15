import React, { useState } from 'react'

export interface JsonViewerProps {
  data: any
  title?: string
  maxHeight?: string
  collapsible?: boolean
  showCopyButton?: boolean
}

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title = 'JSON Data',
  maxHeight = '300px',
  collapsible = true,
  showCopyButton = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const copyToClipboard = async (text: string, path?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPath(path || 'root')
      setTimeout(() => setCopiedPath(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copyFullJson = () => {
    copyToClipboard(JSON.stringify(data, null, 2), 'full')
  }

  if (!data) {
    return (
      <div className="bg-gray-800 p-3 rounded border border-gray-600">
        <div className="text-gray-400 text-sm">No data to display</div>
      </div>
    )
  }

  return (
    <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-blue-800/20 border-b border-blue-600/30">
        <div className="flex items-center space-x-2">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span
                className={`transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
              >
                ▶
              </span>
            </button>
          )}
          <span className="text-sm font-medium text-blue-200">🔍 {title}</span>
          <span className="text-xs px-2 py-1 bg-blue-800 text-blue-100 rounded">
            {getDataTypeInfo(data)}
          </span>
        </div>

        {showCopyButton && (
          <div className="flex items-center space-x-2">
            {copiedPath && (
              <span className="text-xs text-green-400">
                ✓ Copied {copiedPath === 'full' ? 'JSON' : copiedPath}
              </span>
            )}
            <button
              onClick={copyFullJson}
              className="text-xs px-2 py-1 bg-blue-700 hover:bg-blue-600 text-blue-100 rounded transition-colors"
              title="Copy full JSON"
            >
              📋 Copy
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3">
          <div
            className="bg-gray-900 rounded border border-gray-600 overflow-auto"
            style={{ maxHeight }}
          >
            <JsonNode
              data={data}
              path="root"
              level={0}
              onCopy={copyToClipboard}
              copiedPath={copiedPath}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Recursive component to render JSON nodes
const JsonNode: React.FC<{
  data: any
  path: string
  level: number
  onCopy: (text: string, path: string) => void
  copiedPath: string | null
}> = ({ data, path, level, onCopy, copiedPath }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels

  const indent = level * 16

  // Handle null/undefined
  if (data === null || data === undefined) {
    return (
      <div style={{ paddingLeft: indent }} className="py-1">
        <span className="text-gray-500 italic">
          {data === null ? 'null' : 'undefined'}
        </span>
      </div>
    )
  }

  // Handle primitives (string, number, boolean)
  if (typeof data === 'string') {
    return (
      <div style={{ paddingLeft: indent }} className="py-1 group">
        <span className="text-green-400">"{data}"</span>
        <button
          onClick={() => onCopy(data, path)}
          className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-blue-400 hover:text-blue-300"
          title="Copy value"
        >
          {copiedPath === path ? '✓' : '📋'}
        </button>
      </div>
    )
  }

  if (typeof data === 'number') {
    return (
      <div style={{ paddingLeft: indent }} className="py-1 group">
        <span className="text-yellow-400">{data}</span>
        <button
          onClick={() => onCopy(data.toString(), path)}
          className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-blue-400 hover:text-blue-300"
        >
          {copiedPath === path ? '✓' : '📋'}
        </button>
      </div>
    )
  }

  if (typeof data === 'boolean') {
    return (
      <div style={{ paddingLeft: indent }} className="py-1 group">
        <span className="text-purple-400">{data.toString()}</span>
        <button
          onClick={() => onCopy(data.toString(), path)}
          className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-blue-400 hover:text-blue-300"
        >
          {copiedPath === path ? '✓' : '📋'}
        </button>
      </div>
    )
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return (
      <div style={{ paddingLeft: indent }} className="py-1">
        <div className="flex items-center space-x-2 group">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <span
              className={`transform transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
            >
              ▶
            </span>
          </button>
          <span className="text-gray-300">[{data.length} items]</span>
          <button
            onClick={() => onCopy(JSON.stringify(data, null, 2), path)}
            className="opacity-0 group-hover:opacity-100 text-xs text-blue-400 hover:text-blue-300"
            title="Copy array"
          >
            {copiedPath === path ? '✓' : '📋'}
          </button>
        </div>

        {isExpanded && (
          <div className="ml-4 border-l border-gray-600 pl-2 mt-1">
            {data.map((item, index) => (
              <div key={index} className="relative">
                <div className="text-xs text-gray-500 mb-1">[{index}]:</div>
                <JsonNode
                  data={item}
                  path={`${path}[${index}]`}
                  level={level + 1}
                  onCopy={onCopy}
                  copiedPath={copiedPath}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Handle objects
  if (typeof data === 'object') {
    const keys = Object.keys(data)

    return (
      <div style={{ paddingLeft: indent }} className="py-1">
        <div className="flex items-center space-x-2 group">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <span
              className={`transform transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
            >
              ▶
            </span>
          </button>
          <span className="text-gray-300">
            {`{${keys.length} ${keys.length === 1 ? 'key' : 'keys'}}`}
          </span>
          <button
            onClick={() => onCopy(JSON.stringify(data, null, 2), path)}
            className="opacity-0 group-hover:opacity-100 text-xs text-blue-400 hover:text-blue-300"
            title="Copy object"
          >
            {copiedPath === path ? '✓' : '📋'}
          </button>
        </div>

        {isExpanded && (
          <div className="ml-4 border-l border-gray-600 pl-2 mt-1">
            {keys.map(key => (
              <div key={key} className="relative mb-2">
                <div className="flex items-center space-x-2 group">
                  <span className="text-cyan-400 font-mono text-sm">
                    "{key}":
                  </span>
                  <button
                    onClick={() => onCopy(key, `${path}.${key}`)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-gray-300"
                    title="Copy key"
                  >
                    📋
                  </button>
                </div>
                <JsonNode
                  data={data[key]}
                  path={`${path}.${key}`}
                  level={level + 1}
                  onCopy={onCopy}
                  copiedPath={copiedPath}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Fallback for other types
  return (
    <div style={{ paddingLeft: indent }} className="py-1">
      <span className="text-gray-400">{String(data)}</span>
    </div>
  )
}

// Helper function to get data type info
const getDataTypeInfo = (data: any): string => {
  if (data === null) return 'null'
  if (data === undefined) return 'undefined'
  if (Array.isArray(data)) return `array[${data.length}]`
  if (typeof data === 'object') return `object{${Object.keys(data).length}}`
  return typeof data
}

export default JsonViewer
