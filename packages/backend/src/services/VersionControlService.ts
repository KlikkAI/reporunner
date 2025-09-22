/**
 * Version Control Service for Workflow History Tracking
 * Manages workflow versions, snapshots, and rollback capabilities
 */

import { CollaborationSession } from '../models/CollaborationSession.js';
import { type IOperation, Operation } from '../models/Operation.js';
import { Workflow } from '../models/Workflow.js';

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  snapshot: any; // Complete workflow state
  operations: string[]; // Operation IDs that led to this version
  collaborationSessionId?: string;
  createdBy: string;
  createdAt: Date;
  changesSummary: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
    edgesModified: number;
  };
  metadata?: {
    description?: string;
    tags?: string[];
    isStable?: boolean;
    isAutoSaved?: boolean;
  };
}

export interface VersionDiff {
  version1: number;
  version2: number;
  changes: Array<{
    type:
      | 'node_added'
      | 'node_removed'
      | 'node_modified'
      | 'edge_added'
      | 'edge_removed'
      | 'edge_modified'
      | 'property_changed';
    target: {
      type: 'node' | 'edge' | 'workflow';
      id: string;
      path?: string;
    };
    before?: any;
    after?: any;
    timestamp: Date;
    author: string;
  }>;
  summary: {
    totalChanges: number;
    byType: Record<string, number>;
    collaborators: string[];
    timespan: number; // milliseconds
  };
}

export class VersionControlService {
  private static instance: VersionControlService;

  private constructor() {}

  public static getInstance(): VersionControlService {
    if (!VersionControlService.instance) {
      VersionControlService.instance = new VersionControlService();
    }
    return VersionControlService.instance;
  }

  /**
   * Create a new version snapshot of a workflow
   */
  public async createVersion(
    workflowId: string,
    userId: string,
    options: {
      description?: string;
      tags?: string[];
      isStable?: boolean;
      collaborationSessionId?: string;
      forceCreate?: boolean;
    } = {}
  ): Promise<WorkflowVersion> {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Get the last version to calculate changes
    const lastVersion = await this.getLatestVersion(workflowId);
    const newVersionNumber = lastVersion ? lastVersion.version + 1 : 1;

    // Get operations since last version
    const operationsSinceLastVersion = await this.getOperationsSinceVersion(
      workflowId,
      lastVersion?.version || 0
    );

    // Calculate changes summary
    const changesSummary = this.calculateChangesSummary(operationsSinceLastVersion);

    // Don't create version if no significant changes (unless forced)
    if (!options.forceCreate && this.isEmptyChangesSummary(changesSummary)) {
      throw new Error('No significant changes to create a new version');
    }

    // Create version record
    const version: WorkflowVersion = {
      id: `version_${workflowId}_${newVersionNumber}_${Date.now()}`,
      workflowId,
      version: newVersionNumber,
      snapshot: {
        nodes: workflow.nodes,
        edges: workflow.edges,
        settings: workflow.settings,
        metadata: {
          name: workflow.name,
          description: workflow.description,
          tags: workflow.tags,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
        },
      },
      operations: operationsSinceLastVersion.map((op) => op._id.toString()),
      collaborationSessionId: options.collaborationSessionId,
      createdBy: userId,
      createdAt: new Date(),
      changesSummary,
      metadata: {
        description: options.description,
        tags: options.tags || [],
        isStable: options.isStable || false,
        isAutoSaved: !options.description, // Auto-saved if no description provided
      },
    };

    // Store version (you would implement persistent storage here)
    await this.storeVersion(version);

    return version;
  }

  /**
   * Get all versions for a workflow
   */
  public async getWorkflowVersions(
    workflowId: string,
    options: {
      limit?: number;
      offset?: number;
      includeAutoSaved?: boolean;
      stableOnly?: boolean;
    } = {}
  ): Promise<{
    versions: WorkflowVersion[];
    total: number;
    hasMore: boolean;
  }> {
    // This would query your persistent storage
    // For now, returning a mock implementation
    const allVersions = await this.getAllVersionsFromStorage(workflowId);

    let filteredVersions = allVersions;

    if (!options.includeAutoSaved) {
      filteredVersions = filteredVersions.filter((v) => !v.metadata?.isAutoSaved);
    }

    if (options.stableOnly) {
      filteredVersions = filteredVersions.filter((v) => v.metadata?.isStable);
    }

    const total = filteredVersions.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;

    const versions = filteredVersions
      .sort((a, b) => b.version - a.version)
      .slice(offset, offset + limit);

    return {
      versions,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get a specific version
   */
  public async getVersion(workflowId: string, version: number): Promise<WorkflowVersion | null> {
    return await this.getVersionFromStorage(workflowId, version);
  }

  /**
   * Get the latest version
   */
  public async getLatestVersion(workflowId: string): Promise<WorkflowVersion | null> {
    const versions = await this.getWorkflowVersions(workflowId, { limit: 1 });
    return versions.versions[0] || null;
  }

  /**
   * Compare two versions and get differences
   */
  public async compareVersions(
    workflowId: string,
    version1: number,
    version2: number
  ): Promise<VersionDiff> {
    const [v1, v2] = await Promise.all([
      this.getVersion(workflowId, version1),
      this.getVersion(workflowId, version2),
    ]);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    // Get operations between these versions
    const operations = await Operation.find({
      workflowId,
      version: {
        $gt: Math.min(version1, version2),
        $lte: Math.max(version1, version2),
      },
    })
      .populate('authorId', 'name email')
      .sort({ version: 1 });

    const changes = operations.map((op) => {
      // Map operation types to diff types
      let diffType: VersionDiff['changes'][0]['type'];
      switch (op.type) {
        case 'node_add':
          diffType = 'node_added';
          break;
        case 'node_delete':
          diffType = 'node_removed';
          break;
        case 'node_update':
        case 'node_move':
          diffType = 'node_modified';
          break;
        case 'edge_add':
          diffType = 'edge_added';
          break;
        case 'edge_delete':
          diffType = 'edge_removed';
          break;
        case 'edge_update':
          diffType = 'edge_modified';
          break;
        case 'property_update':
          diffType = 'property_changed';
          break;
        default:
          diffType = 'node_modified'; // fallback
      }

      return {
        type: diffType,
        target: {
          type:
            op.target.type === 'property'
              ? 'node'
              : (op.target.type as 'node' | 'edge' | 'workflow'),
          id: op.target.id,
          path: op.target.path,
        },
        before: op.data.before,
        after: op.data.after,
        timestamp: op.createdAt || new Date(),
        author: (op as any).authorId?.name || 'Unknown',
      };
    });

    const collaborators = [
      ...new Set(operations.map((op) => (op as any).authorId?.name).filter(Boolean)),
    ];

    const timespan = v2.createdAt.getTime() - v1.createdAt.getTime();

    const byType = changes.reduce(
      (acc, change) => {
        acc[change.type] = (acc[change.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      version1,
      version2,
      changes,
      summary: {
        totalChanges: changes.length,
        byType,
        collaborators,
        timespan,
      },
    };
  }

  /**
   * Rollback workflow to a specific version
   */
  public async rollbackToVersion(
    workflowId: string,
    targetVersion: number,
    userId: string,
    options: {
      createBackup?: boolean;
      description?: string;
    } = {}
  ): Promise<{
    success: boolean;
    backupVersion?: WorkflowVersion;
    restoredVersion: WorkflowVersion;
  }> {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const targetVersionData = await this.getVersion(workflowId, targetVersion);
    if (!targetVersionData) {
      throw new Error(`Version ${targetVersion} not found`);
    }

    let backupVersion: WorkflowVersion | undefined;

    // Create backup of current state if requested
    if (options.createBackup) {
      backupVersion = await this.createVersion(workflowId, userId, {
        description: `Backup before rollback to version ${targetVersion}`,
        tags: ['backup', 'rollback'],
        isStable: false,
        forceCreate: true,
      });
    }

    // Restore workflow state from target version
    const snapshot = targetVersionData.snapshot;
    workflow.nodes = snapshot.nodes;
    workflow.edges = snapshot.edges;
    workflow.settings = snapshot.settings;

    // Update metadata if it exists in snapshot
    if (snapshot.metadata) {
      workflow.name = snapshot.metadata.name || workflow.name;
      workflow.description = snapshot.metadata.description || workflow.description;
      workflow.tags = snapshot.metadata.tags || workflow.tags;
    }

    workflow.updatedAt = new Date();
    await workflow.save();

    // Create a new version for the rollback
    const rollbackVersion = await this.createVersion(workflowId, userId, {
      description: options.description || `Rolled back to version ${targetVersion}`,
      tags: ['rollback'],
      isStable: true,
      forceCreate: true,
    });

    return {
      success: true,
      backupVersion,
      restoredVersion: rollbackVersion,
    };
  }

  /**
   * Auto-save workflow state during collaboration
   */
  public async autoSaveVersion(
    workflowId: string,
    userId: string,
    collaborationSessionId: string
  ): Promise<WorkflowVersion | null> {
    try {
      // Only auto-save if there have been significant changes
      const lastVersion = await this.getLatestVersion(workflowId);
      const recentOperations = await this.getOperationsSinceVersion(
        workflowId,
        lastVersion?.version || 0
      );

      if (recentOperations.length < 5) {
        return null; // Not enough changes to warrant auto-save
      }

      return await this.createVersion(workflowId, userId, {
        collaborationSessionId,
        tags: ['auto-save'],
        isStable: false,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      return null;
    }
  }

  /**
   * Get version history statistics
   */
  public async getVersionStats(workflowId: string): Promise<{
    totalVersions: number;
    stableVersions: number;
    autoSavedVersions: number;
    averageChangesPerVersion: number;
    mostActiveCollaborator: string;
    versionFrequency: Record<string, number>; // versions per day
  }> {
    const allVersions = await this.getAllVersionsFromStorage(workflowId);

    const totalVersions = allVersions.length;
    const stableVersions = allVersions.filter((v) => v.metadata?.isStable).length;
    const autoSavedVersions = allVersions.filter((v) => v.metadata?.isAutoSaved).length;

    const totalChanges = allVersions.reduce((sum, v) => {
      return sum + Object.values(v.changesSummary).reduce((a, b) => a + b, 0);
    }, 0);

    const averageChangesPerVersion = totalVersions > 0 ? totalChanges / totalVersions : 0;

    // Find most active collaborator
    const collaboratorCounts = allVersions.reduce(
      (acc, v) => {
        acc[v.createdBy] = (acc[v.createdBy] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostActiveCollaborator =
      Object.entries(collaboratorCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';

    // Calculate version frequency (versions per day)
    const versionFrequency = allVersions.reduce(
      (acc, v) => {
        const date = v.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalVersions,
      stableVersions,
      autoSavedVersions,
      averageChangesPerVersion,
      mostActiveCollaborator,
      versionFrequency,
    };
  }

  /**
   * Private helper methods
   */

  private async getOperationsSinceVersion(
    workflowId: string,
    sinceVersion: number
  ): Promise<IOperation[]> {
    return await Operation.find({
      workflowId,
      version: { $gt: sinceVersion },
      status: { $in: ['applied', 'transformed'] },
    }).sort({ version: 1 });
  }

  private calculateChangesSummary(operations: IOperation[]): WorkflowVersion['changesSummary'] {
    const summary = {
      nodesAdded: 0,
      nodesRemoved: 0,
      nodesModified: 0,
      edgesAdded: 0,
      edgesRemoved: 0,
      edgesModified: 0,
    };

    operations.forEach((op) => {
      switch (op.type) {
        case 'node_add':
          summary.nodesAdded++;
          break;
        case 'node_delete':
          summary.nodesRemoved++;
          break;
        case 'node_update':
        case 'node_move':
          summary.nodesModified++;
          break;
        case 'edge_add':
          summary.edgesAdded++;
          break;
        case 'edge_delete':
          summary.edgesRemoved++;
          break;
        case 'edge_update':
          summary.edgesModified++;
          break;
      }
    });

    return summary;
  }

  private isEmptyChangesSummary(summary: WorkflowVersion['changesSummary']): boolean {
    return Object.values(summary).every((count) => count === 0);
  }

  // Mock storage methods - implement with your chosen storage solution
  private async storeVersion(version: WorkflowVersion): Promise<void> {
    // Implement persistent storage (MongoDB, PostgreSQL, etc.)
    console.log(`Storing version ${version.version} for workflow ${version.workflowId}`);
  }

  private async getAllVersionsFromStorage(workflowId: string): Promise<WorkflowVersion[]> {
    // Implement retrieval from persistent storage
    return [];
  }

  private async getVersionFromStorage(
    workflowId: string,
    version: number
  ): Promise<WorkflowVersion | null> {
    // Implement specific version retrieval
    return null;
  }
}
