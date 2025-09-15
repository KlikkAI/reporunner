import React, { useState, useCallback } from 'react'
import { useLeanWorkflowStore, nodeRegistry } from '@/core'
import { VirtualizedList } from '@/design-system'
import {
  UNIFIED_CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_DESCRIPTIONS,
} from '@/core/constants/categories'
interface AdvancedNodePanelProps {
  isCollapsed: boolean
  onToggle: () => void
}

// Helper function to get category metadata
const getCategoryMetadata = (category: string) => {
  const icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
  const info =
    CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS]
  return { icon, info }
}

const AdvancedNodePanel: React.FC<AdvancedNodePanelProps> = ({
  isCollapsed,
  onToggle,
}) => {
  const { addNode, addEdge, nodes, edges } = useLeanWorkflowStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Get all nodes from the registry (replacing hardcoded array)
  const allRegistryDescriptions = nodeRegistry.getAllNodeTypeDescriptions()
  
  const registryNodes = allRegistryDescriptions
    .map(description => ({
      id: `registry-${description.name || 'unknown'}`,
      displayName: description.displayName || description.name || 'Unknown Node',
      description: description.description || 'No description available',
      icon: description.icon || '⚡',
      category:
        description.categories?.[0] || UNIFIED_CATEGORIES.BUSINESS_PRODUCTIVITY,
      color: description.defaults?.color || '#6B7280',
      type: description.name || 'unknown',
      nodeTypeData: {
        name: description.name || 'unknown',
        displayName: description.displayName || description.name || 'Unknown Node',
      },
      isCore: true, // All registry nodes are core nodes
    }))
    .filter(node => node.type !== 'unknown') // Filter out malformed nodes
    
  // Only log in development mode and only if there are issues
  if (import.meta.env.DEV && registryNodes.length === 0) {
    console.warn('⚠️ AdvancedNodePanel - No registry nodes found')
  }

  // Pure Registry System - use only registry nodes, no integration duplicates
  const allAvailableNodes = [...registryNodes]

  // Use unified categories
  const categories = ['all', ...Object.values(UNIFIED_CATEGORIES).sort()]

  // Filter and sort nodes in ascending order
  const filteredNodes = allAvailableNodes
    .filter(node => {
      const matchesSearch =
        (node.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (node.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      const matchesCategory =
        selectedCategory === 'all' || node.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''))

  const onDragStart = useCallback(
    (event: React.DragEvent, node: (typeof allAvailableNodes)[0]) => {
      try {
        const dragData = {
          type: node.type,
          nodeTypeData: node.nodeTypeData,
        }

        event.dataTransfer.setData(
          'application/reactflow',
          JSON.stringify(dragData)
        )
        event.dataTransfer.effectAllowed = 'move'
      } catch (error) {
        console.error('Error in onDragStart:', error)
      }
    },
    []
  )

  // Helper function to find the rightmost node (last in sequence)
  const findLastNode = useCallback(() => {
    if (nodes.length === 0) return null

    // Find node with no outgoing connections (target but no source edges)
    const nodesWithOutgoing = new Set(edges.map(edge => edge.source))
    const candidateNodes = nodes.filter(node => !nodesWithOutgoing.has(node.id))

    if (candidateNodes.length === 0) {
      // If all nodes have outgoing connections, use the rightmost positioned node
      return nodes.reduce((rightmost, current) =>
        current.position.x > rightmost.position.x ? current : rightmost
      )
    }

    // Among candidates with no outgoing connections, pick the rightmost
    return candidateNodes.reduce((rightmost, current) =>
      current.position.x > rightmost.position.x ? current : rightmost
    )
  }, [nodes, edges])

  const handleAddNode = useCallback(
    (node: (typeof allAvailableNodes)[0]) => {
      // Generate a unique ID for the workflow node (simplified for registry nodes)
      const baseId = node.nodeTypeData.name

      // Find last node for auto-connection
      const lastNode = findLastNode()

      // Position new node to the right of the last node, or at origin if no nodes exist
      const newPosition = lastNode
        ? { x: lastNode.position.x + 300, y: lastNode.position.y }
        : { x: 100, y: 100 }

      const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${baseId}`

      // Get the node type description from registry
      const enhancedNodeType = nodeRegistry.getNodeTypeDescription(node.type)

      const newNode = {
        id: newNodeId,
        type: node.type,
        position: newPosition,
        parameters: {},
        data: {
          label: node.displayName,
          nodeType: node.nodeTypeData.name,
          configuration: {},
          credentials: [],
          // Include icon and enhancedNodeType for property panel
          icon: enhancedNodeType?.icon || node.icon,
          enhancedNodeType: enhancedNodeType,
          // Node type data for registry system
          nodeTypeData: node.nodeTypeData,
          config: {},
          parameters: {},
        },
      }

      addNode(newNode)

      // Auto-connect to the last node if it exists
      if (lastNode) {
        const newEdge = {
          id: `edge-${lastNode.id}-${newNodeId}`,
          source: lastNode.id,
          target: newNodeId,
          type: 'default',
        }
        addEdge(newEdge)
      }
    },
    [addNode, addEdge, findLastNode]
  )

  // Render function for node items in virtualized list
  const renderNodeItem = useCallback(
    (node: (typeof allAvailableNodes)[0], _index: number) => (
      <div
        key={node.id}
        draggable
        onDragStart={e => {
          e.stopPropagation()
          onDragStart(e, node)
        }}
        onDragEnd={e => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={e => {
          e.stopPropagation()
          handleAddNode(node)
        }}
        className="group p-2.5 border border-gray-200 rounded-md cursor-move hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-150 mb-1.5"
      >
        <div className="flex items-start space-x-2.5">
          <div
            className="w-7 h-7 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-medium shadow-sm"
            style={{ backgroundColor: node.color }}
          >
            {node.icon || node.displayName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {node.displayName}
              </p>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5 leading-tight">
              {node.description}
            </p>
            <div className="mt-1.5">
              <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">
                {getCategoryMetadata(node.category || '')?.icon || ''}{' '}
                {node.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    [onDragStart, handleAddNode]
  )

  return (
    <div
      className={`${isCollapsed ? 'w-16' : 'w-80'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Expand node panel' : 'Collapse node panel'}
        >
          <span className="text-lg">{isCollapsed ? '→' : '←'}</span>
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="px-4 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Nodes</h2>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                {allAvailableNodes.length}
              </span>
            </div>
            <p className="text-sm text-gray-600">Drag to add to workflow</p>
          </div>
        </>
      )}

      {/* Search and Filter */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 space-y-3">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            aria-label="Select category"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {categories.map(category => {
              const metadata =
                category !== 'all' ? getCategoryMetadata(category) : null
              return (
                <option key={category} value={category}>
                  {category === 'all'
                    ? 'All Categories'
                    : `${metadata?.icon || ''} ${category}`}
                </option>
              )
            })}
          </select>
        </div>
      )}

      {/* Node List */}
      {!isCollapsed && (
        <div className="overflow-hidden flex flex-col">
          {filteredNodes.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">🔍</div>
                <p className="text-gray-500 text-sm">No nodes found</p>
                <p className="text-gray-400 text-xs mt-1">
                  Try adjusting your search or filter
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4">
              <VirtualizedList
                items={filteredNodes}
                renderItem={renderNodeItem}
                height={700}
                estimateSize={85} // Estimated height per node item
                getItemKey={node => node.id}
                gap={0}
                className="node-list"
                emptyState={
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      {searchTerm
                        ? 'No nodes match your search'
                        : 'No nodes available in this category'}
                    </p>
                  </div>
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdvancedNodePanel
