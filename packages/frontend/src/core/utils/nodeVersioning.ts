/**
 * Versioned Node Architecture with Migration Support
 * Based on n8n's versioning system for backward compatibility
 */

import type { INodeType, INodeTypeDescription, IVersionedNodeType, WorkflowNodeInstance } from '../nodes/types'

// Define INodeParameters locally to avoid circular imports
interface INodeParameters {
  [key: string]: any
}

// Version Migration Interface
export interface INodeVersionMigration {
  fromVersion: number
  toVersion: number
  migrate(parameters: INodeParameters): INodeParameters
  description: string
  isBreaking?: boolean
}

// Node Version Information
export interface INodeVersionInfo {
  version: number
  releaseDate: string
  description: string
  changes: Array<{
    type: 'feature' | 'fix' | 'breaking' | 'deprecation'
    description: string
  }>
  deprecatedProperties?: string[]
  newProperties?: string[]
}

// Base Versioned Node Type Implementation
abstract class BaseVersionedNodeType implements IVersionedNodeType {
  public readonly nodeVersions: { [version: number]: INodeType }
  protected readonly versionHistory: INodeVersionInfo[]
  protected readonly migrations: INodeVersionMigration[]
  
  constructor(
    nodeVersions: { [version: number]: INodeType },
    versionHistory: INodeVersionInfo[] = [],
    migrations: INodeVersionMigration[] = []
  ) {
    this.nodeVersions = nodeVersions
    this.versionHistory = versionHistory
    this.migrations = migrations
  }
  
  getNodeType(version: number): INodeType {
    const nodeType = this.nodeVersions[version]
    if (!nodeType) {
      const availableVersions = this.getSupportedVersions()
      const latestVersion = Math.max(...availableVersions)
      console.warn(`Version ${version} not found, falling back to latest version ${latestVersion}`)
      return this.nodeVersions[latestVersion]
    }
    return nodeType
  }
  
  getCurrentVersion(): number {
    const versions = this.getSupportedVersions()
    return Math.max(...versions)
  }
  
  getSupportedVersions(): number[] {
    return Object.keys(this.nodeVersions).map(Number).sort()
  }
  
  getVersionInfo(version: number): INodeVersionInfo | undefined {
    return this.versionHistory.find(info => info.version === version)
  }
  
  getAllVersionInfo(): INodeVersionInfo[] {
    return this.versionHistory.slice()
  }
  
  // Migrate parameters from one version to another
  migrateParameters(parameters: INodeParameters, fromVersion: number, toVersion: number): INodeParameters {
    if (fromVersion === toVersion) {
      return parameters
    }
    
    let currentParameters = { ...parameters }
    let currentVersion = fromVersion
    
    // Apply migrations step by step
    while (currentVersion < toVersion) {
      const migration = this.migrations.find(m => 
        m.fromVersion === currentVersion && m.toVersion > currentVersion
      )
      
      if (migration) {
        try {
          currentParameters = migration.migrate(currentParameters)
          currentVersion = migration.toVersion
        } catch (error) {
          console.error(`Migration from ${migration.fromVersion} to ${migration.toVersion} failed:`, error)
          break
        }
      } else {
        // No direct migration found, try to find next available version
        const nextVersion = this.getSupportedVersions().find(v => v > currentVersion)
        if (nextVersion) {
          currentVersion = nextVersion
        } else {
          break
        }
      }
    }
    
    return currentParameters
  }
  
  // Check if migration is needed
  needsMigration(currentVersion: number, targetVersion?: number): boolean {
    const target = targetVersion ?? this.getCurrentVersion()
    return currentVersion < target
  }
  
  // Get migration path from one version to another
  getMigrationPath(fromVersion: number, toVersion: number): INodeVersionMigration[] {
    const path: INodeVersionMigration[] = []
    let current = fromVersion
    
    while (current < toVersion) {
      const migration = this.migrations.find(m => 
        m.fromVersion === current && m.toVersion <= toVersion
      )
      
      if (migration) {
        path.push(migration)
        current = migration.toVersion
      } else {
        break
      }
    }
    
    return path
  }
}

