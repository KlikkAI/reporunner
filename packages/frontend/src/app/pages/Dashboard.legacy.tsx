import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useLeanWorkflowStore, WorkflowApiService } from '@/core';
import type { ExecutionStats } from '@/core/types/execution';
import type { Workflow } from '@/core/types/workflow';
import { VirtualizedList } from '@/design-system';

const workflowApiService = new WorkflowApiService();

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    createNewWorkflow,
    deleteWorkflow,
    isLoading,
    shouldRefreshDashboard,
    setShouldRefreshDashboard,
  } = useLeanWorkflowStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadWorkflows = useCallback(async () => {
    try {
      const result = await workflowApiService.getWorkflows();

      if (!(result?.items && Array.isArray(result.items))) {
        setWorkflows([]);
        return;
      }

      const workflowsWithDefaults = result.items.map((workflow) => ({
        ...workflow,
        connections: (workflow as any).connections || {},
        createdAt: (workflow as any).createdAt || new Date().toISOString(),
        updatedAt: (workflow as any).updatedAt || new Date().toISOString(),
        status: ((workflow.status as any) === 'expired' ? 'draft' : workflow.status) || 'draft',
        settings: workflow.settings
          ? {
              ...workflow.settings,
              errorHandling:
                workflow.settings.errorHandling === 'retry'
                  ? 'stop'
                  : workflow.settings.errorHandling,
            }
          : undefined,
        nodes: workflow.nodes
          ? workflow.nodes.map((node) => ({
              ...node,
              data: {
                ...(node.data || {}),
                label: node.data?.label || node.id, // Ensure label is always present
                credentials:
                  typeof node.data?.credentials === 'string'
                    ? [node.data?.credentials]
                    : node.data?.credentials,
              },
            }))
          : [],
      }));
      setWorkflows(workflowsWithDefaults as any);
    } catch (error) {
      setWorkflows([]);

      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('token')) {
        toast.error('Please log in to access your workflows');
      } else {
        toast.error('Failed to load workflows');
      }
    }
  }, []); // Empty dependency array since this function doesn't depend on any props/state

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const executionStats = await workflowApiService.getExecutionStats();
      setStats(executionStats);
    } catch (error) {
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('token')) {
        toast.error('Please log in to access execution statistics');
      } else {
        toast.error('Failed to load statistics');
      }
    } finally {
      setStatsLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props/state

  useEffect(() => {
    loadWorkflows();
    loadStats();
  }, [loadStats, loadWorkflows]);

  // Check for refresh flag when component mounts or refresh flag changes
  useEffect(() => {
    if (shouldRefreshDashboard) {
      loadWorkflows();
      loadStats();
      setShouldRefreshDashboard(false);
    }
  }, [shouldRefreshDashboard, setShouldRefreshDashboard, loadStats, loadWorkflows]);

  const handleCreateWorkflow = async () => {
    const name = prompt('Enter workflow name:');
    if (name) {
      if (name.trim().length === 0) {
        toast.error('Please enter a valid workflow name.');
        return;
      }

      try {
        await createNewWorkflow(name.trim(), navigate);
        // Refresh the dashboard workflows list
        await loadWorkflows();
        toast.success('Workflow created successfully!');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create workflow';
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteWorkflow = async (workflowId: string, workflowName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${workflowName}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteWorkflow(workflowId);
        // Refresh the dashboard workflows list
        await loadWorkflows();
        toast.success('Workflow deleted successfully!');
      } catch (_error) {
        toast.error('Failed to delete workflow. Please try again.');
      }
    }
  };

  // Render function for workflow items in virtualized list
  const renderWorkflowItem = useCallback(
    (workflow: Workflow) => (
      <div
        key={workflow.id}
        className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all duration-300 mb-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="font-medium text-white">{workflow.name}</h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  workflow.status === 'active' || workflow.isActive
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : workflow.status === 'error'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                }`}
              >
                {workflow.status === 'active' || workflow.isActive
                  ? 'active'
                  : workflow.status || 'inactive'}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              {workflow.description || 'No description'}
            </p>
            <div className="flex items-center mt-2 space-x-4">
              <span className="text-xs text-slate-400">{workflow.nodes?.length || 0} nodes</span>
              <span className="text-xs text-slate-400">
                Updated{' '}
                {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleDateString() : 'N/A'}
              </span>
              {workflow.lastRun && (
                <span className="text-xs text-slate-400">
                  Last run {new Date(workflow.lastRun).toLocaleDateString()}
                </span>
              )}
              {!workflow.lastRun && <span className="text-xs text-slate-400">Never executed</span>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to={`/workflow/${workflow.id}`}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 text-sm shadow-lg"
            >
              Edit
            </Link>
            <button
              onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
              className="text-slate-400 hover:text-red-300 px-2 py-2 rounded hover:bg-red-500/20 transition-all duration-300 text-sm backdrop-blur-sm"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    ),
    [handleDeleteWorkflow]
  );

  const dashboardStats = [
    { name: 'Total Workflows', value: workflows.length, icon: '🔄' },
    {
      name: 'Active Workflows',
      value: workflows.filter((w) => w.isActive || w.status === 'active').length,
      icon: '✅',
    },
    {
      name: 'Total Executions',
      value: statsLoading ? '...' : (stats?.totalExecutions ?? 0),
      icon: '▶️',
    },
    {
      name: 'Success Rate',
      value: statsLoading
        ? '...'
        : stats?.successRate !== undefined
          ? `${Math.round(stats.successRate)}%`
          : stats?.totalExecutions && stats.totalExecutions > 0
            ? `${Math.round(((stats.successfulExecutions || 0) / stats.totalExecutions) * 100)}%`
            : 'N/A',
      icon: '📈',
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Workflows</h1>
        <p className="text-slate-300">Create and manage your automation workflows</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="text-2xl mr-4">{stat.icon}</div>
              <div>
                <p className="text-sm font-medium text-slate-300">{stat.name}</p>
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                {statsLoading && <p className="text-xs text-slate-400 mt-1">Loading...</p>}
                {!statsLoading &&
                  stats &&
                  stat.name === 'Total Executions' &&
                  stats.totalExecutions === 0 && (
                    <p className="text-xs text-slate-400 mt-1">No executions yet</p>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workflows */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Your Workflows</h2>
            <button
              onClick={handleCreateWorkflow}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Create New
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-2 text-slate-300">Loading workflows...</p>
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-300 mb-4">No workflows yet</p>
              <button
                onClick={handleCreateWorkflow}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Create Your First Workflow
              </button>
            </div>
          ) : (
            <VirtualizedList
              items={workflows}
              renderItem={renderWorkflowItem}
              height={600} // Fixed height for virtualization
              estimateSize={120} // Estimated height per workflow item
              getItemKey={(workflow) => workflow.id}
              gap={0}
              className="workflow-list"
              emptyState={
                <div className="text-center py-8">
                  <p className="text-slate-300 mb-4">No workflows found</p>
                  <button
                    onClick={handleCreateWorkflow}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    Create Your First Workflow
                  </button>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