// Transform Node Versioning Implementation
class VersionedTransformNodeType extends BaseVersionedNodeType {
  constructor() {
    // Define version history
    const versionHistory: INodeVersionInfo[] = [
      {
        version: 1,
        releaseDate: '2024-01-01',
        description: 'Initial Transform node implementation',
        changes: [
          { type: 'feature', description: 'Basic field transformation modes' },
          { type: 'feature', description: 'Add, remove, rename field operations' },
        ]
      },
      {
        version: 2,
        releaseDate: '2024-12-01', 
        description: 'Enhanced Transform node with n8n EditFields compatibility',
        changes: [
          { type: 'feature', description: 'Assignment collection with drag & drop' },
          { type: 'feature', description: 'Type validation and conversion' },
          { type: 'feature', description: 'Expression evaluation engine' },
          { type: 'feature', description: 'Advanced input field management' },
          { type: 'breaking', description: 'Changed parameter structure for assignments' },
        ],
        deprecatedProperties: ['fieldsToAdd', 'fieldsToSet', 'fieldsToRename'],
        newProperties: ['assignments', 'includeInputFields', 'options']
      },
      {
        version: 3,
        releaseDate: '2024-12-15',
        description: 'Advanced Transform with resource mapping',
        changes: [
          { type: 'feature', description: 'Resource mapping capabilities' },
          { type: 'feature', description: 'Bulk operations support' },
          { type: 'feature', description: 'Advanced conditional properties' },
        ],
        newProperties: ['resourceMapping', 'bulkOperations']
      }
    ]
    
    // Define migrations
    const migrations: INodeVersionMigration[] = [
      {
        fromVersion: 1,
        toVersion: 2,
        description: 'Migrate from basic field operations to assignment collection',
        isBreaking: true,
        migrate: (parameters: INodeParameters): INodeParameters => {
          const migrated: INodeParameters = { ...parameters }
          
          // Convert old field operations to assignments
          const assignments: any[] = []
          
          // Migrate fieldsToAdd
          if (parameters.fieldsToAdd && Array.isArray(parameters.fieldsToAdd)) {
            parameters.fieldsToAdd.forEach((field: any, index: number) => {
              assignments.push({
                id: `migrated-add-${index}`,
                name: field.fieldName || '',
                type: 'stringValue',
                value: field.fieldValue || ''
              })
            })
          }
          
          // Migrate fieldsToSet  
          if (parameters.fieldsToSet && Array.isArray(parameters.fieldsToSet)) {
            parameters.fieldsToSet.forEach((field: any, index: number) => {
              assignments.push({
                id: `migrated-set-${index}`,
                name: field.fieldName || '',
                type: 'stringValue', 
                value: field.fieldValue || ''
              })
            })
          }
          
          // Migrate fieldsToRename
          if (parameters.fieldsToRename && Array.isArray(parameters.fieldsToRename)) {
            parameters.fieldsToRename.forEach((field: any, index: number) => {
              assignments.push({
                id: `migrated-rename-${index}`,
                name: field.newName || '',
                type: 'stringValue',
                value: `{{ $json.${field.currentName || ''} }}`
              })
            })
          }
          
          // Set new parameters
          migrated.mode = 'manual'
          migrated.assignments = { values: assignments }
          migrated.includeInputFields = 'all'
          migrated.options = {
            dotNotation: true,
            ignoreConversionErrors: false
          }
          
          // Remove old parameters
          delete migrated.fieldsToAdd
          delete migrated.fieldsToSet  
          delete migrated.fieldsToRename
          delete migrated.fieldsToRemove
          delete migrated.filterCondition
          
          return migrated
        }
      },
      {
        fromVersion: 2,
        toVersion: 3,
        description: 'Add resource mapping and bulk operations support',
        migrate: (parameters: INodeParameters): INodeParameters => {
          const migrated: INodeParameters = { ...parameters }
          
          // Add new optional features
          migrated.resourceMapping = {
            enabled: false,
            mode: 'add',
            fields: []
          }
          
          migrated.bulkOperations = {
            enabled: true,
            showAddAll: true,
            showClearAll: true
          }
          
          return migrated
        }
      }
    ]
    
    // This would be populated with actual node implementations
    const nodeVersions = {
      1: {} as INodeType, // Legacy transform node
      2: {} as INodeType, // Enhanced transform node  
      3: {} as INodeType, // Advanced transform node
    }
    
    super(nodeVersions, versionHistory, migrations)
  }
}

// Node Instance Migration Service
class NodeMigrationService {
  private versionedNodes: Map<string, BaseVersionedNodeType> = new Map()
  
  registerVersionedNode(nodeType: string, versionedNode: BaseVersionedNodeType): void {
    this.versionedNodes.set(nodeType, versionedNode)
  }
  
  // Migrate a single node instance
  migrateNodeInstance(instance: WorkflowNodeInstance, targetVersion?: number): WorkflowNodeInstance {
    const versionedNode = this.versionedNodes.get(instance.type)
    if (!versionedNode) {
      console.warn(`No versioned node found for type: ${instance.type}`)
      return instance
    }
    
    const currentVersion = instance.typeVersion || instance.version || 1
    const target = targetVersion || versionedNode.getCurrentVersion()
    
    if (currentVersion >= target) {
      return instance // No migration needed
    }
    
    try {
      const migratedParameters = versionedNode.migrateParameters(
        instance.parameters,
        currentVersion,
        target
      )
      
      return {
        ...instance,
        parameters: migratedParameters,
        typeVersion: target,
        version: target // Update both for compatibility
      }
    } catch (error) {
      console.error(`Failed to migrate node ${instance.id}:`, error)
      return instance
    }
  }
  
  // Migrate entire workflow
  migrateWorkflow(nodes: WorkflowNodeInstance[], targetVersions?: Map<string, number>): {
    nodes: WorkflowNodeInstance[]
    migrations: Array<{
      nodeId: string
      nodeType: string
      fromVersion: number
      toVersion: number
      success: boolean
      error?: string
    }>
  } {
    const migrations: Array<{
      nodeId: string
      nodeType: string  
      fromVersion: number
      toVersion: number
      success: boolean
      error?: string
    }> = []
    
    const migratedNodes = nodes.map(node => {
      const currentVersion = node.typeVersion || node.version || 1
      const targetVersion = targetVersions?.get(node.type) || this.getLatestVersion(node.type)
      
      if (currentVersion < targetVersion) {
        try {
          const migrated = this.migrateNodeInstance(node, targetVersion)
          migrations.push({
            nodeId: node.id,
            nodeType: node.type,
            fromVersion: currentVersion,
            toVersion: targetVersion,
            success: true
          })
          return migrated
        } catch (error) {
          migrations.push({
            nodeId: node.id,
            nodeType: node.type,
            fromVersion: currentVersion, 
            toVersion: targetVersion,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          })
          return node
        }
      }
      
      return node
    })
    
    return { nodes: migratedNodes, migrations }
  }
  
  // Get latest version for a node type
  getLatestVersion(nodeType: string): number {
    const versionedNode = this.versionedNodes.get(nodeType)
    return versionedNode?.getCurrentVersion() || 1
  }
  
  // Check if migration is needed for a workflow
  workflowNeedsMigration(nodes: WorkflowNodeInstance[]): boolean {
    return nodes.some(node => {
      const currentVersion = node.typeVersion || node.version || 1
      const latestVersion = this.getLatestVersion(node.type)
      return currentVersion < latestVersion
    })
  }
  
  // Get migration summary for a workflow
  getMigrationSummary(nodes: WorkflowNodeInstance[]): {
    needsMigration: boolean
    outdatedNodes: number
    totalNodes: number
    migrationsByType: Map<string, { count: number; versions: Array<{ from: number; to: number }> }>
  } {
    const migrationsByType = new Map<string, { count: number; versions: Array<{ from: number; to: number }> }>()
    let outdatedNodes = 0
    
    nodes.forEach(node => {
      const currentVersion = node.typeVersion || node.version || 1
      const latestVersion = this.getLatestVersion(node.type)
      
      if (currentVersion < latestVersion) {
        outdatedNodes++
        
        if (!migrationsByType.has(node.type)) {
          migrationsByType.set(node.type, { count: 0, versions: [] })
        }
        
        const typeInfo = migrationsByType.get(node.type)!
        typeInfo.count++
        typeInfo.versions.push({ from: currentVersion, to: latestVersion })
      }
    })
    
    return {
      needsMigration: outdatedNodes > 0,
      outdatedNodes,
      totalNodes: nodes.length,
      migrationsByType
    }
  }
}

// Singleton migration service instance
export const nodeMigrationService = new NodeMigrationService()

// Register transform node versioning
nodeMigrationService.registerVersionedNode('transform', new VersionedTransformNodeType())

// Export migration utilities
export {
  BaseVersionedNodeType,
  VersionedTransformNodeType,
  NodeMigrationService
}